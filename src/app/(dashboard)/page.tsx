export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import {
  FolderKanban,
  Lightbulb,
  CheckSquare,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { NextActionCard } from "@/components/dashboard/next-action-card";
import { AINextActionButton } from "@/components/dashboard/ai-next-action";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { StageBadge } from "@/components/projects/stage-badge";
import Link from "next/link";

async function getDashboardData(workspaceId: string) {
  const [
    ideaCount,
    inboxIdeas,
    projects,
    allTasks,
    blockedTasks,
    inProgressTasks,
    urgentTodoTasks,
    recentAIRuns,
  ] = await Promise.all([
    prisma.idea.count({ where: { workspaceId } }),
    prisma.idea.findMany({
      where: { workspaceId, status: "INBOX" },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        workspaceId,
        stage: { notIn: ["ARCHIVED", "SHIPPED"] },
      },
      include: { _count: { select: { tasks: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.task.count({ where: { project: { workspaceId } } }),
    prisma.task.findMany({
      where: { project: { workspaceId }, status: "BLOCKED" },
      include: { project: { select: { id: true, name: true } } },
      take: 5,
    }),
    prisma.task.findMany({
      where: { project: { workspaceId }, status: "IN_PROGRESS" },
      include: { project: { select: { id: true, name: true } } },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: "TODO",
        priority: { in: ["HIGH", "URGENT"] },
      },
      include: { project: { select: { id: true, name: true } } },
      take: 3,
    }),
    prisma.aIRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    ideaCount,
    inboxIdeas,
    projects,
    totalTasks: allTasks,
    blockedTasks,
    inProgressTasks,
    urgentTodoTasks,
    recentAIRuns,
  };
}

function computeNextAction(data: Awaited<ReturnType<typeof getDashboardData>>) {
  if (data.blockedTasks.length > 0) {
    const task = data.blockedTasks[0];
    return {
      action: `Unblock: ${task.title}`,
      reason: `This task in ${task.project.name} is blocked and needs attention.`,
      href: `/projects/${task.project.id}`,
    };
  }

  if (data.inProgressTasks.length > 0) {
    const task = data.inProgressTasks[0];
    return {
      action: `Continue: ${task.title}`,
      reason: `You're actively working on this in ${task.project.name}.`,
      href: `/projects/${task.project.id}`,
    };
  }

  if (data.urgentTodoTasks.length > 0) {
    const task = data.urgentTodoTasks[0];
    return {
      action: `Start: ${task.title}`,
      reason: `High priority task waiting in ${task.project.name}.`,
      href: `/projects/${task.project.id}`,
    };
  }

  if (data.inboxIdeas.length > 0) {
    const idea = data.inboxIdeas[0];
    return {
      action: `Review: ${idea.title}`,
      reason: "You have ideas in your inbox waiting for review.",
      href: `/ideas/${idea.id}`,
    };
  }

  const emptyProject = data.projects.find((p) => p._count.tasks === 0);
  if (emptyProject) {
    return {
      action: `Break down: ${emptyProject.name}`,
      reason: "This project has no tasks yet. Add some to get started.",
      href: `/projects/${emptyProject.id}`,
    };
  }

  return {
    action: "Capture a new idea",
    reason: "Everything looks good. Time to think about what's next.",
    href: "/ideas",
  };
}

export default async function HomePage() {
  const workspaceId = await getSessionWorkspaceId();
  const data = await getDashboardData(workspaceId);
  const nextAction = computeNextAction(data);

  const doneTasks = await prisma.task.count({
    where: { project: { workspaceId }, status: "DONE" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-1 text-muted-foreground">
          Your command center. Here&apos;s what needs attention.
        </p>
      </div>

      {/* Onboarding */}
      <OnboardingChecklist
        ideaCount={data.ideaCount}
        projectCount={data.projects.length}
        taskCount={data.totalTasks}
      />

      {/* Next Action */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <NextActionCard
            action={nextAction.action}
            reason={nextAction.reason}
            href={nextAction.href}
          />
        </div>
        <AINextActionButton />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ideas"
          value={data.ideaCount}
          icon={Lightbulb}
          detail={
            data.inboxIdeas.length > 0
              ? `${data.inboxIdeas.length} in inbox`
              : undefined
          }
        />
        <StatCard
          label="Active Projects"
          value={data.projects.length}
          icon={FolderKanban}
        />
        <StatCard
          label="Tasks"
          value={data.totalTasks}
          icon={CheckSquare}
          detail={`${doneTasks} done · ${data.blockedTasks.length} blocked`}
        />
        <StatCard
          label="AI Runs"
          value={data.recentAIRuns.length}
          icon={Bot}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Active Projects
          </h2>
          {data.projects.length === 0 ? (
            <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
              No active projects.
            </div>
          ) : (
            <div className="glass-panel divide-y divide-border/50">
              {data.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project._count.tasks} tasks
                    </p>
                  </div>
                  <StageBadge stage={project.stage} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Tasks */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Blocked Tasks
          </h2>
          {data.blockedTasks.length === 0 ? (
            <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
              No blocked tasks. Nice!
            </div>
          ) : (
            <div className="glass-panel divide-y divide-border/50">
              {data.blockedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project.name}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* In Progress */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            In Progress
          </h2>
          {data.inProgressTasks.length === 0 ? (
            <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
              Nothing in progress right now.
            </div>
          ) : (
            <div className="glass-panel divide-y divide-border/50">
              {data.inProgressTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project.name}
                    </p>
                  </div>
                  <TaskPriorityBadge priority={task.priority} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent AI Runs */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent AI Runs
          </h2>
          {data.recentAIRuns.length === 0 ? (
            <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
              No AI runs yet.
            </div>
          ) : (
            <div className="glass-panel divide-y divide-border/50">
              {data.recentAIRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{run.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {run.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {run.createdAt.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

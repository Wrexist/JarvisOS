"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActivityFeed } from "@/components/projects/activity-feed";
import { TaskView } from "@/components/tasks/task-view";
import { GenerateTasksButton } from "@/components/projects/generate-tasks-button";
import { DocsView } from "@/components/docs/docs-view";
import { RepoConnect } from "@/components/github/repo-connect";
import { PRList } from "@/components/github/pr-list";
import { ProjectSettings } from "@/components/projects/project-settings";
import { SaveAsTemplate } from "@/components/projects/save-as-template";
import { TimelineView } from "@/components/projects/timeline-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStage, TaskStatus } from "@/generated/prisma/client";

interface ProjectTabsProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    stage: ProjectStage;
    createdAt: string;
    updatedAt: string;
    _count: { tasks: number; documents: number; pullRequests: number };
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      estimateHours: number | null;
      dueDate: string | null;
    }>;
    documents: Array<{
      id: string;
      title: string;
      type: "PRD" | "TECH_SPEC" | "NOTES" | "RETRO" | "SCRATCHPAD";
      updatedAt: string;
    }>;
    activities: Array<{
      id: string;
      type: string;
      message: string | null;
      createdAt: string;
    }>;
    aiRuns: Array<{
      id: string;
      type: string;
      status: string;
      createdAt: string;
    }>;
    pullRequests: Array<{
      id: string;
      number: number;
      title: string;
      headBranch: string;
      status: "OPEN" | "DRAFT" | "MERGED" | "CLOSED";
      url: string;
      updatedAt: string;
    }>;
  };
}

const tabs = [
  "Overview",
  "Tasks",
  "Timeline",
  "Docs",
  "GitHub",
  "AI Runs",
  "Settings",
] as const;

type Tab = (typeof tabs)[number];

const stages: ProjectStage[] = [
  "CLARIFYING",
  "PLANNING",
  "READY_TO_BUILD",
  "BUILDING",
  "TESTING",
  "SHIPPED",
  "PAUSED",
  "ARCHIVED",
];

export function ProjectTabs({ project }: ProjectTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [changingStage, setChangingStage] = useState(false);

  async function handleStageChange(stage: string) {
    setChangingStage(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingStage(false);
    }
  }

  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = project.tasks.filter(
    (t) => t.status === "BLOCKED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "Tasks" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {project._count.tasks}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.tasks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {doneTasks} done · {blockedTasks} blocked
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.documents}
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Pull Requests</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.pullRequests}
                </p>
              </div>
            </div>

            {project.description && (
              <div className="glass-panel p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Recent Activity
              </h3>
              <ActivityFeed activities={project.activities} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Stage</p>
                <Select
                  value={project.stage}
                  onValueChange={handleStageChange}
                  disabled={changingStage}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm mt-0.5">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="text-sm mt-0.5">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <GenerateTasksButton projectId={project.id} />
          </div>
          <TaskView tasks={project.tasks} projectId={project.id} />
        </div>
      )}

      {activeTab === "Timeline" && (
        <TimelineView tasks={project.tasks} />
      )}

      {activeTab === "Docs" && (
        <DocsView documents={project.documents} projectId={project.id} />
      )}

      {activeTab === "GitHub" && (
        <div className="space-y-4">
          <RepoConnect projectId={project.id} />
          <PRList pullRequests={project.pullRequests} />
        </div>
      )}

      {activeTab === "AI Runs" && (
        <div className="space-y-2">
          {project.aiRuns.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">
              No AI runs for this project yet.
            </div>
          ) : (
            project.aiRuns.map((run) => (
              <div key={run.id} className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-xs">{run.type}</Badge>
                  <span className="ml-2 text-sm text-muted-foreground">{run.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="space-y-6">
          <ProjectSettings project={{ id: project.id, name: project.name, description: project.description }} />
          <SaveAsTemplate
            project={{ id: project.id, name: project.name, description: project.description }}
            taskCount={project._count.tasks}
            docCount={project._count.documents}
          />
        </div>
      )}
    </div>
  );
}

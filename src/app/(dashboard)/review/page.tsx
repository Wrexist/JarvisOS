export const dynamic = "force-dynamic";

import { getDefaultWorkspaceId } from "@/lib/workspace";
import {
  getWeeklyReviewData,
  detectStaleProjects,
} from "@/server/services/staleness.service";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CheckSquare,
  Plus,
  Lightbulb,
  ArrowRight,
  Bot,
  AlertTriangle,
  FolderKanban,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function ReviewPage() {
  const workspaceId = await getDefaultWorkspaceId();
  const [review, staleProjects] = await Promise.all([
    getWeeklyReviewData(workspaceId),
    detectStaleProjects(workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Weekly Review
        </h1>
        <p className="mt-1 text-muted-foreground">
          Summary of the last 7 days. See what got done and what needs
          attention.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tasks Completed"
          value={review.tasksCompleted}
          icon={CheckSquare}
        />
        <StatCard
          label="Tasks Created"
          value={review.tasksCreated}
          icon={Plus}
        />
        <StatCard
          label="Ideas Captured"
          value={review.ideasCreated}
          icon={Lightbulb}
          detail={
            review.ideasConverted > 0
              ? `${review.ideasConverted} converted`
              : undefined
          }
        />
        <StatCard
          label="AI Runs"
          value={review.aiRuns}
          icon={Bot}
        />
      </div>

      {/* Status row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-medium">Stage Changes</h3>
          </div>
          <p className="text-2xl font-semibold">{review.stageChanges}</p>
          <p className="text-xs text-muted-foreground">projects moved forward</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-medium">Blocked Tasks</h3>
          </div>
          <p className="text-2xl font-semibold">{review.blockedTasks}</p>
          <p className="text-xs text-muted-foreground">need attention</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium">Stale Projects</h3>
          </div>
          <p className="text-2xl font-semibold">{staleProjects.length}</p>
          <p className="text-xs text-muted-foreground">no activity in 14+ days</p>
        </div>
      </div>

      {/* Stale projects detail */}
      {staleProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Stale Projects (no activity in 14+ days)
          </h2>
          <div className="glass-panel divide-y divide-border/50">
            {staleProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project._count.tasks} tasks ·
                    Last activity:{" "}
                    {project.activities[0]
                      ? new Date(
                          project.activities[0].createdAt
                        ).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

import { getDefaultWorkspaceId } from "@/lib/workspace";
import {
  getTaskCompletionByDay,
  getVelocity,
  getAIUsageByType,
  getProjectProgress,
} from "@/server/services/analytics.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { StageBadge } from "@/components/projects/stage-badge";
import { TrendingUp, TrendingDown, Minus, CheckSquare, Bot } from "lucide-react";
import type { ProjectStage } from "@/generated/prisma/client";

export default async function AnalyticsPage() {
  const workspaceId = await getDefaultWorkspaceId();

  const [completionData, velocity, aiUsage, projectProgress] =
    await Promise.all([
      getTaskCompletionByDay(workspaceId),
      getVelocity(workspaceId),
      getAIUsageByType(workspaceId),
      getProjectProgress(workspaceId),
    ]);

  const maxCompletion = Math.max(...completionData.map((d) => d.count), 1);

  const TrendIcon =
    velocity.trend > 0
      ? TrendingUp
      : velocity.trend < 0
        ? TrendingDown
        : Minus;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Productivity trends and project health metrics.
        </p>
      </div>

      {/* Velocity */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tasks This Week"
          value={velocity.thisWeek}
          icon={CheckSquare}
          detail={
            velocity.trend !== 0
              ? `${velocity.trend > 0 ? "+" : ""}${velocity.trend} vs last week`
              : "Same as last week"
          }
        />
        <StatCard
          label="Tasks Last Week"
          value={velocity.lastWeek}
          icon={CheckSquare}
        />
        <div className="glass-panel p-4 flex items-center gap-3">
          <TrendIcon
            className={`h-6 w-6 ${velocity.trend > 0 ? "text-emerald-400" : velocity.trend < 0 ? "text-red-400" : "text-zinc-400"}`}
          />
          <div>
            <p className="text-sm font-medium">Velocity Trend</p>
            <p className="text-xs text-muted-foreground">
              {velocity.trend > 0
                ? "Accelerating"
                : velocity.trend < 0
                  ? "Slowing down"
                  : "Steady pace"}
            </p>
          </div>
        </div>
      </div>

      {/* Task Completion Chart */}
      <div className="glass-panel p-5 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Task Activity (Last 30 Days)
        </h2>
        <div className="flex items-end gap-[2px] h-32">
          {completionData.map((d) => (
            <div
              key={d.date}
              className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
              style={{
                height: `${Math.max((d.count / maxCompletion) * 100, 4)}%`,
              }}
              title={`${d.date}: ${d.count} tasks`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{completionData[0]?.date}</span>
          <span>{completionData[completionData.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Usage */}
        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Usage by Type
          </h2>
          {aiUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No AI runs yet.
            </p>
          ) : (
            <div className="space-y-2">
              {aiUsage.map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 truncate">
                    {item.type}
                  </span>
                  <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded"
                      style={{
                        width: `${Math.min(
                          (item.count / Math.max(...aiUsage.map((a) => a.count))) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Project Progress
          </h2>
          {projectProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No projects yet.
            </p>
          ) : (
            <div className="space-y-3">
              {projectProgress.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <StageBadge stage={p.stage as ProjectStage} />
                      <span className="text-xs text-muted-foreground">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/50 rounded-full transition-all"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

export default async function AIRunsPage() {
  const workspaceId = await getDefaultWorkspaceId();
  const aiRuns = await prisma.aIRun.findMany({
    where: { workspaceId },
    include: {
      idea: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColor: Record<string, string> = {
    QUEUED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Runs</h1>
        <p className="mt-1 text-muted-foreground">
          AI generation history and outputs.
        </p>
      </div>

      {aiRuns.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No AI runs yet.</p>
          <p className="text-sm mt-1">
            Enrich an idea or generate a spec to create your first run.
          </p>
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {aiRuns.map((run) => (
            <div key={run.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {run.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={statusColor[run.status] ?? ""}
                  >
                    {run.status}
                  </Badge>
                  {run.modelName && (
                    <span className="text-xs text-muted-foreground">
                      {run.modelName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {run.createdAt.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {run.idea && <span>Idea: {run.idea.title}</span>}
                {run.project && <span>Project: {run.project.name}</span>}
                {run.task && <span>Task: {run.task.title}</span>}
              </div>
              {run.output && (
                <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap max-h-24 overflow-auto bg-muted/20 rounded p-2">
                  {run.output.slice(0, 500)}
                  {run.output.length > 500 && "..."}
                </pre>
              )}
              {run.error && (
                <p className="text-xs text-destructive">{run.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

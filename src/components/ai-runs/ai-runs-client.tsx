"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AIRun {
  id: string;
  type: string;
  status: string;
  modelName: string | null;
  output: string | null;
  error: string | null;
  createdAt: string;
  idea: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
  task: { id: string; title: string; projectId: string } | null;
}

const statusColor: Record<string, string> = {
  QUEUED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AIRunsClient({ runs }: { runs: AIRun[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="glass-panel divide-y divide-border/50">
      {runs.map((run) => (
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
              {new Date(run.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {run.idea && (
              <Link
                href={`/ideas/${run.idea.id}`}
                className="text-primary hover:underline"
              >
                Idea: {run.idea.title}
              </Link>
            )}
            {run.project && (
              <Link
                href={`/projects/${run.project.id}`}
                className="text-primary hover:underline"
              >
                Project: {run.project.name}
              </Link>
            )}
            {run.task && (
              <Link
                href={`/projects/${run.task.projectId}?task=${run.task.id}`}
                className="text-primary hover:underline"
              >
                Task: {run.task.title}
              </Link>
            )}
          </div>
          {run.output && (
            <>
              <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap overflow-auto bg-muted/20 rounded p-2 max-h-48">
                {expanded.has(run.id)
                  ? run.output
                  : run.output.slice(0, 500) +
                    (run.output.length > 500 ? "..." : "")}
              </pre>
              {run.output.length > 500 && (
                <button
                  onClick={() => toggle(run.id)}
                  className="text-xs text-primary hover:underline"
                >
                  {expanded.has(run.id) ? "Show less" : "Show more"}
                </button>
              )}
            </>
          )}
          {run.error && (
            <p className="text-xs text-destructive">{run.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { CheckRunsSummary } from "@/components/github/check-run-status";
import type { PRStatus } from "@/generated/prisma/client";

const prStatusConfig: Record<PRStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  DRAFT: { label: "Draft", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  MERGED: { label: "Merged", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  CLOSED: { label: "Closed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

interface PRItem {
  id: string;
  number: number;
  title: string;
  headBranch: string;
  status: PRStatus;
  url: string;
  updatedAt: string;
  checkRuns: Array<{ conclusion: string; name: string }>;
}

export function PRList({ pullRequests }: { pullRequests: PRItem[] }) {
  if (pullRequests.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        No pull requests found.
      </div>
    );
  }

  return (
    <div className="glass-panel divide-y divide-border/50">
      {pullRequests.map((pr) => {
        const config = prStatusConfig[pr.status];
        return (
          <a
            key={pr.id}
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm text-muted-foreground shrink-0">
              #{pr.number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{pr.title}</p>
              <p className="text-xs text-muted-foreground">{pr.headBranch}</p>
            </div>
            <CheckRunsSummary checkRuns={pr.checkRuns} />
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(pr.updatedAt).toLocaleDateString()}
            </span>
          </a>
        );
      })}
    </div>
  );
}

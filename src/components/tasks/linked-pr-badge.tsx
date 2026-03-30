import { GitPullRequest } from "lucide-react";

interface LinkedPRBadgeProps {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  prStatus: string;
}

const statusColors: Record<string, string> = {
  OPEN: "text-emerald-400",
  DRAFT: "text-zinc-400",
  MERGED: "text-violet-400",
  CLOSED: "text-red-400",
};

export function LinkedPRBadge({
  prNumber,
  prTitle,
  prUrl,
  prStatus,
}: LinkedPRBadgeProps) {
  return (
    <a
      href={prUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs hover:bg-muted transition-colors"
    >
      <GitPullRequest
        className={`h-3 w-3 ${statusColors[prStatus] ?? "text-zinc-400"}`}
      />
      <span className="text-muted-foreground">#{prNumber}</span>
      <span className="truncate max-w-[150px]">{prTitle}</span>
    </a>
  );
}

export function LinkedPRIcon({ status }: { status: string }) {
  return (
    <GitPullRequest
      className={`h-3.5 w-3.5 ${statusColors[status] ?? "text-zinc-400"}`}
    />
  );
}

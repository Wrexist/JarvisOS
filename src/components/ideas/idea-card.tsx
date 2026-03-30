import Link from "next/link";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import type { IdeaStatus } from "@/generated/prisma/client";

interface IdeaCardProps {
  id: string;
  title: string;
  summary: string | null;
  status: IdeaStatus;
  score: number | null;
  tags: string[];
  createdAt: string;
}

export function IdeaCard({
  id,
  title,
  summary,
  status,
  score,
  tags,
  createdAt,
}: IdeaCardProps) {
  return (
    <Link href={`/ideas/${id}`}>
      <div className="glass-panel p-5 transition-colors hover:border-zinc-700/70 group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground group-hover:text-white truncate">
              {title}
            </h3>
            {summary && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {summary}
              </p>
            )}
          </div>
          {score !== null && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {score}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <IdeaStatusBadge status={status} />
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

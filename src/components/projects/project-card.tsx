import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { StageBadge } from "@/components/projects/stage-badge";
import type { ProjectStage } from "@/generated/prisma/client";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  stage: ProjectStage;
  taskCount: number;
  docCount: number;
  updatedAt: string;
}

export function ProjectCard({
  id,
  name,
  description,
  stage,
  taskCount,
  docCount,
  updatedAt,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <div className="glass-panel p-5 transition-colors hover:border-zinc-700/70 group">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-foreground group-hover:text-white truncate">
                {name}
              </h3>
              <StageBadge stage={stage} />
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{taskCount} tasks</span>
              <span>{docCount} docs</span>
              <span className="ml-auto">
                Updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

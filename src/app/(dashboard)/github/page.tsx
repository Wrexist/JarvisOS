export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { GitBranch } from "lucide-react";
import Link from "next/link";

export default async function GitHubPage() {
  const workspaceId = await getSessionWorkspaceId();
  const repositories = await prisma.repository.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { pullRequests: true } },
      projects: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GitHub</h1>
        <p className="mt-1 text-muted-foreground">
          Connected repos, pull requests, and check status.
        </p>
      </div>

      {repositories.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          <GitBranch className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No repositories connected yet.</p>
          <p className="text-sm mt-1">
            Connect a repo from a project&apos;s GitHub tab.
          </p>
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{repo.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {repo._count.pullRequests} PRs
                  {repo.projects.length > 0 && (
                    <>
                      {" · Linked to "}
                      {repo.projects.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 && ", "}
                          <Link
                            href={`/projects/${p.id}`}
                            className="text-primary hover:underline"
                          >
                            {p.name}
                          </Link>
                        </span>
                      ))}
                    </>
                  )}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {repo.isPrivate ? "Private" : "Public"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

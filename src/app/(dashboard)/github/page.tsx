export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { GitBranch } from "lucide-react";
import { PRList } from "@/components/github/pr-list";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default async function GitHubPage() {
  const workspaceId = await getSessionWorkspaceId();
  const repositories = await prisma.repository.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { pullRequests: true } },
      projects: { select: { id: true, name: true } },
      pullRequests: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          checkRuns: { select: { conclusion: true, name: true } },
        },
      },
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
        <EmptyState
          icon={GitBranch}
          title="No repositories connected"
          description="Connect a repo from a project's GitHub tab to start tracking PRs."
          actionLabel="Go to Projects"
          actionHref="/projects"
        />
      ) : (
        <div className="space-y-6">
          {repositories.map((repo) => (
            <div key={repo.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{repo.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {repo._count.pullRequests} PRs
                    {repo.isPrivate ? " · Private" : " · Public"}
                    {repo.projects.length > 0 && (
                      <>
                        {" · "}
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
              </div>
              {repo.pullRequests.length > 0 ? (
                <PRList
                  pullRequests={repo.pullRequests.map((pr) => ({
                    id: pr.id,
                    number: pr.number,
                    title: pr.title,
                    headBranch: pr.headBranch,
                    status: pr.status,
                    url: pr.url,
                    updatedAt: pr.updatedAt.toISOString(),
                    checkRuns: pr.checkRuns.map((c) => ({
                      conclusion: c.conclusion,
                      name: c.name,
                    })),
                  }))}
                />
              ) : (
                <div className="glass-panel p-4 text-center text-xs text-muted-foreground">
                  No pull requests yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

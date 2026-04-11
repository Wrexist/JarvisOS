export const dynamic = "force-dynamic";

import { getSessionWorkspaceId } from "@/lib/session";
import { listIdeas } from "@/server/services/idea.service";
import { IdeaList } from "@/components/ideas/idea-list";
import { CreateIdeaDialog } from "@/components/ideas/create-idea-dialog";

export const metadata = { title: "Ideas" };

export default async function IdeasPage() {
  const workspaceId = await getSessionWorkspaceId();
  const ideas = await listIdeas(workspaceId);

  // Serialize dates for client component
  const serialized = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    status: idea.status,
    score: idea.score,
    tags: idea.tags,
    createdAt: idea.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ideas</h1>
          <p className="mt-1 text-muted-foreground">
            Capture, score, and convert ideas into projects.
          </p>
        </div>
        <CreateIdeaDialog />
      </div>
      <IdeaList ideas={serialized} />
    </div>
  );
}

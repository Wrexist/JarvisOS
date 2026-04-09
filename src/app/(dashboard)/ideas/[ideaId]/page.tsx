export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIdea } from "@/server/services/idea.service";
import { getSessionWorkspaceId } from "@/lib/session";
import { IdeaDetail } from "@/components/ideas/idea-detail";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const { ideaId } = await params;
  const workspaceId = await getSessionWorkspaceId();
  const idea = await getIdea(ideaId, workspaceId);

  if (!idea) notFound();

  // Serialize for client component
  const serialized = {
    ...idea,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
    aiRuns: idea.aiRuns.map((run) => ({
      id: run.id,
      type: run.type,
      status: run.status,
      output: run.output,
      createdAt: run.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-4">
      <Link
        href="/ideas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Ideas
      </Link>
      <IdeaDetail idea={serialized} />
    </div>
  );
}

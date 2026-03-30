export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getIdea } from "@/server/services/idea.service";
import { IdeaDetail } from "@/components/ideas/idea-detail";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const { ideaId } = await params;
  const idea = await getIdea(ideaId);

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

  return <IdeaDetail idea={serialized} />;
}

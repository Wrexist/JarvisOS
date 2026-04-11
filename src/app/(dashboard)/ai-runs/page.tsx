export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { Bot } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { AIRunsClient } from "@/components/ai-runs/ai-runs-client";

export const metadata = { title: "AI Runs" };

export default async function AIRunsPage() {
  const workspaceId = await getSessionWorkspaceId();
  const aiRuns = await prisma.aIRun.findMany({
    where: { workspaceId },
    include: {
      idea: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true, projectId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (aiRuns.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Runs</h1>
          <p className="mt-1 text-muted-foreground">
            AI generation history and outputs.
          </p>
        </div>
        <EmptyState
          icon={Bot}
          title="No AI runs yet"
          description="Enrich an idea or generate a spec to create your first run."
        />
      </div>
    );
  }

  const serialized = aiRuns.map((run) => ({
    id: run.id,
    type: run.type,
    status: run.status,
    modelName: run.modelName,
    output: run.output,
    error: run.error,
    createdAt: run.createdAt.toISOString(),
    idea: run.idea,
    project: run.project,
    task: run.task,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Runs</h1>
        <p className="mt-1 text-muted-foreground">
          AI generation history and outputs.
        </p>
      </div>
      <AIRunsClient runs={serialized} />
    </div>
  );
}

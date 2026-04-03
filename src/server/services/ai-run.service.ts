import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification.service";
import type { AIRunStatus, AIRunType } from "@/generated/prisma/client";

export async function createAIRun(data: {
  type: AIRunType;
  status?: AIRunStatus;
  modelName?: string;
  input: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  ideaId?: string;
}) {
  return prisma.aIRun.create({
    data: {
      type: data.type,
      status: data.status ?? "RUNNING",
      modelName: data.modelName,
      input: data.input,
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      taskId: data.taskId,
      ideaId: data.ideaId,
    },
  });
}

export async function completeAIRun(id: string, output: string) {
  const run = await prisma.aIRun.update({
    where: { id },
    data: { status: "COMPLETED", output },
  });

  const href = run.ideaId
    ? `/ideas/${run.ideaId}`
    : run.projectId
      ? `/projects/${run.projectId}`
      : "/ai-runs";

  createNotification(run.workspaceId, {
    type: "ai.completed",
    title: `AI run completed: ${run.type.replace(/_/g, " ").toLowerCase()}`,
    href,
  }).catch(() => {});

  return run;
}

export async function failAIRun(id: string, error: string) {
  return prisma.aIRun.update({
    where: { id },
    data: { status: "FAILED", error },
  });
}

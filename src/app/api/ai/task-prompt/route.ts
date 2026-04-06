import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { renderTemplate } from "@/lib/ai/prompts";
import { createAIRun, completeAIRun } from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const DEFAULT_TASK_PROMPT = `Implement this task in ForgeOS.

Task title:
{{task_title}}

Task description:
{{task_description}}

Acceptance criteria:
{{acceptance_criteria}}

Project context:
{{project_context}}

Relevant files:
{{relevant_files}}

Instructions:
- Inspect the current implementation before changing anything
- Keep the solution minimal and clean
- Reuse existing patterns
- Update types if needed
- Add loading/error states if UI is involved
- Briefly explain what changed`;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const { taskId } = await request.json();

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId is required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { workspaceId } },
    include: {
      project: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { allowed } = checkRateLimit(`ai:${workspaceId}`, { limit: 20, window: 60_000 });
  if (!allowed) return rateLimitResponse();

  // Try loading template from DB
  const dbTemplate = await prisma.promptTemplate.findFirst({
    where: { workspaceId, name: "Task Coding Prompt" },
  });

  const promptContent = dbTemplate?.content ?? DEFAULT_TASK_PROMPT;

  const prompt = renderTemplate(promptContent, {
    task_title: task.title,
    task_description: task.description ?? "",
    acceptance_criteria: task.acceptanceCriteria ?? "None specified",
    project_context: task.project
      ? `${task.project.name}: ${task.project.description ?? ""}`
      : "",
    relevant_files: task.relevantFiles.join("\n") || "Not specified",
  });

  // Save as AIRun
  const aiRun = await createAIRun({
    type: "TASK_PROMPT",
    input: prompt,
    workspaceId,
    projectId: task.project?.id,
    taskId: task.id,
  });

  await completeAIRun(aiRun.id, prompt);

  return NextResponse.json({ prompt, aiRunId: aiRun.id });
}

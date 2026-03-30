import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { renderTemplate } from "@/lib/ai/prompts";
import { createAIRun, completeAIRun } from "@/server/services/ai-run.service";

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
  const { taskId } = await request.json();

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId is required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const workspaceId = await getSessionWorkspaceId();

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

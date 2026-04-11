import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate, AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { apiError, validateBody } from "@/lib/api-utils";
import { aiProjectIdSchema } from "@/lib/validations";
import { getAIConfig } from "@/lib/ai/config";

const DEFAULT_BREAKDOWN_PROMPT = `Turn this project into an MVP execution plan.

Return JSON:
{
  "tasks": [
    {
      "title": "",
      "description": "",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "acceptanceCriteria": ""
    }
  ]
}

Project:
{{project_name}}

Description:
{{project_description}}

Existing tasks (avoid duplicates):
{{existing_tasks}}`;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const data = await validateBody(request, aiProjectIdSchema);
  if (data instanceof NextResponse) return data;
  const { projectId } = data;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    include: {
      tasks: { select: { title: true, status: true } },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const { allowed } = checkRateLimit(`ai:${workspaceId}`, { limit: 20, window: 60_000 });
  if (!allowed) return rateLimitResponse();

  const dbTemplate = await prisma.promptTemplate.findFirst({
    where: { workspaceId, name: "Task Breakdown" },
  });

  const existingTasks = project.tasks
    .map((t) => `- ${t.title} (${t.status})`)
    .join("\n") || "None yet";

  const prompt = renderTemplate(
    dbTemplate?.content ?? DEFAULT_BREAKDOWN_PROMPT,
    {
      project_name: project.name,
      project_description: project.description ?? "",
      existing_tasks: existingTasks,
    }
  );

  const aiConfig = getAIConfig("task-breakdown");

  const aiRun = await createAIRun({
    type: "TASK_GENERATION",
    input: prompt,
    modelName: aiConfig.model,
    workspaceId,
    projectId: project.id,
  });

  try {
    const response = await anthropic.messages.create({
      model: aiConfig.model,
      max_tokens: aiConfig.maxTokens,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let tasks: Array<{
      title: string;
      description: string;
      priority: string;
      acceptanceCriteria: string;
    }> = [];

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      }
    } catch {
      // If JSON parsing fails, try line-by-line extraction
      tasks = [];
    }

    await completeAIRun(aiRun.id, text, {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });

    return NextResponse.json({
      tasks,
      rawOutput: text,
      aiRunId: aiRun.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await failAIRun(aiRun.id, message);
    return apiError("Task breakdown failed", error);
  }
}

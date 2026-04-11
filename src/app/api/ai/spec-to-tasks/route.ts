import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { AI_SYSTEM_PROMPT, sanitizeForPrompt } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { apiError, validateBody } from "@/lib/api-utils";
import { aiDocumentIdSchema } from "@/lib/validations";
import { getAIConfig } from "@/lib/ai/config";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const data = await validateBody(request, aiDocumentIdSchema);
  if (data instanceof NextResponse) return data;
  const { documentId } = data;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, project: { workspaceId } },
    include: {
      project: {
        select: { id: true, name: true },
        include: { tasks: { select: { title: true } } },
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  const { allowed } = checkRateLimit(`ai:${workspaceId}`, { limit: 20, window: 60_000 });
  if (!allowed) return rateLimitResponse();

  const existingTasks =
    doc.project.tasks.map((t) => `- ${t.title}`).join("\n") || "None";

  const prompt = `Based on this technical specification, generate a list of implementation tasks.

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

Specification:
${sanitizeForPrompt(doc.content, 4000)}

Project: ${sanitizeForPrompt(doc.project.name, 200)}

Existing tasks (avoid duplicates):
${sanitizeForPrompt(existingTasks, 2000)}`;

  const aiConfig = getAIConfig("spec-to-tasks");

  const aiRun = await createAIRun({
    type: "TASK_GENERATION",
    input: prompt,
    modelName: aiConfig.model,
    workspaceId,
    projectId: doc.project.id,
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
      tasks = [];
    }

    await completeAIRun(aiRun.id, text, {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });

    return NextResponse.json({
      tasks,
      projectId: doc.project.id,
      aiRunId: aiRun.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await failAIRun(aiRun.id, message);
    return apiError("Spec-to-tasks failed", error);
  }
}

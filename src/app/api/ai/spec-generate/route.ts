import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate, AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createDocument } from "@/server/services/document.service";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { apiError, validateBody } from "@/lib/api-utils";
import { aiProjectIdSchema } from "@/lib/validations";
import { getAIConfig } from "@/lib/ai/config";

const DEFAULT_SPEC_PROMPT = `Create an MVP product spec in markdown.

Include:
- Overview
- User problem
- Core features
- Primary flows
- Technical approach
- MVP boundaries
- Future ideas

Project:
{{project_name}}

Description:
{{project_description}}`;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const data = await validateBody(request, aiProjectIdSchema);
  if (data instanceof NextResponse) return data;
  const { projectId } = data;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    include: { tasks: { select: { title: true, status: true } } },
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
    where: { workspaceId, name: "MVP Spec" },
  });

  const prompt = renderTemplate(
    dbTemplate?.content ?? DEFAULT_SPEC_PROMPT,
    {
      project_name: project.name,
      project_description: project.description ?? "",
    }
  );

  const aiConfig = getAIConfig("spec-generate");

  const aiRun = await createAIRun({
    type: "SPEC_GENERATION",
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

    // Save as a TECH_SPEC document
    const doc = await createDocument(project.id, {
      title: `${project.name} - MVP Spec`,
      type: "TECH_SPEC",
      content: text,
    });

    await completeAIRun(aiRun.id, text, {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });

    return NextResponse.json({ document: doc, aiRun: { id: aiRun.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await failAIRun(aiRun.id, message);
    return apiError("Spec generation failed", error);
  }
}

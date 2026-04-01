import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate } from "@/lib/ai/prompts";
import { getSessionWorkspaceId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createDocument } from "@/server/services/document.service";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";

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
  const { allowed } = checkRateLimit("ai", { limit: 10, window: 60_000 });
  if (!allowed) return rateLimitResponse();
  const { projectId } = await request.json();

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: { select: { title: true, status: true } } },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const workspaceId = await getSessionWorkspaceId();

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

  const aiRun = await createAIRun({
    type: "SPEC_GENERATION",
    input: prompt,
    modelName: "claude-sonnet-4-20250514",
    workspaceId,
    projectId: project.id,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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

    await completeAIRun(aiRun.id, text);

    return NextResponse.json({ document: doc, aiRun: { id: aiRun.id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spec generation failed";
    await failAIRun(aiRun.id, message);
    logger.error("Spec generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

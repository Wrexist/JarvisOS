import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate, IDEA_ENRICH_PROMPT } from "@/lib/ai/prompts";
import { requireAuth } from "@/lib/session";
import { getIdea, updateIdea } from "@/server/services/idea.service";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { ideaId } = await request.json();

  if (!ideaId) {
    return NextResponse.json({ error: "ideaId is required" }, { status: 400 });
  }

  const idea = await getIdea(ideaId);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const { allowed } = checkRateLimit(`ai:${workspaceId}`, { limit: 20, window: 60_000 });
  if (!allowed) return rateLimitResponse();

  // Try to load template from DB, fallback to hardcoded
  const dbTemplate = await prisma.promptTemplate.findFirst({
    where: { workspaceId, name: "Idea Enrich" },
  });

  const promptContent = dbTemplate?.content ?? IDEA_ENRICH_PROMPT;

  const prompt = renderTemplate(promptContent, {
    idea_title: idea.title,
    idea_description: idea.description ?? idea.summary ?? "",
  });

  const aiRun = await createAIRun({
    type: "IDEA_ENRICH",
    input: prompt,
    modelName: "claude-sonnet-4-20250514",
    workspaceId,
    ideaId: idea.id,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Try to parse JSON from the response
    let enrichment: Record<string, unknown> = {};
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enrichment = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, store raw output
      enrichment = { summary: text };
    }

    // Update idea with enriched fields
    const updatedIdea = await updateIdea(idea.id, {
      summary:
        typeof enrichment.summary === "string"
          ? enrichment.summary
          : idea.summary,
      problem:
        typeof enrichment.problem === "string"
          ? enrichment.problem
          : idea.problem,
      targetUser:
        typeof enrichment.targetUser === "string"
          ? enrichment.targetUser
          : idea.targetUser,
      whyNow:
        typeof enrichment.whyNow === "string"
          ? enrichment.whyNow
          : idea.whyNow,
      monetization:
        typeof enrichment.monetization === "string"
          ? enrichment.monetization
          : idea.monetization,
      risks:
        typeof enrichment.risks === "string" ? enrichment.risks : idea.risks,
      assumptions:
        typeof enrichment.assumptions === "string"
          ? enrichment.assumptions
          : idea.assumptions,
      score:
        typeof enrichment.score === "number"
          ? enrichment.score
          : idea.score ?? undefined,
      status: idea.status === "INBOX" ? "REVIEWING" : undefined,
    });

    await completeAIRun(aiRun.id, text);

    return NextResponse.json({
      idea: updatedIdea,
      aiRun: { id: aiRun.id, output: text },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI enrichment failed";
    await failAIRun(aiRun.id, message);
    console.error("AI enrichment failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { workspaceId } = auth;

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 }
    );
  }

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
${doc.content.slice(0, 4000)}

Project: ${doc.project.name}

Existing tasks (avoid duplicates):
${existingTasks}`;

  const aiRun = await createAIRun({
    type: "TASK_GENERATION",
    input: prompt,
    modelName: "claude-sonnet-4-20250514",
    workspaceId,
    projectId: doc.project.id,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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

    await completeAIRun(aiRun.id, text);

    return NextResponse.json({
      tasks,
      projectId: doc.project.id,
      aiRunId: aiRun.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spec-to-tasks failed";
    await failAIRun(aiRun.id, message);
    console.error("Spec-to-tasks failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

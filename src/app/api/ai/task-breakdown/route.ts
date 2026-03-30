import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate } from "@/lib/ai/prompts";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";

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
  const { projectId } = await request.json();

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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

  const workspaceId = await getDefaultWorkspaceId();

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

  const aiRun = await createAIRun({
    type: "TASK_GENERATION",
    input: prompt,
    modelName: "claude-sonnet-4-20250514",
    workspaceId,
    projectId: project.id,
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
      // If JSON parsing fails, try line-by-line extraction
      tasks = [];
    }

    await completeAIRun(aiRun.id, text);

    return NextResponse.json({
      tasks,
      rawOutput: text,
      aiRunId: aiRun.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Task breakdown failed";
    await failAIRun(aiRun.id, message);
    console.error("Task breakdown failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

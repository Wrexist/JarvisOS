import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { renderTemplate } from "@/lib/ai/prompts";
import { getSessionWorkspaceId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
} from "@/server/services/ai-run.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const DEFAULT_NEXT_ACTION_PROMPT = `Given this project state, suggest the single most important next action.

Project:
{{project_name}}

Stage:
{{project_stage}}

Open tasks:
{{open_tasks}}

Blocked tasks:
{{blocked_tasks}}

Open PRs:
{{open_prs}}

Return JSON:
{
  "recommended_action": "",
  "reason": "",
  "target": "project|task|idea",
  "targetName": ""
}`;

export async function POST() {
  try {
    const workspaceId = await getSessionWorkspaceId();

    const { allowed } = checkRateLimit(`ai:${workspaceId}`, { limit: 20, window: 60_000 });
    if (!allowed) return rateLimitResponse();

    // Gather context across all active projects
    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        stage: { notIn: ["ARCHIVED", "SHIPPED", "PAUSED"] },
      },
      include: {
        tasks: { select: { title: true, status: true, priority: true } },
        pullRequests: {
          where: { status: "OPEN" },
          select: { title: true, number: true },
        },
      },
    });

    const dbTemplate = await prisma.promptTemplate.findFirst({
      where: { workspaceId, name: "Next Action" },
    });

    // Build context for the most urgent project
    const projectContexts = projects.map((p) => {
      const openTasks = p.tasks.filter((t) => t.status !== "DONE");
      const blockedTasks = p.tasks.filter((t) => t.status === "BLOCKED");
      return {
        project: p,
        openTasks,
        blockedTasks,
        urgency: blockedTasks.length * 3 + openTasks.length,
      };
    });

    projectContexts.sort((a, b) => b.urgency - a.urgency);
    const topProject = projectContexts[0];

    if (!topProject) {
      return NextResponse.json({
        recommended_action: "Capture a new idea",
        reason: "No active projects. Time to brainstorm!",
        target: "idea",
        targetName: "",
      });
    }

    const p = topProject.project;
    const prompt = renderTemplate(
      dbTemplate?.content ?? DEFAULT_NEXT_ACTION_PROMPT,
      {
        project_name: p.name,
        project_stage: p.stage,
        open_tasks:
          topProject.openTasks.map((t) => `- ${t.title} (${t.status}, ${t.priority})`).join("\n") || "None",
        blocked_tasks:
          topProject.blockedTasks.map((t) => `- ${t.title}`).join("\n") || "None",
        open_prs:
          p.pullRequests.map((pr) => `- #${pr.number}: ${pr.title}`).join("\n") || "None",
      }
    );

    const aiRun = await createAIRun({
      type: "NEXT_ACTION",
      input: prompt,
      modelName: "claude-sonnet-4-20250514",
      workspaceId,
      projectId: p.id,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let result = {
      recommended_action: "Review your projects",
      reason: text,
      target: "project",
      targetName: p.name,
    };

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          recommended_action: parsed.recommended_action ?? result.recommended_action,
          reason: parsed.reason ?? result.reason,
          target: parsed.target ?? "project",
          targetName: parsed.targetName ?? p.name,
        };
      }
    } catch {
      // Use raw text as reason
    }

    await completeAIRun(aiRun.id, text);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Next action failed";
    console.error("Next action failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import {
  createAIRun,
  completeAIRun,
  failAIRun,
} from "@/server/services/ai-run.service";

export async function POST(request: Request) {
  const { pullRequestId } = await request.json();

  if (!pullRequestId) {
    return NextResponse.json(
      { error: "pullRequestId is required" },
      { status: 400 }
    );
  }

  const pr = await prisma.pullRequest.findUnique({
    where: { id: pullRequestId },
    include: {
      checkRuns: true,
      linkedTasks: { select: { title: true, status: true } },
      repository: { select: { fullName: true } },
    },
  });

  if (!pr) {
    return NextResponse.json(
      { error: "Pull request not found" },
      { status: 404 }
    );
  }

  const workspaceId = await getDefaultWorkspaceId();

  const failedChecks = pr.checkRuns
    .filter((c) => c.conclusion === "FAILURE" || c.conclusion === "TIMED_OUT")
    .map((c) => `- ${c.name}: ${c.conclusion}`)
    .join("\n");

  const prompt = `Summarize this pull request and analyze any CI/CD failures.

PR #${pr.number}: ${pr.title}
Repository: ${pr.repository.fullName}
Branch: ${pr.headBranch} → ${pr.baseBranch}
Status: ${pr.status}
Author: ${pr.authorLogin ?? "Unknown"}

Linked tasks:
${pr.linkedTasks.map((t) => `- ${t.title} (${t.status})`).join("\n") || "None"}

Check run results:
${pr.checkRuns.map((c) => `- ${c.name}: ${c.conclusion}`).join("\n") || "No check runs"}

${failedChecks ? `\nFailed checks:\n${failedChecks}\n\nAnalyze the likely causes of these failures.` : ""}

Provide:
1. A brief summary of what this PR likely does
2. Status assessment
3. Any concerns or failure analysis`;

  const aiRun = await createAIRun({
    type: "PR_SUMMARY",
    input: prompt,
    modelName: "claude-sonnet-4-20250514",
    workspaceId,
    projectId: pr.projectId ?? undefined,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    await completeAIRun(aiRun.id, text);

    return NextResponse.json({ summary: text, aiRunId: aiRun.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PR summary failed";
    await failAIRun(aiRun.id, message);
    console.error("PR summary failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

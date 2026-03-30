import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGitHubAppConfig } from "@/lib/github/app";
import { prisma } from "@/lib/prisma";
import {
  syncPullRequest,
  syncCheckRun,
} from "@/server/services/github-sync.service";
import type { PRStatus, CheckConclusion } from "@/generated/prisma/client";

function mapPRStatus(state: string, merged: boolean): PRStatus {
  if (merged) return "MERGED";
  if (state === "closed") return "CLOSED";
  if (state === "draft") return "DRAFT";
  return "OPEN";
}

function mapCheckConclusion(conclusion: string | null): CheckConclusion {
  const map: Record<string, CheckConclusion> = {
    success: "SUCCESS",
    failure: "FAILURE",
    neutral: "NEUTRAL",
    cancelled: "CANCELLED",
    skipped: "SKIPPED",
    timed_out: "TIMED_OUT",
    action_required: "ACTION_REQUIRED",
    stale: "STALE",
    startup_failure: "STARTUP_FAILURE",
  };
  return conclusion ? (map[conclusion] ?? "UNKNOWN") : "UNKNOWN";
}

export async function POST(request: Request) {
  try {
    const config = getGitHubAppConfig();
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (config.webhookSecret && signature) {
      const expected =
        "sha256=" +
        crypto
          .createHmac("sha256", config.webhookSecret)
          .update(body)
          .digest("hex");

      if (signature !== expected) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = request.headers.get("x-github-event");
    const payload = JSON.parse(body);

    const repoFullName = payload.repository?.full_name;
    const repo = repoFullName
      ? await prisma.repository.findUnique({
          where: { fullName: repoFullName },
          include: { projects: { select: { id: true }, take: 1 } },
        })
      : null;

    if (!repo) {
      return NextResponse.json({ received: true, skipped: "repo not tracked" });
    }

    const projectId = repo.projects[0]?.id ?? null;

    if (event === "pull_request" && payload.pull_request) {
      const pr = payload.pull_request;
      await syncPullRequest(repo.id, projectId, {
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        headBranch: pr.head?.ref ?? "",
        baseBranch: pr.base?.ref ?? "",
        status: mapPRStatus(pr.state, pr.merged ?? false),
        authorLogin: pr.user?.login,
        lastCommitSha: pr.head?.sha,
        githubPrId: BigInt(pr.id),
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
      });
    }

    if (event === "check_run" && payload.check_run) {
      const cr = payload.check_run;
      await syncCheckRun(repo.id, {
        name: cr.name,
        status: cr.status,
        conclusion: mapCheckConclusion(cr.conclusion),
        detailsUrl: cr.details_url,
        startedAt: cr.started_at ? new Date(cr.started_at) : undefined,
        completedAt: cr.completed_at ? new Date(cr.completed_at) : undefined,
        headSha: cr.head_sha,
        githubCheckRunId: BigInt(cr.id),
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

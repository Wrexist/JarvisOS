import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification.service";
import type { PRStatus, CheckConclusion } from "@/generated/prisma/client";

/**
 * Upserts a repository record from GitHub webhook/sync data.
 */
export async function upsertRepository(
  workspaceId: string,
  data: {
    fullName: string;
    owner: string;
    name: string;
    defaultBranch?: string;
    isPrivate?: boolean;
    installationId?: string;
  }
) {
  return prisma.repository.upsert({
    where: { fullName: data.fullName },
    update: {
      defaultBranch: data.defaultBranch,
      isPrivate: data.isPrivate,
      installationId: data.installationId,
    },
    create: {
      fullName: data.fullName,
      owner: data.owner,
      name: data.name,
      defaultBranch: data.defaultBranch,
      isPrivate: data.isPrivate ?? true,
      installationId: data.installationId,
      workspaceId,
    },
  });
}

/**
 * Connects a repository to a project.
 */
export async function connectRepoToProject(
  projectId: string,
  repositoryId: string
) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { repositoryId },
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.repo_connected",
      message: "Repository connected to project",
      projectId,
    },
  });

  return project;
}

/**
 * Syncs a pull request from a GitHub webhook payload.
 */
export async function syncPullRequest(
  repositoryId: string,
  projectId: string | null,
  data: {
    number: number;
    title: string;
    url: string;
    headBranch: string;
    baseBranch: string;
    status: PRStatus;
    authorLogin?: string;
    lastCommitSha?: string;
    githubPrId?: bigint;
    createdAt: Date;
    updatedAt: Date;
  }
) {
  const pr = await prisma.pullRequest.upsert({
    where: { githubPrId: data.githubPrId ?? BigInt(-1) },
    update: {
      title: data.title,
      status: data.status,
      lastCommitSha: data.lastCommitSha,
      updatedAt: data.updatedAt,
      projectId,
    },
    create: {
      number: data.number,
      title: data.title,
      url: data.url,
      headBranch: data.headBranch,
      baseBranch: data.baseBranch,
      status: data.status,
      authorLogin: data.authorLogin,
      lastCommitSha: data.lastCommitSha,
      githubPrId: data.githubPrId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      repositoryId,
      projectId,
    },
  });

  if (projectId) {
    await prisma.activityEvent.create({
      data: {
        type: "pr.synced",
        message: `PR #${data.number} "${data.title}" synced`,
        projectId,
      },
    });
  }

  return pr;
}

/**
 * Syncs a check run from a GitHub webhook payload.
 */
export async function syncCheckRun(
  repositoryId: string,
  data: {
    name: string;
    status?: string;
    conclusion: CheckConclusion;
    detailsUrl?: string;
    startedAt?: Date;
    completedAt?: Date;
    headSha?: string;
    githubCheckRunId?: bigint;
  }
) {
  // Find the PR by headSha
  let pullRequestId: string | null = null;
  if (data.headSha) {
    const pr = await prisma.pullRequest.findFirst({
      where: { lastCommitSha: data.headSha },
      select: { id: true },
    });
    pullRequestId = pr?.id ?? null;
  }

  return prisma.checkRun.upsert({
    where: { githubCheckRunId: data.githubCheckRunId ?? BigInt(-1) },
    update: {
      status: data.status,
      conclusion: data.conclusion,
      completedAt: data.completedAt,
    },
    create: {
      name: data.name,
      status: data.status,
      conclusion: data.conclusion,
      detailsUrl: data.detailsUrl,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      headSha: data.headSha,
      githubCheckRunId: data.githubCheckRunId,
      repositoryId,
      pullRequestId,
    },
  });
}

/**
 * Links a task to a PR.
 */
export async function linkTaskToPR(taskId: string, prId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { linkedPullRequestId: prId },
  });

  await prisma.activityEvent.create({
    data: {
      type: "task.pr_linked",
      message: `Task "${task.title}" linked to a pull request`,
      projectId: task.projectId,
      taskId: task.id,
    },
  });

  return task;
}

/**
 * Unlinks a task from its PR.
 */
export async function unlinkTaskPR(taskId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { linkedPullRequestId: null },
  });
}

/**
 * Auto-completes tasks linked to a merged PR.
 */
export async function autoCompleteLinkedTasks(pullRequestId: string) {
  const pr = await prisma.pullRequest.findUnique({
    where: { id: pullRequestId },
    include: {
      repository: { select: { workspaceId: true } },
      linkedTasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, title: true, projectId: true },
      },
    },
  });

  if (!pr || pr.linkedTasks.length === 0) return [];

  const completed = [];
  for (const task of pr.linkedTasks) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "DONE" },
    });

    await prisma.activityEvent.create({
      data: {
        type: "task.auto_completed",
        message: `Task "${task.title}" auto-completed from PR #${pr.number} merge`,
        projectId: task.projectId,
        taskId: task.id,
      },
    });

    completed.push(task);
  }

  if (completed.length > 0) {
    const workspaceId = pr.repository.workspaceId;
    for (const task of completed) {
      createNotification(workspaceId, {
        type: "task.auto_completed",
        title: `Task auto-completed: ${task.title}`,
        message: `PR #${pr.number} was merged`,
        href: `/projects/${task.projectId}?task=${task.id}`,
      }).catch((err) => console.error("Failed to create notification:", err));
    }
  }

  return completed;
}

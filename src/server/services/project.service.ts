import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/server/services/webhook.service";
import type { ProjectStage } from "@/generated/prisma/client";
import slugify from "slugify";

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export async function listProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId },
    include: {
      idea: { select: { id: true, title: true } },
      _count: { select: { tasks: true, documents: true, pullRequests: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      idea: { select: { id: true, title: true, status: true } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          linkedPullRequest: {
            select: { number: true, title: true, url: true, status: true },
          },
        },
      },
      documents: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 10 },
      pullRequests: {
        orderBy: { updatedAt: "desc" },
        include: {
          checkRuns: { select: { conclusion: true, name: true } },
        },
      },
      repository: true,
      _count: { select: { tasks: true, documents: true, pullRequests: true } },
    },
  });
}

export async function createProject(
  workspaceId: string,
  data: CreateProjectInput
) {
  const slug = slugify(data.name, { lower: true, strict: true });

  const existing = await prisma.project.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      slug: finalSlug,
      description: data.description,
      workspaceId,
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.created",
      message: `Project "${project.name}" was created`,
      projectId: project.id,
    },
  });

  return project;
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string | null }
) {
  const project = await prisma.project.update({
    where: { id },
    data,
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.updated",
      message: `Project "${project.name}" was updated`,
      projectId: project.id,
    },
  });

  return project;
}

export async function updateProjectStage(id: string, stage: ProjectStage) {
  const project = await prisma.project.update({
    where: { id },
    data: { stage },
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.stage_changed",
      message: `Project "${project.name}" moved to ${stage}`,
      projectId: project.id,
      metadata: { stage },
    },
  });

  deliverWebhook(project.workspaceId, "project.stage_changed", {
    id: project.id,
    name: project.name,
    stage,
  }).catch(() => {});

  return project;
}

export async function deleteProject(id: string) {
  const project = await prisma.project.delete({ where: { id } });

  await prisma.activityEvent.create({
    data: {
      type: "project.deleted",
      message: `Project "${project.name}" was deleted`,
    },
  });
}

export async function getProjectStats(id: string) {
  const [totalTasks, doneTasks, blockedTasks, openPRs] = await Promise.all([
    prisma.task.count({ where: { projectId: id } }),
    prisma.task.count({ where: { projectId: id, status: "DONE" } }),
    prisma.task.count({ where: { projectId: id, status: "BLOCKED" } }),
    prisma.pullRequest.count({
      where: { projectId: id, status: "OPEN" },
    }),
  ]);

  return { totalTasks, doneTasks, blockedTasks, openPRs };
}

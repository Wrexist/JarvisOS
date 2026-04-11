import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/server/services/webhook.service";
import { createNotification } from "@/server/services/notification.service";
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

export async function getProject(id: string, workspaceId?: string) {
  return prisma.project.findFirst({
    where: { id, ...(workspaceId && { workspaceId }) },
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
  data: CreateProjectInput,
  userId?: string
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
      userId,
    },
  });

  return project;
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string | null },
  workspaceId?: string,
  userId?: string
) {
  if (workspaceId) {
    const exists = await prisma.project.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Project not found");
  }
  const project = await prisma.project.update({
    where: { id },
    data,
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.updated",
      message: `Project "${project.name}" was updated`,
      projectId: project.id,
      userId,
    },
  });

  return project;
}

export async function updateProjectStage(id: string, stage: ProjectStage, workspaceId?: string, userId?: string) {
  if (workspaceId) {
    const exists = await prisma.project.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Project not found");
  }
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
      userId,
    },
  });

  deliverWebhook(project.workspaceId, "project.stage_changed", {
    id: project.id,
    name: project.name,
    stage,
  }).catch((err) => console.error("Failed to deliver webhook:", err));

  createNotification(project.workspaceId, {
    type: "project.stage_changed",
    title: `${project.name} moved to ${stage.replace(/_/g, " ")}`,
    href: `/projects/${project.id}`,
  }).catch((err) => console.error("Failed to create notification:", err));

  return project;
}

export async function deleteProject(id: string, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.project.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Project not found");
  }

  const [project] = await prisma.$transaction([
    prisma.project.delete({ where: { id } }),
    prisma.activityEvent.create({
      data: {
        type: "project.deleted",
        message: "Project was deleted",
      },
    }),
  ]);

  return project;
}

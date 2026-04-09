import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/server/services/webhook.service";
import { createNotification } from "@/server/services/notification.service";
import type { IdeaStatus } from "@/generated/prisma/client";
import slugify from "slugify";

export interface CreateIdeaInput {
  title: string;
  description?: string;
  tags?: string[];
}

export interface UpdateIdeaInput {
  title?: string;
  summary?: string | null;
  description?: string | null;
  problem?: string | null;
  targetUser?: string | null;
  whyNow?: string | null;
  monetization?: string | null;
  risks?: string | null;
  assumptions?: string | null;
  score?: number | null;
  status?: IdeaStatus;
  tags?: string[];
}

export async function listIdeas(
  workspaceId: string,
  filters?: { status?: IdeaStatus; search?: string }
) {
  return prisma.idea.findMany({
    where: {
      workspaceId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" as const } },
          { summary: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIdea(id: string, workspaceId?: string) {
  return prisma.idea.findFirst({
    where: { id, ...(workspaceId && { workspaceId }) },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function createIdea(workspaceId: string, data: CreateIdeaInput) {
  const idea = await prisma.idea.create({
    data: {
      title: data.title,
      description: data.description,
      tags: data.tags ?? [],
      workspaceId,
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "idea.created",
      message: `Idea "${idea.title}" was created`,
    },
  });

  return idea;
}

export async function updateIdea(id: string, data: UpdateIdeaInput, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.idea.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Idea not found");
  }
  const idea = await prisma.idea.update({
    where: { id },
    data,
  });

  await prisma.activityEvent.create({
    data: {
      type: "idea.updated",
      message: `Idea "${idea.title}" was updated`,
    },
  });

  return idea;
}

export async function deleteIdea(id: string, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.idea.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Idea not found");
  }

  // Fetch title before deleting so we can log it
  const idea = await prisma.idea.findUnique({ where: { id }, select: { title: true } });

  await prisma.$transaction([
    prisma.idea.delete({ where: { id } }),
    prisma.activityEvent.create({
      data: {
        type: "idea.deleted",
        message: `Idea "${idea?.title ?? "Unknown"}" was deleted`,
      },
    }),
  ]);
}

export async function convertIdeaToProject(ideaId: string, workspaceId: string) {
  const idea = await prisma.idea.findFirst({ where: { id: ideaId, workspaceId } });
  if (!idea) throw new Error("Idea not found");
  if (idea.status === "CONVERTED") throw new Error("Idea already converted");

  const slug = slugify(idea.title, { lower: true, strict: true });

  // Check for slug collision
  const existing = await prisma.project.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const project = await prisma.project.create({
    data: {
      name: idea.title,
      slug: finalSlug,
      description: idea.summary ?? idea.description,
      workspaceId,
      ideaId: idea.id,
    },
  });

  await prisma.idea.update({
    where: { id: ideaId },
    data: { status: "CONVERTED" },
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        type: "idea.converted",
        message: `Idea "${idea.title}" was converted to project`,
        projectId: project.id,
      },
      {
        type: "project.created",
        message: `Project "${project.name}" was created from idea`,
        projectId: project.id,
      },
    ],
  });

  deliverWebhook(workspaceId, "idea.converted", {
    ideaId: idea.id,
    ideaTitle: idea.title,
    projectId: project.id,
    projectName: project.name,
  }).catch((err) => console.error("Failed to deliver webhook:", err));

  createNotification(workspaceId, {
    type: "idea.converted",
    title: `Idea converted: ${idea.title}`,
    message: `New project "${project.name}" created`,
    href: `/projects/${project.id}`,
  }).catch((err) => console.error("Failed to create notification:", err));

  return project;
}

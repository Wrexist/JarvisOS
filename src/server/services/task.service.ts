import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/server/services/webhook.service";
import { createNotification } from "@/server/services/notification.service";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

export interface CreateTaskInput {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: Priority;
  estimateHours?: number;
  dueDate?: string;
  relevantFiles?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  estimateHours?: number | null;
  dueDate?: string | null;
  relevantFiles?: string[];
}

export async function listProjectTasks(
  projectId: string,
  filters?: { status?: TaskStatus; priority?: Priority }
) {
  return prisma.task.findMany({
    where: {
      projectId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
    },
    include: {
      linkedPullRequest: {
        select: { number: true, title: true, url: true, status: true },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function listAllTasks(
  workspaceId: string,
  filters?: { status?: TaskStatus; priority?: Priority }
) {
  return prisma.task.findMany({
    where: {
      project: { workspaceId },
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
    },
    include: {
      project: { select: { id: true, name: true } },
      linkedPullRequest: {
        select: { number: true, title: true, url: true, status: true },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTask(id: string, workspaceId?: string) {
  return prisma.task.findFirst({
    where: { id, ...(workspaceId && { project: { workspaceId } }) },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      linkedPullRequest: {
        select: { number: true, title: true, url: true, status: true },
      },
      blockedByTasks: { select: { id: true, title: true, status: true } },
      blockingTasks: { select: { id: true, title: true, status: true } },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 5 },
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function createTask(projectId: string, data: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      acceptanceCriteria: data.acceptanceCriteria,
      priority: data.priority ?? "MEDIUM",
      estimateHours: data.estimateHours,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      relevantFiles: data.relevantFiles ?? [],
      projectId,
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "task.created",
      message: `Task "${task.title}" was created`,
      projectId,
      taskId: task.id,
    },
  });

  return task;
}

export async function createManyTasks(
  projectId: string,
  tasks: CreateTaskInput[]
) {
  const result = await prisma.task.createMany({
    data: tasks.map((data) => ({
      title: data.title,
      description: data.description,
      acceptanceCriteria: data.acceptanceCriteria,
      priority: data.priority ?? "MEDIUM",
      estimateHours: data.estimateHours,
      relevantFiles: data.relevantFiles ?? [],
      aiGenerated: true,
      projectId,
    })),
  });

  await prisma.activityEvent.create({
    data: {
      type: "task.bulk_created",
      message: `${result.count} tasks were generated from AI`,
      projectId,
    },
  });

  return result;
}

export async function updateTask(id: string, data: UpdateTaskInput, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.task.findFirst({ where: { id, project: { workspaceId } } });
    if (!exists) throw new Error("Task not found");
  }
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  return task;
}

export async function moveTaskStatus(id: string, status: TaskStatus, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.task.findFirst({ where: { id, project: { workspaceId } } });
    if (!exists) throw new Error("Task not found");
  }
  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: { project: { select: { id: true, name: true, workspaceId: true } } },
  });

  await prisma.activityEvent.create({
    data: {
      type: "task.status_changed",
      message: `Task "${task.title}" moved to ${status}`,
      projectId: task.projectId,
      taskId: task.id,
    },
  });

  // Deliver webhook + notification on task completion
  if (status === "DONE") {
    deliverWebhook(task.project.workspaceId, "task.completed", {
      id: task.id,
      title: task.title,
      project: { id: task.project.id, name: task.project.name },
    }).catch((err) => console.error("Failed to deliver webhook:", err));

    createNotification(task.project.workspaceId, {
      type: "task.completed",
      title: `Task completed: ${task.title}`,
      message: `in ${task.project.name}`,
      href: `/projects/${task.projectId}?task=${task.id}`,
    }).catch((err) => console.error("Failed to create notification:", err));
  }

  return task;
}

export async function deleteTask(id: string, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.task.findFirst({ where: { id, project: { workspaceId } } });
    if (!exists) throw new Error("Task not found");
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: { title: true, projectId: true },
  });

  await prisma.$transaction([
    prisma.task.delete({ where: { id } }),
    prisma.activityEvent.create({
      data: {
        type: "task.deleted",
        message: `Task "${task?.title ?? "Unknown"}" was deleted`,
        projectId: task?.projectId,
      },
    }),
  ]);
}

import { prisma } from "@/lib/prisma";
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
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, slug: true } },
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

export async function updateTask(id: string, data: UpdateTaskInput) {
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  return task;
}

export async function moveTaskStatus(id: string, status: TaskStatus) {
  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });

  await prisma.activityEvent.create({
    data: {
      type: "task.status_changed",
      message: `Task "${task.title}" moved to ${status}`,
      projectId: task.projectId,
      taskId: task.id,
    },
  });

  return task;
}

export async function deleteTask(id: string) {
  const task = await prisma.task.delete({ where: { id } });

  await prisma.activityEvent.create({
    data: {
      type: "task.deleted",
      message: `Task "${task.title}" was deleted`,
      projectId: task.projectId,
    },
  });
}

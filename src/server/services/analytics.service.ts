import { prisma } from "@/lib/prisma";

export async function getTaskCompletionByDay(workspaceId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.activityEvent.findMany({
    where: {
      type: "task.status_changed",
      createdAt: { gte: since },
      project: { workspaceId },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    byDay.set(date.toISOString().split("T")[0], 0);
  }

  for (const e of events) {
    const day = e.createdAt.toISOString().split("T")[0];
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  return Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));
}

export async function getVelocity(workspaceId: string) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: "DONE",
        updatedAt: { gte: oneWeekAgo },
      },
    }),
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: "DONE",
        updatedAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    }),
  ]);

  return { thisWeek, lastWeek, trend: thisWeek - lastWeek };
}

export async function getAIUsageByType(workspaceId: string) {
  const runs = await prisma.aIRun.groupBy({
    by: ["type"],
    where: { workspaceId },
    _count: true,
  });

  return runs.map((r) => ({ type: r.type, count: r._count }));
}

export async function getProjectProgress(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId, stage: { notIn: ["ARCHIVED"] } },
    include: {
      _count: { select: { tasks: true } },
      tasks: { where: { status: "DONE" }, select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    stage: p.stage,
    total: p._count.tasks,
    done: p.tasks.length,
    percentage: p._count.tasks > 0
      ? Math.round((p.tasks.length / p._count.tasks) * 100)
      : 0,
  }));
}

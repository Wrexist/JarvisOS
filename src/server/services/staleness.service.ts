import { prisma } from "@/lib/prisma";

export async function detectStaleProjects(workspaceId: string) {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const activeProjects = await prisma.project.findMany({
    where: {
      workspaceId,
      stage: { notIn: ["ARCHIVED", "SHIPPED", "PAUSED"] },
    },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: { select: { tasks: true } },
    },
  });

  return activeProjects.filter((p) => {
    const lastActivity = p.activities[0]?.createdAt;
    return !lastActivity || lastActivity < fourteenDaysAgo;
  });
}

export async function getWeeklyReviewData(workspaceId: string) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    tasksCompleted,
    tasksCreated,
    ideasCreated,
    ideasConverted,
    aiRuns,
    blockedTasks,
    stageChanges,
  ] = await Promise.all([
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
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.idea.count({
      where: { workspaceId, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.idea.count({
      where: {
        workspaceId,
        status: "CONVERTED",
        updatedAt: { gte: oneWeekAgo },
      },
    }),
    prisma.aIRun.count({
      where: { workspaceId, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.task.count({
      where: { project: { workspaceId }, status: "BLOCKED" },
    }),
    prisma.activityEvent.count({
      where: {
        type: "project.stage_changed",
        createdAt: { gte: oneWeekAgo },
      },
    }),
  ]);

  return {
    tasksCompleted,
    tasksCreated,
    ideasCreated,
    ideasConverted,
    aiRuns,
    blockedTasks,
    stageChanges,
    weekStart: oneWeekAgo.toISOString(),
  };
}

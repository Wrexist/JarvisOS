import { prisma } from "@/lib/prisma";

export interface HealthFactor {
  label: string;
  penalty: number;
  detail: string;
}

export interface HealthResult {
  score: number;
  factors: HealthFactor[];
}

export async function computeHealthScore(
  projectId: string
): Promise<HealthResult> {
  const [tasks, blockedCount, recentActivity] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      select: { status: true },
    }),
    prisma.task.count({
      where: { projectId, status: "BLOCKED" },
    }),
    prisma.activityEvent.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const factors: HealthFactor[] = [];
  let penalty = 0;

  // No tasks penalty
  if (tasks.length === 0) {
    const p = 25;
    penalty += p;
    factors.push({
      label: "No tasks",
      penalty: p,
      detail: "Project has no tasks yet",
    });
  } else {
    // Blocked tasks penalty
    const blockedPenalty = Math.min(blockedCount * 15, 30);
    if (blockedPenalty > 0) {
      penalty += blockedPenalty;
      factors.push({
        label: "Blocked tasks",
        penalty: blockedPenalty,
        detail: `${blockedCount} task${blockedCount > 1 ? "s" : ""} blocked`,
      });
    }

    // Low completion penalty
    const done = tasks.filter((t) => t.status === "DONE").length;
    const completion = Math.round((done / tasks.length) * 100);
    if (completion < 50) {
      const p = Math.round((100 - completion) * 0.3);
      penalty += p;
      factors.push({
        label: "Low completion",
        penalty: p,
        detail: `${completion}% tasks done`,
      });
    }
  }

  // Staleness penalty
  if (recentActivity) {
    const daysSinceActivity = Math.floor(
      (Date.now() - recentActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity > 14) {
      const p = 25;
      penalty += p;
      factors.push({
        label: "Stale project",
        penalty: p,
        detail: `No activity in ${daysSinceActivity} days`,
      });
    } else if (daysSinceActivity > 7) {
      const p = 10;
      penalty += p;
      factors.push({
        label: "Low activity",
        penalty: p,
        detail: `No activity in ${daysSinceActivity} days`,
      });
    }
  } else {
    const p = 20;
    penalty += p;
    factors.push({
      label: "No activity",
      penalty: p,
      detail: "No activity events recorded",
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  // Update the project's healthScore field
  await prisma.project.update({
    where: { id: projectId },
    data: { healthScore: score },
  });

  return { score, factors };
}

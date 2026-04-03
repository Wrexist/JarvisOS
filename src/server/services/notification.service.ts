import { prisma } from "@/lib/prisma";

export async function listUnreadNotifications(workspaceId: string) {
  return prisma.notification.findMany({
    where: { workspaceId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markAllNotificationsRead(workspaceId: string) {
  return prisma.notification.updateMany({
    where: { workspaceId, read: false },
    data: { read: true },
  });
}

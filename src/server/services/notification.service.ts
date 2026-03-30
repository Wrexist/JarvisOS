import { prisma } from "@/lib/prisma";

export async function createNotification(data: {
  type: string;
  title: string;
  message?: string;
  href?: string;
  workspaceId: string;
}) {
  return prisma.notification.create({ data });
}

export async function listUnreadNotifications(workspaceId: string) {
  return prisma.notification.findMany({
    where: { workspaceId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(workspaceId: string) {
  return prisma.notification.updateMany({
    where: { workspaceId, read: false },
    data: { read: true },
  });
}

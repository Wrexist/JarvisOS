import { prisma } from "@/lib/prisma";

export async function createNotification(
  workspaceId: string,
  data: { type: string; title: string; message?: string; href?: string }
) {
  return prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      href: data.href,
      workspaceId,
    },
  });
}

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

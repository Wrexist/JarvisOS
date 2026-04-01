import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getSessionWorkspaceId } from "@/lib/session";
import {
  listUnreadNotifications,
  markAllNotificationsRead,
} from "@/server/services/notification.service";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const notifications = await listUnreadNotifications(workspaceId);
    return NextResponse.json(notifications);
  } catch (error) {
    logger.error("Failed to list notifications:", error);
    return NextResponse.json(
      { error: "Failed to list notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await markAllNotificationsRead(workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to mark notifications:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications" },
      { status: 500 }
    );
  }
}

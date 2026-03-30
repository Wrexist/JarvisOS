import { NextResponse } from "next/server";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import {
  listUnreadNotifications,
  markAllNotificationsRead,
} from "@/server/services/notification.service";

export async function GET() {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    const notifications = await listUnreadNotifications(workspaceId);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to list notifications:", error);
    return NextResponse.json(
      { error: "Failed to list notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    await markAllNotificationsRead(workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications" },
      { status: 500 }
    );
  }
}

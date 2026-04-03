import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {
  listUnreadNotifications,
  markAllNotificationsRead,
} from "@/server/services/notification.service";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
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

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {
  listUnreadNotifications,
  markAllNotificationsRead,
} from "@/server/services/notification.service";
import { apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const notifications = await listUnreadNotifications(workspaceId);
    return NextResponse.json(notifications);
  } catch (error) {
    return apiError("Failed to list notifications", error);
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
    return apiError("Failed to mark notifications", error);
  }
}

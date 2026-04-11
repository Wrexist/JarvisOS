import { NextResponse } from "next/server";
import { moveTaskStatus } from "@/server/services/task.service";
import { requireAuth } from "@/lib/session";
import type { TaskStatus } from "@/generated/prisma/client";
import { apiError } from "@/lib/api-utils";

const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const { status } = await request.json();

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const task = await moveTaskStatus(taskId, status, auth.workspaceId, auth.userId);
    return NextResponse.json(task);
  } catch (error) {
    return apiError("Failed to update task status", error);
  }
}

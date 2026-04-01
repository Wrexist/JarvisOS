import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { moveTaskStatus } from "@/server/services/task.service";
import type { TaskStatus } from "@/generated/prisma/client";

const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { status } = await request.json();

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const task = await moveTaskStatus(taskId, status);
    return NextResponse.json(task);
  } catch (error) {
    logger.error("Failed to update task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

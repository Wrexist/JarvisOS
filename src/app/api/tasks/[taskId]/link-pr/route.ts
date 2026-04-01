import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  linkTaskToPR,
  unlinkTaskPR,
} from "@/server/services/github-sync.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { prId } = await request.json();

    if (!prId) {
      return NextResponse.json(
        { error: "prId is required" },
        { status: 400 }
      );
    }

    const task = await linkTaskToPR(taskId, prId);
    return NextResponse.json(task);
  } catch (error) {
    logger.error("Failed to link PR:", error);
    return NextResponse.json(
      { error: "Failed to link PR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const task = await unlinkTaskPR(taskId);
    return NextResponse.json(task);
  } catch (error) {
    logger.error("Failed to unlink PR:", error);
    return NextResponse.json(
      { error: "Failed to unlink PR" },
      { status: 500 }
    );
  }
}

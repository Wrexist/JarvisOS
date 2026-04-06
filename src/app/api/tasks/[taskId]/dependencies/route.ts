import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const { blockedById } = await request.json();

    if (!blockedById) {
      return NextResponse.json(
        { error: "blockedById is required" },
        { status: 400 }
      );
    }

    if (taskId === blockedById) {
      return NextResponse.json(
        { error: "A task cannot block itself" },
        { status: 400 }
      );
    }

    // Verify task belongs to user's workspace
    const exists = await prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId: auth.workspaceId } },
    });
    if (!exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        blockedByTasks: { connect: { id: blockedById } },
      },
    });

    await prisma.activityEvent.create({
      data: {
        type: "task.dependency_added",
        message: `Task dependency added`,
        projectId: task.projectId,
        taskId: task.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add dependency:", error);
    return NextResponse.json(
      { error: "Failed to add dependency" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const { blockedById } = await request.json();

    if (!blockedById) {
      return NextResponse.json(
        { error: "blockedById is required" },
        { status: 400 }
      );
    }

    // Verify task belongs to user's workspace
    const exists = await prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId: auth.workspaceId } },
    });
    if (!exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        blockedByTasks: { disconnect: { id: blockedById } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove dependency:", error);
    return NextResponse.json(
      { error: "Failed to remove dependency" },
      { status: 500 }
    );
  }
}

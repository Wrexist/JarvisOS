import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
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
    const { taskId } = await params;
    const { blockedById } = await request.json();

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

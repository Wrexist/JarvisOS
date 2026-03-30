import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const { taskIds, status, priority } = await request.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "At least one of status or priority is required" },
        { status: 400 }
      );
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data,
    });

    return NextResponse.json({
      success: true,
      updated: taskIds.length,
    });
  } catch (error) {
    console.error("Bulk update failed:", error);
    return NextResponse.json(
      { error: "Bulk update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { taskIds } = await request.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400 }
      );
    }

    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    return NextResponse.json({
      success: true,
      deleted: taskIds.length,
    });
  } catch (error) {
    console.error("Bulk delete failed:", error);
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBody } from "@/lib/api-utils";
import { bulkTasksSchema } from "@/lib/validations";
import { z } from "zod";

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1, "At least one task ID required"),
});

export async function PATCH(request: Request) {
  try {
    const data = await validateBody(request, bulkTasksSchema);
    if (data instanceof NextResponse) return data;

    const updateData: Record<string, string> = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one of status or priority is required" },
        { status: 400 }
      );
    }

    await prisma.task.updateMany({
      where: { id: { in: data.taskIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: data.taskIds.length,
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
    const data = await validateBody(request, bulkDeleteSchema);
    if (data instanceof NextResponse) return data;

    await prisma.task.deleteMany({
      where: { id: { in: data.taskIds } },
    });

    return NextResponse.json({
      success: true,
      deleted: data.taskIds.length,
    });
  } catch (error) {
    console.error("Bulk delete failed:", error);
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}

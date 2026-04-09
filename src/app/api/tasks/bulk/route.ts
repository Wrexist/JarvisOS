import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
import { bulkTasksSchema } from "@/lib/validations";
import { z } from "zod";

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1, "At least one task ID required"),
});

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

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

    const result = await prisma.task.updateMany({
      where: {
        id: { in: data.taskIds },
        project: { workspaceId: auth.workspaceId },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    return apiError("Bulk update failed", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const data = await validateBody(request, bulkDeleteSchema);
    if (data instanceof NextResponse) return data;

    const result = await prisma.task.deleteMany({
      where: {
        id: { in: data.taskIds },
        project: { workspaceId: auth.workspaceId },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    return apiError("Bulk delete failed", error);
  }
}

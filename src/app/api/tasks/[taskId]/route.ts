import { NextResponse } from "next/server";
import { getTask, updateTask, deleteTask } from "@/server/services/task.service";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { updateTaskSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to get task:", error);
    return NextResponse.json({ error: "Failed to get task" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const data = await validateBody(request, updateTaskSchema);
    if (data instanceof NextResponse) return data;
    const task = await updateTask(taskId, data);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

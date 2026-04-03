import { NextResponse } from "next/server";
import {
  linkTaskToPR,
  unlinkTaskPR,
} from "@/server/services/github-sync.service";
import { requireAuth } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
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
    console.error("Failed to link PR:", error);
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { taskId } = await params;
    const task = await unlinkTaskPR(taskId);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to unlink PR:", error);
    return NextResponse.json(
      { error: "Failed to unlink PR" },
      { status: 500 }
    );
  }
}

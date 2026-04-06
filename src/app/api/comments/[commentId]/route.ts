import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { commentId } = await params;

    const { content } = await request.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify the comment belongs to this workspace via its task or idea
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        OR: [
          { task: { project: { workspaceId: auth.workspaceId } } },
          { idea: { workspaceId: auth.workspaceId } },
        ],
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { commentId } = await params;

    // Verify the comment belongs to this workspace via its task or idea
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        OR: [
          { task: { project: { workspaceId: auth.workspaceId } } },
          { idea: { workspaceId: auth.workspaceId } },
        ],
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

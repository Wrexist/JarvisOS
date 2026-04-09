import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { apiError } from "@/lib/api-utils";

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
    return apiError("Failed to update comment", error);
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
    return apiError("Failed to delete comment", error);
  }
}

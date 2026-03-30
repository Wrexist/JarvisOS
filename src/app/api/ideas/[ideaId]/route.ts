import { NextResponse } from "next/server";
import { getIdea, updateIdea, deleteIdea } from "@/server/services/idea.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    const idea = await getIdea(ideaId);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Failed to get idea:", error);
    return NextResponse.json(
      { error: "Failed to get idea" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    const body = await request.json();

    const idea = await updateIdea(ideaId, body);
    return NextResponse.json(idea);
  } catch (error) {
    console.error("Failed to update idea:", error);
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    await deleteIdea(ideaId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete idea:", error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}

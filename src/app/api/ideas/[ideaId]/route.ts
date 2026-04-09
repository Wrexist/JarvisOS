import { NextResponse } from "next/server";
import { getIdea, updateIdea, deleteIdea } from "@/server/services/idea.service";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
import { updateIdeaSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { ideaId } = await params;
    const idea = await getIdea(ideaId, auth.workspaceId);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json(idea);
  } catch (error) {
    return apiError("Failed to get idea", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { ideaId } = await params;
    const data = await validateBody(request, updateIdeaSchema);
    if (data instanceof NextResponse) return data;

    const idea = await updateIdea(ideaId, data, auth.workspaceId);
    return NextResponse.json(idea);
  } catch (error) {
    return apiError("Failed to update idea", error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { ideaId } = await params;
    await deleteIdea(ideaId, auth.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("Failed to delete idea", error);
  }
}

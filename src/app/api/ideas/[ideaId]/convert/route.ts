import { NextResponse } from "next/server";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { convertIdeaToProject } from "@/server/services/idea.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    const workspaceId = await getDefaultWorkspaceId();

    const project = await convertIdeaToProject(ideaId, workspaceId);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to convert idea";
    console.error("Failed to convert idea:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

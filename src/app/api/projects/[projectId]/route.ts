import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { updateProjectSchema } from "@/lib/validations";
import {
  getProject,
  updateProject,
  updateProjectStage,
  deleteProject,
} from "@/server/services/project.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;
    const project = await getProject(projectId, auth.workspaceId);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to get project:", error);
    return NextResponse.json(
      { error: "Failed to get project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;
    const data = await validateBody(request, updateProjectSchema);
    if (data instanceof NextResponse) return data;

    // Handle stage update separately
    if (data.stage) {
      const project = await updateProjectStage(projectId, data.stage, auth.workspaceId);
      return NextResponse.json(project);
    }

    const project = await updateProject(projectId, data, auth.workspaceId);
    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;
    await deleteProject(projectId, auth.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

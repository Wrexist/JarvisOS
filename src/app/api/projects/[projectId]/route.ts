import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
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
    return apiError("Failed to get project", error);
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

    // Handle stage update if present
    if (data.stage) {
      await updateProjectStage(projectId, data.stage, auth.workspaceId);
    }

    // Handle other field updates
    const rest = { name: data.name, description: data.description };
    const hasOtherFields = Object.values(rest).some((v) => v !== undefined);
    if (hasOtherFields) {
      await updateProject(projectId, rest, auth.workspaceId);
    }

    const project = await getProject(projectId, auth.workspaceId);
    return NextResponse.json(project);
  } catch (error) {
    return apiError("Failed to update project", error);
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
    return apiError("Failed to delete project", error);
  }
}

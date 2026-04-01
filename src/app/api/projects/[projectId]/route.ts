import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
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
    const { projectId } = await params;
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Failed to get project:", error);
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
    const { projectId } = await params;
    const data = await validateBody(request, updateProjectSchema);
    if (data instanceof NextResponse) return data;

    // Handle stage update separately
    if (data.stage) {
      const project = await updateProjectStage(projectId, data.stage);
      return NextResponse.json(project);
    }

    const project = await updateProject(projectId, data);
    return NextResponse.json(project);
  } catch (error) {
    logger.error("Failed to update project:", error);
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
    const { projectId } = await params;
    await deleteProject(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

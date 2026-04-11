import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listProjects, createProject } from "@/server/services/project.service";
import { validateBody, apiError } from "@/lib/api-utils";
import { createProjectSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const projects = await listProjects(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    return apiError("Failed to list projects", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    const data = await validateBody(request, createProjectSchema);
    if (data instanceof NextResponse) return data;

    const project = await createProject(workspaceId, data, auth.userId);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return apiError("Failed to create project", error);
  }
}

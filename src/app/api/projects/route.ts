import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listProjects, createProject } from "@/server/services/project.service";
import { validateBody } from "@/lib/api-utils";
import { createProjectSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const projects = await listProjects(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    const data = await validateBody(request, createProjectSchema);
    if (data instanceof NextResponse) return data;

    const project = await createProject(workspaceId, data);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

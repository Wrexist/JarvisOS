import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/session";
import { listProjects, createProject } from "@/server/services/project.service";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
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
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const project = await createProject(workspaceId, {
      name: body.name,
      description: body.description,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

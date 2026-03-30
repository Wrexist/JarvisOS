import { NextResponse } from "next/server";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import {
  upsertRepository,
  connectRepoToProject,
} from "@/server/services/github-sync.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const workspaceId = await getDefaultWorkspaceId();
    const { fullName } = await request.json();

    if (!fullName || typeof fullName !== "string" || !fullName.includes("/")) {
      return NextResponse.json(
        { error: "fullName is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const [owner, name] = fullName.split("/");

    const repo = await upsertRepository(workspaceId, {
      fullName,
      owner,
      name,
    });

    const project = await connectRepoToProject(projectId, repo.id);
    return NextResponse.json({ project, repository: repo });
  } catch (error) {
    console.error("Failed to connect repository:", error);
    return NextResponse.json(
      { error: "Failed to connect repository" },
      { status: 500 }
    );
  }
}

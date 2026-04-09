import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {
  upsertRepository,
  connectRepoToProject,
} from "@/server/services/github-sync.service";
import { apiError } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const { fullName } = await request.json();

    if (!fullName || typeof fullName !== "string" || !fullName.includes("/")) {
      return NextResponse.json(
        { error: "fullName is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const [owner, name] = fullName.split("/", 2);

    const repo = await upsertRepository(workspaceId, {
      fullName,
      owner,
      name,
    });

    const project = await connectRepoToProject(projectId, repo.id);
    return NextResponse.json({ project, repository: repo });
  } catch (error) {
    return apiError("Failed to connect repository", error);
  }
}

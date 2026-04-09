import { NextResponse } from "next/server";
import { deleteEndpoint, toggleEndpoint } from "@/server/services/webhook.service";
import { requireAuth } from "@/lib/session";
import { apiError } from "@/lib/api-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { endpointId } = await params;
    await deleteEndpoint(endpointId, auth.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("Failed to delete webhook", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { endpointId } = await params;
    const { active } = await request.json();
    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "active must be a boolean" },
        { status: 400 }
      );
    }
    const endpoint = await toggleEndpoint(endpointId, active, auth.workspaceId);
    return NextResponse.json(endpoint);
  } catch (error) {
    return apiError("Failed to update webhook", error);
  }
}

import { NextResponse } from "next/server";
import { deleteEndpoint, toggleEndpoint } from "@/server/services/webhook.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const { endpointId } = await params;
    await deleteEndpoint(endpointId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const { endpointId } = await params;
    const { active } = await request.json();
    const endpoint = await toggleEndpoint(endpointId, active);
    return NextResponse.json(endpoint);
  } catch (error) {
    console.error("Failed to update webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

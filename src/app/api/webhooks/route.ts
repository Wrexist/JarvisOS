import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/session";
import { listEndpoints, createEndpoint } from "@/server/services/webhook.service";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const endpoints = await listEndpoints(workspaceId);
    return NextResponse.json(endpoints);
  } catch (error) {
    console.error("Failed to list webhooks:", error);
    return NextResponse.json(
      { error: "Failed to list webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { url, events, secret } = await request.json();

    if (!url || !events?.length) {
      return NextResponse.json(
        { error: "URL and events are required" },
        { status: 400 }
      );
    }

    const endpoint = await createEndpoint(workspaceId, { url, events, secret });
    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

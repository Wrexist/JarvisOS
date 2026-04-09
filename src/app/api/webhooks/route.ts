import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listEndpoints, createEndpoint } from "@/server/services/webhook.service";
import { validateBody } from "@/lib/api-utils";
import { createWebhookSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    const data = await validateBody(request, createWebhookSchema);
    if (data instanceof NextResponse) return data;

    // Validate URL protocol
    try {
      const parsed = new URL(data.url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json(
          { error: "URL must use http or https protocol" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const endpoint = await createEndpoint(workspaceId, data);
    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

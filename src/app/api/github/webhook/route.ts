import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGitHubAppConfig } from "@/lib/github/app";

/**
 * GitHub webhook endpoint.
 * Verifies signature and processes events.
 * For v1, logs the event. Full processing in future iterations.
 */
export async function POST(request: Request) {
  try {
    const config = getGitHubAppConfig();
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature if secret is configured
    if (config.webhookSecret && signature) {
      const expected =
        "sha256=" +
        crypto
          .createHmac("sha256", config.webhookSecret)
          .update(body)
          .digest("hex");

      if (signature !== expected) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = request.headers.get("x-github-event");
    const payload = JSON.parse(body);

    console.log(`GitHub webhook received: ${event}`, {
      action: payload.action,
      repository: payload.repository?.full_name,
    });

    // TODO: Process events (pull_request, check_run, installation)
    // For now, just acknowledge receipt

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function listEndpoints(workspaceId: string) {
  return prisma.webhookEndpoint.findMany({
    where: { workspaceId },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEndpoint(
  workspaceId: string,
  data: { url: string; events: string[]; secret?: string }
) {
  return prisma.webhookEndpoint.create({
    data: {
      url: data.url,
      events: data.events,
      secret: data.secret,
      workspaceId,
    },
  });
}

export async function deleteEndpoint(id: string, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.webhookEndpoint.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Webhook endpoint not found");
  }
  return prisma.webhookEndpoint.delete({ where: { id } });
}

export async function toggleEndpoint(id: string, active: boolean, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.webhookEndpoint.findFirst({ where: { id, workspaceId } });
    if (!exists) throw new Error("Webhook endpoint not found");
  }
  return prisma.webhookEndpoint.update({
    where: { id },
    data: { active },
  });
}

/**
 * Delivers a webhook event to all active endpoints subscribed to the event.
 * Non-blocking — fires and records delivery status.
 */
export async function deliverWebhook(
  workspaceId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      workspaceId,
      active: true,
      events: { has: event },
    },
  });

  for (const endpoint of endpoints) {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Sign payload if secret configured
    if (endpoint.secret) {
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", endpoint.secret).update(body).digest("hex");
      headers["X-Webhook-Signature"] = signature;
    }

    let status = 0;
    let response = "";

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });
      status = res.status;
      response = (await res.text()).slice(0, 500);
    } catch (err) {
      status = 0;
      response = err instanceof Error ? err.message : "Delivery failed";
    }

    await prisma.webhookDelivery.create({
      data: {
        event,
        payload: JSON.parse(JSON.stringify({ event, data: payload })),
        status,
        response,
        endpointId: endpoint.id,
      },
    });
  }
}

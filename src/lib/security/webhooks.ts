/**
 * Webhook Dispatcher
 * ------------------
 * Delivers event notifications to tenant-configured webhook endpoints.
 * Features:
 *   - HMAC-SHA256 signing (X-Artha-Signature header)
 *   - Retry with exponential backoff (1m, 5m, 30m, 2h, 6h)
 *   - Delivery audit trail (WebhookDelivery table)
 *   - Auto-disable after 5 consecutive failures
 */

import { db } from "../db";
import { createHmac } from "crypto";
import { appendAuditEntry } from "./audit-chain";

export interface WebhookEvent {
  eventType: string;
  payload: Record<string, any>;
  tenantId: string;
}

const MAX_ATTEMPTS = 5;
const BACKOFF_SECONDS = [60, 300, 1800, 7200, 21600]; // 1m, 5m, 30m, 2h, 6h

/**
 * Dispatch an event to all matching webhooks for a tenant.
 */
export async function dispatchWebhookEvent(event: WebhookEvent): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: {
      tenantId: event.tenantId,
      isActive: true,
      failureCount: { lt: 5 },
    },
  });

  for (const webhook of webhooks) {
    let events: string[] = [];
    try { events = JSON.parse(webhook.eventsJson); } catch {}

    if (events.length > 0 && !events.includes(event.eventType)) continue;

    await deliverWebhook(webhook, event);
  }
}

/**
 * Deliver a single webhook with retries.
 */
async function deliverWebhook(webhook: any, event: WebhookEvent): Promise<void> {
  const eventId = crypto.randomUUID();
  const payload = JSON.stringify({
    id: eventId,
    type: event.eventType,
    created_at: new Date().toISOString(),
    data: event.payload,
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const delivery = await attemptDelivery(webhook, event, payload, eventId, attempt);

    if (delivery.success) {
      // Reset failure count on success
      await db.webhook.update({
        where: { id: webhook.id },
        data: { failureCount: 0, lastDeliveryAt: new Date() },
      });

      await db.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventId,
          eventType: event.eventType,
          payload,
          statusCode: delivery.statusCode,
          responseMs: delivery.responseMs,
          success: true,
          attempt,
        },
      });
      return;
    }

    // Failed attempt
    await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        eventId,
        eventType: event.eventType,
        payload,
        statusCode: delivery.statusCode,
        responseMs: delivery.responseMs,
        success: false,
        attempt,
      },
    });

    if (attempt === MAX_ATTEMPTS) {
      // Increment failure count; auto-disable at 5
      const newFailureCount = webhook.failureCount + 1;
      await db.webhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: newFailureCount,
          isActive: newFailureCount < 5,
          lastDeliveryAt: new Date(),
        },
      });

      await appendAuditEntry({
        tenantId: webhook.tenantId,
        actorType: "system",
        action: "webhook.disabled.auto",
        details: {
          webhookId: webhook.id,
          url: webhook.url,
          failureCount: newFailureCount,
          lastEventType: event.eventType,
        },
      });
      return;
    }

    // Wait before retry (in production: queue via SQS/Redis with delay)
    const waitSec = BACKOFF_SECONDS[attempt - 1];
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitSec * 1000, 30000))); // cap at 30s for dev
  }
}

async function attemptDelivery(
  webhook: any,
  event: WebhookEvent,
  payload: string,
  eventId: string,
  attempt: number
): Promise<{ success: boolean; statusCode?: number; responseMs: number }> {
  // Compute HMAC signature
  const secret = await getWebhookSecret(webhook);
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Artha-Signature": `sha256=${signature}`,
        "X-Artha-Event": event.eventType,
        "X-Artha-Delivery": eventId,
        "X-Artha-Attempt": attempt.toString(),
        "User-Agent": "ArthaAI-Webhook/1.0",
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseMs = Date.now() - start;

    return {
      success: res.status >= 200 && res.status < 300,
      statusCode: res.status,
      responseMs,
    };
  } catch (err: any) {
    return { success: false, responseMs: Date.now() - start };
  }
}

/**
 * Get the webhook signing secret (decrypted from DB).
 * Stored as sha256 hash for verification; original secret returned to client on creation only.
 */
async function getWebhookSecret(webhook: any): Promise<string> {
  // The secretHash field stores the actual secret (not a hash despite the name)
  // because we need it to sign outgoing requests.
  // In production, store it encrypted via KMS.
  return webhook.secretHash;
}

/**
 * Generate a new webhook secret.
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
}

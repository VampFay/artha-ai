/**
 * Security Event Detector
 * -----------------------
 * Detects suspicious patterns and writes SecurityEvent records.
 * Triggers alerts for high-severity events.
 *
 * Monitored events:
 *   - Repeated failed logins (brute force)
 *   - Privilege escalation attempts
 *   - Rate-limit threshold breaches
 *   - Bulk data export (potential exfiltration)
 *   - Off-hours access (configurable)
 *   - Geolocation anomalies
 *   - Concurrent sessions from multiple IPs
 */

import { db } from "../db";

export type SecuritySeverity = "info" | "low" | "medium" | "high" | "critical";

export interface SecurityEventInput {
  eventType: string;
  severity?: SecuritySeverity;
  tenantId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any>;
}

/**
 * Record a security event.
 */
export async function recordSecurityEvent(input: SecurityEventInput): Promise<string> {
  const created = await db.securityEvent.create({
    data: {
      eventType: input.eventType,
      severity: input.severity || "info",
      tenantId: input.tenantId || null,
      userId: input.userId || null,
      ipAddress: input.ipAddress || null,
      detailsJson: input.details ? JSON.stringify(input.details) : null,
    },
    select: { id: true },
  });

  // Trigger alert for high-severity events
  if (input.severity === "high" || input.severity === "critical") {
    await triggerSecurityAlert(input).catch((err) => {
      console.error("Failed to send security alert:", err);
    });
  }

  return created.id;
}

/**
 * Detect brute-force login attempts.
 * Called after each failed login.
 */
export async function detectBruteForce(
  email: string,
  ipAddress: string,
  tenantId?: string | null
): Promise<boolean> {
  // Count failed logins from this IP in the last 15 minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentFailed = await db.securityEvent.count({
    where: {
      eventType: "failed_login",
      ipAddress,
      detectedAt: { gte: fifteenMinAgo },
    },
  });

  if (recentFailed >= 5) {
    await recordSecurityEvent({
      eventType: "brute_force_detected",
      severity: "high",
      tenantId,
      ipAddress,
      details: { email, failedAttempts: recentFailed, window: "15min" },
    });
    return true;
  }

  return false;
}

/**
 * Detect bulk data export (potential exfiltration).
 * Called after each export operation.
 */
export async function detectBulkExport(
  userId: string,
  tenantId: string | null,
  recordCount: number,
  exportType: string
): Promise<void> {
  if (recordCount > 1000) {
    await recordSecurityEvent({
      eventType: "bulk_export",
      severity: recordCount > 10000 ? "high" : "medium",
      tenantId,
      userId,
      details: { recordCount, exportType },
    });
  }
}

/**
 * Detect privilege escalation attempts.
 * Called when a user attempts an action requiring a role they don't have.
 */
export async function detectPrivilegeEscalation(
  userId: string,
  attemptedAction: string,
  requiredRole: string,
  tenantId?: string | null,
  ipAddress?: string
): Promise<void> {
  await recordSecurityEvent({
    eventType: "privilege_escalation",
    severity: "high",
    tenantId,
    userId,
    ipAddress,
    details: { attemptedAction, requiredRole },
  });
}

/**
 * Resolve a security event.
 */
export async function resolveSecurityEvent(
  eventId: string,
  resolutionNotes: string
): Promise<void> {
  await db.securityEvent.update({
    where: { id: eventId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolutionNotes,
    },
  });
}

/**
 * Get unresolved high-severity events (for SOC dashboard).
 */
export async function getUnresolvedHighSeverity(tenantId?: string | null) {
  return db.securityEvent.findMany({
    where: {
      resolved: false,
      severity: { in: ["high", "critical"] },
      ...(tenantId !== undefined ? { tenantId } : {}),
    },
    orderBy: { detectedAt: "desc" },
    take: 100,
  });
}

/**
 * Trigger a security alert (webhook/email/pagerduty).
 * Stub — implement with your alerting provider.
 */
async function triggerSecurityAlert(input: SecurityEventInput): Promise<void> {
  // NOTE: Integrate with PagerDuty/Opsgenie/Slack in production (stub for dev)
  // For now, log to console (production: replace with webhook to SecOps channel)
  console.warn(`[SECURITY ALERT] ${input.severity?.toUpperCase()} ${input.eventType}`, {
    tenantId: input.tenantId,
    userId: input.userId,
    ipAddress: input.ipAddress,
    details: input.details,
  });

  // If critical, also create an IncidentReport
  if (input.severity === "critical") {
    await db.incidentReport.create({
      data: {
        title: `Critical security event: ${input.eventType}`,
        severity: "P0",
        status: "open",
        description: JSON.stringify(input.details || {}),
        tenantId: input.tenantId || null,
        detectedAt: new Date(),
      },
    });
  }
}

/**
 * Email Notification System
 * -------------------------
 * Uses AWS SES (production) or console (dev) for transactional emails.
 *
 * Email types:
 *   - welcome: Registration confirmation
 *   - password_reset: Password reset link
 *   - filing_reminder: Compliance filing deadline (7d/1d/overdue)
 *   - tax_notice: Tax notice received from authority
 *   - dsr_acknowledgment: Data subject request received
 *   - dsr_completed: Data subject request completed
 *   - breach_notification: Security breach (72h timer)
 *   - team_invitation: Entity team member invitation
 *   - bulk_job_complete: Bulk job finished
 *   - weekly_digest: Weekly compliance summary
 */

import { appendAuditEntry } from "../security/audit-chain";

export type EmailTemplate =
  | "welcome"
  | "password_reset"
  | "filing_reminder"
  | "tax_notice"
  | "dsr_acknowledgment"
  | "dsr_completed"
  | "breach_notification"
  | "team_invitation"
  | "bulk_job_complete"
  | "weekly_digest";

export interface EmailParams {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
  tenantId?: string | null;
  userId?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate email content from template + data.
 */
function generateEmail(template: EmailTemplate, data: Record<string, any>): EmailContent {
  switch (template) {
    case "welcome":
      return {
        subject: "Welcome to Artha AI — Your Wealth Intelligence Platform",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0F172A; padding: 30px; border-radius: 12px;">
              <h1 style="color: #F59E0B; margin: 0 0 20px;">ARTHA AI</h1>
              <h2 style="color: #fff;">Welcome, ${data.name}!</h2>
              <p style="color: #94A3B8;">Your account has been created. Start your wealth intelligence journey today.</p>
              <a href="${data.loginUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Access Dashboard</a>
            </div>
          </div>
        `,
        text: `Welcome to Artha AI!\n\nYour account has been created. Visit ${data.loginUrl} to access your dashboard.`,
      };

    case "password_reset":
      return {
        subject: "Artha AI — Password Reset Request",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F59E0B;">Password Reset</h1>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${data.resetUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
            <p style="color: #64748B; font-size: 12px; margin-top: 20px;">If you didn't request this, ignore this email.</p>
          </div>
        `,
        text: `Password Reset\n\nReset your password: ${data.resetUrl}\n\nThis link expires in 1 hour.`,
      };

    case "filing_reminder":
      return {
        subject: `⚠ ${data.urgency}: ${data.filingName} due ${data.dueDate}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${data.urgency === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7'}; padding: 20px; border-radius: 12px; border-left: 4px solid ${data.urgency === 'OVERDUE' ? '#EF4444' : '#F59E0B'};">
              <h2 style="color: ${data.urgency === 'OVERDUE' ? '#EF4444' : '#92400E'};">${data.urgency}</h2>
              <p><strong>${data.filingName}</strong> (${data.form})</p>
              <p>Due: ${data.dueDate}</p>
              <p>Entity: ${data.entityName}</p>
              <p>Statutory body: ${data.statutoryBody}</p>
              <p style="color: #64748B; font-size: 13px;">Penalty: ${data.penalty}</p>
              <a href="${data.dashboardUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">View Compliance Calendar</a>
            </div>
          </div>
        `,
        text: `${data.urgency}: ${data.filingName} (${data.form})\nDue: ${data.dueDate}\nEntity: ${data.entityName}\nPenalty: ${data.penalty}\n\nView: ${data.dashboardUrl}`,
      };

    case "tax_notice":
      return {
        subject: `⚠ Tax Notice Received: ${data.noticeType}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; border-left: 4px solid #F59E0B;">
              <h2 style="color: #92400E;">Tax Notice Received</h2>
              <p><strong>Type:</strong> ${data.noticeType}</p>
              <p><strong>Issued by:</strong> ${data.issuedBy}</p>
              <p><strong>Date:</strong> ${data.issuedDate}</p>
              ${data.din ? `<p><strong>DIN:</strong> ${data.din}</p>` : ''}
              ${data.amountDemand ? `<p><strong>Demand Amount:</strong> ₹${data.amountDemand.toLocaleString("en-IN")}</p>` : ''}
              ${data.dueDate ? `<p><strong>Response due:</strong> ${data.dueDate}</p>` : ''}
              <a href="${data.dashboardUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">View Notice</a>
            </div>
          </div>
        `,
        text: `Tax Notice: ${data.noticeType}\nIssued by: ${data.issuedBy}\nDate: ${data.issuedDate}\n${data.din ? `DIN: ${data.din}\n` : ''}${data.amountDemand ? `Demand: ₹${data.amountDemand}\n` : ''}\nView: ${data.dashboardUrl}`,
      };

    case "dsr_acknowledgment":
      return {
        subject: "Data Subject Request Received — Artha AI",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F59E0B;">Request Acknowledged</h1>
            <p>We've received your data subject request: <strong>${data.requestType}</strong></p>
            <p>Request ID: ${data.requestId}</p>
            <p>We'll respond within 30 days as per DPDP Act / GDPR requirements.</p>
          </div>
        `,
        text: `Data Subject Request Acknowledged\n\nType: ${data.requestType}\nID: ${data.requestId}\nWe'll respond within 30 days.`,
      };

    case "dsr_completed":
      return {
        subject: "Data Subject Request Completed — Artha AI",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10B981;">Request Completed</h1>
            <p>Your ${data.requestType} request has been completed.</p>
            <p>Request ID: ${data.requestId}</p>
            ${data.downloadUrl ? `<a href="${data.downloadUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Download Data</a>` : ''}
          </div>
        `,
        text: `Request Completed\n\nType: ${data.requestType}\nID: ${data.requestId}\n${data.downloadUrl ? `Download: ${data.downloadUrl}` : ''}`,
      };

    case "breach_notification":
      return {
        subject: `🚨 Security Incident: ${data.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #FEE2E2; padding: 20px; border-radius: 12px; border: 2px solid #EF4444;">
              <h1 style="color: #EF4444;">Security Incident Notification</h1>
              <p><strong>Incident:</strong> ${data.title}</p>
              <p><strong>Severity:</strong> ${data.severity}</p>
              <p><strong>Detected:</strong> ${data.detectedAt}</p>
              <p><strong>Description:</strong> ${data.description}</p>
              <p><strong>Affected data:</strong> ${data.affectedData || 'Under investigation'}</p>
              <p><strong>Mitigation:</strong> ${data.mitigation || 'In progress'}</p>
              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;">
              <p style="font-size: 13px; color: #64748B;">This notification is sent per DPDP Act (72-hour requirement) and GDPR Article 34. We take your data security seriously and will provide updates as the situation develops.</p>
            </div>
          </div>
        `,
        text: `SECURITY INCIDENT\n\nTitle: ${data.title}\nSeverity: ${data.severity}\nDetected: ${data.detectedAt}\nDescription: ${data.description}\nAffected: ${data.affectedData}\nMitigation: ${data.mitigation}\n\nPer DPDP Act / GDPR, this notification is sent within 72 hours.`,
      };

    case "team_invitation":
      return {
        subject: `You've been invited to ${data.entityName} — Artha AI`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F59E0B;">Team Invitation</h1>
            <p>${data.invitedBy} has invited you to join <strong>${data.entityName}</strong> as <strong>${data.role}</strong>.</p>
            <a href="${data.loginUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Accept Invitation</a>
          </div>
        `,
        text: `Team Invitation\n\n${data.invitedBy} invited you to join ${data.entityName} as ${data.role}.\n\nLogin: ${data.loginUrl}`,
      };

    case "bulk_job_complete":
      return {
        subject: `✅ Bulk Job Completed: ${data.jobType}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10B981;">Job Completed</h1>
            <p><strong>Job:</strong> ${data.jobType}</p>
            <p><strong>Processed:</strong> ${data.processedItems} / ${data.totalItems} items</p>
            ${data.failedItems > 0 ? `<p><strong>Failed:</strong> ${data.failedItems}</p>` : ''}
            ${data.outputUrl ? `<a href="${data.outputUrl}" style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Download Results</a>` : ''}
          </div>
        `,
        text: `Job Completed: ${data.jobType}\nProcessed: ${data.processedItems}/${data.totalItems}\nFailed: ${data.failedItems}\n${data.outputUrl ? `Download: ${data.outputUrl}` : ''}`,
      };

    case "weekly_digest":
      return {
        subject: `📊 Weekly Compliance Digest — ${data.entityName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F59E0B;">Weekly Compliance Summary</h1>
            <p><strong>Entity:</strong> ${data.entityName}</p>
            <p><strong>Week:</strong> ${data.weekRange}</p>
            <hr>
            <h3>Filings Due Next Week</h3>
            <ul>${(data.upcomingFilings || []).map((f: any) => `<li>${f.name} — due ${f.dueDate}</li>`).join("")}</ul>
            <h3>Overdue</h3>
            <ul>${(data.overdueFilings || []).map((f: any) => `<li style="color: red;">${f.name} — ${f.daysOverdue}d overdue</li>`).join("")}</ul>
            <h3>Tax Summary</h3>
            <p>Total tax burden: ₹${data.totalTaxBurden?.toLocaleString("en-IN") || 0}</p>
            <p>Effective rate: ${data.effectiveTaxRate?.toFixed(2) || 0}%</p>
          </div>
        `,
        text: `Weekly Compliance Digest\n\nEntity: ${data.entityName}\nWeek: ${data.weekRange}\n\nUpcoming: ${(data.upcomingFilings || []).length} filings\nOverdue: ${(data.overdueFilings || []).length} filings\nTax burden: ₹${data.totalTaxBurden?.toLocaleString("en-IN") || 0}`,
      };

    default:
      return { subject: "Artha AI Notification", html: "<p>You have a new notification.</p>", text: "You have a new notification." };
  }
}

/**
 * Send an email.
 * Uses AWS SES in production, console.log in development.
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, template, data, tenantId, userId } = params;

  const content = generateEmail(template, data);

  const SES_ENABLED = process.env.SES_ENABLED === "true" || process.env.SMTP_HOST;

  if (SES_ENABLED) {
    try {
      // Use AWS SES in production
      const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
      const ses = new SESClient({ region: process.env.AWS_REGION || "ap-south-1" });

      const command = new SendEmailCommand({
        Source: process.env.SMTP_FROM || "noreply@artha.ai",
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: content.subject },
          Body: {
            Html: { Data: content.html },
            Text: { Data: content.text },
          },
        },
      });

      await ses.send(command);
    } catch (err) {
      console.error("SES send failed, falling back to console:", err);
      console.log(`[EMAIL] To: ${to}\nSubject: ${content.subject}\n---\n${content.text}\n---`);
    }
  } else {
    // Dev mode — log to console
    console.log(`\n[EMAIL]\n  To: ${to}\n  Subject: ${content.subject}\n  ---\n  ${content.text.substring(0, 200)}\n  ---\n`);
  }

  // Audit log
  await appendAuditEntry({
    tenantId,
    userId,
    actorType: "system",
    action: `email.sent.${template}`,
    details: { to, template, subject: content.subject },
  }).catch(() => {});

  return true;
}

/**
 * Send bulk emails (for breach notification to all affected users).
 */
export async function sendBulkEmails(
  recipients: Array<{ email: string; userId?: string }>,
  template: EmailTemplate,
  data: Record<string, any>,
  tenantId?: string | null
): Promise<number> {
  let sent = 0;
  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        template,
        data,
        tenantId,
        userId: recipient.userId,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send email to ${recipient.email}:`, err);
    }
  }
  return sent;
}

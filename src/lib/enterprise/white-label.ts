/**
 * White-Label Configuration
 * -------------------------
 * Per-tenant branding, custom domains, and theme overrides.
 * Loaded at runtime based on the tenant of the requesting user.
 */

import { db } from "../db";

export interface WhiteLabelConfig {
  appName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  customDomain: string | null;
  customCssUrl: string | null;
  emailFromName: string | null;
  emailFromAddr: string | null;
  hideBranding: boolean;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  appName: "Artha AI",
  primaryColor: "#0F172A",
  accentColor: "#6366F1",
  logoUrl: null,
  faviconUrl: null,
  customDomain: null,
  customCssUrl: null,
  emailFromName: "Artha AI",
  emailFromAddr: "noreply@artha.ai",
  hideBranding: false,
};

/**
 * Get white-label config for a tenant.
 * Returns default config if tenant has no custom config.
 */
export async function getWhiteLabelConfig(tenantId: string | null): Promise<WhiteLabelConfig> {
  if (!tenantId) return DEFAULT_CONFIG;

  const config = await db.whiteLabelConfig.findUnique({
    where: { tenantId },
  });

  if (!config) return DEFAULT_CONFIG;

  return {
    appName: config.appName,
    primaryColor: config.primaryColor,
    accentColor: config.accentColor,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    customDomain: config.customDomain,
    customCssUrl: config.customCssUrl,
    emailFromName: config.emailFromName,
    emailFromAddr: config.emailFromAddr,
    hideBranding: config.hideBranding,
  };
}

/**
 * Set white-label config for a tenant.
 */
export async function setWhiteLabelConfig(
  tenantId: string,
  config: Partial<WhiteLabelConfig>
): Promise<void> {
  await db.whiteLabelConfig.upsert({
    where: { tenantId },
    update: {
      appName: config.appName,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
      customDomain: config.customDomain,
      customCssUrl: config.customCssUrl,
      emailFromName: config.emailFromName,
      emailFromAddr: config.emailFromAddr,
      hideBranding: config.hideBranding,
    },
    create: {
      tenantId,
      appName: config.appName || "Artha AI",
      primaryColor: config.primaryColor || "#0F172A",
      accentColor: config.accentColor || "#6366F1",
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
      customDomain: config.customDomain,
      customCssUrl: config.customCssUrl,
      emailFromName: config.emailFromName,
      emailFromAddr: config.emailFromAddr,
      hideBranding: config.hideBranding || false,
    },
  });
}

/**
 * Resolve a custom domain to a tenant ID.
 */
export async function resolveTenantByDomain(domain: string): Promise<string | null> {
  const config = await db.whiteLabelConfig.findFirst({
    where: { customDomain: domain },
    select: { tenantId: true },
  });
  return config?.tenantId || null;
}

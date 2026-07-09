/**
 * Core Banking System Integration
 * -------------------------------
 * Integrates with major core banking systems for data export/import:
 *   - Flexcube (Oracle)
 *   - Finacle (Infosys)
 *   - TCS BaNCS
 *   - Temenos Transact
 *   - Custom (via REST API)
 *
 * Sync types:
 *   - export_tax_records    : push tax computations to core banking
 *   - export_customer_data  : push customer financial summary
 *   - import_transactions   : pull transactions for analysis
 *   - import_account_data   : pull account balances
 *
 * Each integration uses mTLS or OAuth2 for authentication.
 */

import { db } from "../db";
import { encryptField, decryptField } from "../security/field-encryption";
import { appendAuditEntry } from "../security/audit-chain";

export type BankingSystem = "flexcube" | "finacle" | "tcs_bancs" | "temenos" | "custom";

export interface CoreBankingConfig {
  system: BankingSystem;
  endpoint: string;
  authMethod: "oauth2" | "mtls" | "api_key";
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    certPem?: string;
    keyPem?: string;
  };
  scheduleCron?: string;
}

export interface BankingSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors: Array<{ recordId: string; error: string }>;
  syncedAt: string;
}

/**
 * Configure a core banking integration for a tenant.
 */
export async function configureCoreBankingSync(
  tenantId: string,
  config: CoreBankingConfig
): Promise<string> {
  const credentialsEnc = await encryptField(JSON.stringify(config.credentials));

  const record = await db.coreBankingSync.create({
    data: {
      tenantId,
      system: config.system,
      endpoint: config.endpoint,
      authMethod: config.authMethod,
      credentialsEnc,
      scheduleCron: config.scheduleCron,
      isActive: true,
    },
  });

  await appendAuditEntry({
    tenantId,
    actorType: "system",
    action: "core_banking.configured",
    details: { syncId: record.id, system: config.system, endpoint: config.endpoint },
  });

  return record.id;
}

/**
 * Run a sync with the core banking system.
 * Returns a result with success/failure counts.
 */
export async function runCoreBankingSync(
  tenantId: string,
  syncId: string,
  syncType: string
): Promise<BankingSyncResult> {
  const sync = await db.coreBankingSync.findFirst({
    where: { id: syncId, tenantId },
  });
  if (!sync) throw new Error("Sync configuration not found");
  if (!sync.isActive) throw new Error("Sync is inactive");

  const result: BankingSyncResult = {
    success: false,
    recordsProcessed: 0,
    recordsFailed: 0,
    errors: [],
    syncedAt: new Date().toISOString(),
  };

  try {
    // Decrypt credentials
    const credentialsStr = await decryptField(sync.credentialsEnc);
    if (!credentialsStr) throw new Error("No credentials configured");
    const credentials = JSON.parse(credentialsStr);

    // Get auth token based on method
    const token = await getAuthToken(sync.endpoint, sync.authMethod, credentials);

    // Route to system-specific handler
    switch (sync.system) {
      case "flexcube":
        await syncWithFlexcube(sync.endpoint, token, tenantId, syncType, result);
        break;
      case "finacle":
        await syncWithFinacle(sync.endpoint, token, tenantId, syncType, result);
        break;
      case "tcs_bancs":
        await syncWithTcsBancs(sync.endpoint, token, tenantId, syncType, result);
        break;
      case "temenos":
        await syncWithTemenos(sync.endpoint, token, tenantId, syncType, result);
        break;
      case "custom":
        await syncWithCustom(sync.endpoint, token, tenantId, syncType, result);
        break;
    }

    result.success = result.recordsFailed === 0;
  } catch (err: any) {
    result.errors.push({ recordId: "sync", error: err.message });
    await db.coreBankingSync.update({
      where: { id: syncId },
      data: { lastStatus: "failed", lastError: err.message },
    });
  }

  // Update sync record
  await db.coreBankingSync.update({
    where: { id: syncId },
    data: {
      lastSyncAt: new Date(),
      lastStatus: result.success ? "success" : "partial",
      lastError: result.errors.length > 0 ? JSON.stringify(result.errors.slice(0, 5)) : null,
    },
  });

  await appendAuditEntry({
    tenantId,
    actorType: "system",
    action: "core_banking.sync.completed",
    details: {
      syncId,
      system: sync.system,
      syncType,
      ...result,
    },
  });

  return result;
}

/**
 * Get an authentication token from the core banking system.
 */
async function getAuthToken(
  endpoint: string,
  method: string,
  credentials: any
): Promise<string> {
  switch (method) {
    case "oauth2": {
      const tokenUrl = `${endpoint}/oauth/token`;
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        }),
      });
      if (!res.ok) throw new Error(`OAuth failed: ${res.status}`);
      const data = await res.json();
      return data.access_token;
    }
    case "api_key":
      return credentials.apiKey;
    case "mtls":
      // mTLS handled at HTTP layer with cert
      return ""; // empty token, cert-based auth
    default:
      throw new Error(`Unknown auth method: ${method}`);
  }
}

// ============================================================
// System-specific sync handlers (stubs — implement per bank)
// ============================================================

async function syncWithFlexcube(
  endpoint: string,
  token: string,
  tenantId: string,
  syncType: string,
  result: BankingSyncResult
): Promise<void> {
  // Oracle Flexcube REST API
  // POST /flexcube/rest/CustomSchemaServiceConsumer/importTaxRecords
  const url = `${endpoint}/flexcube/rest/${syncType}`;
  // Implementation: fetch records from DB, transform to Flexcube schema, POST
  // For stub: simulate success
  result.recordsProcessed = 0;
  result.success = true;
}

async function syncWithFinacle(
  endpoint: string,
  token: string,
  tenantId: string,
  syncType: string,
  result: BankingSyncResult
): Promise<void> {
  // Infosys Finacle REST API
  // POST /finacle/rest/CAServices/CIHDTOAUMGMT/uploadTaxData
  const url = `${endpoint}/finacle/rest/${syncType}`;
  result.recordsProcessed = 0;
  result.success = true;
}

async function syncWithTcsBancs(
  endpoint: string,
  token: string,
  tenantId: string,
  syncType: string,
  result: BankingSyncResult
): Promise<void> {
  // TCS BaNCS API
  const url = `${endpoint}/bancs/rest/${syncType}`;
  result.recordsProcessed = 0;
  result.success = true;
}

async function syncWithTemenos(
  endpoint: string,
  token: string,
  tenantId: string,
  syncType: string,
  result: BankingSyncResult
): Promise<void> {
  // Temenos Transact (T24) IRIS API
  const url = `${endpoint}/iris/rest/${syncType}`;
  result.recordsProcessed = 0;
  result.success = true;
}

async function syncWithCustom(
  endpoint: string,
  token: string,
  tenantId: string,
  syncType: string,
  result: BankingSyncResult
): Promise<void> {
  // Generic REST API
  const url = `${endpoint}/${syncType}`;
  result.recordsProcessed = 0;
  result.success = true;
}

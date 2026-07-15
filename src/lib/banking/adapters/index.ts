/**
 * Core Banking Integration — Adapter Pattern
 * ------------------------------------------
 * Provides a unified interface for integrating with different core banking
 * systems (Flexcube, Finacle, TCS BaNCS, Temenos, custom REST).
 *
 * Each adapter implements the BankingAdapter interface with:
 *   - authenticate(): Get auth token (OAuth2/mTLS/API key)
 *   - exportTaxRecords(): Push tax computations to core banking GL
 *   - exportCustomerData(): Push customer financial summary
 *   - importTransactions(): Pull transactions for analysis
 *   - importAccountBalances(): Pull account balances
 *   - syncRegulatoryReturns(): Sync RBI/SEBI returns
 *   - healthCheck(): Verify connectivity
 */

import { appendAuditEntry } from "../security/audit-chain";

export interface BankingAdapter {
  name: string;
  authenticate(): Promise<string>;
  exportTaxRecords(entityId: string, taxData: any): Promise<SyncResult>;
  exportCustomerData(entityId: string, customerData: any): Promise<SyncResult>;
  importTransactions(entityId: string, fromDate: Date, toDate: Date): Promise<any[]>;
  importAccountBalances(entityId: string): Promise<any[]>;
  syncRegulatoryReturns(entityId: string, returnType: string, data: any): Promise<SyncResult>;
  healthCheck(): Promise<boolean>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors: Array<{ recordId: string; error: string }>;
  syncedAt: string;
}

// ============================================================
// Base adapter with common functionality
// ============================================================

abstract class BaseBankingAdapter implements BankingAdapter {
  abstract name: string;
  protected endpoint: string;
  protected credentials: any;
  protected authToken: string | null = null;

  constructor(endpoint: string, credentials: any) {
    this.endpoint = endpoint;
    this.credentials = credentials;
  }

  abstract authenticate(): Promise<string>;

  protected async request(path: string, method: string, body?: any): Promise<any> {
    if (!this.authToken) {
      this.authToken = await this.authenticate();
    }

    const url = `${this.endpoint}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.authToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`${this.name} API error: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  async exportTaxRecords(entityId: string, taxData: any): Promise<SyncResult> {
    try {
      const response = await this.request("/tax/export", "POST", {
        entityId,
        ...taxData,
      });
      return {
        success: true,
        recordsProcessed: response.recordsProcessed || 1,
        recordsFailed: 0,
        errors: [],
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [{ recordId: entityId, error: err.message }],
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async exportCustomerData(entityId: string, customerData: any): Promise<SyncResult> {
    try {
      const response = await this.request("/customer/export", "POST", {
        entityId,
        ...customerData,
      });
      return {
        success: true,
        recordsProcessed: response.recordsProcessed || 1,
        recordsFailed: 0,
        errors: [],
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [{ recordId: entityId, error: err.message }],
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async importTransactions(entityId: string, fromDate: Date, toDate: Date): Promise<any[]> {
    try {
      const response = await this.request(
        `/transactions?entityId=${entityId}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
        "GET"
      );
      return response.transactions || [];
    } catch (err) {
      console.error(`${this.name} import failed:`, err);
      return [];
    }
  }

  async importAccountBalances(entityId: string): Promise<any[]> {
    try {
      const response = await this.request(`/accounts?entityId=${entityId}`, "GET");
      return response.accounts || [];
    } catch (err) {
      console.error(`${this.name} balance fetch failed:`, err);
      return [];
    }
  }

  async syncRegulatoryReturns(entityId: string, returnType: string, data: any): Promise<SyncResult> {
    try {
      const response = await this.request(`/regulatory/${returnType}`, "POST", {
        entityId,
        ...data,
      });
      return {
        success: true,
        recordsProcessed: 1,
        recordsFailed: 0,
        errors: [],
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [{ recordId: entityId, error: err.message }],
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request("/health", "GET");
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================
// Oracle Flexcube Adapter
// ============================================================

export class FlexcubeAdapter extends BaseBankingAdapter {
  name = "Oracle Flexcube";

  async authenticate(): Promise<string> {
    const res = await fetch(`${this.endpoint}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        scope: "flexcube:api",
      }),
    });

    if (!res.ok) throw new Error(`Flexcube auth failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }

  async exportTaxRecords(entityId: string, taxData: any): Promise<SyncResult> {
    // Flexcube uses CustomSchemaServiceConsumer API
    try {
      const response = await this.request(
        "/flexcube/rest/CustomSchemaServiceConsumer/importTaxRecords",
        "POST",
        { entityId, taxData }
      );
      return {
        success: true,
        recordsProcessed: response.recordsProcessed || 1,
        recordsFailed: 0,
        errors: [],
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [{ recordId: entityId, error: err.message }],
        syncedAt: new Date().toISOString(),
      };
    }
  }
}

// ============================================================
// Infosys Finacle Adapter
// ============================================================

export class FinacleAdapter extends BaseBankingAdapter {
  name = "Infosys Finacle";

  async authenticate(): Promise<string> {
    const res = await fetch(`${this.endpoint}/finacle/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString("base64")}`,
      },
    });

    if (!res.ok) throw new Error(`Finacle auth failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  }

  async exportTaxRecords(entityId: string, taxData: any): Promise<SyncResult> {
    // Finacle uses CAServices/CIHDTOAUMGMT API
    try {
      const response = await this.request(
        "/finacle/rest/CAServices/CIHDTOAUMGMT/uploadTaxData",
        "POST",
        { entityId, taxData }
      );
      return {
        success: true,
        recordsProcessed: 1,
        recordsFailed: 0,
        errors: [],
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [{ recordId: entityId, error: err.message }],
        syncedAt: new Date().toISOString(),
      };
    }
  }
}

// ============================================================
// TCS BaNCS Adapter
// ============================================================

export class TcsBancsAdapter extends BaseBankingAdapter {
  name = "TCS BaNCS";

  async authenticate(): Promise<string> {
    // BaNCS uses session-based auth
    const res = await fetch(`${this.endpoint}/bancs/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.credentials.username,
        password: this.credentials.password,
      }),
    });

    if (!res.ok) throw new Error(`BaNCS auth failed: ${res.status}`);
    const data = await res.json();
    return data.sessionToken;
  }
}

// ============================================================
// Temenos Transact (T24) Adapter
// ============================================================

export class TemenosAdapter extends BaseBankingAdapter {
  name = "Temenos Transact";

  async authenticate(): Promise<string> {
    // Temenos uses IRIS API with API key
    return this.credentials.apiKey;
  }

  protected async request(path: string, method: string, body?: any): Promise<any> {
    const url = `${this.endpoint}/iris/rest${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.authToken || this.credentials.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Temenos API error: ${res.status}`);
    }

    return res.json();
  }
}

// ============================================================
// Custom REST Adapter (generic)
// ============================================================

export class CustomAdapter extends BaseBankingAdapter {
  name = "Custom REST";

  async authenticate(): Promise<string> {
    if (this.credentials.apiKey) return this.credentials.apiKey;

    const res = await fetch(`${this.endpoint}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: this.credentials.clientId,
        clientSecret: this.credentials.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`Custom API auth failed: ${res.status}`);
    const data = await res.json();
    return data.accessToken;
  }
}

// ============================================================
// Adapter Factory
// ============================================================

export function createBankingAdapter(
  system: string,
  endpoint: string,
  credentials: any
): BankingAdapter | null {
  switch (system) {
    case "flexcube":
      return new FlexcubeAdapter(endpoint, credentials);
    case "finacle":
      return new FinacleAdapter(endpoint, credentials);
    case "tcs_bancs":
      return new TcsBancsAdapter(endpoint, credentials);
    case "temenos":
      return new TemenosAdapter(endpoint, credentials);
    case "custom":
      return new CustomAdapter(endpoint, credentials);
    default:
      console.error(`Unknown banking system: ${system}`);
      return null;
  }
}

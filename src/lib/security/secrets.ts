/**
 * Secrets Management
 * ------------------
 * Provides a unified interface for reading secrets from:
 *   - Process env (dev fallback)
 *   - AWS Secrets Manager (production)
 *   - HashiCorp Vault KV (production alternative)
 *   - Google Secret Manager (GCP)
 *
 * In production, NO secrets should be in .env files — all should come from here.
 */

export type SecretsBackend = "env" | "aws-sm" | "vault" | "gcp-sm";

interface CachedSecret {
  value: string;
  fetchedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CachedSecret>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 min

class EnvSecretsBackend {
  async get(name: string): Promise<string | null> {
    return process.env[name] || null;
  }

  async getJson<T>(name: string): Promise<T | null> {
    const v = process.env[name];
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  }
}

class AwsSecretsManagerBackend {
  private client: any = null;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "ap-south-1";
  }

  private async getClient() {
    if (this.client) return this.client;
    const mod: any = await import("@aws-sdk/client-secrets-manager").catch(() => ({} as any));
    if (!mod.SecretsManagerClient) throw new Error("@aws-sdk/client-secrets-manager not installed");
    this.client = new mod.SecretsManagerClient({ region: this.region });
    return this.client;
  }

  async get(name: string): Promise<string | null> {
    const client = await this.getClient();
    const mod: any = await import("@aws-sdk/client-secrets-manager");
    const cmd = new mod.GetSecretValueCommand({ SecretId: name });
    const res = await client.send(cmd);
    return res.SecretString || null;
  }

  async getJson<T>(name: string): Promise<T | null> {
    const v = await this.get(name);
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  }
}

class VaultSecretsBackend {
  private addr: string;
  private token: string;

  constructor() {
    this.addr = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
    this.token = process.env.VAULT_TOKEN || "";
  }

  async get(name: string): Promise<string | null> {
    // name format: "kv/path:key" — reads from Vault KV v2
    const [path, key] = name.split(":");
    if (!path || !key) throw new Error(`Invalid Vault secret name: ${name}`);
    const res = await fetch(`${this.addr}/v1/secret/data/${path}`, {
      headers: { "X-Vault-Token": this.token },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.data?.[key] || null;
  }

  async getJson<T>(name: string): Promise<T | null> {
    const v = await this.get(name);
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  }
}

let _backend: any = null;

function getBackend(): any {
  if (_backend) return _backend;
  const backend = (process.env.SECRETS_BACKEND || "env") as SecretsBackend;
  switch (backend) {
    case "aws-sm":
      _backend = new AwsSecretsManagerBackend();
      break;
    case "vault":
      _backend = new VaultSecretsBackend();
      break;
    case "gcp-sm":
      // GCP Secret Manager — stubbed; implement when needed
      console.warn("GCP Secret Manager not yet implemented — falling back to env");
      _backend = new EnvSecretsBackend();
      break;
    case "env":
    default:
      _backend = new EnvSecretsBackend();
      break;
  }
  return _backend;
}

/**
 * Get a secret by name. Caches for the TTL.
 */
export async function getSecret(name: string, ttlMs = DEFAULT_TTL_MS): Promise<string | null> {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.fetchedAt < cached.ttlMs) {
    return cached.value;
  }

  const backend = getBackend();
  const value = await backend.get(name);

  if (value !== null) {
    cache.set(name, { value, fetchedAt: Date.now(), ttlMs });
  }

  return value;
}

/**
 * Get a JSON secret (e.g., database credentials bundle).
 */
export async function getSecretJson<T>(name: string, ttlMs = DEFAULT_TTL_MS): Promise<T | null> {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.fetchedAt < cached.ttlMs) {
    try { return JSON.parse(cached.value); } catch { return null; }
  }

  const backend = getBackend() as {
    get(name: string): Promise<string | null>;
    getJson<T>(name: string): Promise<T | null>;
  };
  const value = await backend.getJson<T>(name);

  if (value !== null) {
    cache.set(name, { value: JSON.stringify(value), fetchedAt: Date.now(), ttlMs });
  }

  return value;
}

/**
 * Clear the cache — call when a secret is rotated.
 */
export function clearSecretCache(name?: string): void {
  if (name) {
    cache.delete(name);
  } else {
    cache.clear();
  }
}

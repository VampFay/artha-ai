/**
 * mTLS Middleware
 * ---------------
 * Enforces mutual TLS for service-to-service communication.
 * In production, this runs behind an ALB that terminates mTLS and forwards
 * the client cert in headers. This middleware verifies the cert.
 *
 * For client-to-service traffic, the public ALB handles TLS termination.
 * For internal service-to-service, mTLS is required.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { X509Certificate } from "crypto";

const MTLS_ENABLED = process.env.MTLS_ENABLED === "true";
const CA_CERT_PATH = process.env.MTLS_CA_CERT_PATH;
const ALLOWED_CLIENT_CN_PREFIX = process.env.MTLS_ALLOWED_CN_PREFIX || "artha-internal-";

let caCertCache: string | null = null;

function getCaCert(): string | null {
  if (caCertCache) return caCertCache;
  if (!CA_CERT_PATH) return null;
  try {
    caCertCache = readFileSync(CA_CERT_PATH, "utf8");
    return caCertCache;
  } catch {
    return null;
  }
}

/**
 * Verify the client certificate presented in headers.
 * ALB terminates mTLS and forwards cert in X-Amzn-Mtls-Clientcert header.
 */
export function verifyMtls(req: NextRequest): { valid: boolean; error?: string } {
  if (!MTLS_ENABLED) return { valid: true };

  const clientCertPem = req.headers.get("x-amzn-mtls-clientcert");
  if (!clientCertPem) {
    return { valid: false, error: "Client certificate required" };
  }

  try {
    const cert = new X509Certificate(Buffer.from(clientCertPem, "base64"));

    // Verify cert is signed by our CA
    const caCert = getCaCert();
    if (caCert) {
      const ca = new X509Certificate(caCert);
      const verified = cert.verify(ca.publicKey);
      if (!verified) {
        return { valid: false, error: "Client cert not signed by trusted CA" };
      }
    }

    // Verify cert is not expired (X509Certificate uses validFrom/validTo)
    const now = new Date();
    const validFrom = new Date(cert.validFrom);
    const validTo = new Date(cert.validTo);
    if (validFrom > now) {
      return { valid: false, error: "Client cert not yet valid" };
    }
    if (validTo < now) {
      return { valid: false, error: "Client cert expired" };
    }

    // Verify CN is in allowed list
    const subject = cert.subject || "";
    if (typeof subject === "string" && !subject.includes(ALLOWED_CLIENT_CN_PREFIX)) {
      return { valid: false, error: `Client CN not allowed: ${subject}` };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `Cert verification failed: ${err.message}` };
  }
}

/**
 * Middleware function — wraps API handlers to enforce mTLS for internal calls.
 */
export function withMtls(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only enforce for internal endpoints (marked via header)
    const isInternal = req.headers.get("x-internal") === "true";
    if (isInternal) {
      const mtlsResult = verifyMtls(req);
      if (!mtlsResult.valid) {
        return NextResponse.json(
          { error: { code: "mtls_failed", message: mtlsResult.error } },
          { status: 403 }
        );
      }
    }
    return handler(req);
  };
}

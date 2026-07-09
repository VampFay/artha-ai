/**
 * Security barrel — single import surface for all security modules.
 *
 * Usage:
 *   import { encryptField, appendAuditEntry, getSecret } from "@/lib/security";
 */

export * from "./kms";
export * from "./field-encryption";
export * from "./audit-chain";
export * from "./secrets";
export * from "./events";
export * from "./pdf-signing";
export * from "./rbac";
export * from "./saml";
export * from "./oidc";
export * from "./scim";
export * from "./api-keys";
export * from "./middleware";

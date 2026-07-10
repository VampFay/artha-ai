# Artha AI Enterprise API Reference

**Version:** 1.0
**Base URL:** `https://api.artha.ai/api/v1`

## Authentication

All endpoints require authentication via one of:
1. **Bearer JWT** (for user sessions) — `Authorization: Bearer <jwt>`
2. **API Key** (for programmatic access) — `X-API-Key: artha_live_<token>`

## Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Per-IP (default) | 600 | 1 min |
| Per-API-Key (default) | 600 | 1 min |
| Per-API-Key (custom) | configurable | 1 min |
| Auth endpoints | 10 | 1 min |
| Bulk endpoints | 10 | 1 min |

## Endpoints

### Health
- `GET /api/v1/health` — Health check (public)

### Tenant Management
- `GET /api/v1/tenants/current` — Get current tenant info
- `PATCH /api/v1/tenants/current` — Update tenant settings (admin)
- `POST /api/v1/tenants/provision` — Provision new tenant (platform admin)
- `GET /api/v1/tenants/current/roles` — List roles
- `GET /api/v1/tenants/current/users` — List users
- `GET /api/v1/tenants/current/sso` — List SSO connections
- `POST /api/v1/tenants/current/sso` — Create SSO connection

### Documents
- `POST /api/v1/documents/upload` — Upload document
- `GET /api/v1/documents/:id` — Get document status + extracted data

### Tax
- `GET /api/v1/tax/summary?financial_year=2024-25` — Get tax summary

### Portfolio
- `GET /api/v1/portfolio/summary` — Get portfolio summary

### Bulk Jobs
- `GET /api/v1/bulk/jobs` — List bulk jobs
- `POST /api/v1/bulk/jobs` — Create bulk job
- `GET /api/v1/bulk/jobs/:id` — Get bulk job status

### API Keys
- `GET /api/v1/api-keys` — List API keys
- `POST /api/v1/api-keys` — Create API key
- `DELETE /api/v1/api-keys/:id` — Revoke API key

### Webhooks
- `GET /api/v1/webhooks` — List webhooks
- `POST /api/v1/webhooks` — Create webhook
- `DELETE /api/v1/webhooks/:id` — Delete webhook

### Privacy & Compliance
- `GET /api/v1/consents` — List consents
- `POST /api/v1/consents` — Grant consent
- `POST /api/v1/consents/revoke` — Revoke consent
- `GET /api/v1/data-subject-requests` — List DSRs
- `POST /api/v1/data-subject-requests` — Submit DSR
- `GET /api/v1/retention` — List retention policies
- `POST /api/v1/retention` — Create retention policy
- `GET /api/v1/processing-records` — List data processing records
- `POST /api/v1/processing-records` — Create processing record
- `GET /api/v1/compliance` — Compliance dashboard

### Audit & Security
- `GET /api/v1/audit` — Audit log (with chain integrity verification)
- `GET /api/v1/exports?type=documents|tax|audit|all` — Export data
- `GET /api/v1/incidents` — List security incidents
- `POST /api/v1/incidents` — Report security incident
- `GET /api/v1/backups` — List backup records

### SSO
- `GET /api/sso/saml/login?tenant=<slug>` — SAML SSO login
- `POST /api/sso/saml/acs` — SAML Assertion Consumer Service
- `GET /api/sso/saml/metadata` — SAML SP metadata
- `GET /api/sso/oidc/login?tenant=<slug>` — OIDC SSO login
- `GET /api/sso/oidc/callback` — OIDC callback

### SCIM 2.0
- `GET /api/scim/v2/Users` — List users
- `POST /api/scim/v2/Users` — Create user
- `GET /api/scim/v2/Users/:id` — Get user
- `PUT /api/scim/v2/Users/:id` — Replace user
- `PATCH /api/scim/v2/Users/:id` — Patch user
- `DELETE /api/scim/v2/Users/:id` — Deactivate user
- `GET /api/scim/v2/Groups` — List groups

## Error Responses

All errors use the format:
```json
{
  "error": {
    "code": "forbidden",
    "message": "Insufficient permissions: requires documents:read"
  }
}
```

HTTP status codes:
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error
- 503: Service Unavailable

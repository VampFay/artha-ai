# Artha AI — Production Scaling Plan

**Goal:** Transform Artha AI from a single-instance demo to a production-grade platform serving 500+ concurrent users with zero downtime deployments.

---

## Phase 1: Database Migration (SQLite → PostgreSQL)
**Effort:** 2 hours | **Risk:** Low | **Impact:** Unlocks concurrent writes

1. Add `docker-compose.yml` with PostgreSQL 16 service
2. Verify `prisma/schema.prisma` has no SQLite-specific types
3. Update `DATABASE_URL` to `postgresql://artha:password@localhost:5432/artha`
4. Run `bun run db:push` against Postgres
5. Write `scripts/migrate-sqlite-to-postgres.ts` — reads all tables from SQLite, batch-inserts to Postgres
6. Run migration script
7. Verify all queries work against Postgres
8. Add PgBouncer for connection pooling
9. Document the switch in README

## Phase 2: File Storage Abstraction (Local → S3/R2)
**Effort:** 3 hours | **Risk:** Low | **Impact:** Unlocks multi-instance deploys

1. Create `src/lib/storage/file-store.ts` interface
2. Implement `LocalFileStore` (current behavior)
3. Implement `S3FileStore` using `@aws-sdk/client-s3`
4. Add `STORAGE_DRIVER` env var
5. Refactor document upload/download/delete to use `getFileStore()`
6. Add presigned URL support for direct browser uploads (bypass server)
7. Write migration script: copy local files to S3
8. Add Cloudflare R2 support (S3-compatible, no egress fees)

## Phase 3: Redis-Backed Rate Limiting
**Effort:** 1 hour | **Risk:** Low | **Impact:** Correct rate limits across instances

1. `bun add ioredis`
2. Create `src/lib/redis.ts` — singleton with in-memory fallback
3. Update `checkRateLimit()` to use Redis `INCR` + `EXPIRE`
4. Sliding window using sorted sets with timestamp scores
5. Add Redis to `docker-compose.yml`
6. Fallback to in-memory if `REDIS_URL` not set (dev mode)

## Phase 4: Background Job Queue (BullMQ)
**Effort:** 4 hours | **Risk:** Medium | **Impact:** Non-blocking PDF generation + document processing

1. `bun add bullmq`
2. Define queues: `reportQueue`, `documentQueue`
3. Create workers: `src/workers/report-worker.ts`, `src/workers/document-worker.ts`
4. Update `POST /api/documents` — return 202 immediately, queue parsing
5. Create `GET /api/documents/[id]/status` — polling endpoint
6. Update `POST /api/reports` — return jobId immediately, queue generation
7. Create `GET /api/reports/jobs/[id]` — job status polling
8. Add `scripts/start-worker.ts` — entry point for worker process
9. Add worker to `docker-compose.yml`
10. Add WebSocket push when jobs complete (Socket.io)

## Phase 5: JWT Refresh Tokens
**Effort:** 3 hours | **Risk:** Medium | **Impact:** Better security + UX

1. Add `RefreshToken` model with rotation
2. Update `createToken()` — return access (15min) + refresh (30 days)
3. Create `POST /api/auth/refresh` — rotate refresh token, issue new pair
4. Create `useRefreshToken` hook — auto-refresh 5min before expiry
5. Update `apiFetch` — handle 401 → try refresh → retry or logout
6. Add "Active Sessions" UI in Settings
7. Add "Logout All Devices" — revoke all refresh tokens

## Phase 6: Docker Containerization
**Effort:** 2 hours | **Risk:** Low | **Impact:** One-command deploy

1. Multi-stage `Dockerfile` (builder + runner)
2. `.dockerignore`
3. `docker-compose.yml` — web + worker + postgres + redis
4. Health checks using `/api/health` + `/api/ready`
5. Volume for `uploads/` (or S3 in prod)
6. Environment-based config (dev/staging/prod)
7. `docker-compose.prod.yml` — production overrides

## Phase 7: CI/CD Pipeline
**Effort:** 2 hours | **Risk:** Low | **Impact:** Automated quality gate

1. `.github/workflows/ci.yml` — typecheck + lint + test + build
2. `.github/workflows/e2e.yml` — Playwright on PR
3. Cache `node_modules` + `.next/cache`
4. Bundle size check — fail if first-load JS > 250kb
5. Dependabot for security updates
6. Auto-deploy to staging on merge to main
7. Blue-green deployment strategy

## Phase 8: Observability & Monitoring
**Effort:** 2 hours | **Risk:** Low | **Impact:** Know when things break

1. Sentry integration (`@sentry/nextjs`)
2. PostHog analytics (feature usage, funnels)
3. Prometheus metrics endpoint (`/api/metrics`)
4. Grafana dashboards (request count, p95 latency, error rate)
5. Uptime monitoring (UptimeRobot)
6. Status page
7. Alerting: Slack webhook on new error

## Phase 9: Testing
**Effort:** 4 hours | **Risk:** Low | **Impact:** Prevent regressions

1. Vitest unit tests for tax-engine, finance-engine, goal-engine, bank-parser
2. Playwright E2E: login → upload → verify → score → report
3. Integration tests for API routes (using test database)
4. Coverage gate: fail CI if < 70%
5. Visual regression tests (screenshot comparison)

## Phase 10: Security Hardening
**Effort:** 2 hours | **Risk:** Low | **Impact:** Production-safe

1. Add Zod validation to ALL POST routes (some already done)
2. PAN/account number encryption at rest (AES-256-GCM)
3. CSRF protection via `validateOrigin()` on mutating routes
4. Rate limit all POST routes (not just auth + assistant)
5. Security headers audit (HSTS, X-Content-Type-Options already done)
6. OWASP Top 10 re-audit
7. Dependency vulnerability scan (`bun audit`)
8. Privacy policy + terms of service pages

---

## Timeline

| Phase | Days | Dependency |
|-------|------|------------|
| 1. PostgreSQL | Day 1 | None |
| 2. S3 Storage | Day 1-2 | None |
| 3. Redis | Day 2 | None |
| 4. Job Queue | Day 2-3 | Redis |
| 5. JWT Refresh | Day 3 | None |
| 6. Docker | Day 3-4 | Postgres + Redis |
| 7. CI/CD | Day 4 | Tests |
| 8. Observability | Day 4-5 | None |
| 9. Testing | Day 5-6 | None |
| 10. Security | Day 6 | None |

**Total: ~6 days for full production readiness.**

---

## Postgres Connection String Examples

```
# Local dev (Docker)
DATABASE_URL=postgresql://artha:artha@localhost:5432/artha

# Supabase (free tier)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Neon (serverless Postgres)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# Railway
DATABASE_URL=postgresql://postgres:password@monorail.proxy.rlwy.net:port/db
```

## S3 Configuration Examples

```
# AWS S3
STORAGE_DRIVER=s3
S3_BUCKET=artha-ai-documents
S3_REGION=ap-south-1
S3_ACCESS_KEY=AKIAxxx
S3_SECRET_KEY=xxx

# Cloudflare R2 (S3-compatible, no egress)
STORAGE_DRIVER=s3
S3_BUCKET=artha-ai
S3_REGION=auto
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

## Docker Compose (Production)

```yaml
version: '3.8'
services:
  web:
    build: .
    ports: ["3000:3000"]
    env_file: .env.production
    depends_on: [postgres, redis]
    deploy:
      replicas: 2
      resources:
        limits: { memory: 512M }

  worker:
    build: .
    command: bun run scripts/start-worker.ts
    env_file: .env.production
    depends_on: [redis]

  postgres:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_USER: artha
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: artha

  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

volumes:
  pgdata:
  redisdata:
```

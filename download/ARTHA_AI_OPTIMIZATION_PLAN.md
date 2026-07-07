# Artha AI — Complete Optimization, Scaling & Enhancement Plan

**Generated:** 2026-07-08
**Total actionable steps:** ~850
**Estimated effort:** 120-160 focused hours (3-4 weeks solo)
**Convention:** Every step is sized to 5-30 minutes. Tagged **P0** (do now), **P1** (this week), **P2** (before evaluation), **P3** (nice-to-have).

---

## How to Use This Plan

1. Pick a section.
2. Execute steps in order — each builds on the previous.
3. Tick `[ ]` boxes as you go.
4. Run the verification step at the end of each subsection before moving on.
5. Commit after each subsection with conventional format: `perf(ticker): drop page from useEffect deps`.

---

## Table of Contents

1. [Performance — Frontend](#1-performance--frontend)
2. [Performance — Backend](#2-performance--backend)
3. [Code Quality & Architecture](#3-code-quality--architecture)
4. [Security Hardening](#4-security-hardening)
5. [Testing & CI/CD](#5-testing--cicd)
6. [Scaling & Production Readiness](#6-scaling--production-readiness)
7. [UX & Feature Enhancements](#7-ux--feature-enhancements)
8. [Documentation & Developer Experience](#8-documentation--developer-experience)

---

## 1. Performance — Frontend

### 1.1 Font Loading Optimization — P0

**Goal:** Eliminate render-blocking Google Fonts `<link>`, use `next/font` for self-hosting.

- [ ] 1.1.1 **P0** — Check if Michroma is available via `next/font/google`
- [ ] 1.1.2 **P0** — If yes: add `Michroma` import to `layout.tsx` via `next/font/google`
- [ ] 1.1.3 **P0** — If no: download Michroma `.woff2` file, place in `public/fonts/`
- [ ] 1.1.4 **P0** — Check if Geist Pixel is available via `next/font/google`
- [ ] 1.1.5 **P0** — If yes: add `Geist_Pixel` import (unlikely — it's very new)
- [ ] 1.1.6 **P0** — If no: download Geist Pixel `.ttf`, convert to `.woff2` using `pyftsubset`, place in `public/fonts/`
- [ ] 1.1.7 **P0** — Create `src/lib/fonts.ts` — exports configured font objects
- [ ] 1.1.8 **P0** — Update `layout.tsx` — import from `@/lib/fonts` instead of `<link>` tag
- [ ] 1.1.9 **P0** — Remove the `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` from `<head>`
- [ ] 1.1.10 **P0** — Update `globals.css` `@theme` — set `--font-michroma` and `--font-geist-pixel` to use the `next/font` CSS variables
- [ ] 1.1.11 **P0** — Verify fonts still render correctly in browser (Michroma on headings, Geist Pixel on numbers)
- [ ] 1.1.12 **P1** — Run Lighthouse — verify "Eliminate render-blocking resources" is gone
- [ ] 1.1.13 **P1** — Verify CSP no longer needs `https://fonts.googleapis.com` in `style-src` (can revert that CSP addition)

**Definition of done:** Fonts load from `/_next/static/media/` (self-hosted), no external font requests, no render-blocking `<link>`.

---

### 1.2 SWR Data Caching — P0

**Goal:** Stop re-fetching API data on every navigation. Cache for 30s, invalidate on mutation.

- [ ] 1.2.1 **P0** — `bun add swr`
- [ ] 1.2.2 **P0** — Create `src/lib/swr-client.ts` — exports `fetcher` function: `fetch(url, { headers: { Authorization: \`Bearer \${token}\` } }).then(r => r.json())`
- [ ] 1.2.3 **P0** — Create `src/hooks/use-tax-summary.ts` — `useSWR(['/api/tax/summary', token], fetcher, { dedupingInterval: 5000, revalidateOnFocus: false })`
- [ ] 1.2.4 **P0** — Create `src/hooks/use-finance-summary.ts` — accepts `emergencyFund` param
- [ ] 1.2.5 **P0** — Create `src/hooks/use-portfolio.ts`
- [ ] 1.2.6 **P0** — Create `src/hooks/use-cashflow.ts` — summary + income-vs-expenses + top-expenses combined
- [ ] 1.2.7 **P0** — Create `src/hooks/use-liabilities.ts`
- [ ] 1.2.8 **P0** — Create `src/hooks/use-estate.ts`
- [ ] 1.2.9 **P0** — Create `src/hooks/use-subscriptions.ts`
- [ ] 1.2.10 **P0** — Create `src/hooks/use-goals.ts`
- [ ] 1.2.11 **P0** — Create `src/hooks/use-documents.ts`
- [ ] 1.2.12 **P0** — Create `src/hooks/use-oracle-insight.ts`
- [ ] 1.2.13 **P0** — Create `src/hooks/use-ticker-data.ts` — combines tax + finance for ticker bar
- [ ] 1.2.14 **P0** — Refactor `DashboardView.tsx` — replace 7 raw `fetch` calls with `useTaxSummary`, `usePortfolio`, etc.
- [ ] 1.2.15 **P0** — Refactor `TaxView.tsx` — use `useTaxSummary`
- [ ] 1.2.16 **P0** — Refactor `FinanceView.tsx` — use `useFinanceSummary`
- [ ] 1.2.17 **P0** — Refactor `PortfolioView.tsx` — use `usePortfolio`
- [ ] 1.2.18 **P0** — Refactor `CashflowView.tsx` — use `useCashflow`
- [ ] 1.2.19 **P0** — Refactor `LiabilitiesView.tsx` — use `useLiabilities`
- [ ] 1.2.20 **P0** — Refactor `EstateView.tsx` — use `useEstate`
- [ ] 1.2.21 **P0** — Refactor `GoalsView.tsx` — use `useGoals` + `mutate` on create/delete
- [ ] 1.2.22 **P0** — Refactor `DocumentsView.tsx` — use `useDocuments` + `mutate` on upload/delete
- [ ] 1.2.23 **P0** — Refactor `SettingsView.tsx` — use SWR for consent + audit log
- [ ] 1.2.24 **P0** — Refactor `app-shell.tsx` — use `useTickerData` instead of manual `useEffect` + `fetch`
- [ ] 1.2.25 **P0** — Add optimistic updates to document verify — `mutate(['extraction', docId], { ...data, verified: true }, false)`
- [ ] 1.2.26 **P0** — Add optimistic updates to goal create/delete
- [ ] 1.2.27 **P0** — Add optimistic updates to estate nominee create
- [ ] 1.2.28 **P0** — Configure SWR global provider in `layout.tsx` — `SWRConfig` with `revalidateOnReconnect: true, shouldRetryOnError: false`
- [ ] 1.2.29 **P1** — Add `keepPreviousData: true` for FinanceView when changing emergency fund input
- [ ] 1.2.30 **P1** — Add `onErrorRetry` — don't retry on 401 or 403
- [ ] 1.2.31 **P1** — Add cache persistence to `localStorage` for offline-first feel (swr-persist)

**Definition of done:** Navigate Dashboard → Tax → Dashboard — second dashboard visit is instant (cache hit, no spinner).

---

### 1.3 Ticker Bar Optimization — P0

**Goal:** Fetch ticker data once per session, not on every page change.

- [ ] 1.3.1 **P0** — In `app-shell.tsx`, change `useEffect` deps from `[user, page]` to `[user]`
- [ ] 1.3.2 **P0** — Replace manual fetch with `useTickerData()` SWR hook (from 1.2.13)
- [ ] 1.3.3 **P0** — Set `revalidateOnFocus: false, revalidateOnMount: true` for ticker SWR
- [ ] 1.3.4 **P1** — Add `refreshInterval: 300000` (5 min background revalidation)

**Definition of done:** Ticker bar fetches once on login, updates every 5 min in background, never re-fetches on navigation.

---

### 1.4 Code-Split Views — P1

**Goal:** Cut first-load JS by ~40% by lazy-loading non-dashboard views.

- [ ] 1.4.1 **P1** — In `app-shell.tsx`, replace static view imports with `next/dynamic`
- [ ] 1.4.2 **P1** — `const PortfolioView = dynamic(() => import("@/views/PortfolioView"))`
- [ ] 1.4.3 **P1** — `const CashflowView = dynamic(() => import("@/views/CashflowView"))`
- [ ] 1.4.4 **P1** — `const LiabilitiesView = dynamic(() => import("@/views/LiabilitiesView"))`
- [ ] 1.4.5 **P1** — `const RetirementView = dynamic(() => import("@/views/RetirementView"))`
- [ ] 1.4.6 **P1** — `const EstateView = dynamic(() => import("@/views/EstateView"))`
- [ ] 1.4.7 **P1** — `const TaxView = dynamic(() => import("@/views/TaxView"))`
- [ ] 1.4.8 **P1** — `const FinanceView = dynamic(() => import("@/views/FinanceView"))`
- [ ] 1.4.9 **P1** — `const GoalsView = dynamic(() => import("@/views/GoalsView"))`
- [ ] 1.4.10 **P1** — `const AssistantView = dynamic(() => import("@/views/AssistantView"))`
- [ ] 1.4.11 **P1** — `const ReportsView = dynamic(() => import("@/views/ReportsView"))`
- [ ] 1.4.12 **P1** — `const SettingsView = dynamic(() => import("@/views/SettingsView"))`
- [ ] 1.4.13 **P1** — `const DocumentsView = dynamic(() => import("@/views/DocumentsView"))`
- [ ] 1.4.14 **P1** — `const DocumentVerifyView = dynamic(() => import("@/views/DocumentVerifyView"))`
- [ ] 1.4.15 **P1** — Keep `DashboardView` as static import (it's the first page users see)
- [ ] 1.4.16 **P1** — Add loading fallback: `<Loader2 className="animate-spin" />` centered
- [ ] 1.4.17 **P1** — Add `prefetch` on nav hover (mouse over nav item → prefetch that view's chunk)
- [ ] 1.4.18 **P1** — Run `bun run build` — verify separate chunks per view in output
- [ ] 1.4.19 **P1** — Compare before/after first-load JS size

**Definition of done:** `bun run build` shows separate chunks per view. First load only ships dashboard + shared code.

---

### 1.5 Dashboard Loading & Error States — P0

**Goal:** Show skeleton while loading, show error with retry on failure.

- [ ] 1.5.1 **P0** — In `DashboardView.tsx`, add `loading` state derived from SWR hook `isLoading`
- [ ] 1.5.2 **P0** — Create `DashboardSkeleton` component — mimics the bento grid layout with shimmer placeholders
- [ ] 1.5.3 **P0** — Show `DashboardSkeleton` while `loading` is true
- [ ] 1.5.4 **P0** — Add `error` state — if any API returns non-200, show error banner with "Retry" button
- [ ] 1.5.5 **P0** — Add "Retry" handler — calls `mutate()` on all SWR keys
- [ ] 1.5.6 **P0** — Handle partial data — if tax API works but portfolio fails, show tax data + error card for portfolio
- [ ] 1.5.7 **P1** — Add `staleTime: 30000` — show cached data immediately while revalidating in background

**Definition of done:** Dashboard shows skeleton for 200ms, then cached data, then fresh data — no flash of zeros.

---

### 1.6 Document-Verify Navigation Fix — P0

**Goal:** "Review" button passes the clicked document's ID, not just navigates generically.

- [ ] 1.6.1 **P0** — In `DocumentsView.tsx`, change Review button onClick: `onNavigate("document-verify", { id: doc.id })`
- [ ] 1.6.2 **P0** — In `DocumentVerifyView.tsx`, read `params.id` from `useNav()` instead of fetching latest document
- [ ] 1.6.3 **P0** — Fetch fields for that specific document: `fetch(\`/api/extraction/\${docId}/fields\`)`
- [ ] 1.6.4 **P0** — Handle case where `params.id` is missing — redirect back to documents
- [ ] 1.6.5 **P0** — Add "Back to Documents" button at top of verify view

**Definition of done:** Click Review on a specific document → see that document's extracted fields, not the latest one.

---

### 1.7 Bundle Analysis & Cleanup — P1

**Goal:** Remove dead weight, know exactly what's in the bundle.

- [ ] 1.7.1 **P1** — `bun add -d @next/bundle-analyzer`
- [ ] 1.7.2 **P1** — Update `next.config.ts` — wrap with `withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })`
- [ ] 1.7.3 **P1** — Run `ANALYZE=true bun run build`
- [ ] 1.7.4 **P1** — Open `.next/analyze/client.html` — identify top 10 heaviest modules
- [ ] 1.7.5 **P1** — Verify `pdfkit` and `pdf-parse` are NOT in client bundle (server-only)
- [ ] 1.7.6 **P1** — Verify `z-ai-web-dev-sdk` is NOT in client bundle
- [ ] 1.7.7 **P1** — Verify `papaparse` and `xlsx` are NOT in client bundle
- [ ] 1.7.8 **P1** — Check `motion` (Framer Motion) size — if >80kb, consider `motion/react-mini` or lazy-loading
- [ ] 1.7.9 **P1** — Check `lucide-react` size — verify tree-shaking works (only ~30 icons should be included)
- [ ] 1.7.10 **P1** — `bunx depcheck` — find unused dependencies
- [ ] 1.7.11 **P1** — Remove `date-fns` if unused (was only used by deleted calendar component)
- [ ] 1.7.12 **P1** — Remove any other unused deps found by depcheck
- [ ] 1.7.13 **P1** — Add bundle size check to CI: fail if first-load JS > 250kb

**Definition of done:** Bundle analyzer shows clean separation. No server-only packages in client bundle. All unused deps removed.

---

### 1.8 Image Optimization — P2

**Goal:** Optimize document thumbnails, user avatars.

- [ ] 1.8.1 **P2** — Re-enable Next.js image optimization: `images: { unoptimized: false }` in `next.config.ts`
- [ ] 1.8.2 **P2** — Keep `sharp` package (needed for image optimization)
- [ ] 1.8.3 **P2** — Generate document thumbnail (first page of PDF → PNG) on upload using `pdf-parse` + `canvas`
- [ ] 1.8.4 **P2** — Store thumbnail in `/storage/thumbs/{docId}.png`
- [ ] 1.8.5 **P2** — Use `next/image` for document thumbnails in DocumentsView
- [ ] 1.8.6 **P2** — Compress uploaded images (JPG/PNG) before storing using `sharp`

**Definition of done:** Document list shows real thumbnails, optimized via `next/image`.

---

## 2. Performance — Backend

### 2.1 Prisma N+1 Query Audit — P0

**Goal:** Find and fix all N+1 query patterns.

- [ ] 2.1.1 **P0** — Add Prisma query logging: `LOG_QUERIES=true` env → `prisma.$on('query', e => console.log(e.query, e.duration+'ms'))`
- [ ] 2.1.2 **P0** — Hit `/api/tax/summary` — count queries (should be ≤5)
- [ ] 2.1.3 **P0** — Audit tax-engine: documents → extracted fields per document (N+1!) — fix with `include: { extractedFields: true }` on documents query
- [ ] 2.1.4 **P0** — Hit `/api/finance/summary` — count queries
- [ ] 2.1.5 **P0** — Audit finance-engine: expenses grouped by category — verify single query
- [ ] 2.1.6 **P0** — Hit `/api/cashflow/summary` — count queries (should be ≤2 after our fix)
- [ ] 2.1.7 **P0** — Hit `/api/portfolio/summary` — count queries (should be 2: holdings + targets)
- [ ] 2.1.8 **P0** — Hit `/api/liabilities` — count queries (should be 2: liabilities + incomes)
- [ ] 2.1.9 **P0** — Hit `/api/estate/nominees` — count queries (should be 3: nominees + estateDocs + holdings)
- [ ] 2.1.10 **P0** — Add `select` to Prisma queries to limit fields returned (don't fetch unused columns)
- [ ] 2.1.11 **P1** — Add `X-Query-Count` response header for debugging
- [ ] 2.1.12 **P1** — Add p99 query duration metric (log if any query > 50ms)
- [ ] 2.1.13 **P1** — Consider Prisma Accelerate or Data Proxy for edge runtime

**Definition of done:** With query logging on, every API endpoint shows ≤5 queries.

---

### 2.2 Database Indexes — P0

**Goal:** Verify all hot-path queries use indexes.

- [ ] 2.2.1 **P0** — Open `prisma/schema.prisma`
- [ ] 2.2.2 **P0** — `Document`: add composite `@@index([userId, documentType])` (used by tax-engine)
- [ ] 2.2.3 **P0** — `ExtractedField`: add `@@index([documentId, fieldName])` (used by verify page)
- [ ] 2.2.4 **P0** — `Expense`: add `@@index([userId, transactionDate])` (used by cashflow)
- [ ] 2.2.5 **P0** — `Expense`: add `@@index([userId, category])` (used by finance-engine GROUP BY)
- [ ] 2.2.6 **P0** — `Income`: add `@@index([userId, month, financialYear])` (used by cashflow + finance)
- [ ] 2.2.7 **P0** — `AuditLog`: add composite `@@index([userId, timestamp])` (used by settings audit log)
- [ ] 2.2.8 **P0** — `AssetHolding`: add `@@index([userId, assetClass])` (used by portfolio + cashflow)
- [ ] 2.2.9 **P0** — `Liability`: add `@@unique([userId, name])` (prevent duplicate loans)
- [ ] 2.2.10 **P0** — `RevokedToken`: remove redundant `@@index([token])` (unique already creates index)
- [ ] 2.2.11 **P0** — Run `bun run db:migrate --name add_indexes`
- [ ] 2.2.12 **P0** — Verify with `EXPLAIN QUERY PLAN` on SQLite for each hot query

**Definition of done:** `EXPLAIN QUERY PLAN` shows index usage, not table scans.

---

### 2.3 Auth Token Caching — P1

**Goal:** Reduce DB lookups per authenticated request from 2 to 0 (cached).

- [ ] 2.3.1 **P1** — In `src/lib/auth.ts`, add in-memory LRU cache for user lookups
- [ ] 2.3.2 **P1** — Cache key: `payload.sub` (user ID), value: `{ id: string }`, TTL: 30s
- [ ] 2.3.3 **P1** — On `verifyToken`: check cache first, fall back to DB, store in cache
- [ ] 2.3.4 **P1** — On `revokeToken`: invalidate cache for that user
- [ ] 2.3.5 **P1** — On logout: invalidate cache for that user
- [ ] 2.3.6 **P1** — Add cache hit/miss logging (debug only)
- [ ] 2.3.7 **P2** — Consider Bloom filter for revoked tokens (O(1) lookup, false positives OK since we verify)

**Definition of done:** 7 concurrent dashboard API calls = 0 DB lookups for auth (all cache hits).

---

### 2.4 PDF Generation Streaming — P1

**Goal:** Move PDF generation off the request thread.

- [ ] 2.4.1 **P1** — Add `ReportJob` model: `{ id, userId, type, status, resultUrl, error, createdAt, completedAt }`
- [ ] 2.4.2 **P1** — Create `POST /api/reports/queue` — creates job, returns `{ jobId }` immediately
- [ ] 2.4.3 **P1** — Create `GET /api/reports/jobs/[id]` — returns job status + download URL
- [ ] 2.4.4 **P1** — Background processor: `setInterval` in dev or BullMQ worker in prod
- [ ] 2.4.5 **P1** — Update `ReportsView.tsx` — click Generate → poll job status → download when ready
- [ ] 2.4.6 **P1** — Add progress indicator: "Queued → Processing → Ready"
- [ ] 2.4.7 **P2** — Add WebSocket push when job completes (if WebSocket infra exists)

**Definition of done:** Click Generate → immediate response → background generates PDF → user polls → download.

---

### 2.5 Document Processing Async — P1

**Goal:** Return 202 immediately after file save, process in background.

- [ ] 2.5.1 **P1** — In `POST /api/documents`, after file save + DB create, return `202 Accepted` with `{ id, processing_status: "processing" }`
- [ ] 2.5.2 **P1** — Move PDF parsing + field extraction + bank statement parsing to `setTimeout(0)` or a job queue
- [ ] 2.5.3 **P1** — Create `GET /api/documents/[id]/status` — returns current `processingStatus`
- [ ] 2.5.4 **P1** — Update `DocumentsView.tsx` — after upload, poll status every 2s until `extracted` or `failed`
- [ ] 2.5.5 **P1** — Show live status badge: "Processing..." → "Extracted" or "Failed"
- [ ] 2.5.6 **P2** — Add WebSocket push when processing completes

**Definition of done:** Upload returns instantly, user sees "Processing..." badge, updates to "Extracted" when done.

---

### 2.6 HTTP Caching Headers — P2

**Goal:** Cache static + immutable responses at browser level.

- [ ] 2.6.1 **P2** — Add `Cache-Control: private, max-age=30, stale-while-revalidate=60` to GET API responses
- [ ] 2.6.2 **P2** — Add `Cache-Control: no-store` to auth endpoints (login, register, logout)
- [ ] 2.6.3 **P2** — Add `ETag` support for list endpoints (hash of response body)
- [ ] 2.6.4 **P2** — Return `304 Not Modified` when ETag matches
- [ ] 2.6.5 **P2** — Verify browser DevTools shows `from disk cache` on repeated API calls

**Definition of done:** Browser DevTools shows `from disk cache` on repeated API calls within 30s.

---

## 3. Code Quality & Architecture

### 3.1 Type Safety Audit — P0

**Goal:** Eliminate `any` types, enable strict mode.

- [ ] 3.1.1 **P0** — `grep -rn ": any" src/ | wc -l` — count current
- [ ] 3.1.2 **P0** — Fix `app/page.tsx` `renderPage(page: string, navigate: (p: any, params?: any) => void)` — use proper types
- [ ] 3.1.3 **P0** — Fix `DocumentVerifyView.tsx` `params.id as string` — validate with Zod
- [ ] 3.1.4 **P0** — Fix `app-shell.tsx` `user as any` — use proper User type
- [ ] 3.1.5 **P0** — Fix `DashboardView.tsx` `useState<any>({})` — define proper interface
- [ ] 3.1.6 **P0** — Fix `CashflowView.tsx` `useState<any[]>([])` — define interfaces
- [ ] 3.1.7 **P0** — Fix `EstateView.tsx` `useState<any[]>([])` — use Nominee/Will interfaces
- [ ] 3.1.8 **P0** — Add ESLint rule: `no-explicit-any` as error
- [ ] 3.1.9 **P0** — Add `noUncheckedIndexedAccess: true` in `tsconfig.json`
- [ ] 3.1.10 **P0** — Run `bunx tsc --noEmit` — fix all type errors
- [ ] 3.1.11 **P1** — Generate Zod schemas from Prisma types using `zod-prisma-types`
- [ ] 3.1.12 **P1** — Replace all `any` in third-party API responses with `unknown` + narrow

**Definition of done:** `grep -rn ": any" src/` returns 0. `tsc --noEmit` passes with strict.

---

### 3.2 Error Boundaries — P0

**Goal:** Graceful crash recovery — no white screens.

- [ ] 3.2.1 **P0** — Create `src/components/ErrorBoundary.tsx` — class component with `componentDidCatch`
- [ ] 3.2.2 **P0** — Error UI: "Something went wrong" + stack trace (dev only) + "Reload" + "Go to Dashboard"
- [ ] 3.2.3 **P0** — Wrap each view in `<ErrorBoundary>` in `app-shell.tsx`'s `renderView()`
- [ ] 3.2.4 **P0** — Add `key={page}` to ErrorBoundary so it resets on navigation
- [ ] 3.2.5 **P0** — Test: throw error in FinanceView → see error UI → click "Go to Dashboard" → recovers
- [ ] 3.2.6 **P1** — Send error to Sentry (if configured)
- [ ] 3.2.7 **P1** — Add error ID for user to share with support

**Definition of done:** Force error in any view → other views still work → error view shows recovery options.

---

### 3.3 RetirementView — Use Real API — P0

**Goal:** Delete client-side math, call `/api/retirement/simulate`.

- [ ] 3.3.1 **P0** — In `RetirementView.tsx`, add `useEffect` that calls `POST /api/retirement/simulate` on slider change (debounced 500ms)
- [ ] 3.3.2 **P0** — Replace local `computeFutureExpense`, `computeCorpus`, `computeSIP` with API response
- [ ] 3.3.3 **P0** — Delete the local math functions (lines 14-25)
- [ ] 3.3.4 **P0** — Add loading state while API computes
- [ ] 3.3.5 **P0** — Add error state if API returns 400 (invalid inputs)
- [ ] 3.3.6 **P0** — Verify numbers match between API and view
- [ ] 3.3.7 **P1** — Add "Save as Goal" button — calls `POST /api/goals` with computed corpus as target

**Definition of done:** Move any slider → API computes → numbers update. No client-side math.

---

### 3.4 Dead Button Audit — P0

**Goal:** Wire every button that currently does nothing.

- [ ] 3.4.1 **P0** — `EstateView.tsx` "Review Assets" button — add onClick to navigate to portfolio
- [ ] 3.4.2 **P0** — `EstateView.tsx` "Upload Document" button (Wills tab) — trigger file input
- [ ] 3.4.3 **P0** — `EstateView.tsx` "View" button on wills — download file
- [ ] 3.4.4 **P0** — `LiabilitiesView.tsx` "Prepayment Options" — navigate to a prepayment simulator (or add tooltip "Coming soon")
- [ ] 3.4.5 **P0** — `LiabilitiesView.tsx` "Simulate Prepayment" — call `/api/liabilities/prepayment-simulate` (create endpoint)
- [ ] 3.4.6 **P0** — `CashflowView.tsx` "Add Subscription" tile — open subscription form
- [ ] 3.4.7 **P0** — `CashflowView.tsx` subscription delete button — `DELETE /api/subscriptions/[id]`
- [ ] 3.4.8 **P0** — `TaxView.tsx` "Upload Rent Receipt" — navigate to documents with type pre-selected
- [ ] 3.4.9 **P0** — `LoginScreen.tsx` "Forgot?" link — show "Contact your administrator" toast
- [ ] 3.4.10 **P1** — `PortfolioView.tsx` "Performance" tab — implement or remove

**Definition of done:** Click every button in the app — every one either does something or shows "Coming soon" tooltip.

---

### 3.5 Consistent Error Handling — P1

**Goal:** Every API route returns the same error shape. Every view handles errors the same way.

- [ ] 3.5.1 **P1** — Standardize all API error responses to `{ detail: string }` — no `error` field, no `errors` array
- [ ] 3.5.2 **P1** — Remove `error: e?.message` from oracle insight route (already done in audit, verify)
- [ ] 3.5.3 **P1** — Create `src/lib/api-error.ts` — `ApiError` class with `detail` and `status`
- [ ] 3.5.4 **P1** — Create `src/lib/api-client.ts` — `apiFetch` wrapper that auto-attaches token, handles 401 (redirect to login), parses errors
- [ ] 3.5.5 **P1** — Refactor all views to use `apiFetch` instead of raw `fetch`
- [ ] 3.5.6 **P1** — Add error toast on every failed API call — use the existing `useToast` hook
- [ ] 3.5.7 **P1** — Add 429 rate-limit handling — show "Rate limited, try again in X minutes"

**Definition of done:** Every API error shows a toast. Every 401 redirects to login. No silent failures.

---

### 3.6 Code Formatting & Linting — P1

**Goal:** Consistent code style, enforced on commit.

- [ ] 3.6.1 **P1** — Add Prettier: `.prettierrc` — 2 spaces, single quotes, trailing comma, 100 char width
- [ ] 3.6.2 **P1** — Run `bunx prettier --write .` to format everything
- [ ] 3.6.3 **P1** — Add `eslint-plugin-unused-imports`
- [ ] 3.6.4 **P1** — Add `eslint-plugin-import` for import order enforcement
- [ ] 3.6.5 **P1** — Configure import order: react → next → third-party → @/ → relative
- [ ] 3.6.6 **P1** — Add `husky` pre-commit hook
- [ ] 3.6.7 **P1** — Add `lint-staged` config — lint + format staged files only
- [ ] 3.6.8 **P1** — Add `commitlint` with conventional commits
- [ ] 3.6.9 **P1** — Document commit format in `CONTRIBUTING.md`
- [ ] 3.6.10 **P1** — Add `eslint-plugin-jsx-a11y` for accessibility linting
- [ ] 3.6.11 **P1** — Add `eslint-plugin-security` for security linting

**Definition of done:** `git commit` → husky runs lint+format → fails if issues. All commits use conventional format.

---

## 4. Security Hardening

### 4.1 Input Validation on All Routes — P0

**Goal:** Every POST/PUT/DELETE route has Zod validation.

- [ ] 4.1.1 **P0** — Audit all POST/PUT/DELETE routes — list which ones have Zod and which don't
- [ ] 4.1.2 **P0** — `/api/auth/login` — add Zod: `{ email: z.string().email(), password: z.string().min(8) }`
- [ ] 4.1.3 **P0** — `/api/auth/register` — add Zod: `{ name: z.string().min(1), email: z.string().email(), password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/) }`
- [ ] 4.1.4 **P0** — `/api/documents` POST — validate `document_type` is in ALLOWED_TYPES enum
- [ ] 4.1.5 **P0** — `/api/extraction/[id]/fields/[field_id]/verify` — add Zod: `{ value: z.string().max(1000).optional() }`
- [ ] 4.1.6 **P0** — `/api/consent` POST — add Zod: `{ consent_type: z.string(), consent_text: z.string() }`
- [ ] 4.1.7 **P0** — `/api/assistant/ask` — add Zod: `{ question: z.string().min(1).max(2000) }`
- [ ] 4.1.8 **P0** — `/api/goals` POST — add Zod: `{ goal_name, target_amount, monthly_contribution, target_date, expected_return_rate }`
- [ ] 4.1.9 **P0** — `/api/goals/[id]` DELETE — verify ID is a valid CUID
- [ ] 4.1.10 **P0** — Create `src/lib/schemas/` directory — one Zod schema file per domain
- [ ] 4.1.11 **P1** — Add rate limiting to ALL POST routes (not just auth + assistant)
- [ ] 4.1.12 **P1** — Add `validateOrigin(req)` to all mutating routes (CSRF protection)

**Definition of done:** No POST/PUT/DELETE route accepts unvalidated input.

---

### 4.2 PAN/Account Number Masking — P1

**Goal:** Consistently mask sensitive fields everywhere they appear.

- [ ] 4.2.1 **P1** — Create `src/lib/mask.ts` — `maskSensitive(fieldName, value)` function
- [ ] 4.2.2 **P1** — Mask PAN: `XXXXX1234X` → `XXXXXX234X` (show last 4)
- [ ] 4.2.3 **P1** — Mask account numbers: `123456789012` → `XXXXXXXX9012`
- [ ] 4.2.4 **P1** — Use exact-match list: `["employee_pan", "pan", "pan_number", "account_number", "bank_account"]`
- [ ] 4.2.5 **P1** — Don't mask `account_holder_name` (it's a name, not a number)
- [ ] 4.2.6 **P1** — Apply masking in a single serializer used by ALL extraction routes
- [ ] 4.2.7 **P1** — Consider encrypting PAN at rest using AES-256-GCM
- [ ] 4.2.8 **P2** — Add "Reveal" button for verified users (with audit log)

**Definition of done:** PAN and account numbers are masked in every API response.

---

### 4.3 Rate Limiter Memory Leak Fix — P1

**Goal:** Prevent unbounded Map growth, add periodic cleanup.

- [ ] 4.3.1 **P1** — In `src/lib/security.ts`, add `setInterval` cleanup: every 60s, delete expired entries from `RATE_LIMITS` Map
- [ ] 4.3.2 **P1** — Add max Map size (10,000 entries) — evict oldest when exceeded
- [ ] 4.3.3 **P1** — Log when Map exceeds 1,000 entries (potential abuse)
- [ ] 4.3.4 **P2** — Switch to `@upstash/ratelimit` for Redis-backed rate limiting
- [ ] 4.3.5 **P2** — Configure `@upstash/redis` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Definition of done:** RATE_LIMITS Map never exceeds 10,000 entries. Expired entries cleaned up every 60s.

---

### 4.4 File Path Validation — P0

**Goal:** Prevent path traversal attacks on document download/delete.

- [ ] 4.4.1 **P0** — In `DELETE /api/documents/[id]`, validate `d.filePath.startsWith("uploads/")` before `path.join`
- [ ] 4.4.2 **P0** — In `GET /api/documents/[id]/download`, validate `doc.filePath.startsWith("uploads/")`
- [ ] 4.4.3 **P0** — In `DELETE /api/users/me` (account delete), validate all file paths before deletion
- [ ] 4.4.4 **P0** — Add `path.resolve()` check: verify resolved path is within `uploads/` directory
- [ ] 4.4.5 **P0** — Reject any path containing `..` or starting with `/`

**Definition of done:** No path traversal possible via document or account endpoints.

---

## 5. Testing & CI/CD

### 5.1 Vitest Unit Tests — P0

**Goal:** Test the engines (pure functions, easy wins).

- [ ] 5.1.1 **P0** — `bun add -d vitest @vitest/coverage-v8 @vitest/ui`
- [ ] 5.1.2 **P0** — Create `vitest.config.ts` with path aliases
- [ ] 5.1.3 **P0** — Add `test` script: `vitest run` + `test:watch`: `vitest` + `test:coverage`: `vitest run --coverage`
- [ ] 5.1.4 **P0** — Create `src/lib/__tests__/tax-engine.test.ts`
- [ ] 5.1.5 **P0** — Test: `computeTaxSummary` for income = ₹0 → tax = ₹0
- [ ] 5.1.6 **P0** — Test: income = ₹3L (below basic exemption) → tax = ₹0
- [ ] 5.1.7 **P0** — Test: income = ₹5L old regime → tax = ₹12,500 (5% of 2.5L)
- [ ] 5.1.8 **P0** — Test: income = ₹5L new regime → tax = ₹0 (87A rebate)
- [ ] 5.1.9 **P0** — Test: income = ₹7L new regime → tax = ₹0 (87A rebate at threshold)
- [ ] 5.1.10 **P0** — Test: income = ₹7,01,000 new regime → tax > ₹0 (just above 87A threshold)
- [ ] 5.1.11 **P0** — Test: income = ₹10L new regime → tax = ₹40,000 (5% of 4L)
- [ ] 5.1.12 **P0** — Test: income = ₹15L new regime → tax = ₹1,05,000
- [ ] 5.1.13 **P0** — Test: regime comparison recommends the cheaper one
- [ ] 5.1.14 **P0** — Test: missing documents detected correctly
- [ ] 5.1.15 **P0** — Create `src/lib/__tests__/bank-statement.test.ts`
- [ ] 5.1.16 **P0** — Test: `detectBankFormat` for HDFC headers
- [ ] 5.1.17 **P0** — Test: `detectBankFormat` for ICICI headers
- [ ] 5.1.18 **P0** — Test: `detectBankFormat` for unknown headers
- [ ] 5.1.19 **P0** — Test: `normalizeDate` for DD/MM/YYYY, DD-MM-YYYY, Excel serial, ISO
- [ ] 5.1.20 **P0** — Test: `normalizeAmount` for "1,234.56", "₹1,234", "(1,234)", "1234 DR"
- [ ] 5.1.21 **P0** — Test: `categorizeTransaction` for "SWIGGY" → Food, "AMAZON" → Shopping
- [ ] 5.1.22 **P0** — Test: full pipeline with sample HDFC CSV (the one in scripts/)
- [ ] 5.1.23 **P0** — Create `src/lib/__tests__/goal-engine.test.ts`
- [ ] 5.1.24 **P0** — Test: `projectGoal` with 0 current → correct months
- [ ] 5.1.25 **P0** — Test: `projectGoal` with current > target → 0 months
- [ ] 5.1.26 **P0** — Test: `projectGoal` with monthly = 0 → null (never achievable)
- [ ] 5.1.27 **P0** — Test: `computeShortfall` returns correct amount
- [ ] 5.1.28 **P0** — Create `src/lib/__tests__/auth.test.ts`
- [ ] 5.1.29 **P0** — Test: `hashPassword` + `verifyPassword` round-trip
- [ ] 5.1.30 **P0** — Test: `createToken` returns valid JWT
- [ ] 5.1.31 **P0** — Test: `verifyToken` accepts valid, rejects expired, rejects tampered
- [ ] 5.1.32 **P0** — Create `src/lib/__tests__/format.test.ts`
- [ ] 5.1.33 **P0** — Test: `formatINR(123456)` → "₹1,23,456"
- [ ] 5.1.34 **P0** — Test: `formatINR(0)` → "₹0"
- [ ] 5.1.35 **P0** — Test: `formatPercent(22.5)` → "22.5%"
- [ ] 5.1.36 **P0** — Target: 80% coverage on `src/lib/`
- [ ] 5.1.37 **P1** — Add coverage gate in CI: fail if < 70%
- [ ] 5.1.38 **P1** — Add coverage badge to README
- [ ] 5.1.39 **P1** — Set up Vitest UI for dev: `vitest --ui`

**Definition of done:** `bun run test` passes 35+ tests. Coverage ≥80% on `src/lib/`.

---

### 5.2 Playwright E2E Tests — P1

**Goal:** Cover critical user flows.

- [ ] 5.2.1 **P1** — `bun add -d @playwright/test`
- [ ] 5.2.2 **P1** — `bunx playwright install --with-deps chromium`
- [ ] 5.2.3 **P1** — Create `playwright.config.ts` — base URL `http://localhost:3000`
- [ ] 5.2.4 **P1** — Create `e2e/auth.spec.ts` — login with valid/invalid creds, logout
- [ ] 5.2.5 **P1** — Create `e2e/documents.spec.ts` — upload, verify fields, delete
- [ ] 5.2.6 **P1** — Create `e2e/tax.spec.ts` — tax summary loads, regime comparison displays
- [ ] 5.2.7 **P1** — Create `e2e/navigation.spec.ts` — each nav item navigates correctly, Cmd+K works
- [ ] 5.2.8 **P1** — Create `e2e/goals.spec.ts` — create goal, delete goal
- [ ] 5.2.9 **P1** — Create `e2e/assistant.spec.ts` — ask question, get response
- [ ] 5.2.10 **P1** — Create `e2e/reports.spec.ts` — generate PDF, verify download
- [ ] 5.2.11 **P1** — Add HTML report generation, screenshots + video on failure
- [ ] 5.2.12 **P1** — Run E2E in CI on every PR

**Definition of done:** `bun run e2e` runs 15+ tests, all pass.

---

### 5.3 CI/CD Pipeline — P1

**Goal:** Automated quality gate on every push.

- [ ] 5.3.1 **P1** — Create `.github/workflows/ci.yml`
- [ ] 5.3.2 **P1** — Job 1: `bun install` → `bunx tsc --noEmit` (typecheck)
- [ ] 5.3.3 **P1** — Job 2: `bun run lint` (ESLint)
- [ ] 5.3.4 **P1** — Job 3: `bun run test` (Vitest unit tests)
- [ ] 5.3.5 **P1** — Job 4: `bun run build` (production build)
- [ ] 5.3.6 **P1** — Cache `node_modules` + `.next/cache` between runs
- [ ] 5.3.7 **P1** — Upload coverage report as artifact
- [ ] 5.3.8 **P1** — Fail PR if any job fails
- [ ] 5.3.9 **P1** — Create `.github/workflows/e2e.yml` — Playwright on PR to main
- [ ] 5.3.10 **P1** — Add Dependabot config for security updates
- [ ] 5.3.11 **P2** — Add CodeQL analysis
- [ ] 5.3.12 **P2** — Add bundle size check: fail if first-load JS grows >10%

**Definition of done:** Open PR → GitHub Actions runs typecheck + lint + test + build → all must pass.

---

## 6. Scaling & Production Readiness

### 6.1 PostgreSQL Migration Path — P1

**Goal:** Document + enable seamless switch from SQLite to Postgres.

- [ ] 6.1.1 **P1** — Verify `prisma/schema.prisma` uses no SQLite-specific types
- [ ] 6.1.2 **P1** — Add `docker-compose.yml` with Postgres service for local dev
- [ ] 6.1.3 **P1** — Add `.env.example` showing both SQLite and Postgres `DATABASE_URL` options
- [ ] 6.1.4 **P1** — Test schema against Postgres: `DATABASE_URL="postgresql://..." bun run db:push`
- [ ] 6.1.5 **P1** — Fix any Postgres-incompatible bits
- [ ] 6.1.6 **P1** — Create `scripts/migrate-sqlite-to-postgres.ts` — reads from SQLite, writes to Postgres
- [ ] 6.1.7 **P1** — Document migration guide in `docs/migration-sqlite-to-postgres.md`
- [ ] 6.1.8 **P2** — Add connection pooling config (PgBouncer)
- [ ] 6.1.9 **P2** — Add read replica config (`DATABASE_REPLICA_URL`)

**Definition of done:** Set `DATABASE_URL` to Postgres → `db:push` → app works identically.

---

### 6.2 File Storage Abstraction — P1

**Goal:** Interface with Local + S3 implementations.

- [ ] 6.2.1 **P1** — Create `src/lib/storage/file-store.ts` interface: `save`, `read`, `delete`, `getSignedUrl`
- [ ] 6.2.2 **P1** — Create `src/lib/storage/local-store.ts` — implements using `fs`
- [ ] 6.2.3 **P1** — Create `src/lib/storage/s3-store.ts` — implements using `@aws-sdk/client-s3`
- [ ] 6.2.4 **P1** — `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] 6.2.5 **P1** — Create `src/lib/storage/index.ts` — exports `getFileStore()` based on env
- [ ] 6.2.6 **P1** — Refactor document upload/download to use `getFileStore()`
- [ ] 6.2.7 **P1** — Add env vars: `STORAGE_DRIVER`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- [ ] 6.2.8 **P2** — Add Cloudflare R2 support (S3-compatible)
- [ ] 6.2.9 **P2** — Add migration script: copy local files to S3

**Definition of done:** Set `STORAGE_DRIVER=s3` → uploads go to S3.

---

### 6.3 Redis Rate Limiting — P2

**Goal:** Production-grade rate limiting that survives restarts.

- [ ] 6.3.1 **P2** — `bun add ioredis`
- [ ] 6.3.2 **P2** — Add `REDIS_URL` env var
- [ ] 6.3.3 **P2** — Create `src/lib/redis.ts` — singleton with fallback to in-memory
- [ ] 6.3.4 **P2** — Update `checkRateLimit` to use Redis `INCR` + `EXPIRE`
- [ ] 6.3.5 **P2** — Sliding window: sorted set with timestamp scores
- [ ] 6.3.6 **P2** — Fallback to in-memory if REDIS_URL not set

**Definition of done:** Restart server → rate limits still enforced.

---

### 6.4 JWT Refresh Tokens — P1

**Goal:** Short-lived access + long-lived refresh.

- [ ] 6.4.1 **P1** — Add `RefreshToken` model: `{ id, userId, tokenHash, expiresAt, revokedAt, userAgent, ip }`
- [ ] 6.4.2 **P1** — Update `createToken` to return both `access_token` (15min) and `refresh_token` (30 days)
- [ ] 6.4.3 **P1** — Create `POST /api/auth/refresh` — validates refresh token, issues new pair (rotation)
- [ ] 6.4.4 **P1** — Update `auth-context.tsx` to store both tokens
- [ ] 6.4.5 **P1** — Create `useRefreshToken` hook — auto-refresh when access token within 5min of expiry
- [ ] 6.4.6 **P1** — Update `apiFetch` to handle 401: try refresh once, if fails → logout
- [ ] 6.4.7 **P1** — On logout: revoke both tokens
- [ ] 6.4.8 **P1** — On password reset: revoke all refresh tokens
- [ ] 6.4.9 **P2** — Show active sessions in Settings (userAgent, ip, lastUsed)
- [ ] 6.4.10 **P2** — "Logout all devices" — revokes all refresh tokens

**Definition of done:** Login → access token expires in 15min → app auto-refreshes → user stays logged in for 30 days.

---

### 6.5 Health Check Endpoints — P0

**Goal:** Kubernetes-friendly health probes.

- [ ] 6.5.1 **P0** — Create `GET /api/health` — returns `{ status: "ok", timestamp, uptime, version }`
- [ ] 6.5.2 **P0** — Create `GET /api/ready` — checks DB connection, returns 200 or 503
- [ ] 6.5.3 **P0** — DB ping: `await prisma.$queryRaw\`SELECT 1\``
- [ ] 6.5.4 **P0** — Return individual checks: `{ db: "ok", storage: "ok" }`
- [ ] 6.5.5 **P1** — Add `/api/metrics` — Prometheus format (request count, response times)

**Definition of done:** `curl /api/health` returns 200 always; `curl /api/ready` returns 503 if DB is down.

---

### 6.6 Docker Containerization — P1

**Goal:** One-command deploy.

- [ ] 6.6.1 **P1** — Create `Dockerfile` — multi-stage: builder + runner
- [ ] 6.6.2 **P1** — Use `node:20-alpine` base
- [ ] 6.6.3 **P1** — Use Next.js standalone output
- [ ] 6.6.4 **P1** — Create `.dockerignore` — exclude `node_modules`, `.next`, `storage`, `*.log`
- [ ] 6.6.5 **P1** — Create `docker-compose.yml` — web + postgres + redis
- [ ] 6.6.6 **P1** — Add healthcheck using `/api/health`
- [ ] 6.6.7 **P1** — Test: `docker-compose up` → app works end-to-end

**Definition of done:** `docker-compose up` starts full stack.

---

## 7. UX & Feature Enhancements

### 7.1 Confirmation Dialogs — P0

**Goal:** Confirm destructive actions.

- [ ] 7.1.1 **P0** — Create `src/components/ConfirmDialog.tsx` — `{ open, title, description, confirmLabel, variant, onConfirm, onCancel }`
- [ ] 7.1.2 **P0** — Render in portal with backdrop blur
- [ ] 7.1.3 **P0** — Esc cancels, Enter confirms
- [ ] 7.1.4 **P0** — Add focus trap
- [ ] 7.1.5 **P0** — Wrap document delete in confirm dialog
- [ ] 7.1.6 **P0** — Wrap goal delete in confirm dialog
- [ ] 7.1.7 **P0** — Wrap consent revoke in confirm dialog
- [ ] 7.1.8 **P0** — Wrap logout in confirm dialog (optional — may be annoying)
- [ ] 7.1.9 **P0** — Wrap account delete in confirm dialog with typing confirmation
- [ ] 7.1.10 **P1** — Add "Don't ask again" checkbox for non-critical confirms
- [ ] 7.1.11 **P1** — Add undo toast: "Deleted. Undo" (5s window)

**Definition of done:** Click delete on any item → modal → Cancel/Delete → Esc cancels.

---

### 7.2 Toast System — P0

**Goal:** Consistent feedback on every action.

- [ ] 7.2.1 **P0** — Audit all `catch {}` blocks — add error toast to each
- [ ] 7.2.2 **P0** — Add success toast on: document upload, goal create, goal delete, nominee add, consent accept, report generate, field verify
- [ ] 7.2.3 **P0** — Position: bottom-right on desktop, top-center on mobile
- [ ] 7.2.4 **P0** — Auto-dismiss after 5s, pause on hover
- [ ] 7.2.5 **P0** — Variants: success (emerald), error (crimson), warning (saffron), info (carbon)
- [ ] 7.2.6 **P1** — Add swipe-to-dismiss on mobile

**Definition of done:** Every action shows a toast. No silent failures.

---

### 7.3 Empty States with Personality — P1

**Goal:** Illustrated empty states with CTAs for every empty list.

- [ ] 7.3.1 **P1** — Create `src/components/EmptyState.tsx` — `{ illustration, title, description, action }`
- [ ] 7.3.2 **P1** — Create 6 SVG illustrations: documents, goals, chat, reports, transactions, portfolio
- [ ] 7.3.3 **P1** — Documents empty: "Upload your first document" + button
- [ ] 7.3.4 **P1** — Goals empty: "Start with an Emergency Fund" + preset button
- [ ] 7.3.5 **P1** — Assistant empty: "Ask me anything" + suggestion chips
- [ ] 7.3.6 **P1** — Portfolio empty: "Add your first holding" + button
- [ ] 7.3.7 **P1** — Reports empty: "Generate your first report"
- [ ] 7.3.8 **P1** — Estate empty: "Add a nominee"
- [ ] 7.3.9 **P1** — Liabilities empty: "No active loans — you're debt free!"

**Definition of done:** Every empty list shows an illustrated state with a clear CTA.

---

### 7.4 Keyboard Shortcuts — P1

**Goal:** Power user navigation.

- [ ] 7.4.1 **P1** — Create `src/hooks/use-keyboard-shortcuts.ts`
- [ ] 7.4.2 **P1** — `g` then `d` → dashboard, `g` then `t` → tax, etc. (vim-style)
- [ ] 7.4.3 **P1** — `?` → shortcuts help modal
- [ ] 7.4.4 **P1** — `Esc` → close any modal/dialog
- [ ] 7.4.5 **P1** — `/` → focus command palette
- [ ] 7.4.6 **P1** — `n` on goals → new goal form
- [ ] 7.4.7 **P1** — `u` on documents → upload
- [ ] 7.4.8 **P1** — Disable shortcuts when typing in input/textarea
- [ ] 7.4.9 **P1** — Add footer hint: "Press ? for shortcuts"

**Definition of done:** Press `g` then `t` → navigates to Tax. Press `?` → modal shows all shortcuts.

---

### 7.5 Accessibility Audit — P0

**Goal:** WCAG AA compliance.

- [ ] 7.5.1 **P0** — Run Lighthouse accessibility audit on each page
- [ ] 7.5.2 **P0** — Fix `--color-stone: #71717a` on `--color-canvas: #f4f0ea` — check contrast ratio (should be ≥4.5:1)
- [ ] 7.5.3 **P0** — Darken `--color-stone` to `#52525b` if contrast fails
- [ ] 7.5.4 **P0** — Add `aria-label` to ALL icon-only buttons (delete, edit, back, send, hamburger, close)
- [ ] 7.5.5 **P0** — Add `role="dialog"` + `aria-modal="true"` to command palette
- [ ] 7.5.6 **P0** — Add `role="tab"` + `aria-selected` to all tab buttons
- [ ] 7.5.7 **P0** — Add `aria-live="polite"` to loading indicators
- [ ] 7.5.8 **P0** — Add `aria-live="assertive"` to error messages
- [ ] 7.5.9 **P0** — Verify keyboard navigation: tab through every page, logical order
- [ ] 7.5.10 **P0** — Add skip-to-content link at top of page
- [ ] 7.5.11 **P0** — Add `aria-current="page"` to active nav item
- [ ] 7.5.12 **P0** — Test with screen reader (VoiceOver/NVDA) — main flows
- [ ] 7.5.13 **P1** — Add `autocomplete="email"` / `autocomplete="current-password"` on login form
- [ ] 7.5.14 **P1** — Test with keyboard only — all features accessible

**Definition of done:** Lighthouse a11y score ≥ 95 on all pages.

---

## 8. Documentation & Developer Experience

### 8.1 README Rewrite — P0

**Goal:** Tell the story, document architecture.

- [ ] 8.1.1 **P0** — Rewrite `README.md` from scratch
- [ ] 8.1.2 **P0** — Hero section: project name, one-line description, badges
- [ ] 8.1.3 **P0** — "Why Artha AI?" — problem statement, solution
- [ ] 8.1.4 **P0** — Features list with screenshots
- [ ] 8.1.5 **P0** — "Quick Start" — prereqs, install, env, run
- [ ] 8.1.6 **P0** — Architecture diagram (Mermaid)
- [ ] 8.1.7 **P0** — Tech stack with rationale
- [ ] 8.1.8 **P0** — Security model: auth, rate limit, CSP, OWASP fixes
- [ ] 8.1.9 **P0** — Scaling path: SQLite→Postgres, local→S3, in-memory→Redis
- [ ] 8.1.10 **P0** — API documentation link
- [ ] 8.1.11 **P0** — Deployment guide (Docker)
- [ ] 8.1.12 **P0** — Testing guide
- [ ] 8.1.13 **P0** — Roadmap section
- [ ] 8.1.14 **P0** — License

**Definition of done:** Faculty opens README → in 5 minutes understands the project.

---

### 8.2 API Documentation — P1

**Goal:** Auto-generated API docs.

- [ ] 8.2.1 **P1** — Write `openapi.yaml` for all 25+ endpoints
- [ ] 8.2.2 **P1** — Document each: method, path, params, body schema, responses, auth required
- [ ] 8.2.3 **P1** — Add examples for each endpoint
- [ ] 8.2.4 **P1** — Add error response schemas
- [ ] 8.2.5 **P1** — Document auth scheme (Bearer JWT)
- [ ] 8.2.6 **P1** — Add `/api-doc` page serving Swagger UI or ReDoc
- [ ] 8.2.7 **P1** — Generate TypeScript types from OpenAPI using `openapi-typescript`

**Definition of done:** Visit `/api-doc` → see all endpoints with try-it-out.

---

### 8.3 i18n Foundation — P2

**Goal:** Structure for Hindi/Tamil addition.

- [ ] 8.3.1 **P2** — `bun add next-intl`
- [ ] 8.3.2 **P2** — Create `messages/en.json` with all UI strings
- [ ] 8.3.3 **P2** — Categorize: `nav`, `auth`, `dashboard`, `tax`, `finance`, etc.
- [ ] 8.3.4 **P2** — Replace all hardcoded strings with `t('key')` calls
- [ ] 8.3.5 **P2** — Create `messages/hi.json` (Hindi) — partial
- [ ] 8.3.6 **P2** — Add language switcher in settings
- [ ] 8.3.7 **P2** — Detect browser language on first visit

**Definition of done:** Switch to Hindi → all UI text in Hindi → switch back.

---

## Summary: Priority Sequencing

### Week 1 (Critical Fixes)
- §1.1 Font loading optimization
- §1.2 SWR caching (all views)
- §1.3 Ticker bar fix
- §1.5 Dashboard loading/error states
- §1.6 Document-verify navigation fix
- §2.1 Prisma N+1 audit
- §2.2 Database indexes
- §3.2 Error boundaries
- §3.3 RetirementView API wiring
- §3.4 Dead button audit
- §4.1 Input validation on all routes
- §4.4 File path validation
- §5.1 Vitest unit tests (engines)
- §7.1 Confirmation dialogs
- §7.2 Toast system
- §7.5 Accessibility audit
- §8.1 README rewrite
- §6.5 Health check endpoints

### Week 2 (Strategic Depth)
- §1.4 Code-split views
- §1.7 Bundle analysis & cleanup
- §2.3 Auth token caching
- §2.4 PDF generation streaming
- §2.5 Document processing async
- §3.1 Type safety audit
- §3.5 Consistent error handling
- §4.2 PAN/account masking
- §4.3 Rate limiter cleanup
- §5.2 Playwright E2E tests
- §5.3 CI/CD pipeline
- §6.1 PostgreSQL migration path
- §6.2 File storage abstraction
- §6.4 JWT refresh tokens
- §6.6 Docker containerization
- §7.3 Empty states
- §7.4 Keyboard shortcuts
- §8.2 API documentation

### Week 3 (Polish)
- §1.8 Image optimization
- §2.6 HTTP caching headers
- §3.6 Code formatting & linting
- §6.3 Redis rate limiting
- §7.5 Accessibility deep dive
- §8.3 i18n foundation

---

*End of plan.*

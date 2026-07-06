# FinSight AI — Deep Improvement Plan

**Document version:** 1.0
**Generated:** 2026-07-06
**Total actionable steps:** ~1,400 (across 8 dimensions)
**Convention:** Every step is sized to be completed in 5–30 minutes. Numbering is `Section.Subsection.Step`. Steps are tagged **P0** (faculty-critical), **P1** (strategic), **P2** (polish).

---

## How to use this plan

1. Pick a dimension (e.g. §3 Optimisation).
2. Pick a sub-section (e.g. 3.1 Code-splitting).
3. Execute steps in order — each builds on the previous.
4. Tick the `[ ]` boxes as you go.
5. After each sub-section, run the verification step (last item) before moving on.

A "definition of done" appears at the end of each sub-section.

---

## Table of Contents

1. [Functionality](#1-functionality) — bank parser, capital gains, multi-year, password reset, budgets, recurring detection, bulk upload
2. [Features](#2-features) — command palette, onboarding, achievements, share links, SIP calc, net worth, tax-suggestion engine, voice input, templates
3. [Optimisation](#3-optimisation) — code-splitting, SWR, tree-shaking, N+1 audit, bundle analyzer, lazy motion, PDF streaming, DB indexes
4. [Scaling](#4-scaling) — Postgres migration, file storage abstraction, Redis rate limit, jobs, JWT refresh, WebSocket, health probes
5. [UI & UX](#5-ui--ux) — empty states, skeletons, confirm dialogs, shortcuts, mobile nav, drag-reorder, toast portal, error boundaries, pull-refresh, FAB
6. [Narration & Storytelling](#6-narration--storytelling) — onboarding flow, progressive disclosure, journey timeline, contextual copy, digest, annual report
7. [Color Palette](#7-color-palette) — tonal scales, semantic system, data viz palette, dark mode, contrast, tertiary accent
8. [Etc — Engineering Rigor](#8-etc--engineering-rigor) — Vitest, Playwright, CI/CD, a11y, OpenAPI, README, Sentry, analytics, i18n, type safety

---

## 1. Functionality

### 1.1 Real Bank Statement Parser (CSV / XLSX) — P0

**Goal:** Replace keyword-based finance engine with real transaction-level parsing for HDFC, ICICI, SBI, Axis, Kotak bank exports.

- [ ] 1.1.1 **P0** — `bun add papaparse @types/papaparse xlsx`
- [ ] 1.1.2 **P0** — Verify `xlsx` is the community version (no license issue); if not, switch to `exceljs`
- [ ] 1.1.3 **P0** — Create `src/lib/parsers/bank-statement.ts`
- [ ] 1.1.4 **P0** — Define `Transaction` interface: `{ id, userId, documentId, date: Date, description: string, amount: number, type: 'debit'|'credit', balance?: number, category?: string, merchant?: string, sourceFormat: string }`
- [ ] 1.1.5 **P0** — Define `BankStatementResult` interface: `{ transactions: Transaction[], totals: { credits, debits, net }, sourceFormat: string, monthDetected?: string }`
- [ ] 1.1.6 **P0** — Write `detectBankFormat(headers: string[]): BankFormat` — pattern-matches header names
- [ ] 1.1.7 **P0** — Add HDFC format detector: headers contain `"Narration"`, `"Withdrawal"`, `"Deposit"`, `"Closing Balance"`
- [ ] 1.1.8 **P0** — Add ICICI format detector: `"Transaction Date"`, `"Description"`, `"Debit"`, `"Credit"`
- [ ] 1.1.9 **P0** — Add SBI format detector: `"Txn Date"`, `"Description"`, `"Debit"`, `"Credit"`, `"Balance"`
- [ ] 1.1.10 **P0** — Add Axis format detector
- [ ] 1.1.11 **P0** — Add Kotak format detector
- [ ] 1.1.12 **P0** — Add fallback: return `'unknown'` if no match
- [ ] 1.1.13 **P0** — Write `parseCSV(buffer: Buffer): Transaction[]` — uses `Papa.parse(buf.toString(), { header: true, dynamicTyping: true, skipEmptyLines: true })`
- [ ] 1.1.14 **P0** — Write `parseXLSX(buffer: Buffer): Transaction[]` — uses `xlsx.read(buffer)` then `sheet_to_json(firstSheet, { raw: true })`
- [ ] 1.1.15 **P0** — Write `normalizeDate(value: any): Date | null` — handles `DD/MM/YYYY`, `DD-MM-YYYY`, `DD/MM/YY`, ISO `YYYY-MM-DD`, Excel serial numbers (1900 epoch), and `DD-MMM-YYYY` (e.g. `05-Jan-2024`)
- [ ] 1.1.16 **P0** — Add unit test for `normalizeDate` covering all 6 formats + invalid input
- [ ] 1.1.17 **P0** — Write `normalizeAmount(value: any): number` — strips `₹`, commas, spaces; handles `"(1,234.56)"` as `-1234.56`; handles empty string as `0`; handles `"1,234.56 CR"` as positive, `"DR"` as negative
- [ ] 1.1.18 **P0** — Add unit test for `normalizeAmount` covering 8 edge cases
- [ ] 1.1.19 **P0** — Write `inferTransactionType(row: Record<string, any>, format: BankFormat): 'debit'|'credit'` — checks which amount column has a value
- [ ] 1.1.20 **P0** — Write `cleanDescription(desc: string): string` — removes trailing UPI refs (`...@oksbi`), trailing `Ref No 123456`, trailing dates, multiple spaces
- [ ] 1.1.21 **P0** — Write `extractMerchant(desc: string): string | null` — regex for UPI: `Paid to (.+?) on`; for card: first 3 words capitalized
- [ ] 1.1.22 **P0** — Write `categorizeTransaction(desc: string): string` — extends existing 13-category classifier with sub-keywords (e.g. `SWIGGY` → `Food`, `ZOMATO` → `Food`, `AMAZON` → `Shopping`, `BIGBASKET` → `Groceries`)
- [ ] 1.1.23 **P0** — Build master merchant → category mapping in `src/lib/parsers/merchant-map.ts` (at least 80 merchants)
- [ ] 1.1.24 **P0** — Write `parseBankStatement(buffer: Buffer, fileName: string): BankStatementResult` — orchestrates detection + parsing
- [ ] 1.1.25 **P0** — Handle multi-sheet XLSX (pick the sheet with most rows that look like transactions)
- [ ] 1.1.26 **P0** — Handle CSVs with leading metadata rows (HDFC has account info before the actual table) — skip rows until headers found
- [ ] 1.1.27 **P0** — Add `Prisma.schema` `Transaction` model: `id String @id @default(cuid())`, `userId String`, `documentId String`, `date DateTime`, `description String`, `amount Float`, `type String`, `balance Float?`, `category String?`, `merchant String?`, `sourceFormat String`, `createdAt DateTime @default(now())`, relations to User and Document with `onDelete: Cascade`
- [ ] 1.1.28 **P0** — Add composite index `@@index([userId, date])` and `@@index([userId, category, date])`
- [ ] 1.1.29 **P0** — Run `bun run db:migrate --name add_transactions`
- [ ] 1.1.30 **P0** — Update `src/app/api/documents/route.ts` POST handler — after `extractPdfFields`, check if file is CSV/XLSX, call `parseBankStatement`
- [ ] 1.1.31 **P0** — Use `prisma.transaction.createMany({ data, skipDuplicates: true })` for batch insert
- [ ] 1.1.32 **P0** — Update document `processing_status` to `'extracted'` after transaction parse
- [ ] 1.1.33 **P0** — Update `src/lib/finance-engine.ts` `computeFinanceSummary` — if `transactions` table has rows for this month, aggregate from there (more accurate than keyword counts)
- [ ] 1.1.34 **P0** — Add `getMonthlyTotals(userId, month): { totalDebits, totalCredits, byCategory }` helper
- [ ] 1.1.35 **P0** — Add `getTopMerchants(userId, month, limit=10)` helper
- [ ] 1.1.36 **P0** — Add `getDailyNetCashFlow(userId, month): { date, net }[]` helper
- [ ] 1.1.37 **P0** — Create `src/app/api/transactions/route.ts` — GET returns paginated transactions
- [ ] 1.1.38 **P0** — Support query params: `month`, `type`, `category`, `minAmount`, `maxAmount`, `search`, `page`, `pageSize`
- [ ] 1.1.39 **P0** — Add Zod validation for query params
- [ ] 1.1.40 **P0** — Add rate limit (60 req/min per user)
- [ ] 1.1.41 **P0** — Create `src/app/api/transactions/[id]/route.ts` — GET, PATCH (re-categorize), DELETE
- [ ] 1.1.42 **P0** — Create `src/app/api/transactions/export/route.ts` — GET returns CSV
- [ ] 1.1.43 **P0** — Add `src/views/transactions.tsx` — table view with filters
- [ ] 1.1.44 **P0** — Add it to nav as "Transactions" (between Finance and Goals)
- [ ] 1.1.45 **P0** — Add date range picker component
- [ ] 1.1.46 **P0** — Add category multi-select filter
- [ ] 1.1.47 **P0** — Add amount range inputs
- [ ] 1.1.48 **P0** — Add debounced search box
- [ ] 1.1.49 **P0** — Add CSV export button (calls export endpoint)
- [ ] 1.1.50 **P0** — Add inline "Recategorize" dropdown per row
- [ ] 1.1.51 **P1** — Add pagination controls (Prev/Next + page indicator)
- [ ] 1.1.52 **P1** — Add "Select all" + bulk recategorize
- [ ] 1.1.53 **P1** — Add monthly net cash flow line chart to finance view
- [ ] 1.1.54 **P1** — Add top merchants list (top 5) to finance view
- [ ] 1.1.55 **P1** — Add `merchants-view` page showing spend-by-merchant breakdown
- [ ] 1.1.56 **P1** — Download 3 real sample bank statements from public datasets (Kaggle has anonymized ones)
- [ ] 1.1.57 **P1** — Add sample to `scripts/sample-data/` for seeding
- [ ] 1.1.58 **P1** — Write seed script that uploads sample statement to test account on `bun run scripts/seed-accounts.ts`
- [ ] 1.1.59 **P1** — Add error boundary: if parse fails, mark document `processing_status='failed'` with `error_message`
- [ ] 1.1.60 **P1** — Add file size check (reject >10MB with 413)
- [ ] 1.1.61 **P1** — Add row count check (reject >10,000 rows with 400 + message to split file)
- [ ] 1.1.62 **P2** — Auto-detect duplicate uploads (hash of file content)
- [ ] 1.1.63 **P2** — Add Yes Bank, IDFC First, Federal Bank, IndusInd parsers
- [ ] 1.1.64 **P2** — Add PayPal/Stripe CSV parser for freelancers
- [ ] 1.1.65 **P2** — Document supported formats in `docs/bank-formats.md` with sample column screenshots

**Definition of done:** Upload a real HDFC CSV → see 50+ transactions in Transactions page → finance summary updates with accurate category breakdown → CSV export works.

---

### 1.2 Capital Gains Computation — P1

**Goal:** Compute LTCG/STCG for equity, debt, and property per Indian IT Act.

- [ ] 1.2.1 — Create `src/lib/capital-gains-engine.ts`
- [ ] 1.2.2 — Define `Asset` enum: `EQUITY_LISTED`, `EQUITY_UNLISTED`, `DEBT_MUTUAL_FUND`, `PROPERTY`, `GOLD`, `OTHER`
- [ ] 1.2.3 — Define `Trade` interface: `{ date, assetType, quantity, buyPrice, sellPrice, expenses }`
- [ ] 1.2.4 — Define `CapitalGain` interface: `{ trade, gainType: 'STCG'|'LTCG', gainAmount, indexedCost?: number }`
- [ ] 1.2.5 — Write `determineGainType(assetType, holdingPeriodMonths): 'STCG'|'LTCG'` — equity listed: 12mo threshold; debt/property: 24mo threshold (post Budget 2024 changes — verify current rule)
- [ ] 1.2.6 — Write `computeHoldingPeriod(buyDate, sellDate): number` (months)
- [ ] 1.2.7 — Write `computeIndexedCost(buyPrice, buyYear, sellYear): number` — uses CII table
- [ ] 1.2.8 — Add CII table 2000-01 to 2024-25 as const array in `src/lib/cii-table.ts`
- [ ] 1.2.9 — Write `computeCapitalGain(trade): CapitalGain`
- [ ] 1.2.10 — Write `computeCapitalGainsTax(gains, regime): number` — LTCG equity: 10% over ₹1.25L (post Budget 2024); STCG equity: 20% (post Budget 2024); debt LTCG: 12.5% (post Budget 2024); property LTCG: 12.5% with indexation (post Budget 2024)
- [ ] 1.2.11 — Add unit tests for each asset type × STCG/LTCG combo
- [ ] 1.2.12 — Update `prisma/schema.prisma` — add `Trade` model
- [ ] 1.2.13 — Run migration
- [ ] 1.2.14 — Create `src/app/api/capital-gains/route.ts` — GET returns computed gains summary, POST adds a trade
- [ ] 1.2.15 — Create `src/app/api/capital-gains/[id]/route.ts` — DELETE, PATCH
- [ ] 1.2.16 — Create `src/views/capital-gains.tsx` — form to add trades + table of computed gains
- [ ] 1.2.17 — Add to tax summary API response: `capital_gains: { stcg_total, ltcg_total, tax_liability }`
- [ ] 1.2.18 — Update tax.tsx view to show capital gains section
- [ ] 1.2.19 — Update PDF report to include capital gains table
- [ ] 1.2.20 — Document assumptions in `docs/capital-gains.md` (cite Budget 2024 changes)

**Definition of done:** Add 3 trades (equity, debt, property) → see correct STCG/LTCG split → tax liability appears in tax summary PDF.

---

### 1.3 Multi-Year Tax Comparison — P1

**Goal:** Let users compare FY 2022-23 vs 2023-24 vs 2024-25 tax scores, income, deductions.

- [ ] 1.3.1 — Update `TaxEstimation` model: ensure `financial_year` field is unique per user (already is)
- [ ] 1.3.2 — Add `getMultiYearSummary(userId): { year, totalIncome, totalTax, regimeUsed, score }[]` helper in `tax-engine.ts`
- [ ] 1.3.3 — Create `/api/tax/multi-year` route returning array of last 3 FYs
- [ ] 1.3.4 — Create `MultiYearComparison` component in `src/views/tax.tsx` — shows table + grouped bar chart
- [ ] 1.3.5 — Add year-over-year delta column (↑12%)
- [ ] 1.3.6 — Add "Insights" section: "Your income grew 18% but tax only grew 8% — well optimized"
- [ ] 1.3.7 — Add ability to switch primary FY (affects dashboard)
- [ ] 1.3.8 — Add multi-year trend line chart on dashboard (replaces mock sparkline)
- [ ] 1.3.9 — Add PDF report: "3-Year Tax Comparison"

**Definition of done:** After using app for 2+ FYs, see comparison table with deltas and trend chart.

---

### 1.4 Password Reset Flow — P0

**Goal:** Standard email-link password reset (dev mode: print link to console; prod: SMTP).

- [ ] 1.4.1 — Add `PasswordResetToken` model: `{ id, email, token, expiresAt, usedAt? }`
- [ ] 1.4.2 — Index on `token` (unique)
- [ ] 1.4.3 — Run migration
- [ ] 1.4.4 — Create `src/app/api/auth/password-reset/request/route.ts` — POST `{ email }` → generates token, saves with 1h expiry, returns `{ message: "If the email exists, a reset link has been sent" }` (generic to prevent enumeration)
- [ ] 1.4.5 — In dev mode, console.log the link
- [ ] 1.4.6 — Add rate limit: 3 requests per email per hour
- [ ] 1.4.7 — Create `src/app/api/auth/password-reset/confirm/route.ts` — POST `{ token, newPassword }` → validates token, updates password (bcrypt), marks token used
- [ ] 1.4.8 — Add Zod validation (password ≥ 8 chars + 1 letter + 1 digit)
- [ ] 1.4.9 — Add "Forgot password?" link on login screen
- [ ] 1.4.10 — Create `ForgotPassword` modal showing email input + success message
- [ ] 1.4.11 — Create `ResetPassword` page (mounted via state, not URL)
- [ ] 1.4.12 — Add password strength meter on reset form
- [ ] 1.4.13 — Add SMTP integration stub via `nodemailer` (env-driven)
- [ ] 1.4.14 — Configure SMTP env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- [ ] 1.4.15 — In prod mode, send real email with HTML template
- [ ] 1.4.16 — Email template: branded, plain-text fallback, single CTA button
- [ ] 1.4.17 — Invalidate all existing JWTs on password reset (mark all `RevokedToken` for user)
- [ ] 1.4.18 — Audit log entry on reset request and reset confirm
- [ ] 1.4.19 — E2E test: request → confirm → login with new password

**Definition of done:** Click "Forgot password" → enter email → receive link (console in dev) → set new password → login works with new password.

---

### 1.5 Budget Setting & Tracking — P1

**Goal:** Users set monthly category budgets; app shows variance vs actuals.

- [ ] 1.5.1 — Add `Budget` model: `{ id, userId, category, monthYear (YYYY-MM), amount }` — unique on `(userId, category, monthYear)`
- [ ] 1.5.2 — Run migration
- [ ] 1.5.3 — Create `/api/budgets` route — GET (current month), PUT (upsert), DELETE
- [ ] 1.5.4 — Create `/api/budgets/variance?month=YYYY-MM` — returns `[{ category, budgeted, actual, variance, variancePct }]`
- [ ] 1.5.5 — Create `src/views/budgets.tsx` — shows category cards with budget input + progress bar (actual vs budgeted)
- [ ] 1.5.6 — Color code: under budget = moss, over budget = clay, near budget (90-100%) = gold
- [ ] 1.5.7 — Add "Overall budget health" summary: % categories over budget
- [ ] 1.5.8 — Add "Suggested budget" button: uses last 3 months average × 1.05
- [ ] 1.5.9 — Add monthly budget report in PDF
- [ ] 1.5.10 — Add notification (toast on dashboard) when category crosses 80% of budget mid-month

**Definition of done:** Set Rent budget ₹15k → spend ₹14k on rent → see green progress bar with "₹1k under budget" → set Food budget ₹8k → spend ₹10k → see red "₹2k over" warning.

---

### 1.6 Recurring Transaction Detection — P1

**Goal:** Auto-detect subscriptions, rent, EMI; forecast next 3 months.

- [ ] 1.6.1 — Write `detectRecurring(transactions: Transaction[]): RecurringPattern[]` in `src/lib/recurring-detector.ts`
- [ ] 1.6.2 — Algorithm: group by `merchant` + similar `amount` (±5%) + at least 3 occurrences at roughly monthly intervals (±7 days)
- [ ] 1.6.3 — Define `RecurringPattern` interface: `{ merchant, amount, type: 'subscription'|'rent'|'emi'|'utility', confidence, lastDate, nextDate, frequency }`
- [ ] 1.6.4 — Add subscription merchant list (Netflix, Spotify, Prime, etc.) for higher confidence
- [ ] 1.6.5 — Create `/api/recurring` route
- [ ] 1.6.6 — Create `RecurringPanel` component on finance view showing subscriptions + total monthly outflow
- [ ] 1.6.7 — Add "Next 3 months forecast" chart (sum of recurring × 3)
- [ ] 1.6.8 — Add "Cancel subscription?" button — opens merchant website (link only, no actual cancel)
- [ ] 1.6.9 — Add to finance summary: `subscription_total` (already exists), but now sourced from real detection

**Definition of done:** After parsing 3+ months of statements, see "3 subscriptions detected: Netflix ₹649/mo, Spotify ₹119/mo, Gym ₹1500/mo" with cancel links and 3-month forecast.

---

### 1.7 Bulk Document Upload — P1

**Goal:** Drag 5 PDFs at once, process in parallel, show progress per file.

- [ ] 1.7.1 — Update `src/views/documents.tsx` drop handler to accept `e.dataTransfer.files` (multiple)
- [ ] 1.7.2 — Update file input to `multiple`
- [ ] 1.7.3 — Create `UploadQueue` component showing each file with its own progress bar + status (queued/uploading/extracting/done/failed)
- [ ] 1.7.4 — Upload sequentially (avoid overwhelming server) but show all in queue
- [ ] 1.7.5 — Add "Cancel" button per queued file
- [ ] 1.7.6 — Add "Retry" on failed files
- [ ] 1.7.7 — Add "Clear completed" button
- [ ] 1.7.8 — Show total progress: `3 of 5 done`
- [ ] 1.7.9 — After all complete, refresh document list
- [ ] 1.7.10 — Add success toast: "5 documents uploaded, 47 fields extracted"
- [ ] 1.7.11 — Backend: ensure `/api/documents` POST is safe for sequential calls (it already is)

**Definition of done:** Drag 3 PDFs onto dropzone → see 3 progress cards → all complete → 3 new rows in document list.

---

## 2. Features

### 2.1 Command Palette (Cmd+K) — P0

**Goal:** Quick search across documents, navigation, actions.

- [ ] 2.1.1 **P0** — `bun add cmdk` (Vercel's headless command palette)
- [ ] 2.1.2 **P0** — Create `src/components/command-palette.tsx`
- [ ] 2.1.3 **P0** — Register global keydown listener for `Cmd+K` / `Ctrl+K`
- [ ] 2.1.4 **P0** — Add `useCommandPalette` hook with `open`, `setOpen` state
- [ ] 2.1.5 **P0** — Render `Command.Dialog` with backdrop blur
- [ ] 2.1.6 **P0** — Style with forest+cream: dark forest modal, cream text, gold accent for highlights
- [ ] 2.1.7 **P0** — Add "Navigation" group: 8 nav items as `Command.Item`
- [ ] 2.1.8 **P0** — Add "Quick Actions" group: Upload Document, Generate Tax Report, Ask AI, Logout
- [ ] 2.1.9 **P0** — Add "Search Documents" group: fetches `/api/documents?search=query` on input
- [ ] 2.1.10 **P0** — Debounce search input (200ms)
- [ ] 2.1.11 **P0** — Show document type icon + name + date in results
- [ ] 2.1.12 **P0** — Enter on document result navigates to verify page
- [ ] 2.1.13 **P0** — Add "Search Transactions" group (if §1.1 done) — fetches `/api/transactions?search=query`
- [ ] 2.1.14 **P0** — Add keyboard nav: ↑↓ to move, Enter to select, Esc to close
- [ ] 2.1.15 **P0** — Add "Recently used" section at top (last 5 actions stored in localStorage)
- [ ] 2.1.16 **P0** — Add footer: `↑↓ to navigate  ↵ to select  esc to close`
- [ ] 2.1.17 **P0** — Add empty state: "No results found"
- [ ] 2.1.18 **P0** — Add `?` shortcut to open shortcuts help
- [ ] 2.1.19 **P0** — Add `g` then `d` (dashboard), `g` then `t` (tax), etc. — vim-style navigation
- [ ] 2.1.20 **P0** — Show palette hint button in sidebar footer: "⌘K to open palette"
- [ ] 2.1.21 **P1** — Add "Recent Reports" group
- [ ] 2.1.22 **P1** — Add "Jump to month" command for finance/tax views
- [ ] 2.1.23 **P1** — Add "Switch tax year" command
- [ ] 2.1.24 **P1** — Add fuzzy search (`bun add fuse.js`) for document/transaction search
- [ ] 2.1.25 **P1** — Add command grouping with section headers
- [ ] 2.1.26 **P1** — Add animations: fade-in backdrop, scale-up dialog, staggered results
- [ ] 2.1.27 **P1** — Persist recently used across sessions
- [ ] 2.1.28 **P2** — Add custom command registration API (other components can register commands)
- [ ] 2.1.29 **P2** — Add "Calculate" command — opens inline SIP/EMI calculator

**Definition of done:** Press Cmd+K anywhere → palette opens → type "tax" → see Tax nav + tax reports + tax-related documents → Enter navigates.

---

### 2.2 Onboarding Tour — P0

**Goal:** First-time users get a 4-step highlight tour.

- [ ] 2.2.1 **P0** — `bun add driver.js react` (lightweight tour library) OR `bun add react-joyride`
- [ ] 2.2.2 **P0** — Choose `driver.js` for smaller bundle (~7kb)
- [ ] 2.2.3 **P0** — Create `src/lib/onboarding.ts` — defines tour steps
- [ ] 2.2.4 **P0** — Step 1: highlight Upload button → "Start by uploading your salary slip or Form 16"
- [ ] 2.2.5 **P0** — Step 2: highlight Documents nav → "Your documents appear here"
- [ ] 2.2.6 **P0** — Step 3: highlight Tax nav → "See your tax readiness score once you upload docs"
- [ ] 2.2.7 **P0** — Step 4: highlight AI Assistant nav → "Ask anything about your money"
- [ ] 2.2.8 **P0** — Add "Skip tour" button on each step
- [ ] 2.2.9 **P0** — Add "Next" + "Back" buttons
- [ ] 2.2.10 **P0** — Persist completion in `localStorage.onboarding_complete`
- [ ] 2.2.11 **P0** — Auto-start on first login (no localStorage flag)
- [ ] 2.2.12 **P0** — Add "Replay tour" option in Settings
- [ ] 2.2.13 **P0** — Style popover: forest background, cream text, gold "Next" button
- [ ] 2.2.14 **P0** — Add progress dots: ●○○○
- [ ] 2.2.15 **P0** — Add highlight animation: pulsing border on target element
- [ ] 2.2.16 **P1** — Add contextual copy based on user role (admin vs user)
- [ ] 2.2.17 **P1** — Add analytics event: `onboarding_started`, `onboarding_step_X`, `onboarding_completed`, `onboarding_skipped`
- [ ] 2.2.18 **P1** — A/B test: auto-start vs "Take tour" button
- [ ] 2.2.19 **P2** — Add video embed on step 1 (15s loop of upload flow)

**Definition of done:** New user logs in → tour auto-starts → highlights Upload → highlights Documents nav → highlights Tax → highlights AI → completes → doesn't show again. Can replay from Settings.

---

### 2.3 Achievements & Streaks — P1

**Goal:** Gamification — badges, streaks, milestones.

- [ ] 2.3.1 — Add `Achievement` model: `{ id, userId, type, earnedAt, metadata? }`
- [ ] 2.3.2 — Define achievement types: `FIRST_DOCUMENT`, `FIRST_VERIFICATION`, `FIRST_GOAL`, `FIVE_DOCUMENTS`, `COMPLETE_PROFILE`, `SEVEN_DAY_STREAK`, `THIRTY_DAY_STREAK`, `TAX_SCORE_80`, `TAX_SCORE_100`, `SAVINGS_RATE_30`, `GOAL_COMPLETED`, `ALL_DOCS_VERIFIED`
- [ ] 2.3.3 — Create `src/lib/achievements.ts` — `checkAndAward(userId, type, context)` function
- [ ] 2.3.4 — Hook into: document upload, field verify, goal create, login (for streak), score compute
- [ ] 2.3.5 — Create `/api/achievements` route — GET returns earned + locked
- [ ] 2.3.6 — Create `AchievementToast` component — pops up when new achievement earned
- [ ] 2.3.7 — Toast animation: scale-in, confetti emoji, gold accent
- [ ] 2.3.8 — Create `AchievementsPanel` on dashboard — small bento card showing recent + total
- [ ] 2.3.9 — Add "View all" → settings/achievements page
- [ ] 2.3.10 — Show locked achievements with hint: "Upload 5 documents to unlock"
- [ ] 2.3.11 — Add streak counter on dashboard: "🔥 7 day streak"
- [ ] 2.3.12 — Streak logic: login on consecutive calendar days
- [ ] 2.3.13 — Add `UserStreak` model: `{ userId, currentStreak, longestStreak, lastActiveDate }`
- [ ] 2.3.14 — Update on every login: if lastActiveDate = yesterday, increment; if today, no-op; else reset to 1
- [ ] 2.3.15 — Show streak break warning: "Login tomorrow to keep your streak!"
- [ ] 2.3.16 — Add milestone animations: 7-day = small celebration, 30-day = bigger
- [ ] 2.3.17 — Add leaderboard (anonymized): "You're in top 10% for tax readiness"

**Definition of done:** Upload first doc → achievement toast "First Document! 🎉" → appears in dashboard achievements panel → 7 days of logins → "7 Day Streak 🔥".

---

### 2.4 Share Report via Signed Link — P1

**Goal:** Generate 24h-expiring signed URL for CA to view report without login.

- [ ] 2.4.1 — Add `SharedReport` model: `{ id, userId, reportType, token, expiresAt, viewedAt?, createdAt }`
- [ ] 2.4.2 — Index on `token` unique
- [ ] 2.4.3 — Create `/api/reports/share` POST — body `{ reportType }` → generates token, returns `/shared/{token}`
- [ ] 2.4.4 — Create `/shared/[token]/page.tsx` — public route, no auth
- [ ] 2.4.5 — On load: validate token, check expiry, fetch report data, render read-only HTML version
- [ ] 2.4.6 — Add "Share" button on each report card in reports.tsx
- [ ] 2.4.7 — Show modal with link + copy button + "Link expires in 24 hours"
- [ ] 2.4.8 — Track `viewedAt` on first view
- [ ] 2.4.9 — Show in original user's reports list: "Viewed 2 hours ago"
- [ ] 2.4.10 — Add "Revoke link" button
- [ ] 2.4.11 — Add "Generate new link" (invalidates old)
- [ ] 2.4.12 — Rate limit: 10 share generations per user per day
- [ ] 2.4.13 — Style shared report page: branded header, "Prepared for [User Name]", print-friendly
- [ ] 2.4.14 — Add PDF download button on shared page
- [ ] 2.4.15 — Add watermark with viewer IP + timestamp (deters forwarding)

**Definition of done:** Click "Share" on Tax Summary report → modal with link → copy → open in incognito → see report → CA can download PDF → link expires after 24h.

---

### 2.5 SIP & Retirement Calculator — P1

**Goal:** Indian-audience staple calculators.

- [ ] 2.5.1 — Create `src/lib/calculators.ts` with pure functions
- [ ] 2.5.2 — `computeSIP(monthlyInvestment, annualReturnRate, years): { invested, returns, total, yearByYear[] }`
- [ ] 2.5.3 — `computeLumpsum(principal, annualReturnRate, years): { total, returns, yearByYear[] }`
- [ ] 2.5.4 — `computeEMI(principal, annualRate, months): { emi, totalInterest, totalPayment, schedule[] }`
- [ ] 2.5.5 — `computeRetirementCorpus(currentAge, retireAge, lifeExpectancy, monthlyExpense, inflationRate, preRetReturn, postRetReturn): { corpusNeeded, monthlySIPNeeded, projection[] }`
- [ ] 2.5.6 — Add unit tests for each calculator
- [ ] 2.5.7 — Create `src/views/calculators.tsx` with 4 tabs: SIP, Lumpsum, EMI, Retirement
- [ ] 2.5.8 — Each tab: input form on left, results on right
- [ ] 2.5.9 — Add interactive line chart showing growth over time
- [ ] 2.5.10 — Add "Compare scenarios" — SIP at 12% vs 10% vs 8% overlay
- [ ] 2.5.11 — Add inflation-adjusted view toggle
- [ ] 2.5.12 — Add "Save as goal" button on SIP — creates goal in goals engine
- [ ] 2.5.13 — Add to nav as "Calculators"
- [ ] 2.5.14 — Add tooltips on each input with formula explanation
- [ ] 2.5.15 — Add "Why this number?" expandable sections

**Definition of done:** Open Calculators → SIP tab → enter ₹10k/mo for 20 years at 12% → see ₹99.9L total (₹24L invested, ₹75.9L returns) with year-by-year chart → "Save as goal" creates retirement goal.

---

### 2.6 Net Worth Tracker — P1

**Goal:** Track assets − liabilities over time.

- [ ] 2.6.1 — Add `Asset` model: `{ id, userId, name, type: 'cash'|'bank'|'investment'|'property'|'gold'|'vehicle'|'other', value, asOfDate }`
- [ ] 2.6.2 — Add `Liability` model: `{ id, userId, name, type: 'loan'|'credit_card'|'other', amount, asOfDate }`
- [ ] 2.6.3 — Add `NetWorthSnapshot` model: `{ id, userId, date, totalAssets, totalLiabilities, netWorth }`
- [ ] 2.6.4 — Run migration
- [ ] 2.6.5 — Create `/api/net-worth` routes for CRUD on assets/liabilities
- [ ] 2.6.6 — Create `/api/net-worth/snapshot` — POST triggers a snapshot for current month
- [ ] 2.6.7 — Create `/api/net-worth/history` — GET returns last 12 months of snapshots
- [ ] 2.6.8 — Create `src/views/net-worth.tsx`
- [ ] 2.6.9 — Top: big net worth number (assets green, liabilities red, net bold)
- [ ] 2.6.10 — Section: Assets table with add/edit/delete
- [ ] 2.6.11 — Section: Liabilities table
- [ ] 2.6.12 — Chart: 12-month net worth line chart
- [ ] 2.6.13 — Chart: asset allocation pie
- [ ] 2.6.14 — "Take snapshot" button — saves current state for this month
- [ ] 2.6.15 — Auto-snapshot on first login of each month
- [ ] 2.6.16 — Add net worth widget to dashboard

**Definition of done:** Add 3 assets (bank ₹2L, MF ₹5L, gold ₹1L) + 1 liability (car loan ₹3L) → see net worth ₹5L → take snapshot → next month update MF to ₹5.5L → see line chart trend up.

---

### 2.7 Tax Saving Suggestions Engine — P0

**Goal:** Instead of generic "improve savings", suggest specific actions.

- [ ] 2.7.1 **P0** — Create `src/lib/tax-suggestions.ts`
- [ ] 2.7.2 **P0** — Define `TaxSuggestion` interface: `{ id, title, description, section, maxDeduction, currentClaimed, potentialSaving, actionUrl, priority }`
- [ ] 2.7.3 **P0** — Build rule set: 80C (PPE, ELSS, PPF, EPF, life insurance — ₹1.5L), 80D (health insurance — ₹25k self, ₹50k parents), 80CCD(1B) (NPS — ₹50k), 80E (education loan interest), 80G (donations), 24(b) (home loan interest — ₹2L), 80EE/80EEA (first home buyer)
- [ ] 2.7.4 **P0** — For each section: check if user has claimed → if not claimed and eligible → generate suggestion
- [ ] 2.7.5 **P0** — Compute potential saving: `unclaimed_amount × user_tax_rate`
- [ ] 2.7.6 **P0** — Sort suggestions by `potentialSaving` desc
- [ ] 2.7.7 **P0** — Create `/api/tax/suggestions` route
- [ ] 2.7.8 **P0** — Create `TaxSuggestionsPanel` component on tax.tsx view
- [ ] 2.7.9 **P0** — Each suggestion as card: section badge, title, "Save ₹X" callout, "Learn more" link
- [ ] 2.7.10 **P0** — Add "Mark as done" button — hides suggestion
- [ ] 2.7.11 **P0** — Add "Not applicable" button — hides with reason stored
- [ ] 2.7.12 **P1** — Add "Apply to deductions" — pre-fills deduction record
- [ ] 2.7.13 **P1** — Add educational content per section (modal with rules, examples, links to government docs)
- [ ] 2.7.14 **P1** — Add "Savings if you claim all" total at top
- [ ] 2.7.15 **P2** — Add AI-powered personalized suggestions using LLM (grounded on user data)

**Definition of done:** User with no 80D claim → sees "Invest in health insurance → save ₹7,800/yr under 80D" with ₹25k × 31.2% tax rate calculation.

---

### 2.8 Voice Input for AI Assistant — P2

**Goal:** Use Web Speech API for voice queries.

- [ ] 2.8.1 — Check browser support: `if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)`
- [ ] 2.8.2 — Create `src/hooks/use-speech-recognition.ts` hook
- [ ] 2.8.3 — Hook returns `{ isListening, transcript, start, stop, supported }`
- [ ] 2.8.4 — Configure: `lang='en-IN'`, `continuous=false`, `interimResults=true`
- [ ] 2.8.5 — Add mic button next to send button in assistant.tsx
- [ ] 2.8.6 — While listening: animate mic with pulsing red dot
- [ ] 2.8.7 — Show interim transcript in input field as user speaks
- [ ] 2.8.8 — On final result: auto-send question
- [ ] 2.8.9 — If unsupported: hide mic button
- [ ] 2.8.10 — Add "Voice not supported in this browser" tooltip on hover if unsupported
- [ ] 2.8.11 — Add keyboard shortcut: `Ctrl+Space` to start/stop voice
- [ ] 2.8.12 — Add voice response via SpeechSynthesis API (text-to-speech) — opt-in toggle

**Definition of done:** Click mic → speak "What's my tax score?" → transcript appears → auto-sends → AI responds.

---

### 2.9 Document Templates Library — P2

**Goal:** Sample Form 16, rent receipt format, etc. so users know what to upload.

- [ ] 2.9.1 — Create `docs/templates/` directory
- [ ] 2.9.2 — Add `form16-sample.pdf` (synthetic, with fake data)
- [ ] 2.9.3 — Add `salary-slip-sample.pdf`
- [ ] 2.9.4 — Add `rent-receipt-template.pdf` (printable)
- [ ] 2.9.5 — Add `bank-statement-sample.csv`
- [ ] 2.9.6 — Create `src/views/templates.tsx` showing each template with download link
- [ ] 2.9.7 — Each template: preview image, description, "Download sample" + "What to upload instead" guidance
- [ ] 2.9.8 — Add "Try with this sample" button — uploads to user's account for demo
- [ ] 2.9.9 — Add to onboarding as "Not sure what to upload? See examples"

**Definition of done:** New user opens Templates → sees Form 16 example → downloads sample → tries upload → sees extraction working.

---

### 2.10 Notification Center — P1

**Goal:** In-app notifications for events (document processed, score changed, budget exceeded).

- [ ] 2.10.1 — Add `Notification` model: `{ id, userId, type, title, body, linkUrl?, readAt?, createdAt }`
- [ ] 2.10.2 — Index on `(userId, createdAt)` desc
- [ ] 2.10.3 — Create `src/lib/notifications.ts` — `send(userId, { type, title, body, linkUrl })`
- [ ] 2.10.4 — Hook into: document processed, score change >5pts, budget exceeded, goal projected to complete soon
- [ ] 2.10.5 — Create `/api/notifications` GET (paginated, unread first) + POST `/api/notifications/read` to mark all read
- [ ] 2.10.6 — Add bell icon in app-shell top bar
- [ ] 2.10.7 — Show unread count badge (animated pulse)
- [ ] 2.10.8 — Dropdown panel with list of notifications
- [ ] 2.10.9 — Each notification: icon, title, body, timestamp, click navigates to linkUrl
- [ ] 2.10.10 — "Mark all read" button
- [ ] 2.10.11 — Real-time via polling every 60s (or WebSocket if §4.5 done)
- [ ] 2.10.12 — Toast on new notification if panel closed

**Definition of done:** Upload document → 5 seconds later → bell badge shows "1" → click bell → "Salary Slip processed, 12 fields extracted" → click → navigates to verify page.

---

## 3. Optimisation

### 3.1 Code-Split Each View — P0

**Goal:** Cut first-load JS by ~40% by lazy-loading non-dashboard views.

- [ ] 3.1.1 **P0** — Open `src/app/page.tsx`
- [ ] 3.1.2 **P0** — Replace static imports of views with `next/dynamic`
- [ ] 3.1.3 **P0** — `const DashboardContent = dynamic(() => import("@/views/dashboard"), { ssr: false })` — wait, keep SSR for dashboard (it's first page)
- [ ] 3.1.4 **P0** — Actually: keep Dashboard static (first paint), dynamic-load the other 8 views
- [ ] 3.1.5 **P0** — `const TaxContent = dynamic(() => import("@/views/tax"))`
- [ ] 3.1.6 **P0** — `const FinanceContent = dynamic(() => import("@/views/finance"))`
- [ ] 3.1.7 **P0** — `const GoalsContent = dynamic(() => import("@/views/goals"))`
- [ ] 3.1.8 **P0** — `const AssistantContent = dynamic(() => import("@/views/assistant"))`
- [ ] 3.1.9 **P0** — `const ReportsContent = dynamic(() => import("@/views/reports"))`
- [ ] 3.1.10 **P0** — `const SettingsContent = dynamic(() => import("@/views/settings"))`
- [ ] 3.1.11 **P0** — `const DocumentsContent = dynamic(() => import("@/views/documents"))`
- [ ] 3.1.12 **P0** — `const DocumentVerifyContent = dynamic(() => import("@/views/document-verify"))`
- [ ] 3.1.13 **P0** — Add loading fallback: `<Loader2 className="animate-spin" />` centered
- [ ] 3.1.14 **P0** — Verify build: `bun run build` — check `Route (app)` size table
- [ ] 3.1.15 **P0** — Compare before/after first-load JS in build output
- [ ] 3.1.16 **P0** — Verify dashboard still renders fast (it's eager)
- [ ] 3.1.17 **P1** — Add `prefetch` on nav hover (mouse over Tax nav → prefetch tax chunk)
- [ ] 3.1.18 **P1** — Add `prefetch` on nav focus (keyboard accessibility)
- [ ] 3.1.19 **P2** — Add route-based code splitting for assistant (heavy due to LLM history)

**Definition of done:** `bun run build` shows separate chunks per view. First load to dashboard only ships dashboard + shared. Navigating to Tax fetches tax chunk.

---

### 3.2 API Response Caching with SWR — P0

**Goal:** Stop re-fetching on every nav click.

- [ ] 3.2.1 **P0** — `bun add swr`
- [ ] 3.2.2 **P0** — Create `src/hooks/use-tax-summary.ts` — `useSWR(['tax-summary', fy], () => tax.summary())`
- [ ] 3.2.3 **P0** — Create `src/hooks/use-finance-summary.ts` — `useSWR(['finance-summary', ef], () => finance.summary(ef))`
- [ ] 3.2.4 **P0** — Create `src/hooks/use-goals.ts`, `use-documents.ts`, etc.
- [ ] 3.2.5 **P0** — Configure SWR globals: `dedupingInterval: 5000`, `revalidateOnFocus: false`, `revalidateOnReconnect: true`
- [ ] 3.2.6 **P0** — Set `revalidateOnMount: true` for first load
- [ ] 3.2.7 **P0** — Update dashboard.tsx to use `useTaxSummary()` instead of manual `useEffect + fetch`
- [ ] 3.2.8 **P0** — Update tax.tsx, finance.tsx, goals.tsx, documents.tsx, settings.tsx, reports.tsx similarly
- [ ] 3.2.9 **P0** — Add `mutate` after mutations: after upload document, `mutate(['documents'])` and `mutate(['tax-summary'])`
- [ ] 3.2.10 **P0** — Add `mutate` after goal create/delete
- [ ] 3.2.11 **P0** — Add `mutate` after field verify
- [ ] 3.2.12 **P0** — Add optimistic updates: on verify, immediately update cache, rollback on error
- [ ] 3.2.13 **P0** — Set `keepPreviousData: true` when changing month filter (avoids flash of empty)
- [ ] 3.2.14 **P1** — Add background revalidation every 5 min for dashboard
- [ ] 3.2.15 **P1** — Add error retry: 3 retries with exponential backoff
- [ ] 3.2.16 **P1** — Add cache persistence to localStorage for offline-first feel
- [ ] 3.2.17 **P2** — Add SWR DevTools (swr-devtools package)

**Definition of done:** Navigate dashboard → tax → dashboard → tax → second dashboard visit is instant (cache hit, no spinner).

---

### 3.3 Tree-Shake Lucide-React — P0

**Goal:** Verify icon imports aren't pulling entire library.

- [ ] 3.3.1 **P0** — Audit current imports: `grep -r "from 'lucide-react'" src/ | wc -l`
- [ ] 3.3.2 **P0** — Verify all imports use named imports: `import { Loader2 } from "lucide-react"` (already correct)
- [ ] 3.3.3 **P0** — Run `bun run build` — check lucide-react in bundle
- [ ] 3.3.4 **P0** — If lucide > 50kb in bundle, switch to per-icon: `import Loader2 from "lucide-react/dist/esm/icons/loader-2"`
- [ ] 3.3.5 **P0** — Or use `lucide-react/icons/...` path (depends on version)
- [ ] 3.3.6 **P0** — Verify tree-shaking works: only used icons in bundle
- [ ] 3.3.7 **P1** — Replace duplicate icon usage with shared `Icon` component
- [ ] 3.3.8 **P1** — Lazy-load rarely-used icons (admin-only icons) with dynamic import

**Definition of done:** Bundle analyzer shows only ~30 icons used, each ~1kb, total < 5kb.

---

### 3.4 Prisma N+1 Query Audit — P0

**Goal:** Find and fix N+1 queries.

- [ ] 3.4.1 **P0** — Add Prisma query logging: `LOG_QUERIES=true` env var → `prisma.$on('query', e => console.log(e.query, e.duration))`
- [ ] 3.4.2 **P0** — Hit each API endpoint and count queries
- [ ] 3.4.3 **P0** — Audit `/api/tax/summary` — currently fires: user lookup, documents, extracted fields per document (N+1!), incomes, expenses, deductions
- [ ] 3.4.4 **P0** — Fix: use `include: { extractedFields: true }` on documents query
- [ ] 3.4.5 **P0** — Verify single query returns all needed data
- [ ] 3.4.6 **P0** — Audit `/api/finance/summary` similarly
- [ ] 3.4.7 **P0** — Audit `/api/goals` — currently fetches goals, then projection per goal (N+1!)
- [ ] 3.4.8 **P0** — Fix: batch projections in single loop after goals fetch
- [ ] 3.4.9 **P0** — Audit `/api/documents` — should already be one query
- [ ] 3.4.10 **P0** — Audit `/api/extraction/[id]/fields` — single query
- [ ] 3.4.11 **P0** — Audit `/api/settings` — consents + audit logs in parallel via `Promise.all`
- [ ] 3.4.12 **P0** — Add Prisma `select` to limit fields returned (don't fetch unused fields)
- [ ] 3.4.13 **P0** — For list endpoints, add pagination to avoid fetching all rows
- [ ] 3.4.14 **P1** — Add query count header: `X-Query-Count: 3` for debugging
- [ ] 3.4.15 **P1** — Add p99 query duration metric
- [ ] 3.4.16 **P2** — Add Prisma Accelerate or Data Proxy for edge runtime

**Definition of done:** With query logging on, hitting `/api/tax/summary` shows ≤ 5 queries (not N+1 based on document count).

---

### 3.5 Bundle Analyzer — P1

**Goal:** See what's heavy in the bundle.

- [ ] 3.5.1 — `bun add -d @next/bundle-analyzer`
- [ ] 3.5.2 — Update `next.config.ts` to wrap with `withBundleAnalyzer`
- [ ] 3.5.3 — Set `ANALYZE=true` env var
- [ ] 3.5.4 — Run `bun run build`
- [ ] 3.5.5 — Open `.next/analyze/server.html` and `client.html`
- [ ] 3.5.6 — Identify top 10 heaviest modules
- [ ] 3.5.7 — For each heavy module: can it be replaced? Lazy-loaded? Tree-shaken?
- [ ] 3.5.8 — Common culprits: `pdfkit` (only used server-side, ensure not client bundle), `recharts` (already replaced with custom SVG, verify removed), `motion` (large but valuable)
- [ ] 3.5.9 — Verify `pdfkit` and `pdf-parse` are NOT in client bundle (only via API routes)
- [ ] 3.5.10 — Verify `z-ai-web-dev-sdk` is NOT in client bundle
- [ ] 3.5.11 — Document findings in `docs/bundle-audit.md`
- [ ] 3.5.12 — Add CI check: build fails if first-load JS > 200kb

**Definition of done:** Bundle analyzer shows clean separation: client bundle has only React + motion + UI components; pdfkit/pdf-parse/SDK only in server bundle.

---

### 3.6 Lazy-Load Motion Components — P1

**Goal:** Don't ship ProgressRing/Sparkline to login page.

- [ ] 3.6.1 — Convert `ProgressRing`, `Sparkline`, `GradientBars`, `LiquidProgress` to dynamic imports in views that use them
- [ ] 3.6.2 — Actually — these are tiny, may not be worth it. Profile first.
- [ ] 3.6.3 — If profile shows they're <5kb total, skip this section
- [ ] 3.6.4 — If >10kb, lazy-load on dashboard/finance only
- [ ] 3.6.5 — Verify login page doesn't include them

**Definition of done:** After profiling, login page bundle doesn't include chart primitives.

---

### 3.7 PDF Generation Streaming — P1

**Goal:** Move PDF generation off the request thread.

- [ ] 3.7.1 — Currently `/api/reports?type=tax_summary` blocks for ~3s while pdfkit generates
- [ ] 3.7.2 — Add `ReportJob` model: `{ id, userId, type, status: 'queued'|'processing'|'done'|'failed', resultUrl?, error?, createdAt, completedAt? }`
- [ ] 3.7.3 — Create `/api/reports/queue` POST — creates job, returns `{ jobId }`
- [ ] 3.7.4 — Create `/api/reports/jobs/[id]` GET — returns job status + download URL if done
- [ ] 3.7.5 — Create background processor — currently no worker infra; use setInterval in dev or BullMQ (§4.4)
- [ ] 3.7.6 — For now: keep sync generation but add loading state in UI
- [ ] 3.7.7 — Long-term: when §4.4 done, migrate to job queue
- [ ] 3.7.8 — Add progress indicator in UI: "Generating report... 0% → 100%"

**Definition of done:** User clicks Generate → sees clear loading state → can navigate away → comes back to find report in "Recent Generations" list with download link.

---

### 3.8 Database Indexes — P0

**Goal:** Verify all hot paths are indexed.

- [ ] 3.8.1 **P0** — Open `prisma/schema.prisma`
- [ ] 3.8.2 **P0** — `User`: index on `email` (already unique)
- [ ] 3.8.3 **P0** — `Document`: index on `(userId, createdAt)` — currently has `userId` only
- [ ] 3.8.4 **P0** — `ExtractedField`: index on `(documentId, fieldName)` and `(userId, verifiedByUser)`
- [ ] 3.8.5 **P0** — `Income`, `Expense`, `Deduction`: index on `(userId, financialYear)` (or `month` for Expense)
- [ ] 3.8.6 **P0** — `TaxEstimation`: index on `(userId, financialYear)` — already unique
- [ ] 3.8.7 **P0** — `Goal`: index on `userId`
- [ ] 3.8.8 **P0** — `AuditLog`: index on `(userId, createdAt)` — currently has `userId` only
- [ ] 3.8.9 **P0** — `RevokedToken`: index on `token` (already unique)
- [ ] 3.8.10 **P0** — `Consent`: index on `(userId, acceptedAt)`
- [ ] 3.8.11 **P0** — Run `bun run db:migrate --name add_indexes`
- [ ] 3.8.12 **P0** — Verify with `EXPLAIN QUERY PLAN` on SQLite (or Prisma query log)
- [ ] 3.8.13 **P1** — Add partial index on `Document WHERE processing_status = 'extracted'` (most queries filter on this)
- [ ] 3.8.14 **P2** — Consider composite indexes for common filter combos

**Definition of done:** All foreign keys + hot-path query columns have indexes. `EXPLAIN QUERY PLAN` shows index usage, not table scans.

---

### 3.9 Image Optimization — P1

**Goal:** Optimize document thumbnails, user avatars.

- [ ] 3.9.1 — Use `next/image` for all images
- [ ] 3.9.2 — Add document thumbnail generation (first page of PDF → PNG) on upload
- [ ] 3.9.3 — Store thumbnail in `/storage/thumbs/{docId}.png`
- [ ] 3.9.4 — Use thumbnail in document list instead of generic icon
- [ ] 3.9.5 — Generate user avatar with initials (already done) — make it an SVG component instead of div
- [ ] 3.9.6 — Add `sharp` for server-side image processing (already installed)
- [ ] 3.9.7 — Compress uploaded images (JPG/PNG) before storing

**Definition of done:** Document list shows real thumbnails of first page; images are properly sized via `next/image`.

---

### 3.10 HTTP Caching Headers — P1

**Goal:** Cache static + immutable responses.

- [ ] 3.10.1 — Add `Cache-Control: public, max-age=31536000, immutable` to `/_next/static/*` (Next.js already does this)
- [ ] 3.10.2 — Add `Cache-Control: private, max-age=30` to GET API responses that are user-specific but cacheable
- [ ] 3.10.3 — Add `Cache-Control: no-store` to auth endpoints
- [ ] 3.10.4 — Add ETag support for list endpoints (hash of response body)
- [ ] 3.10.5 — Add `304 Not Modified` response when ETag matches
- [ ] 3.10.6 — Add `stale-while-revalidate=60` for SWR-like behavior at HTTP layer
- [ ] 3.10.7 — Verify CSP headers don't conflict (already set in next.config.ts)

**Definition of done:** Browser DevTools shows `from disk cache` on repeated API calls within 30s window.

---

## 4. Scaling

### 4.1 SQLite → PostgreSQL Migration Path — P0

**Goal:** Document + enable seamless switch.

- [ ] 4.1.1 **P0** — Verify `prisma/schema.prisma` uses no SQLite-specific types (currently uses `String` for everything — should be fine)
- [ ] 4.1.2 **P0** — Replace any `DateTime` usage that depends on SQLite's TEXT storage (Prisma handles this)
- [ ] 4.1.3 **P0** — Add `docker-compose.yml` with Postgres service for local dev
- [ ] 4.1.4 **P0** — Add `.env.example` showing both `DATABASE_URL` options (sqlite file vs postgres URL)
- [ ] 4.1.5 **P0** — Test schema against Postgres: `bun run db:push` with `DATABASE_URL="postgresql://..."`
- [ ] 4.1.6 **P0** — Fix any Postgres-incompatible bits (e.g. `Json` type works differently)
- [ ] 4.1.7 **P0** — Add migration guide to `docs/migration-sqlite-to-postgres.md`
- [ ] 4.1.8 **P0** — Add `scripts/migrate-sqlite-to-postgres.ts` — reads from sqlite, writes to postgres
- [ ] 4.1.9 **P1** — Add connection pooling config (PgBouncer)
- [ ] 4.1.10 **P1** — Add read replica config (env var `DATABASE_REPLICA_URL`)
- [ ] 4.1.11 **P1** — Update Prisma client to use read replica for GET endpoints
- [ ] 4.1.12 **P2** — Add multi-region replication guide

**Definition of done:** Set `DATABASE_URL` to Postgres URL → `bun run db:push` → app works identically. Run migration script to copy dev data.

---

### 4.2 File Storage Abstraction — P0

**Goal:** Interface with Local + S3 implementations.

- [ ] 4.2.1 **P0** — Create `src/lib/storage/file-store.ts` interface: `save(key, buffer, contentType): Promise<string>`, `read(key): Promise<Buffer>`, `delete(key): Promise<void>`, `getSignedUrl(key, expiry): Promise<string>`
- [ ] 4.2.2 **P0** — Create `src/lib/storage/local-store.ts` — implements interface using `fs` to `/storage` dir
- [ ] 4.2.3 **P0** — Create `src/lib/storage/s3-store.ts` — implements using `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- [ ] 4.2.4 **P0** — `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] 4.2.5 **P0** — Create `src/lib/storage/index.ts` — exports `getFileStore()` that returns Local or S3 based on env
- [ ] 4.2.6 **P0** — Env vars: `STORAGE_DRIVER=local|s3`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- [ ] 4.2.7 **P0** — Refactor document upload to use `getFileStore().save()`
- [ ] 4.2.8 **P0** — Refactor document download route to use `getFileStore().read()` or `getSignedUrl()`
- [ ] 4.2.9 **P0** — Refactor report PDF save (if we save them) similarly
- [ ] 4.2.10 **P0** — Add migration script: copy local files to S3
- [ ] 4.2.11 **P1** — Add Cloudflare R2 support (S3-compatible)
- [ ] 4.2.12 **P1** — Add Azure Blob support
- [ ] 4.2.13 **P2** — Add Google Cloud Storage support

**Definition of done:** Set `STORAGE_DRIVER=s3` + S3 env vars → uploads go to S3 → downloads stream from S3.

---

### 4.3 Redis-Backed Rate Limiter — P0

**Goal:** Production-grade rate limiting that survives restarts.

- [ ] 4.3.1 **P0** — `bun add ioredis`
- [ ] 4.3.2 **P0** — Add `REDIS_URL` env var
- [ ] 4.3.3 **P0** — Create `src/lib/redis.ts` — exports `getRedis()` singleton with fallback to in-memory (dev)
- [ ] 4.3.4 **P0** — Update `src/lib/security.ts` `checkRateLimit` to use Redis `INCR` + `EXPIRE`
- [ ] 4.3.5 **P0** — Algorithm: `INCR key`, if 1 then `EXPIRE key windowSec`, if > limit reject
- [ ] 4.3.6 **P0** — Sliding window: use sorted set with timestamp scores (more accurate)
- [ ] 4.3.7 **P0** — Fallback to in-memory if REDIS_URL not set (dev mode)
- [ ] 4.3.8 **P0** — Test: hit endpoint 6 times rapidly, 6th should be rejected
- [ ] 4.3.9 **P0** — Add Redis connection error handling
- [ ] 4.3.10 **P1** — Add Redis sentinel support
- [ ] 4.3.11 **P1** — Add Redis cluster support
- [ ] 4.3.12 **P2** — Add distributed rate limit dashboard (admin only)

**Definition of done:** Restart server → rate limits still enforced (Redis state persists).

---

### 4.4 Background Job Queue — P1

**Goal:** Async PDF generation, document reprocessing, weekly emails.

- [ ] 4.4.1 — `bun add bullmq`
- [ ] 4.4.2 — Define queues in `src/lib/queues.ts`: `reportQueue`, `documentQueue`, `emailQueue`
- [ ] 4.4.3 — Create `src/workers/report-worker.ts` — processes report generation jobs
- [ ] 4.4.4 — Create `src/workers/document-worker.ts` — reprocesses documents (e.g. when extraction model updates)
- [ ] 4.4.5 — Create `src/workers/email-worker.ts` — sends weekly digest emails
- [ ] 4.4.6 — Add `scripts/start-worker.ts` — entry point for worker process
- [ ] 4.4.7 — Add `worker` script to package.json: `bun run scripts/start-worker.ts`
- [ ] 4.4.8 — Add cron: weekly digest every Sunday 9am IST
- [ ] 4.4.9 — Add job status tracking in DB: `JobStatus` model
- [ ] 4.4.10 — Add admin endpoint to view job queue
- [ ] 4.4.11 — Add retry with exponential backoff (BullMQ default)
- [ ] 4.4.12 — Add dead letter queue for failed jobs
- [ ] 4.4.13 — Document deployment: `bun run start` (web) + `bun run worker` (worker)

**Definition of done:** Generate report → returns immediately with jobId → background worker picks it up → user polls status → download ready in 5s.

---

### 4.5 JWT Refresh Tokens — P0

**Goal:** Short-lived access + long-lived refresh; supports real logout.

- [ ] 4.5.1 **P0** — Add `RefreshToken` model: `{ id, userId, tokenHash, expiresAt, revokedAt?, createdAt, userAgent?, ip? }`
- [ ] 4.5.2 **P0** — Index on `tokenHash` unique
- [ ] 4.5.3 **P0** — Update `src/lib/auth.ts` `createToken` to return both `access_token` (15min) and `refresh_token` (30 days)
- [ ] 4.5.4 **P0** — Create `/api/auth/refresh` POST — body `{ refresh_token }` → validates, issues new access + refresh (rotate)
- [ ] 4.5.5 **P0** — On refresh, mark old refresh token as used, issue new one (rotation detects theft)
- [ ] 4.5.6 **P0** — Update `src/lib/auth-context.tsx` to store both tokens
- [ ] 4.5.7 **P0** — Create `useRefreshToken` hook — auto-refresh when access token within 5min of expiry
- [ ] 4.5.8 **P0** — Update `apiFetch` to handle 401: try refresh once, if refresh fails → logout
- [ ] 4.5.9 **P0** — Update logout to revoke both tokens
- [ ] 4.5.10 **P0** — On password reset, revoke all user's refresh tokens
- [ ] 4.5.11 **P1** — Add "Logout all devices" — revokes all refresh tokens for user
- [ ] 4.5.12 **P1** — Show active sessions in Settings (userAgent, ip, lastUsed)
- [ ] 4.5.13 **P2** — Add device management UI

**Definition of done:** Login → access token expires in 15min → app auto-refreshes → user stays logged in for 30 days → logout revokes everywhere.

---

### 4.6 WebSocket Real-Time Updates — P1

**Goal:** Push document processing status, notifications, score changes.

- [ ] 4.6.1 — `bun add socket.io socket.io-client`
- [ ] 4.6.2 — Create `src/lib/socket-server.ts` — attaches Socket.io to Next.js custom server
- [ ] 4.6.3 — Create `src/lib/socket-client.ts` — client-side singleton
- [ ] 4.6.4 — Update `package.json` `start` script to use custom server: `bun server.ts`
- [ ] 4.6.5 — Create `server.ts` at root: starts Next.js + attaches Socket.io
- [ ] 4.6.6 — Authentication: client sends JWT on connect, server verifies
- [ ] 4.6.7 — Join room: `socket.join(\`user:\${userId}\`)`
- [ ] 4.6.8 — Emit events: `document:processed`, `notification:new`, `score:changed`
- [ ] 4.6.9 — Server-side: when document processing completes, emit to user's room
- [ ] 4.6.10 — Client: subscribe in `useEffect`, update SWR cache on events
- [ ] 4.6.11 — Replace notification polling (§2.10) with WebSocket
- [ ] 4.6.12 — Replace document processing polling with WebSocket
- [ ] 4.6.13 — Add reconnect logic with exponential backoff
- [ ] 4.6.14 — Add offline queue: events buffered while disconnected, replayed on reconnect

**Definition of done:** Upload document → close laptop → 3 seconds later reopen → see "Document processed" notification without manual refresh.

---

### 4.7 Health Check + Readiness Probe — P0

**Goal:** Kubernetes-friendly endpoints.

- [ ] 4.7.1 **P0** — Create `/api/health` GET — returns `{ status: 'ok', timestamp, uptime, version }`
- [ ] 4.7.2 **P0** — Create `/api/ready` GET — checks DB connection, Redis connection (if configured), returns 200 or 503
- [ ] 4.7.3 **P0** — Add DB ping: `await prisma.$queryRaw\`SELECT 1\``
- [ ] 4.7.4 **P0** — Add Redis ping: `await redis.ping()`
- [ ] 4.7.5 **P0** — Add file storage ping: write + read + delete a tiny test file
- [ ] 4.7.6 **P0** — Return individual checks in response: `{ db: 'ok', redis: 'ok', storage: 'ok' }`
- [ ] 4.7.7 **P0** — Add `/api/metrics` GET — Prometheus format (request count, response times, error rate)
- [ ] 4.7.8 **P1** — Add memory/CPU metrics
- [ ] 4.7.9 **P1** — Add DB connection pool metrics
- [ ] 4.7.10 **P2** — Add OpenTelemetry instrumentation

**Definition of done:** `curl /api/health` returns 200 always; `curl /api/ready` returns 503 if DB is down.

---

### 4.8 Containerization — P1

**Goal:** Docker + docker-compose for one-command deploy.

- [ ] 4.8.1 — Create `Dockerfile` — multi-stage: builder (install deps, build) + runner (copy standalone + public + static)
- [ ] 4.8.2 — Use `node:20-alpine` base
- [ ] 4.8.3 — Use Next.js standalone output (already configured)
- [ ] 4.8.4 — Add `EXPOSE 3000`
- [ ] 4.8.5 — Add `CMD ["node", "server.js"]`
- [ ] 4.8.6 — Create `.dockerignore` — exclude `node_modules`, `.next`, `storage`, `*.log`
- [ ] 4.8.7 — Create `docker-compose.yml` — services: web, worker, postgres, redis
- [ ] 4.8.8 — Add volume for `storage/` directory
- [ ] 4.8.9 — Add healthcheck using `/api/health`
- [ ] 4.8.10 — Add restart policy: `unless-stopped`
- [ ] 4.8.11 — Add env_file: `.env`
- [ ] 4.8.12 — Test: `docker-compose up` → app accessible on :3000
- [ ] 4.8.13 — Create `docker-compose.prod.yml` — production overrides (no source code mount, etc.)

**Definition of done:** `docker-compose up` starts the full stack (web + worker + Postgres + Redis) and app works end-to-end.

---

## 5. UI & UX

### 5.1 Empty States with Personality — P0

**Goal:** Replace "No X yet" with illustrated + actionable states.

- [ ] 5.1.1 **P0** — Create `src/components/empty-state.tsx` component: `{ icon, title, description, actionLabel, onAction, illustration? }`
- [ ] 5.1.2 **P0** — Create SVG illustrations: 6 hand-drawn-style illustrations matching forest+cream palette
- [ ] 5.1.3 **P0** — Illustration 1: Empty documents (stack of papers with question mark)
- [ ] 5.1.4 **P0** — Illustration 2: Empty goals (target with arrow missing)
- [ ] 5.1.5 **P0** — Illustration 3: Empty chat (speech bubble with sparkles)
- [ ] 5.1.6 **P0** — Illustration 4: Empty transactions (empty wallet)
- [ ] 5.1.7 **P0** — Illustration 5: Empty reports (clipboard)
- [ ] 5.1.8 **P0** — Illustration 6: Empty notifications (bell with X)
- [ ] 5.1.9 **P0** — Each illustration: 200×200 SVG with subtle float animation
- [ ] 5.1.10 **P0** — Update `documents.tsx` empty state — show illustration + "Upload your first document" + button
- [ ] 5.1.11 **P0** — Update `goals.tsx` empty state — illustration + "Set your first goal" + suggestion: "Most users start with an Emergency Fund"
- [ ] 5.1.12 **P0** — Update `assistant.tsx` empty state — illustration + "Ask me anything" + suggestion chips
- [ ] 5.1.13 **P0** — Update `transactions.tsx` empty state — illustration + "Upload a bank statement to see transactions"
- [ ] 5.1.14 **P0** — Update `reports.tsx` empty state — illustration + "Generate your first report"
- [ ] 5.1.15 **P0** — Add animation: illustration floats gently, title slides up, description fades in, button scales in
- [ ] 5.1.16 **P0** — Stagger: illustration → title → description → button (60ms each)
- [ ] 5.1.17 **P1** — Add random rotation to illustration (-3° to +3°) for hand-drawn feel
- [ ] 5.1.18 **P1** — Add personalization: "Hi [Name], upload your first document to get started"
- [ ] 5.1.19 **P1** — Add contextual suggestions based on what other users do
- [ ] 5.1.20 **P2** — Add Lottie animations instead of static SVG

**Definition of done:** Every empty list/table in the app shows a beautiful illustrated state with a clear CTA. No more "No X yet" dead-end screens.

---

### 5.2 Skeleton Screens Everywhere — P0

**Goal:** Replace spinners with skeleton screens.

- [ ] 5.2.1 **P0** — Audit all `loading` states: `grep "loading" src/views/ | grep skeleton`
- [ ] 5.2.2 **P0** — Currently only dashboard.tsx has skeleton
- [ ] 5.2.3 **P0** — Create `src/components/skeletons.tsx` with reusable skeleton patterns
- [ ] 5.2.4 **P0** — `SkeletonCard` — rectangle with shimmer (already have `.skeleton` class)
- [ ] 5.2.5 **P0** — `SkeletonBentoGrid` — mimics dashboard bento layout
- [ ] 5.2.6 **P0** — `SkeletonTable` — rows of skeleton lines
- [ ] 5.2.7 **P0** — `SkeletonChart` — grayed-out chart shape
- [ ] 5.2.8 **P0** — `SkeletonList` — list items with avatar + 2 lines
- [ ] 5.2.9 **P0** — Update tax.tsx loading state — use bento skeleton matching layout
- [ ] 5.2.10 **P0** — Update finance.tsx loading — bento skeleton + chart skeleton
- [ ] 5.2.11 **P0** — Update goals.tsx loading — 2×2 card skeleton
- [ ] 5.2.12 **P0** — Update documents.tsx loading — upload zone stays, list area shows skeleton rows
- [ ] 5.2.13 **P0** — Update assistant.tsx loading — chat area shows skeleton message bubbles
- [ ] 5.2.14 **P0** — Update reports.tsx loading — 3 card skeletons
- [ ] 5.2.15 **P0** — Update settings.tsx loading — profile skeleton + 2 panel skeletons
- [ ] 5.2.16 **P0** — Update document-verify.tsx loading — summary skeleton + field row skeletons
- [ ] 5.2.17 **P0** — Add subtle pulse to skeleton (already have shimmer animation)
- [ ] 5.2.18 **P1** — Match skeleton dimensions to actual content (avoid layout shift)
- [ ] 5.2.19 **P1** — Add variant: skeleton with "Loading..." text for screen readers (aria-busy)
- [ ] 5.2.20 **P2** — Add predictive skeletons that match real content shape after first load

**Definition of done:** Slow 3G network → navigate to any page → see skeleton matching final layout → no jarring layout shift when content loads.

---

### 5.3 Confirmation Dialogs — P0

**Goal:** Confirm destructive actions.

- [ ] 5.3.1 **P0** — Create `src/components/confirm-dialog.tsx`
- [ ] 5.3.2 **P0** — Props: `{ open, title, description, confirmLabel, cancelLabel, variant: 'danger'|'warning'|'info', onConfirm, onCancel }`
- [ ] 5.3.3 **P0** — Render in portal (so it overlays everything)
- [ ] 5.3.4 **P0** — Backdrop blur + fade in
- [ ] 5.3.5 **P0** — Dialog scale-in animation
- [ ] 5.3.6 **P0** — Variant styles: danger = clay, warning = gold, info = forest
- [ ] 5.3.7 **P0** — Add keyboard: Esc cancels, Enter confirms
- [ ] 5.3.8 **P0** — Add focus trap (focus stays in dialog)
- [ ] 5.3.9 **P0** — Add `useConfirm` hook returning `{ confirm, ConfirmDialogComponent }`
- [ ] 5.3.10 **P0** — Update document delete — wrap in confirm dialog
- [ ] 5.3.11 **P0** — Update goal delete — confirm dialog
- [ ] 5.3.12 **P0** — Update consent revoke — confirm with warning text
- [ ] 5.3.13 **P0** — Update logout — confirm dialog (or skip if considered non-destructive)
- [ ] 5.3.14 **P0** — Update transaction delete — confirm
- [ ] 5.3.15 **P0** — Update asset/liability delete — confirm
- [ ] 5.3.16 **P0** — Update "Verify All" — confirm (bulk action)
- [ ] 5.3.17 **P1** — Add "Don't ask again" checkbox for non-critical confirms
- [ ] 5.3.18 **P1** — Add undo toast: "Deleted. Undo" (5s window)

**Definition of done:** Click delete on any item → modal appears with item name + warning + Cancel/Delete buttons → Esc cancels → Delete confirms.

---

### 5.4 Keyboard Shortcuts — P1

**Goal:** Power user navigation.

- [ ] 5.4.1 — Create `src/hooks/use-keyboard-shortcuts.ts`
- [ ] 5.4.2 — Register global listener on mount
- [ ] 5.4.3 — Shortcuts: `g d` (dashboard), `g t` (tax), `g f` (finance), `g g` (goals), `g a` (assistant), `g r` (reports), `g s` (settings), `g u` (documents/upload)
- [ ] 5.4.4 — Implement sequence detection: listen for `g`, then next key within 1s
- [ ] 5.4.5 — `?` opens shortcuts help modal
- [ ] 5.4.6 — `Cmd+K` opens command palette (already)
- [ ] 5.4.7 — `/` focuses search/command palette input
- [ ] 5.4.8 — `Esc` closes any open modal/dialog
- [ ] 5.4.9 — `n` on goals page = new goal
- [ ] 5.4.10 — `u` on documents page = upload
- [ ] 5.4.11 — `?` modal: table of all shortcuts, categorized
- [ ] 5.4.12 — Add footer hint: "Press ? for shortcuts"
- [ ] 5.4.13 — Disable shortcuts when typing in input/textarea (except Esc)
- [ ] 5.4.14 — Add visual feedback: subtle flash on shortcut trigger
- [ ] 5.4.15 — Make shortcuts configurable in settings (advanced)

**Definition of done:** Press `g` then `t` → navigates to Tax page. Press `?` → modal shows all shortcuts.

---

### 5.5 Mobile Bottom Nav — P0

**Goal:** Replace horizontal scroll with proper tab bar.

- [ ] 5.5.1 **P0** — Replace current mobile nav (horizontal scroll) with fixed bottom tab bar
- [ ] 5.5.2 **P0** — Show 4 most important: Dashboard, Documents, Tax, Assistant
- [ ] 5.5.3 **P0** — 5th tab: "More" → opens sheet with remaining nav items
- [ ] 5.5.4 **P0** — Tab bar height: 64px (iOS safe area aware)
- [ ] 5.5.5 **P0** — Active tab: filled icon + label + gold indicator line on top
- [ ] 5.5.6 **P0** — Inactive: outline icon + label
- [ ] 5.5.7 **P0** — Add safe area padding: `padding-bottom: env(safe-area-inset-bottom)`
- [ ] 5.5.8 **P0** — Add haptic feedback: `navigator.vibrate(10)` on tap
- [ ] 5.5.9 **P0** — "More" sheet: slides up from bottom, 60% screen height
- [ ] 5.5.10 **P0** — Sheet shows: Finance, Goals, Reports, Settings, Logout
- [ ] 5.5.11 **P0** — Add backdrop dim when sheet open
- [ ] 5.5.12 **P0** — Tap backdrop closes sheet
- [ ] 5.5.13 **P0** — Swipe down on sheet closes it
- [ ] 5.5.14 **P0** — Remove top mobile bar (logo can go in tab bar or move to dashboard header)
- [ ] 5.5.15 **P1** — Add long-press on tab for quick actions (e.g. long-press Documents = upload)
- [ ] 5.5.16 **P1** — Add badge on tab for notifications (e.g. bell on More if unread)

**Definition of done:** On mobile, bottom shows 4 clear tabs + More. Tap "More" → sheet slides up with rest. Active tab visually distinct.

---

### 5.6 Drag-to-Reorder Dashboard Widgets — P2

**Goal:** User-customizable bento layout.

- [ ] 5.6.1 — `bun add @dnd-kit/core @dnd-kit/sortable`
- [ ] 5.6.2 — Wrap each bento card in `Sortable` component
- [ ] 5.6.3 — Persist layout in `User.dashboard_layout` JSON column
- [ ] 5.6.4 — Add "Customize" toggle on dashboard
- [ ] 5.6.5 — When toggled: drag handles appear, cards get dashed border
- [ ] 5.6.6 — On drop: update layout in DB
- [ ] 5.6.7 — Add "Reset to default" button
- [ ] 5.6.8 — Add resize handles (small/medium/large)
- [ ] 5.6.9 — Constrain: some cards have min size
- [ ] 5.6.10 — Add hide/show toggle per card

**Definition of done:** Click "Customize" → drag Tax Score card to bottom → it stays there on reload.

---

### 5.7 Toast Portal + Queue — P0

**Goal:** Proper toast system.

- [ ] 5.7.1 **P0** — Currently using shadcn Toaster — verify it's portal-mounted
- [ ] 5.7.2 **P0** — If not, create custom toast portal in `src/components/ui/toast-portal.tsx`
- [ ] 5.7.3 **P0** — Position: bottom-right on desktop, top-center on mobile
- [ ] 5.7.4 **P0** — Stack multiple toasts vertically with gap
- [ ] 5.7.5 **P0** — Animate in: slide from right + fade
- [ ] 5.7.6 **P0** — Animate out: slide right + fade
- [ ] 5.7.7 **P0** — Auto-dismiss after 5s (configurable)
- [ ] 5.7.8 **P0** — Pause auto-dismiss on hover
- [ ] 5.7.9 **P0** — Manual close button
- [ ] 5.7.10 **P0** — Variants: success (moss), error (clay), warning (gold), info (forest)
- [ ] 5.7.11 **P0** — Icon per variant
- [ ] 5.7.12 **P0** — Action button support: `{ actionLabel, onAction }`
- [ ] 5.7.13 **P0** — Limit: max 3 visible, oldest dismissed
- [ ] 5.7.14 **P1** — Add swipe-to-dismiss on mobile
- [ ] 5.7.15 **P1** — Add progress bar showing time until auto-dismiss
- [ ] 5.7.16 **P2** — Add sound effect (optional, opt-in)

**Definition of done:** Trigger 3 toasts rapidly → they stack neatly → hover pauses timer → click X dismisses → auto-dismiss after 5s.

---

### 5.8 Error Boundaries with Recovery — P0

**Goal:** Graceful crash recovery.

- [ ] 5.8.1 **P0** — Create `src/components/error-boundary.tsx` — class component with `componentDidCatch`
- [ ] 5.8.2 **P0** — Wrap each view in ErrorBoundary in page.tsx
- [ ] 5.8.3 **P0** — Error UI: friendly illustration + "Something went wrong" + stack trace (dev only)
- [ ] 5.8.4 **P0** — Buttons: "Reload page" + "Go to Dashboard"
- [ ] 5.8.5 **P0** — Send error to Sentry (if §8.5 done)
- [ ] 5.8.6 **P0** — Add `error.tsx` at app root for route-level errors
- [ ] 5.8.7 **P0** — Add `global-error.tsx` for catastrophic errors
- [ ] 5.8.8 **P0** — Test: throw error in a view → see error UI → click "Reload" → recovers
- [ ] 5.8.9 **P1** — Add "Report this issue" button → opens GitHub issue pre-filled
- [ ] 5.8.10 **P1** — Add error ID for user to share with support

**Definition of done:** Force an error in Finance view → other views still work → Finance shows error UI with recovery options.

---

### 5.9 Pull-to-Refresh on Mobile — P1

**Goal:** Native-feeling refresh gesture.

- [ ] 5.9.1 — Create `src/hooks/use-pull-to-refresh.ts`
- [ ] 5.9.2 — Detect touch start at top of scroll container
- [ ] 5.9.3 — Track pull distance, show indicator
- [ ] 5.9.4 — Threshold: 80px → trigger refresh
- [ ] 5.9.5 — Indicator: spinner + "Pull to refresh" → "Release to refresh" → "Refreshing..."
- [ ] 5.9.6 — On release past threshold: call `mutate` on current view's SWR keys
- [ ] 5.9.7 — Add resistance: pull becomes harder past threshold
- [ ] 5.9.8 — Disable on desktop (touch-only)
- [ ] 5.9.9 — Add haptic feedback at threshold
- [ ] 5.9.10 — Test on iOS Safari + Android Chrome

**Definition of done:** On mobile, pull down at top of any view → see refresh indicator → release → data refreshes.

---

### 5.10 Floating Action Button — P1

**Goal:** Always-accessible primary action.

- [ ] 5.10.1 — Create `src/components/fab.tsx`
- [ ] 5.10.2 — Position: fixed bottom-right (desktop), above bottom nav (mobile)
- [ ] 5.10.3 — Icon: Upload (or context-aware)
- [ ] 5.10.4 — On click: navigate to documents page and trigger file picker
- [ ] 5.10.5 — Expandable: long-press reveals quick actions (Upload, New Goal, Ask AI, Generate Report)
- [ ] 5.10.6 — Animate: scale-in on mount, pulse subtly
- [ ] 5.10.7 — Hide on scroll down, show on scroll up
- [ ] 5.10.8 — Hide on certain pages (e.g. login)
- [ ] 5.10.9 — Context-aware: on goals page → "New Goal", on documents → "Upload", on assistant → hide

**Definition of done:** FAB visible on all main pages → click → navigates + opens appropriate action → long-press → quick action menu.

---

### 5.11 Better Form Inputs — P0

**Goal:** Premium-feeling form controls.

- [ ] 5.11.1 **P0** — Create `src/components/ui/input.tsx` — styled input with focus animation
- [ ] 5.11.2 **P0** — Add floating label effect (label moves up on focus/filled)
- [ ] 5.11.3 **P0** — Add prefix/suffix support (₹ prefix for amounts)
- [ ] 5.11.4 **P0** — Add error state (red border + message below)
- [ ] 5.11.5 **P0** — Add success state (green checkmark)
- [ ] 5.11.6 **P0** — Create `src/components/ui/select.tsx` — custom dropdown
- [ ] 5.11.7 **P0** — Animate dropdown open/close
- [ ] 5.11.8 **P0** — Add search in dropdown for long lists
- [ ] 5.11.9 **P0** — Create `src/components/ui/checkbox.tsx` — custom checkbox
- [ ] 5.11.10 **P0** — Animate check state
- [ ] 5.11.11 **P0** — Create `src/components/ui/radio.tsx` — custom radio
- [ ] 5.11.12 **P0** — Create `src/components/ui/toggle.tsx` — switch toggle
- [ ] 5.11.13 **P0** — Animate toggle with spring
- [ ] 5.11.14 **P0** — Create `src/components/ui/textarea.tsx` — auto-resizing textarea
- [ ] 5.11.15 **P0** — Replace all native inputs across views with these components
- [ ] 5.11.16 **P1** — Add input mask for currency (auto-format ₹1,23,456)
- [ ] 5.11.17 **P1** — Add input mask for dates (DD/MM/YYYY)
- [ ] 5.11.18 **P1** — Add input mask for phone numbers
- [ ] 5.11.19 **P2** — Add voice input button on text fields (Web Speech API)

**Definition of done:** Every input in the app uses custom component → consistent styling → focus animations → error/success states visible.

---

### 5.12 Loading States for Buttons — P0

**Goal:** Show loading state on every async button.

- [ ] 5.12.1 **P0** — Create `src/components/ui/button.tsx` with `loading` prop
- [ ] 5.12.2 **P0** — Loading: replace icon with spinner, disable click
- [ ] 5.12.3 **P0** — Variants: primary (forest gradient), secondary (outline), ghost, danger (clay)
- [ ] 5.12.4 **P0** — Sizes: sm, md, lg
- [ ] 5.12.5 **P0** — Add hover/tap animations
- [ ] 5.12.6 **P0** — Audit all buttons: replace native `<button>` with this component
- [ ] 5.12.7 **P0** — Verify every async action shows loading state
- [ ] 5.12.8 **P0** — Login button already does — verify all others

**Definition of done:** Click any async button → sees spinner → button disabled → reverts on success/failure.

---

## 6. Narration & Storytelling

### 6.1 First-Run Onboarding Flow — P0

**Goal:** 3-screen welcome with clear narrative.

- [ ] 6.1.1 **P0** — Create `src/components/onboarding-flow.tsx`
- [ ] 6.1.2 **P0** — Shows on first login (no `localStorage.onboarding_complete`)
- [ ] 6.1.3 **P0** — Screen 1: "Welcome to FinSight AI" → illustration of forest + money → "We'll help you understand your money clearly"
- [ ] 6.1.4 **P0** — Screen 2: "How it works" → 3-step visual: Upload → AI extracts → Get insights
- [ ] 6.1.5 **P0** — Screen 3: "Privacy first" → shield illustration → "Your data is encrypted, masked, and deletable"
- [ ] 6.1.6 **P0** — Screen 4: "Ready to start?" → "Upload your first document" CTA
- [ ] 6.1.7 **P0** — Each screen: full-screen overlay, animated entrance
- [ ] 6.1.8 **P0** — Skip button always visible
- [ ] 6.1.9 **P0** — Next button per screen
- [ ] 6.1.10 **P0** — Progress dots: 4 dots
- [ ] 6.1.11 **P0** — Animate transition between screens: slide left + fade
- [ ] 6.1.12 **P0** — On finish: set `localStorage.onboarding_complete = true`
- [ ] 6.1.13 **P0** — On finish: navigate to documents page
- [ ] 6.1.14 **P0** — Add "Skip for now" → goes straight to dashboard
- [ ] 6.1.15 **P1** — Personalize: show user's name on screen 1
- [ ] 6.1.16 **P1** — Add "Watch 30s demo video" option on screen 4
- [ ] 6.1.17 **P2** — A/B test different opening messages

**Definition of done:** New user logs in → sees 4-screen welcome → clicks through → lands on documents page ready to upload.

---

### 6.2 Progressive Disclosure — P0

**Goal:** Don't overwhelm new users; reveal features as they earn them.

- [ ] 6.2.1 **P0** — Define user milestones: `NEW` (0 docs), `STARTED` (1+ docs), `VERIFIED` (1+ verified), `ENGAGED` (5+ docs), `POWER` (10+ docs + goal + report)
- [ ] 6.2.2 **P0** — Compute milestone in `useUserMilestone` hook
- [ ] 6.2.3 **P0** — NEW: nav shows only Dashboard, Documents, Assistant, Settings
- [ ] 6.2.4 **P0** — STARTED: nav adds Tax
- [ ] 6.2.5 **P0** — VERIFIED: nav adds Finance
- [ ] 6.2.6 **P0** — ENGAGED: nav adds Goals, Reports
- [ ] 6.2.7 **P0** — When new nav item unlocks: show celebration toast "🎉 Tax unlocked! See your readiness score"
- [ ] 6.2.8 **P0** — Locked items in command palette show "Unlock by uploading 1 document"
- [ ] 6.2.9 **P0** — Dashboard adapts: NEW shows only upload CTA + welcome; ENGAGED shows full bento
- [ ] 6.2.10 **P0** — Add "Skip progression" in settings (show all features)
- [ ] 6.2.11 **P1** — Track progression events in analytics
- [ ] 6.2.12 **P2** — Adaptive: if user uploads 5 docs in day 1, accelerate unlock

**Definition of done:** New user sees 4 nav items → uploads doc → 5th nav unlocks with celebration → keeps progressing.

---

### 6.3 Journey Timeline — P1

**Goal:** Horizontal scroll of user's financial journey.

- [ ] 6.3.1 — Add `UserEvent` model: `{ id, userId, type, title, description, metadata, createdAt }`
- [ ] 6.3.2 — Hook into: account created, first document, first verification, score changes (every 5pts), first goal, goal completed, report generated
- [ ] 6.3.3 — Create `/api/journey` GET — returns events paginated
- [ ] 6.3.4 — Create `JourneyTimeline` component on dashboard
- [ ] 6.3.5 — Horizontal scroll: cards left to right, oldest to newest
- [ ] 6.3.6 — Each card: date, icon, title, description
- [ ] 6.3.7 — Connecting line with dots at each event
- [ ] 6.3.8 — Animation: cards stagger-in on scroll into view
- [ ] 6.3.9 — Add "View full journey" → settings/journey page with vertical timeline
- [ ] 6.3.10 — Add filter: by event type
- [ ] 6.3.11 — Add export: download journey as PDF

**Definition of done:** After using app for a week, see timeline: "Joined → First doc → First verification → Score 65 → Score 80 → First goal".

---

### 6.4 Contextual Empty-State Copy — P0

**Goal:** Replace generic "No X" with personalized, actionable copy.

- [ ] 6.4.1 **P0** — Documents empty: "Hi [Name], upload your salary slip or Form 16 to get started. Most users see their tax score in 60 seconds."
- [ ] 6.4.2 **P0** — Goals empty: "You haven't set a goal yet. Most users start with an Emergency Fund — want to try?" + "Create Emergency Fund" button
- [ ] 6.4.3 **P0** — Reports empty: "Generate your first report — it takes 5 seconds and is CA-ready."
- [ ] 6.4.4 **P0** — Assistant empty: "I'm your AI assistant. I know your finances — ask me anything. Try: 'How can I save more tax?'"
- [ ] 6.4.5 **P0** — Transactions empty: "Upload a bank statement to see your transactions auto-categorized."
- [ ] 6.4.6 **P0** — Tax missing docs: instead of just listing, add "Upload this to boost your score by 15 points"
- [ ] 6.4.7 **P0** — Finance no data: "Upload a bank statement and I'll show your spending breakdown by category, top merchants, and savings rate."
- [ ] 6.4.8 **P1** — A/B test different copy variants
- [ ] 6.4.9 **P1** — Personalize based on time of day: "Good morning, [Name]" vs "Good evening"
- [ ] 6.4.10 **P2** — Use LLM to generate dynamic personalized copy

**Definition of done:** Every empty state feels like a helpful nudge, not a dead end.

---

### 6.5 Weekly Digest Email — P1

**Goal:** Bring users back with a recap.

- [ ] 6.5.1 — Create `src/lib/email-templates/weekly-digest.tsx` — MJML template
- [ ] 6.5.2 — `bun add mjml`
- [ ] 6.5.3 — Template sections: Header (branded), Score change, New documents, Top insight, Tip of the week, CTA
- [ ] 6.5.4 — Add weekly digest job (§4.4) — runs Sunday 9am IST
- [ ] 6.5.5 — Job: for each user with email consent, generate digest, send via SMTP
- [ ] 6.5.6 — Add `User.emailConsent` field (defaults false)
- [ ] 6.5.7 — Add toggle in settings: "Weekly digest email"
- [ ] 6.5.8 — Add unsubscribe link in email footer
- [ ] 6.5.9 — Track opens + clicks (use tracking pixel + UTM params)
- [ ] 6.5.10 — Add "View in app" link that opens dashboard
- [ ] 6.5.11 — Test with Mailtrap or Ethereal in dev

**Definition of done:** User enables digest in settings → Sunday 9am → receives email with "Your score went up 5 points, you uploaded 2 documents, top tip: invest in PPF".

---

### 6.6 "Your Year in Money" Annual Report — P2

**Goal:** Year-end recap, shareable.

- [ ] 6.6.1 — Create `src/views/year-recap.tsx`
- [ ] 6.6.2 — Compute: total income, total tax saved, biggest expense category, savings rate trend, goals achieved, documents processed
- [ ] 6.6.3 — Animated stat cards: count-up animation
- [ ] 6.6.4 — "Your top 3 merchants" with icons
- [ ] 6.6.5 — "Months you saved the most" bar chart
- [ ] 6.6.6 — "Goals you crushed" section
- [ ] 6.6.7 — "What could be better" suggestions
- [ ] 6.6.8 — "Share to social" buttons (Twitter, WhatsApp) with pre-filled text
- [ ] 6.6.9 — Available Dec 15 - Jan 31
- [ ] 6.6.10 — Add banner on dashboard during availability window
- [ ] 6.6.11 — Generate as PDF for download
- [ ] 6.6.12 — Add narration: "2024 was the year you..." text

**Definition of done:** Dec 15 → user sees banner "Your 2024 in Money is ready" → opens → sees animated recap → shares to WhatsApp.

---

### 6.7 "What's New" Changelog — P2

**Goal:** Signal app is alive.

- [ ] 6.7.1 — Create `src/views/changelog.tsx`
- [ ] 6.7.2 — Define changelog entries in `src/lib/changelog-data.ts` (versioned)
- [ ] 6.7.3 — Each entry: `{ version, date, type: 'feature'|'improvement'|'fix', title, description, icon }`
- [ ] 6.7.4 — Show "What's New" badge on Settings nav if unseen
- [ ] 6.7.5 — Modal on first login after new version: highlights top 3 changes
- [ ] 6.7.6 — "Don't show again" + "View full changelog" buttons
- [ ] 6.7.7 — Persist last seen version in localStorage

**Definition of done:** Ship new feature → user sees badge → opens modal → sees what's new.

---

## 7. Color Palette

### 7.1 Tonal Scales — P0

**Goal:** Full 50→950 scales for forest, gold, moss, clay.

- [ ] 7.1.1 **P0** — Generate forest scale:
  - `--color-forest-50: #f0f7f3`
  - `--color-forest-100: #d9ebe0`
  - `--color-forest-200: #b3d7c2`
  - `--color-forest-300: #80ba9b`
  - `--color-forest-400: #4d9c75`
  - `--color-forest-500: #1a5c47` (current forest-light)
  - `--color-forest-600: #0d3b2e` (current forest)
  - `--color-forest-700: #0a3024`
  - `--color-forest-800: #062418` (current forest-dark)
  - `--color-forest-900: #031711` (current forest-deep)
  - `--color-forest-950: #01100a`
- [ ] 7.1.2 **P0** — Generate gold scale:
  - `--color-gold-50: #fdf8e8`
  - `--color-gold-100: #faedc4`
  - `--color-gold-200: #f4d97a`
  - `--color-gold-300: #e8c14a` (current gold-light)
  - `--color-gold-400: #d4a017` (current gold)
  - `--color-gold-500: #b88810`
  - `--color-gold-600: #936908`
  - `--color-gold-700: #6e4d05`
  - `--color-gold-800: #4a3303`
  - `--color-gold-900: #2e2002`
- [ ] 7.1.3 **P0** — Generate moss scale (similar pattern)
- [ ] 7.1.4 **P0** — Generate clay scale (similar pattern)
- [ ] 7.1.5 **P0** — Generate cream scale:
  - `--color-cream-50: #ffffff`
  - `--color-cream-100: #fdfcfa`
  - `--color-cream-200: #faf7f2` (current cream)
  - `--color-cream-300: #f3ede3` (current cream-dark)
  - `--color-cream-400: #ece4d3` (current cream-deep)
  - `--color-cream-500: #d9cdb5`
- [ ] 7.1.6 **P0** — Generate ink scale:
  - `--color-ink-50: #f5f5f5`
  - `--color-ink-100: #e0e0e0`
  - `--color-ink-200: #c0c0c0`
  - `--color-ink-300: #8a8a8a` (current ink-muted)
  - `--color-ink-400: #4a4a4a` (current ink-soft)
  - `--color-ink-500: #1a1a1a` (current ink)
  - `--color-ink-600: #111111`
  - `--color-ink-700: #0a0a0a`
  - `--color-ink-800: #050505`
  - `--color-ink-900: #000000`
- [ ] 7.1.7 **P0** — Add all scales to `@theme` block in globals.css
- [ ] 7.1.8 **P0** — Keep legacy color names as aliases for backward compat (`--color-forest` = `--color-forest-600`)
- [ ] 7.1.9 **P0** — Audit all components — replace hardcoded hex with scale references
- [ ] 7.1.10 **P0** — Test: no visual regression

**Definition of done:** Open dev tools → see all 7 color scales available → components use scale references not hex.

---

### 7.2 Semantic Color System — P0

**Goal:** Formalize success/warning/danger/info.

- [ ] 7.2.1 **P0** — Define semantic tokens:
  - `--color-success: var(--color-moss-500)` (+ `--color-success-soft: rgba(moss, 0.1)`)
  - `--color-warning: var(--color-gold-400)` (+ `--color-warning-soft`)
  - `--color-danger: var(--color-clay-400)` (+ `--color-danger-soft`)
  - `--color-info: #3b82f6` (new sky blue, + `--color-info-soft: rgba(59,130,246,0.1)`)
- [ ] 7.2.2 **P0** — Replace all status indicators:
  - `processing_status === 'extracted'` → use `--color-success`
  - missing docs warning → use `--color-danger`
  - confidence < 0.7 → use `--color-warning`
  - info badges → use `--color-info`
- [ ] 7.2.3 **P0** — Replace toast variants to use semantic colors
- [ ] 7.2.4 **P0** — Replace all `rgba(13,59,46,X)` and `rgba(198,93,58,X)` with semantic soft tokens
- [ ] 7.2.5 **P0** — Add Tailwind utilities: `bg-success`, `text-danger`, `border-warning`, etc.

**Definition of done:** `grep "rgba(13,59" src/` returns 0 hits — all use `--color-success-soft` instead.

---

### 7.3 Data Viz Palette — P0

**Goal:** 8-color chart palette as design tokens.

- [ ] 7.3.1 **P0** — Define `--chart-1` through `--chart-8` in `@theme`
- [ ] 7.3.2 **P0** — Palette: forest-600, moss-500, gold-400, clay-400, forest-500, gold-300, ink-300, ink-400
- [ ] 7.3.3 **P0** — Verify colorblind-safe using online simulator (Coblis)
- [ ] 7.3.4 **P0** — If not safe, adjust: ensure no red/green-only encoding
- [ ] 7.3.5 **P0** — Update `DONUT_COLORS` array in finance.tsx to use CSS vars
- [ ] 7.3.6 **P0** — Update `GradientBars` to use chart tokens
- [ ] 7.3.7 **P0** — Update any other hardcoded chart colors
- [ ] 7.3.8 **P1** — Add pattern fills as alternative to colors (for severe colorblindness)
- [ ] 7.3.9 **P2** — Add data viz color storybook page showing all colors

**Definition of done:** All charts use `var(--chart-N)` tokens. Tested colorblind-safe.

---

### 7.4 Dark Mode — P0

**Goal:** Cream-on-Forest dark theme with toggle.

- [ ] 7.4.1 **P0** — Add `dark` class strategy: `class` in Tailwind config
- [ ] 7.4.2 **P0** — Add `ThemeProvider` with `light`/`dark`/`system` options
- [ ] 7.4.3 **P0** — Persist preference in localStorage
- [ ] 7.4.4 **P0** — Apply `dark` class on `<html>` element
- [ ] 7.4.5 **P0** — Define dark mode overrides in globals.css:
  - `--color-cream` → `#0a0e0c` (near-black forest)
  - `--color-cream-dark` → `#0f1411`
  - `--color-ink` → `#faf7f2` (cream becomes text)
  - `--color-ink-soft` → `rgba(250,247,242,0.7)`
  - `--color-ink-muted` → `rgba(250,247,242,0.5)`
  - `--color-surface` → `#0f1411`
  - `--color-line` → `rgba(250,247,242,0.1)`
- [ ] 7.4.6 **P0** — Bento cards in dark mode:
  - `bento-light` → dark surface with subtle border
  - `bento-dark` → even darker (forest-900)
  - `bento-gold` stays gold
  - `bento-warm` → warm dark surface
- [ ] 7.4.7 **P0** — Aurora background: invert blobs (forest blobs become lighter)
- [ ] 7.4.8 **P0** — Add toggle button in sidebar footer + settings
- [ ] 7.4.9 **P0** — Animate toggle: sun ↔ moon icon morph
- [ ] 7.4.10 **P0** — Add `prefers-color-scheme: dark` default if system
- [ ] 7.4.11 **P0** — Audit every component: ensure readable in dark
- [ ] 7.4.12 **P0** — Test: toggle works, no flash of wrong theme on reload (set class in script tag before paint)
- [ ] 7.4.13 **P1** — Add theme transition: 200ms ease on all color properties
- [ ] 7.4.14 **P1** — Add auto-dark based on time of day (sunset/sunrise)

**Definition of done:** Click toggle → entire app switches to dark forest theme smoothly → preference persists → no contrast issues.

---

### 7.5 Accessibility Contrast Audit — P0

**Goal:** WCAG AA compliance (4.5:1 for body text, 3:1 for large/UI).

- [ ] 7.5.1 **P0** — Run Lighthouse accessibility audit on each page
- [ ] 7.5.2 **P0** — Fix `--color-ink-muted: #8a8a8a` on white → fails AA (3.96:1) → darken to `#6e6e6e` (5.04:1)
- [ ] 7.5.3 **P0** — Fix `--color-ink-muted` on `--color-cream` → similar
- [ ] 7.5.4 **P0** — Verify all `text-xs` (12px) text uses ≥4.5:1 contrast
- [ ] 7.5.5 **P0** — Verify gold text on dark background passes (gold-300 on forest-600)
- [ ] 7.5.6 **P0** — Verify clay on white passes
- [ ] 7.5.7 **P0** — Use WebAIM Contrast Checker for manual checks
- [ ] 7.5.8 **P0** — Add `aria-label` to all icon-only buttons
- [ ] 7.5.9 **P0** — Add `aria-label` to all `<motion.div>` acting as buttons
- [ ] 7.5.10 **P0** — Add `role="status"` to toasts
- [ ] 7.5.11 **P0** — Add `role="alert"` to error messages
- [ ] 7.5.12 **P0** — Add `aria-live="polite"` to loading indicators
- [ ] 7.5.13 **P0** — Verify focus visible on all interactive elements (already have `*:focus-visible`)
- [ ] 7.5.14 **P0** — Test keyboard navigation: tab through every page, verify logical order
- [ ] 7.5.15 **P0** — Test with screen reader (VoiceOver/NVDA) — main flows
- [ ] 7.5.16 **P1** — Add skip-to-content link at top of page
- [ ] 7.5.17 **P1** — Add `lang` attribute properly (already have `lang="en"`)
- [ ] 7.5.18 **P1** — Add `aria-current="page"` to active nav item
- [ ] 7.5.19 **P2** — Test with switch access (for motor disabilities)

**Definition of done:** Lighthouse a11y score ≥ 95 on all pages. Manual screen reader test passes for upload → verify → see score flow.

---

### 7.6 Tertiary Accent Color — P1

**Goal:** Add variety without breaking identity.

- [ ] 7.6.1 — Define `--color-sky: #3b82f6` (info)
- [ ] 7.6.2 — Define `--color-sky-soft: rgba(59,130,246,0.1)`
- [ ] 7.6.3 — Use for: info badges, neutral chart segments, "new" badges
- [ ] 7.6.4 — Don't overuse — limit to ≤5% of UI surface
- [ ] 7.6.5 — Add to semantic tokens (§7.2)
- [ ] 7.6.6 — Verify it harmonizes with forest+gold (use Adobe Color)
- [ ] 7.6.7 — Add sky scale (50-950)

**Definition of done:** Info badges use sky blue, charts have 8th color, palette still cohesive.

---

## 8. Etc — Engineering Rigor

### 8.1 Vitest Unit Tests — P0

**Goal:** Test the 3 engines (pure functions, easy wins).

- [ ] 8.1.1 **P0** — `bun add -d vitest @vitest/coverage-v8 @vitest/ui`
- [ ] 8.1.2 **P0** — Create `vitest.config.ts` with React + path aliases
- [ ] 8.1.3 **P0** — Add `test` script: `vitest run` + `test:watch`: `vitest`
- [ ] 8.1.4 **P0** — Add `test:coverage`: `vitest run --coverage`
- [ ] 8.1.5 **P0** — Create `src/lib/__tests__/tax-engine.test.ts`
- [ ] 8.1.6 **P0** — Test: `computeTax(income=250000, regime='new')` returns `0` (below basic exemption)
- [ ] 8.1.7 **P0** — Test: `computeTax(income=500000, regime='new')` returns correct tax
- [ ] 8.1.8 **P0** — Test: `computeTax(income=1000000, regime='new')` returns correct tax
- [ ] 8.1.9 **P0** — Test: `computeTax(income=1500000, regime='new')` returns correct tax
- [ ] 8.1.10 **P0** — Test: same incomes for `regime='old'` with various deductions
- [ ] 8.1.11 **P0** — Test: edge case `income=0` → `0`
- [ ] 8.1.12 **P0** — Test: edge case `income=NaN` → throws or returns 0
- [ ] 8.1.13 **P0** — Test: `compareRegimes(oldTax, newTax)` returns correct recommendation + savings
- [ ] 8.1.14 **P0** — Test: `computeScore(...)` returns 0-100 with correct breakdown
- [ ] 8.1.15 **P0** — Test: `detectMissingDocuments(...)` returns correct list
- [ ] 8.1.16 **P0** — Create `src/lib/__tests__/finance-engine.test.ts`
- [ ] 8.1.17 **P0** — Test: `computeSavingsRate(income=100, expenses=80)` → `20`
- [ ] 8.1.18 **P0** — Test: `computeDebtToIncome(income=100, debt=30)` → `30`
- [ ] 8.1.19 **P0** — Test: `computeEmergencyFundMonths(expenses=50k, fund=200k)` → `4`
- [ ] 8.1.20 **P0** — Test: `computeScore(...)` weighted correctly
- [ ] 8.1.21 **P0** — Test: `categorizeTransaction("SWIGGY BANGALORE")` → `"Food"`
- [ ] 8.1.22 **P0** — Test: `categorizeTransaction("AMAZON IN")` → `"Shopping"`
- [ ] 8.1.23 **P0** — Test all 13 categories
- [ ] 8.1.24 **P0** — Create `src/lib/__tests__/goal-engine.test.ts`
- [ ] 8.1.25 **P0** — Test: `projectGoal(current=0, monthly=10k, rate=0.04, target=100k)` → correct months
- [ ] 8.1.26 **P0** — Test: `projectGoal` with already-completed goal (current > target) → 0 months
- [ ] 8.1.27 **P0** — Test: `computeShortfall(...)` returns correct amount
- [ ] 8.1.28 **P0** — Test: edge case `monthly=0` → infinite (handle gracefully)
- [ ] 8.1.29 **P0** — Create `src/lib/__tests__/auth.test.ts`
- [ ] 8.1.30 **P0** — Test: `hashPassword` + `verifyPassword` round-trip
- [ ] 8.1.31 **P0** — Test: `createToken` returns valid JWT
- [ ] 8.1.32 **P0** — Test: `verifyToken` accepts valid, rejects expired, rejects tampered
- [ ] 8.1.33 **P0** — Test: `revokeToken` adds to RevokedToken, verify rejects after
- [ ] 8.1.34 **P0** — Create `src/lib/__tests__/security.test.ts`
- [ ] 8.1.35 **P0** — Test: `checkRateLimit` allows N, blocks N+1
- [ ] 8.1.36 **P0** — Test: `checkRateLimit` resets after window
- [ ] 8.1.37 **P0** — Test: `getClientIp` from various headers (X-Forwarded-For, X-Real-IP, etc.)
- [ ] 8.1.38 **P0** — Test: `validateOrigin` accepts same origin, rejects cross
- [ ] 8.1.39 **P0** — Create `src/lib/parsers/__tests__/bank-statement.test.ts`
- [ ] 8.1.40 **P0** — Test: `detectBankFormat` for each known bank
- [ ] 8.1.41 **P0** — Test: `normalizeDate` for each format
- [ ] 8.1.42 **P0** — Test: `normalizeAmount` for each edge case
- [ ] 8.1.43 **P0** — Test: full pipeline with sample HDFC CSV
- [ ] 8.1.44 **P0** — Create `src/lib/__tests__/format.test.ts`
- [ ] 8.1.45 **P0** — Test: `formatINR(123456)` → `"₹1,23,456"`
- [ ] 8.1.46 **P0** — Test: `formatINR(0)` → `"₹0"`
- [ ] 8.1.47 **P0** — Test: `formatINR(-500)` → handles negative
- [ ] 8.1.48 **P0** — Test: `formatPercent(22.5)` → `"22.5%"`
- [ ] 8.1.49 **P0** — Test: `formatDate`, `formatDateTime`, `formatBytes`
- [ ] 8.1.50 **P0** — Target: 80% coverage on `src/lib/`
- [ ] 8.1.51 **P1** — Add coverage gate in CI: fail if < 70%
- [ ] 8.1.52 **P1** — Add coverage badge to README
- [ ] 8.1.53 **P1** — Set up Vitest UI for dev: `vitest --ui`

**Definition of done:** `bun run test` passes 50+ tests. `bun run test:coverage` shows ≥80% on `src/lib/`.

---

### 8.2 Playwright E2E Tests — P0

**Goal:** Cover critical user flows.

- [ ] 8.2.1 **P0** — `bun add -d @playwright/test`
- [ ] 8.2.2 **P0** — `bunx playwright install --with-deps chromium`
- [ ] 8.2.3 **P0** — Create `playwright.config.ts` — base URL `http://localhost:3000`
- [ ] 8.2.4 **P0** — Add `e2e` script: `playwright test`
- [ ] 8.2.5 **P0** — Create `e2e/auth.spec.ts`
- [ ] 8.2.6 **P0** — Test: login with valid creds → redirects to dashboard
- [ ] 8.2.7 **P0** — Test: login with invalid creds → shows error
- [ ] 8.2.8 **P0** — Test: register new user → logs in
- [ ] 8.2.9 **P0** — Test: logout → back to login screen
- [ ] 8.2.10 **P0** — Test: rate limit blocks after 5 failed attempts
- [ ] 8.2.11 **P0** — Create `e2e/documents.spec.ts`
- [ ] 8.2.12 **P0** — Test: upload document → appears in list
- [ ] 8.2.13 **P0** — Test: verify fields → status updates
- [ ] 8.2.14 **P0** — Test: delete document → removed from list
- [ ] 8.2.15 **P0** — Test: upload invalid file → shows error
- [ ] 8.2.16 **P0** — Create `e2e/tax.spec.ts`
- [ ] 8.2.17 **P0** — Test: tax summary loads → shows score
- [ ] 8.2.18 **P0** — Test: regime comparison displays
- [ ] 8.2.19 **P0** — Test: missing documents section
- [ ] 8.2.20 **P0** — Create `e2e/finance.spec.ts`
- [ ] 8.2.21 **P0** — Test: finance summary loads → shows score
- [ ] 8.2.22 **P0** — Test: emergency fund input updates metrics
- [ ] 8.2.23 **P0** — Create `e2e/goals.spec.ts`
- [ ] 8.2.24 **P0** — Test: create goal → appears in list
- [ ] 8.2.25 **P0** — Test: delete goal → removed
- [ ] 8.2.26 **P0** — Create `e2e/assistant.spec.ts`
- [ ] 8.2.27 **P0** — Test: ask question → gets response
- [ ] 8.2.28 **P0** — Test: suggestion chips send question
- [ ] 8.2.29 **P0** — Create `e2e/reports.spec.ts`
- [ ] 8.2.30 **P0** — Test: generate tax report → downloads PDF
- [ ] 8.2.31 **P0** — Create `e2e/settings.spec.ts`
- [ ] 8.2.32 **P0** — Test: export data → downloads JSON
- [ ] 8.2.33 **P0** — Test: revoke consent → updates UI
- [ ] 8.2.34 **P0** — Create `e2e/navigation.spec.ts`
- [ ] 8.2.35 **P0** — Test: each nav item navigates correctly
- [ ] 8.2.36 **P0** — Test: command palette (Cmd+K) opens
- [ ] 8.2.37 **P0** — Test: mobile nav works
- [ ] 8.2.38 **P0** — Add HTML report generation
- [ ] 8.2.39 **P0** — Add screenshots on failure
- [ ] 8.2.40 **P0** — Add video on failure
- [ ] 8.2.41 **P0** — Add trace on failure
- [ ] 8.2.42 **P1** — Add visual regression tests with `toHaveScreenshot()`
- [ ] 8.2.43 **P1** — Add performance tests (Lighthouse integration)
- [ ] 8.2.44 **P1** — Run E2E in CI on every PR

**Definition of done:** `bun run e2e` runs 25+ tests, all pass. CI runs them on every push.

---

### 8.3 CI/CD Pipeline — P0

**Goal:** GitHub Actions: lint + typecheck + test on every push.

- [ ] 8.3.1 **P0** — Create `.github/workflows/ci.yml`
- [ ] 8.3.2 **P0** — Trigger: `push` to any branch, `pull_request` to main
- [ ] 8.3.3 **P0** — Job 1: lint — `bun install`, `bun run lint`
- [ ] 8.3.4 **P0** — Job 2: typecheck — `bunx tsc --noEmit`
- [ ] 8.3.5 **P0** — Job 3: unit tests — `bun run test:coverage`
- [ ] 8.3.6 **P0** — Job 4: build — `bun run build`
- [ ] 8.3.7 **P0** — Run jobs in parallel where possible
- [ ] 8.3.8 **P0** — Cache `node_modules` and `.next/cache` between runs
- [ ] 8.3.9 **P0** — Use `actions/setup-node@v4` with `bun` cache
- [ ] 8.3.10 **P0** — Upload coverage report as artifact
- [ ] 8.3.11 **P0** — Upload build artifact
- [ ] 8.3.12 **P0** — Fail PR if any job fails
- [ ] 8.3.13 **P0** — Create `.github/workflows/e2e.yml`
- [ ] 8.3.14 **P0** — Run on PR to main
- [ ] 8.3.15 **P0** — Start dev server, wait for ready, run Playwright
- [ ] 8.3.16 **P0** — Upload HTML report on failure
- [ ] 8.3.17 **P0** — Create `.github/workflows/deploy.yml`
- [ ] 8.3.18 **P0** — Trigger: push to main (after CI passes)
- [ ] 8.3.19 **P0** — Build Docker image, push to registry (GHCR)
- [ ] 8.3.20 **P0** — Deploy to staging
- [ ] 8.3.21 **P1** — Add branch protection: require CI pass before merge
- [ ] 8.3.22 **P1** — Add dependabot config for security updates
- [ ] 8.3.23 **P1** — Add codeQL analysis
- [ ] 8.3.24 **P1** — Add bundle size check: fail if first-load JS grows >10%
- [ ] 8.3.25 **P2** — Add preview deployments per PR

**Definition of done:** Open PR → GitHub Actions runs lint + typecheck + tests + build → all must pass before merge.

---

### 8.4 API Documentation (OpenAPI) — P1

**Goal:** Auto-generated API docs.

- [ ] 8.4.1 — `bun add -d swagger-jsdoc`
- [ ] 8.4.2 — Or hand-write `openapi.yaml` for the 13+ endpoints
- [ ] 8.4.3 — Document each endpoint: method, path, params, body, responses, auth required
- [ ] 8.4.4 — Add `src/app/api-doc/page.tsx` serving Swagger UI
- [ ] 8.4.5 — Or use `redocly` for nicer docs
- [ ] 8.4.6 — Add examples for each endpoint
- [ ] 8.4.7 — Add error response schemas
- [ ] 8.4.8 — Document auth scheme (Bearer JWT)
- [ ] 8.4.9 — Document rate limit headers
- [ ] 8.4.10 — Generate TypeScript types from OpenAPI schema
- [ ] 8.4.11 — Verify types match actual API (use `openapi-typescript`)
- [ ] 8.4.12 — Add `/api-doc` link in settings (admin only? or all users?)
- [ ] 8.4.13 — Add Postman collection export

**Definition of done:** Visit `/api-doc` → see all endpoints with try-it-out functionality.

---

### 8.5 README Rewrite — P0

**Goal:** Tell the story, document architecture.

- [ ] 8.5.1 **P0** — Rewrite `README.md` from scratch
- [ ] 8.5.2 **P0** — Add hero section: project name, one-line description, badges (build, coverage, license)
- [ ] 8.5.3 **P0** — Add "Why FinSight AI?" section: problem statement, solution
- [ ] 8.5.4 **P0** — Add features list with screenshots
- [ ] 8.5.5 **P0** — Add "Quick Start" section: prereqs, install, env, run
- [ ] 8.5.6 **P0** — Add architecture diagram (use Mermaid or ASCII art)
- [ ] 8.5.7 **P0** — Document tech stack with rationale per choice
- [ ] 8.5.8 **P0** — Document security model: auth, rate limit, CSP, OWASP fixes
- [ ] 8.5.9 **P0** — Document scaling path: SQLite→Postgres, local→S3, in-memory→Redis
- [ ] 8.5.10 **P0** — Add API documentation link
- [ ] 8.5.11 **P0** — Add deployment guide (Docker)
- [ ] 8.5.12 **P0** — Add testing guide
- [ ] 8.5.13 **P0** — Add contributing guide (even if solo — shows discipline)
- [ ] 8.5.14 **P0** — Add license
- [ ] 8.5.15 **P0** — Add "Roadmap" section: link to this improvement plan
- [ ] 8.5.16 **P0** — Add "Acknowledgments" section
- [ ] 8.5.17 **P0** — Add table of contents
- [ ] 8.5.18 **P1** — Add demo video link
- [ ] 8.5.19 **P1** — Add multi-language (Hindi) version
- [ ] 8.5.20 **P1** — Add GitHub social preview image

**Definition of done:** Faculty opens README → in 5 minutes understands what the project is, how it's built, why decisions were made, how to run it.

---

### 8.6 Error Monitoring (Sentry) — P1

**Goal:** Catch production errors.

- [ ] 8.6.1 — `bun add @sentry/nextjs`
- [ ] 8.6.2 — Run `bunx @sentry/wizard@latest -i nextjs` for setup
- [ ] 8.6.3 — Add `SENTRY_DSN` env var
- [ ] 8.6.4 — Configure `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] 8.6.5 — Add source maps upload in CI
- [ ] 8.6.6 — Add release tracking (git commit SHA)
- [ ] 8.6.7 — Add user context (userId, email on auth)
- [ ] 8.6.8 — Add breadcrumb for nav changes
- [ ] 8.6.9 — Add tag for environment (dev/staging/prod)
- [ ] 8.6.10 — Filter out 404 errors
- [ ] 8.6.11 — Set sample rate: 100% in dev, 10% in prod
- [ ] 8.6.12 — Add Sentry to error boundaries (§5.8)
- [ ] 8.6.13 — Add performance monitoring (transactions)
- [ ] 8.6.14 — Add custom transaction for API routes
- [ ] 8.6.15 — Set up alerting: Slack/Discord webhook on new error
- [ ] 8.6.16 — Test: throw error in dev → see it in Sentry dashboard

**Definition of done:** Any unhandled error in prod → appears in Sentry within 30s with full stack trace + user context.

---

### 8.7 Analytics (PostHog) — P1

**Goal:** See which features users actually use.

- [ ] 8.7.1 — `bun add posthog-js posthog-node`
- [ ] 8.7.2 — Sign up for PostHog Cloud (free tier) or self-host
- [ ] 8.7.3 — Add `NEXT_PUBLIC_POSTHOG_KEY` env var
- [ ] 8.7.4 — Create `src/lib/analytics.ts` — `track(event, properties)` function
- [ ] 8.7.5 — Initialize PostHog in `layout.tsx`
- [ ] 8.7.6 — Track page views (automatic with PostHog)
- [ ] 8.7.7 — Track: `document_uploaded`, `document_verified`, `report_generated`, `goal_created`, `ai_question_asked`
- [ ] 8.7.8 — Track: `nav_clicked` with page name
- [ ] 8.7.9 — Track: `onboarding_step_X`, `onboarding_completed`, `onboarding_skipped`
- [ ] 8.7.10 — Identify user after login (userId, email, role)
- [ ] 8.7.11 — Add session recording (opt-in)
- [ ] 8.7.12 — Add feature flags for A/B tests
- [ ] 8.7.13 — Create dashboard: DAU, feature usage, funnel (signup → upload → score)
- [ ] 8.7.14 — Add privacy notice in settings: "We use analytics to improve the app"
- [ ] 8.7.15 — Add opt-out toggle in settings
- [ ] 8.7.16 — Respect Do Not Track header

**Definition of done:** Use app for a day → PostHog dashboard shows feature usage, funnel conversion, retention.

---

### 8.8 Privacy Policy + Terms — P1

**Goal:** Show maturity, required for production.

- [ ] 8.8.1 — Create `src/app/legal/privacy/page.tsx`
- [ ] 8.8.2 — Privacy policy: what data collected, how used, how stored, user rights (GDPR-style), contact
- [ ] 8.8.3 — Create `src/app/legal/terms/page.tsx`
- [ ] 8.8.4 — Terms of service: acceptable use, disclaimers (not financial advice), limitation of liability
- [ ] 8.8.5 — Add footer links on login + settings
- [ ] 8.8.6 — Add "Last updated" date
- [ ] 8.8.7 — Have a lawyer review (or use a template + disclaimer)
- [ ] 8.8.8 — Add checkbox on register: "I agree to Privacy Policy and Terms"
- [ ] 8.8.9 — Store consent timestamp in `User` model
- [ ] 8.8.10 — Add data processing agreement template for B2B

**Definition of done:** Footer shows Privacy + Terms links → readable policies → registration requires consent.

---

### 8.9 Backup/Restore Script — P1

**Goal:** Don't lose user data.

- [ ] 8.9.1 — Create `scripts/backup.ts`
- [ ] 8.9.2 — Dump SQLite DB to timestamped file in `backups/`
- [ ] 8.9.3 — Or use `pg_dump` for Postgres
- [ ] 8.9.4 — Also backup `storage/` directory (documents)
- [ ] 8.9.5 — Compress to `.tar.gz`
- [ ] 8.9.6 — Upload to S3 (if configured)
- [ ] 8.9.7 — Retention: keep last 30 daily backups
- [ ] 8.9.8 — Create `scripts/restore.ts`
- [ ] 8.9.9 — Accept backup file path as arg
- [ ] 8.9.10 — Stop app, restore DB + files, restart
- [ ] 8.9.11 — Add cron: daily 2am backup
- [ ] 8.9.12 — Add `backup` script to package.json
- [ ] 8.9.13 — Test restore on fresh environment
- [ ] 8.9.14 — Document disaster recovery procedure

**Definition of done:** Run `bun run scripts/backup.ts` → `backups/2024-01-15.tar.gz` created → can restore on new machine.

---

### 8.10 Type Safety Audit — P0

**Goal:** Eliminate `any` types.

- [ ] 8.10.1 **P0** — `grep -rn ": any" src/ | wc -l` — count current
- [ ] 8.10.2 **P0** — `grep -rn "as any" src/` — find type assertions
- [ ] 8.10.3 **P0** — Fix `page.tsx` `renderPage(page: string, navigate: (p: any, params?: any) => void)` → use proper types
- [ ] 8.10.4 **P0** — Fix `document-verify.tsx` `params.id as string` → validate
- [ ] 8.10.5 **P0** — Fix `goals.tsx` `Object.entries(data.income_summary)` → type the values
- [ ] 8.10.6 **P0** — Fix `assistant.tsx` `data.answer || "..."` → type the API response
- [ ] 8.10.7 **P0** — Add ESLint rule: `no-explicit-any` as error
- [ ] 8.10.8 **P0** — Add ESLint rule: `no-unsafe-assignment` as warn
- [ ] 8.10.9 **P0** — Add `strict: true` in tsconfig (verify already set)
- [ ] 8.10.10 **P0** — Add `noUncheckedIndexedAccess: true` in tsconfig
- [ ] 8.10.11 **P0** — Fix all type errors from strict mode
- [ ] 8.10.12 **P0** — Generate types from Prisma (already done via `prisma generate`)
- [ ] 8.10.13 **P0** — Generate types from OpenAPI (if §8.4 done)
- [ ] 8.10.14 **P0** — Add `tsc --noEmit` to CI (§8.3)
- [ ] 8.10.15 **P1** — Add `eslint-plugin-typecheck` for runtime type validation
- [ ] 8.10.16 **P1** — Replace `any` in third-party API responses with `unknown` + narrow

**Definition of done:** `grep -rn ": any" src/` returns 0 (or < 5 with justification). `tsc --noEmit` passes with strict.

---

### 8.11 i18n Foundation — P1

**Goal:** Structure for Hindi/Tamil addition later.

- [ ] 8.11.1 — `bun add next-intl`
- [ ] 8.11.2 — Create `messages/en.json` with all UI strings
- [ ] 8.11.3 — Categorize: `nav`, `auth`, `dashboard`, `tax`, `finance`, `goals`, `assistant`, `reports`, `settings`, `common`
- [ ] 8.11.4 — Replace all hardcoded strings with `t('key')` calls
- [ ] 8.11.5 — Create `messages/hi.json` (Hindi) — even if partial
- [ ] 8.11.6 — Add language switcher in settings
- [ ] 8.11.7 — Persist language in localStorage
- [ ] 8.11.8 — Detect browser language on first visit
- [ ] 8.11.9 — Add RTL support (for Urdu/Arabic future)
- [ ] 8.11.10 — Add `lang` attribute update on switch
- [ ] 8.11.11 — Translate numbers (Indian digit grouping already done)
- [ ] 8.11.12 — Translate currency symbol (₹ stays)
- [ ] 8.11.13 — Add date format per locale
- [ ] 8.11.14 — Document translation process for contributors
- [ ] 8.11.15 — Add Tamil (`ta.json`) partial

**Definition of done:** Switch to Hindi → all UI text in Hindi → switch back to English → all back. Easy to add more languages.

---

### 8.12 Performance Monitoring — P1

**Goal:** Track real user metrics.

- [ ] 8.12.1 — Add Web Vitals tracking: `next/web-vitals`
- [ ] 8.12.2 — Report LCP, FID, CLS, FCP, TTFB to analytics (PostHog or Sentry)
- [ ] 8.12.3 — Add server-side timing: response time per API route
- [ ] 8.12.4 — Add `Server-Timing` header
- [ ] 8.12.5 — Add DB query timing
- [ ] 8.12.6 — Add alerting: p95 > 500ms → Slack
- [ ] 8.12.7 — Add uptime monitoring (UptimeRobot free)
- [ ] 8.12.8 — Add status page (status.finsight.ai)
- [ ] 8.12.9 — Add Lighthouse CI to GitHub Actions
- [ ] 8.12.10 — Set budgets: LCP < 2.5s, CLS < 0.1, FID < 100ms

**Definition of done:** Open PostHog → see real Web Vitals from users. p95 API response times tracked.

---

### 8.13 Dependency Audit — P0

**Goal:** Security + bloat.

- [ ] 8.13.1 **P0** — `bun audit` — check for vulnerabilities
- [ ] 8.13.2 **P0** — Fix all high/critical vulnerabilities
- [ ] 8.13.3 **P0** — `bunx npm-check-updates` — see outdated
- [ ] 8.13.4 **P0** — Update Next.js to latest 16.x patch
- [ ] 8.13.5 **P0** — Update React to latest 19.x
- [ ] 8.13.6 **P0** — Update Prisma to latest
- [ ] 8.13.7 **P0** — Verify no breaking changes after each update
- [ ] 8.13.8 **P0** — Add `bun audit` to CI
- [ ] 8.13.9 **P0** — Add Dependabot config
- [ ] 8.13.10 **P0** — Remove unused deps: `bunx depcheck`
- [ ] 8.13.11 **P0** — Remove `@fontsource-variable/inter` (using Geist now)
- [ ] 8.13.12 **P0** — Remove `@fontsource/jetbrains-mono` (using Geist Mono)
- [ ] 8.13.13 **P0** — Remove `recharts` (replaced with custom SVG) — verify no usages
- [ ] 8.13.14 **P0** — Remove `tailwindcss-animate` (using `tw-animate-css`? or neither?)
- [ ] 8.13.15 **P0** — Verify `sharp` is actually used (it is, for image opt)
- [ ] 8.13.16 **P1** — Replace `bcryptjs` with `bcrypt` (native, faster) — but adds native build complexity
- [ ] 8.13.17 **P1** — Add `license-checker` to CI — fail on GPL/incompatible licenses

**Definition of done:** `bun audit` shows 0 vulnerabilities. `depcheck` shows 0 unused deps. All deps on latest minor.

---

### 8.14 Documentation Site — P2

**Goal:** External docs site for users + devs.

- [ ] 8.14.1 — Use Mintlify or Docusaurus
- [ ] 8.14.2 — Or simple Next.js app at `/docs`
- [ ] 8.14.3 — User docs: getting started, features, FAQ, troubleshooting
- [ ] 8.14.4 — Dev docs: architecture, contributing, API reference
- [ ] 8.14.5 — Add search (Algolia free tier)
- [ ] 8.14.6 — Add analytics
- [ ] 8.14.7 — Add feedback widget ("Was this helpful?")
- [ ] 8.14.8 — Add edit on GitHub links
- [ ] 8.14.9 — Deploy on Vercel

**Definition of done:** Visit `/docs` → see categorized documentation → search works → helpful for both users and devs.

---

### 8.15 Code Quality Rules — P0

**Goal:** Consistent code style.

- [ ] 8.15.1 **P0** — Use existing ESLint config (Next.js default)
- [ ] 8.15.2 **P0** — Add custom rules: no console.log in production (warn)
- [ ] 8.15.3 **P0** — Add `eslint-plugin-unused-imports`
- [ ] 8.15.4 **P0** — Add `eslint-plugin-import` for order enforcement
- [ ] 8.15.5 **P0** — Configure import order: react → next → third-party → @/ → relative
- [ ] 8.15.6 **P0** — Add Prettier
- [ ] 8.15.7 **P0** — Create `.prettierrc`: 2 spaces, single quotes, trailing comma, 100 char width
- [ ] 8.15.8 **P0** — Run `bunx prettier --write .` once to format everything
- [ ] 8.15.9 **P0** — Add `lint-staged` config
- [ ] 8.15.10 **P0** — Add `husky` pre-commit hook
- [ ] 8.15.11 **P0** — Pre-commit: lint + format staged files
- [ ] 8.15.12 **P0** — Add `commitlint` with conventional commits
- [ ] 8.15.13 **P0** — Document commit format in CONTRIBUTING.md
- [ ] 8.15.14 **P1** — Add `eslint-plugin-jsx-a11y` for accessibility linting
- [ ] 8.15.15 **P1** — Add `eslint-plugin-security` for security linting

**Definition of done:** `git commit` → husky runs lint+format → fails if issues. All commits use conventional format.

---

## Summary: Priority Sequencing

### Week 1 (Faculty-Critical Wins)
- §5.1 Empty states with personality
- §5.2 Skeleton screens everywhere
- §5.3 Confirmation dialogs
- §8.1 Vitest unit tests (3 engines)
- §8.2 Playwright E2E (auth + upload + score flow)
- §6.1 First-run onboarding flow
- §7.1 Tonal scales
- §7.5 Accessibility contrast audit

### Week 2 (Strategic Depth)
- §1.1 Bank statement parser (real finance engine)
- §1.4 Password reset
- §1.7 Bulk upload
- §2.1 Command palette
- §2.7 Tax saving suggestions
- §3.1 Code-split views
- §3.2 SWR caching
- §3.4 Prisma N+1 audit
- §4.2 File storage abstraction
- §4.5 JWT refresh tokens
- §4.7 Health checks
- §7.4 Dark mode

### Week 3 (Polish + Scale)
- §1.2 Capital gains
- §1.5 Budgets
- §1.6 Recurring detection
- §2.5 SIP/retirement calculators
- §2.6 Net worth tracker
- §2.10 Notification center
- §3.5 Bundle analyzer
- §3.8 DB indexes (verify)
- §4.1 Postgres migration path
- §4.3 Redis rate limiter
- §4.4 Background jobs
- §4.8 Containerization
- §8.3 CI/CD pipeline
- §8.5 README rewrite

### Week 4 (Delight + Maturity)
- §2.3 Achievements & streaks
- §2.4 Share report links
- §2.8 Voice input
- §4.6 WebSocket real-time
- §5.4 Keyboard shortcuts
- §5.5 Mobile bottom nav
- §5.11 Custom form inputs
- §6.3 Journey timeline
- §6.5 Weekly digest
- §8.6 Sentry
- §8.7 PostHog analytics
- §8.8 Privacy/Terms
- §8.11 i18n foundation
- §8.13 Dependency audit

---

## How to Execute This Plan

1. **Don't try to do everything at once.** Pick a week, work through it sequentially.
2. **Tick boxes as you go.** The psychological win of ticking matters.
3. **Run tests after each sub-section.** Don't accumulate breakage.
4. **Commit per sub-section.** Conventional commit format: `feat(tax): add capital gains computation`, `fix(auth): refresh token rotation`, `chore(deps): remove unused recharts`.
5. **If you get blocked on a step, skip it and come back.** Don't let one step block 50 others.
6. **After each week, demo to someone.** Faculty, friend, yourself on a fresh account. Notice what confuses them.
7. **Update this document.** As you complete steps, add notes. As you discover new improvements, add new sections.

**Estimated total effort:** 200-300 focused hours for a solo developer. Compressable to 80-100 hours if you skip P2 items and parallelize where possible.

---

*End of plan.*

/**
 * Generate: ARTHA Pre-Deployment & Professional Use Plan
 * Style: Tech minimal (DM-1 Deep Cyan palette, R1 cover recipe)
 * Output: /home/z/my-project/download/ARTHA-Deployment-Plan.docx
 */

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, TableLayoutType, WidthType,
  BorderStyle, ShadingType, TabStopType, TabStopPosition,
  TableOfContents, NumberFormat, PageOrientation, LevelFormat,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────
// PALETTE — DM-1 Deep Cyan (tech / AI / digital)
// ─────────────────────────────────────────────────────────────────────
const P = {
  bg: "162235",
  primary: "FFFFFF",
  accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
  // Body palette (white pages)
  bodyText: "1A2B40",
  headingColor: "0A1628",
  secondary: "6878A0",
  codeBg: "F4F8FC",
  codeText: "0A1628",
  rule: "C8DDE2",
  inlineCode: "1B6B7A",
  // Code fonts — choose universally-installed fonts to avoid fallback warnings
  codeFontAscii: "Consolas",
  codeFontEastAsia: "NSimSun",
};

// ─────────────────────────────────────────────────────────────────────
// BORDERS — mandatory allNoBorders for cover wrapper
// ─────────────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ─────────────────────────────────────────────────────────────────────
// HELPERS — calcTitleLayout, splitTitleLines, calcCoverSpacing
// (copied verbatim from design-system.md)
// ─────────────────────────────────────────────────────────────────────
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([
    ..."，。、；：！？", ..."的与和及之在于为", ..."-_—–·/", ..." \t",
  ]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) {
      breakAt = charsPerLine;
      const prevChar = remaining[breakAt - 1];
      const nextChar = remaining[breakAt];
      if (prevChar && nextChar && !breakAfter.has(prevChar) && !breakAfter.has(nextChar) &&
          /[\u4e00-\u9fff]/.test(prevChar) && /[\u4e00-\u9fff]/.test(nextChar)) {
        breakAt = breakAt - 1;
      }
    }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838,
    marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

// ─────────────────────────────────────────────────────────────────────
// COVER — R1 Pure Paragraph Cover (Left-Aligned), DM-1 palette
// ─────────────────────────────────────────────────────────────────────
function buildCoverR1(config) {
  const Pc = config.palette; // cover palette
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: Pc.accent, space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  // 2. English label with accent bottom border
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: Pc.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "),
        size: 18, color: Pc.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }

  // 3. Main title
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: Pc.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }

  // 4. Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: Pc.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  // 5. Meta info lines with left accent border
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: Pc.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  // 6. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  // 7. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: Pc.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: Pc.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: Pc.footerColor, font: { ascii: "Arial" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: Pc.bg }, borders: noBorders, children,
      })],
    })],
  })];
}

// ─────────────────────────────────────────────────────────────────────
// BODY HELPERS
// ─────────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 360, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 32, color: P.headingColor,
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160, line: 320, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 28, color: P.headingColor,
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 300, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 24, color: P.headingColor,
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: opts.after || 120 },
    children: [new TextRun({ text, size: 22, color: P.bodyText,
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function bullet(text, level = 0) {
  // Inline-code support: split text on `...` markers
  const parts = [];
  let i = 0;
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf("`", cursor);
    if (start === -1) { parts.push({ text: text.slice(cursor), code: false }); break; }
    if (start > cursor) parts.push({ text: text.slice(cursor, start), code: false });
    const end = text.indexOf("`", start + 1);
    if (end === -1) { parts.push({ text: text.slice(start), code: false }); break; }
    parts.push({ text: text.slice(start + 1, end), code: true });
    cursor = end + 1;
  }
  const runs = parts.map(p => p.code
    ? new TextRun({ text: p.text, size: 20, color: P.inlineCode,
        font: { ascii: P.codeFontAscii, eastAsia: P.codeFontEastAsia },
        shading: { type: ShadingType.CLEAR, fill: P.codeBg } })
    : new TextRun({ text: p.text, size: 22, color: P.bodyText,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })
  );
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: runs,
  });
}

function codeBlock(code, language = "") {
  // Each line becomes a paragraph with surface background + monospace font
  const lines = code.split("\n");
  const out = [];
  // Top spacer paragraph with shaded background as a "header"
  for (let i = 0; i < lines.length; i++) {
    const isLast = i === lines.length - 1;
    out.push(new Paragraph({
      spacing: { line: 260, lineRule: "atLeast", before: i === 0 ? 120 : 0, after: isLast ? 120 : 0 },
      shading: { type: ShadingType.CLEAR, fill: P.codeBg },
      indent: { left: 200, right: 200 },
      border: i === 0 ? { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent } }
            : isLast ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent } }
            : undefined,
      children: [new TextRun({ text: lines[i] || " ", size: 18, color: P.codeText,
        font: { ascii: P.codeFontAscii, eastAsia: P.codeFontEastAsia } })],
    }));
  }
  return out;
}

function spacer(twips = 100) {
  return new Paragraph({ spacing: { before: twips, after: 0 }, children: [] });
}

// Table builder — percent widths, header row, alternating rows
function buildTable(headers, rows, colWidths) {
  // colWidths: array of percentages, must sum to 100
  const totalCols = headers.length;
  const widths = colWidths || headers.map(() => Math.floor(100 / totalCols));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({ text: h, bold: true, size: 20, color: P.table.headerText,
          font: { ascii: "Calibri", eastAsia: "SimHei" } })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : P.table.surface },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({ text: String(cell == null ? "" : cell), size: 20, color: P.bodyText,
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ─────────────────────────────────────────────────────────────────────
// CONTENT — Executive Summary
// ─────────────────────────────────────────────────────────────────────
function buildExecutiveSummary() {
  const out = [];
  out.push(h1("Executive Summary"));
  out.push(body("ARTHA is currently a feature-rich demo: 308 unit tests passing, all 11 phase modules (entities, tax engine, GST/TDS generators, banking adapters, AI tax advisor, security/RBAC, compliance, SCIM/SSO, multi-tenant, multi-currency) implemented. However, the production build was broken by 9 type errors at the start of this audit; those have now been patched locally but are not committed. The database is SQLite (single-file, no concurrent writes), environment variables are partially wired, no CI/CD pipeline exists, and the previous GitHub PAT was leaked into git history (now stripped, but cached copies may persist in clones/forks)."));
  out.push(body("This document is the punch-list to take ARTHA from a localhost demo to a production-grade deployment. It is organized as 12 phases (Phase 0 through Phase 11), each a checklist of items with inline code/config snippets where needed. After the phases, you'll find a deployment target decision matrix (VPS / AWS / Vercel) and a sequenced timeline with effort estimates."));
  out.push(h2("Top 5 Blockers (must-fix before launch)"));
  out.push(bullet("Commit the 9 build fixes from the audit session — production build is currently broken on `main`."));
  out.push(bullet("Revoke the old `ghp_25uB...` PAT (leaked into git history via an accidental `git add .` of `.git.backup-before-rewrite/`)."));
  out.push(bullet("Migrate off SQLite to Postgres — current `file:./db/custom.db` will corrupt under concurrent writes."));
  out.push(bullet("Set up CI/CD — there is no `.github/workflows/` directory, every commit depends on manual build/test runs."));
  out.push(bullet("Generate real `.env.production` with JWT_SECRET, REDIS_URL, SENTRY_DSN, S3 creds, KMS key — current `.env` has only `DATABASE_URL`."));
  out.push(h2("Recommended Deploy Path"));
  out.push(body("Given ARTHA's current maturity, the VPS route (DigitalOcean/Hetzner droplet + Docker Compose + Cloudflare in front) gets you to launch fastest (~6 working days). The AWS route buys you multi-region scaling and KMS-backed encryption but adds 4–5 days of infra setup. The Vercel route is the simplest but is awkward for a Next.js app that uses long-running workers (BullMQ document parsing) and persistent uploads — you'd need to split the worker process out."));
  out.push(h2("Total Effort"));
  out.push(body("Rough estimate: 50–70 hours of focused solo work to clear Phases 0–10 (pre-deploy), then 30 days of post-launch monitoring/hardening (Phase 11). See the sequenced timeline at the end of this document for breakdown."));
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// PHASE BUILDERS — each returns array of paragraphs/tables
// ─────────────────────────────────────────────────────────────────────
function buildPhase0() {
  const out = [];
  out.push(h1("Phase 0 — Pre-flight: Commit Fixes, Kill Secrets"));
  out.push(body("Estimated effort: 2 hours. Day 0 (do this first, before any other phase). All work in this phase is local repo cleanup that unblocks subsequent phases."));
  out.push(h2("Checklist"));
  out.push(bullet("Commit the 9 build fixes patched in this audit: `z.record(z.any())` → `z.record(z.string(), z.any())` in `src/app/api/entities/route.ts`; broken ternary at `:129`; `citations` type cast in `src/lib/ai/tax-advisor.ts`; import path fix in `src/lib/banking/adapters/index.ts`; `(txn.counterpartyPan?.length ?? 0) > 0` in `src/lib/gst/gstr-generator.ts`; `bun add @aws-sdk/client-ses @sentry/nextjs`; `model: \"glm-5v-turbo\"` added to two `createVision()` calls in `src/lib/parsers/document-extraction.ts`; union narrowing in `src/lib/tax/dtaa-matrix.ts`."));
  out.push(...codeBlock(
`git add -A
git commit -m "fix: 9 production build errors blocking deploy

- Zod v4: z.record() requires key+value schema
- broken ternary in entities/route.ts:129
- type cast for citations[] in tax-advisor.ts
- correct relative import path in banking/adapters/index.ts
- null-coalesce comparison in gstr-generator.ts
- add missing optional deps: @aws-sdk/client-ses, @sentry/nextjs
- pass model param to zai.chat.completions.createVision()
- union type narrowing for DTAA rateEntry.conditions

Build now passes. Tests still 308/308 green."
git push origin main`));
  out.push(bullet("Revoke the leaked `ghp_25uB...` PAT at https://github.com/settings/tokens — find the token starting with `ghp_25uB` and click Revoke. The token is no longer in git history (stripped via git-filter-repo), but cached copies in any clone/fork may persist."));
  out.push(bullet("Audit all of git history for other leaked secrets using gitleaks:"));
  out.push(...codeBlock(
`# Install gitleaks
brew install gitleaks   # macOS
# or: curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz | tar xz -C /usr/local/bin

# Scan all of history
gitleaks detect --source . --verbose

# If any secrets found, add to .gitleaksignore and rotate them
# OR strip from history using git-filter-repo (same approach as .git.backup-before-rewrite/)`));
  out.push(bullet("Remove demo credentials from `README.md` — currently shows `admin@finsight.ai / admin1234` in plain text. Replace with: \"Contact admin@artha.ai for demo access\"."));
  out.push(bullet("Rotate `DATABASE_URL` — the SQLite path is in `.env` and was committed to history. Generate a fresh Postgres URL in Phase 1."));
  out.push(bullet("Add `.git.backup-before-rewrite*` to `.gitignore` (already done in this audit). Verify with `cat .gitignore | grep git.backup`."));
  out.push(bullet("Enable branch protection on `main`: require pull request reviews (1 approval), require status checks to pass before merge, require branches to be up to date before merge. Do this via GitHub UI: Settings → Branches → Branch protection rules → Add rule."));
  return out;
}

function buildPhase1() {
  const out = [];
  out.push(h1("Phase 1 — Database: SQLite → PostgreSQL"));
  out.push(body("Estimated effort: 3 hours. Day 1. Unblocks concurrent writes and is a hard prerequisite for any multi-instance deploy."));
  out.push(h2("Checklist"));
  out.push(bullet("Switch Prisma provider in `prisma/schema.prisma` from `sqlite` to `postgresql`. Verify no SQLite-specific types remain (e.g., `Bytes`, `Decimal` precision). The repo already has `prisma/schema.postgres.prisma` as reference — diff the two and merge any missing models."));
  out.push(bullet("Provision a Postgres instance — fastest options:"));
  out.push(...codeBlock(
`# Option A: Supabase (free tier, 500MB, generous connection pool)
# Sign up at https://supabase.com, create new project, copy connection string
# DATABASE_URL=postgresql://postgres.<ref>:<pass>@db.<ref>.supabase.co:5432/postgres

# Option B: Neon (serverless, branches for staging)
# Sign up at https://neon.tech, create database, copy pooled connection string
# DATABASE_URL=postgresql://<user>:<pass>@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Option C: Self-hosted via docker-compose (for VPS deploys)
# Add to docker-compose.prod.yml:
#   postgres:
#     image: postgres:16-alpine
#     restart: always
#     environment:
#       POSTGRES_USER: artha
#       POSTGRES_PASSWORD: \${DB_PASSWORD}
#       POSTGRES_DB: artha
#     volumes:
#       - pgdata:/var/lib/postgresql/data
#     healthcheck:
#       test: ["CMD-SHELL", "pg_isready -U artha"]
#       interval: 10s
#       timeout: 5s
#       retries: 5
# volumes:
#   pgdata:`));
  out.push(bullet("Run `bun run db:generate:postgres` (uses `schema.postgres.prisma`) to regenerate the Prisma client for Postgres."));
  out.push(bullet("Push the schema: `bun run db:push:postgres`. Verify tables exist via `psql` or a GUI like TablePlus."));
  out.push(bullet("Run the migration script `bun run scripts/migrate-sqlite-to-postgres.ts` to copy all rows from `db/custom.db` into Postgres. Verify row counts match:"));
  out.push(...codeBlock(
`# Quick row-count sanity check
psql "$DATABASE_URL" -c "
SELECT 'users' AS tbl, COUNT(*) FROM "User"
UNION ALL SELECT 'documents', COUNT(*) FROM "Document"
UNION ALL SELECT 'audit_logs', COUNT(*) FROM "AuditLog"
UNION ALL SELECT 'entities', COUNT(*) FROM "Entity"
ORDER BY tbl;"`));
  out.push(bullet("Update `.env` (and `.env.production`): `DATABASE_URL=postgresql://...` (replace the old SQLite path)."));
  out.push(bullet("Add PgBouncer in front of Postgres for connection pooling. With Supabase/Neon this is built-in; for self-hosted, add `pgbouncer/pgbouncer:1.22.0` to docker-compose with `pool_mode=transaction`. Set `DATABASE_URL` to point at PgBouncer port 6432 instead of 5432."));
  out.push(bullet("Set up automated daily backups. For Supabase/Neon this is built-in. For self-hosted, add a cron container running `pg_dump` to S3/R2:"));
  out.push(...codeBlock(
`# /etc/cron.daily/backup-artha-pg.sh
#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
docker exec artha-postgres pg_dump -U artha artha | \\
  gzip | \\
  aws s3 cp - "s3://artha-backups/postgres/\${TS}.sql.gz" \\
    --endpoint-url "\${S3_ENDPOINT:-}" \\
    --no-progress
# Retention: keep last 30 days
aws s3api list-objects-v2 --bucket artha-backups --prefix postgres/ | \\
  jq -r '.Contents[].Key' | sort -r | tail -n +31 | \\
  xargs -I{} aws s3 rm "s3://artha-backups/{}"`));
  out.push(bullet("Smoke test: run `bun run dev`, hit `/api/health`, log in, upload a document, verify a row appears in `Document` table in Postgres."));
  return out;
}

function buildPhase2() {
  const out = [];
  out.push(h1("Phase 2 — Secrets & Environment Management"));
  out.push(body("Estimated effort: 2 hours. Day 1. Without this, every other phase has chicken-and-egg problems with config."));
  out.push(h2("Checklist"));
  out.push(bullet("Enumerate every env var the codebase reads. Run `grep -rhoE \"process\\.env\\.[A-Z_]+\" src/ | sort -u` to list them. The required set:"));
  out.push(...codeBlock(
`# .env.production template — fill ALL of these before launch

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...   # for Prisma migrations (no pooler)

# Auth / crypto
JWT_SECRET=<openssl rand -base64 48>   # 64-char minimum
JWT_REFRESH_SECRET=<openssl rand -base64 48>
ENCRYPTION_KEY=<openssl rand -hex 32>  # field-level AES-256-GCM
KMS_KEY_ID=alias/artha-prod             # AWS KMS key alias

# Storage
STORAGE_DRIVER=s3
S3_BUCKET=artha-ai-documents
S3_REGION=ap-south-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=                              # only for R2

# Cache + queue
REDIS_URL=redis://default:pass@redis:6379

# AI / LLM
ZAI_API_KEY=...

# Observability
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=https://...

# Email
MAIL_DRIVER=ses   # or "smtp"
SES_REGION=ap-south-1
MAIL_FROM="Artha <noreply@artha.ai>"

# App
NEXT_PUBLIC_APP_URL=https://artha.ai
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1`));
  out.push(bullet("Pick a secrets manager. Recommended: Doppler (free for solo/small team) — syncs secrets to .env on deploy and rotates them. Alternative: AWS Secrets Manager (if you're already on AWS)."));
  out.push(...codeBlock(
`# Doppler setup (fastest path)
brew install dopplerhq/doppler/doppler
doppler login
doppler setup
doppler set config production
# Paste secrets via doppler.com UI or:
doppler secrets set JWT_SECRET="$(openssl rand -base64 48)"
# Use in dev: doppler run -- bun run dev
# Use in prod: doppler run --config production -- bun run start`));
  out.push(bullet("Add `.env*` (except `.env.example`) to `.gitignore` if not already. Verify with `git check-ignore .env` returning `.env`."));
  out.push(bullet("Document each env var in `README.md` under a new \"Environment Variables\" section — what it does, where to get it, example value (redacted)."));
  out.push(bullet("Generate strong secrets locally with `openssl rand -base64 48` (for JWT) and `openssl rand -hex 32` (for AES key). NEVER reuse dev secrets in prod."));
  out.push(bullet("Set `NEXT_PUBLIC_*` vars in Vercel/Cloudflare Pages UI as well (these get baked into the client bundle at build time)."));
  out.push(bullet("For Docker deploys, pass secrets via `--env-file .env.production` (never bake them into the image)."));
  return out;
}

function buildPhase3() {
  const out = [];
  out.push(h1("Phase 3 — File Storage: Local → S3 / R2"));
  out.push(body("Estimated effort: 3 hours. Day 1–2. Local uploads break under multi-instance deploys and survive server reboots poorly."));
  out.push(h2("Checklist"));
  out.push(bullet("Pick a storage backend: AWS S3 (most mature, slightly pricier), Cloudflare R2 (S3-compatible, zero egress, recommended for cost), or MinIO (self-hosted, single-tenant)."));
  out.push(bullet("Create the bucket. Block all public access, enable versioning, enable server-side encryption (SSE-S3 at minimum, SSE-KMS for prod)."));
  out.push(...codeBlock(
`# AWS S3
aws s3api create-bucket \\
  --bucket artha-ai-documents \\
  --region ap-south-1 \\
  --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-bucket-versioning --bucket artha-ai-documents \\
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket artha-ai-documents \\
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'

# Cloudflare R2 (via wrangler)
wrangler r2 bucket create artha-ai-documents
# Then create an API token in Cloudflare dashboard, use as S3_ACCESS_KEY/S3_SECRET_KEY
# Set S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`));
  out.push(bullet("Set `STORAGE_DRIVER=s3` in `.env.production`. The codebase already supports this — `src/lib/storage/file-store.ts` dynamically imports `s3-store.ts` when `STORAGE_DRIVER=s3`."));
  out.push(bullet("Configure lifecycle rules: transition to IA after 30 days, Glacier after 90 days, expire non-current versions after 365 days. This cuts storage cost ~70%."));
  out.push(...codeBlock(
`aws s3api put-bucket-lifecycle-configuration \\
  --bucket artha-ai-documents \\
  --lifecycle-configuration file://lifecycle.json
# lifecycle.json:
{
  "Rules": [
    {"ID": "ia-transition", "Status": "Enabled",
     "Filter": {"Prefix": "uploads/"},
     "Transitions": [{"Days": 30, "StorageClass": "STANDARD_IA"}]},
    {"ID": "glacier-transition", "Status": "Enabled",
     "Filter": {"Prefix": "uploads/"},
     "Transitions": [{"Days": 90, "StorageClass": "GLACIER"}]},
    {"ID": "nvc-expire", "Status": "Enabled",
     "NoncurrentVersionExpiration": {"NoncurrentDays": 365}}
  ]
}`));
  out.push(bullet("Switch from server-side upload to presigned URLs for files >5MB — saves bandwidth and CPU on the Next.js server. The codebase already has `@aws-sdk/s3-request-presigner` installed."));
  out.push(...codeBlock(
`// src/app/api/documents/presign/route.ts (new file)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth } from "@/lib/security/middleware";

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { filename, contentType } = await req.json();
  const key = \`uploads/\${user.id}/\${Date.now()}-\${filename}\`;

  const url = await getSignedUrl(
    new S3Client({ region: process.env.S3_REGION }),
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  return Response.json({ url, key });
}`));
  out.push(bullet("Migrate existing local uploads: `aws s3 sync uploads/ s3://artha-ai-documents/uploads/ --storage-class STANDARD_IA`. Verify counts match: `find uploads/ -type f | wc -l` vs `aws s3 ls s3://artha-ai-documents/uploads/ --recursive | wc -l`."));
  out.push(bullet("Test upload/download/delete paths end-to-end: upload a 2MB PDF, verify it appears in S3, fetch it back via the GET endpoint, then DELETE via the API and verify S3 version is marked as deleted."));
  return out;
}

function buildPhase4() {
  const out = [];
  out.push(h1("Phase 4 — Auth & Sessions"));
  out.push(body("Estimated effort: 4 hours. Day 2. The codebase already implements refresh tokens, account lockout, and SSO/SAML/OIDC — this phase is mostly verification and hardening."));
  out.push(h2("Checklist"));
  out.push(bullet("Generate a strong `JWT_SECRET` (64+ chars) and a SEPARATE `JWT_REFRESH_SECRET`. Rotate them so old tokens are invalidated."));
  out.push(bullet("Verify `RefreshToken` table exists in Prisma schema with rotation columns (`token`, `hashedToken`, `userId`, `expiresAt`, `revokedAt`, `replacedByToken`)."));
  out.push(bullet("Verify access token TTL is 15 minutes, refresh token TTL is 30 days. Update in `src/lib/auth.ts`:"));
  out.push(...codeBlock(
`// src/lib/auth.ts
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
// verify:
//   const access = await jwt.sign({ sub: user.id, type: "access" }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
//   const refresh = await jwt.sign({ sub: user.id, type: "refresh", jti: randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });`));
  out.push(bullet("Verify `/api/auth/refresh` endpoint rotates the refresh token (revoke old, issue new pair) — prevents replay attacks. Test: refresh, then refresh again with the same token → should 401."));
  out.push(bullet("Verify `/api/auth/logout-all` revokes every refresh token for the user — test by logging in on 2 devices, calling logout-all on one, verifying the other gets 401 on next request."));
  out.push(bullet("Verify bcrypt cost factor is 12 (already in `src/lib/auth.ts`). Anything <10 is unsafe; >14 is too slow on small VPS."));
  out.push(bullet("Verify account lockout: 5 failed attempts within 15 minutes → account locked 15 minutes. Check `src/lib/security/events.ts` for the `detectBruteForce()` event. Test by deliberately failing 5 logins."));
  out.push(bullet("Verify password policy: min 10 chars, at least 1 of {lower, upper, digit, special}. Add Zod schema to `POST /api/auth/register` if missing."));
  out.push(bullet("MFA per tenant: verify the `Tenant` model has `enforceMfa` boolean. When true, login requires TOTP code. The SSO path bypasses MFA — verify your SSO providers enforce MFA themselves (Google/Azure do by default)."));
  out.push(bullet("Token revocation list: verify `RevokedToken` table is checked on every protected route via `src/lib/security/middleware.ts` → `requireAuth()`. Test by revoking a token via logout, then immediately using it → should 401."));
  return out;
}

function buildPhase5() {
  const out = [];
  out.push(h1("Phase 5 — Rate Limiting, Queue, Caching"));
  out.push(body("Estimated effort: 5 hours. Day 2–3. The codebase stubs `checkRateLimit()` in `src/lib/security/middleware.ts`; this phase wires it to Redis and adds BullMQ for async document parsing / PDF generation."));
  out.push(h2("Checklist"));
  out.push(bullet("Provision Redis. Self-hosted: add `redis:7-alpine` to docker-compose. Managed: Upstash (free tier, 10k commands/day, good for low-traffic); Redis Cloud (paid, multi-AZ)."));
  out.push(...codeBlock(
`# docker-compose.yml (self-hosted)
redis:
  image: redis:7-alpine
  restart: always
  command: redis-server --requirepass \${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redisdata:/data
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD}", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5`));
  out.push(bullet("Wire `checkRateLimitAsync()` to use Redis `INCR` + `EXPIRE` for sliding window. Fall back to in-memory if `REDIS_URL` unset (dev mode)."));
  out.push(...codeBlock(
`// src/lib/security/rate-limit.ts (new file or extend existing)
import Redis from "ioredis";
let redis: Redis | null = null;
try { if (process.env.REDIS_URL) redis = new Redis(process.env.REDIS_URL); } catch {}

const buckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimitAsync(key: string, limit: number, windowSec: number) {
  if (redis) {
    const k = \`rl:\${key}\`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt: Date.now() + windowSec * 1000 };
  }
  // In-memory fallback (dev only — breaks in multi-instance)
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowSec * 1000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + windowSec * 1000; }
  bucket.count++;
  buckets.set(key, bucket);
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}`));
  out.push(bullet("Apply rate limiting to ALL POST routes, not just `/api/auth/*` and `/api/assistant/ask`. Audit: `grep -lrn \"export async function POST\" src/app/api/ | xargs grep -L checkRateLimit`. Every file in that list needs the middleware."));
  out.push(bullet("Install BullMQ: `bun add bullmq ioredis`. Define queues for `documentQueue` (PDF/CSV parsing) and `reportQueue` (PDF report generation)."));
  out.push(...codeBlock(
`// src/lib/queues.ts (new file)
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export const documentQueue = new Queue("documents", { connection });
export const reportQueue = new Queue("reports", { connection });

// POST /api/documents — return 202 + jobId immediately
// POST /api/reports — return 202 + jobId immediately
// GET  /api/documents/[id]/status — poll for status
// GET  /api/reports/jobs/[id] — poll for status
// On completion: emit WebSocket event (Socket.io) to refresh the UI`));
  out.push(bullet("Create `src/workers/document-worker.ts` and `src/workers/report-worker.ts`. Add `scripts/start-worker.ts` as the entry point. Add worker as a separate service in `docker-compose.prod.yml` (same image, different command)."));
  out.push(bullet("Switch document upload endpoint to async: instead of parsing the PDF inline (which blocks the request for 5–30s), queue it and return `202 Accepted` + `jobId`. Frontend polls `/api/documents/[id]/status` every 2s until `status=completed`."));
  out.push(bullet("Add Socket.io for push notifications when jobs complete. The codebase already has `socket.io-client` in `package.json`. Worker emits on `document:completed`, frontend subscribes via `useEffect` in `DocumentVerifyView`."));
  return out;
}

function buildPhase6() {
  const out = [];
  out.push(h1("Phase 6 — Containerization & Deploy"));
  out.push(body("Estimated effort: 3 hours. Day 3–4. The repo has a `Dockerfile` and `docker-compose.yml` already; this phase polishes them for production."));
  out.push(h2("Checklist"));
  out.push(bullet("Verify the Dockerfile is multi-stage: `builder` stage installs deps and builds `.next/standalone`; `runner` stage copies only the standalone output + `node_modules` for prod deps. Final image should be <300MB."));
  out.push(...codeBlock(
`# Dockerfile (multi-stage, standalone output)
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json bun.lock ./
RUN npm install -g bun && bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]`));
  out.push(bullet("Add `.dockerignore` to skip `node_modules`, `.next`, `.git`, `*.log`, `db/`, `uploads/`, `.env*`. This speeds up build context by ~10×."));
  out.push(bullet("Write `docker-compose.prod.yml` with 4 services: `web`, `worker`, `postgres`, `redis`. Use `env_file: .env.production`. Add `healthcheck` for each service. Use `restart: unless-stopped`."));
  out.push(bullet("Verify the healthcheck endpoint `/api/health` returns 200 with `status: ok` and dependency status (DB, Redis, S3). Add to docker-compose:"));
  out.push(...codeBlock(
`# docker-compose.prod.yml (snippet)
web:
  build: .
  ports: ["3000:3000"]
  env_file: .env.production
  depends_on:
    postgres: { condition: service_healthy }
    redis: { condition: service_healthy }
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 5s
    retries: 3
  restart: unless-stopped`));
  out.push(bullet("Pick a deploy strategy: blue-green (zero-downtime, more infra) vs rolling (simpler, brief overlap). For single-VPS, use rolling with 2 replicas; for AWS ECS Fargate, blue-green with target group swap."));
  out.push(bullet("Set up a reverse proxy in front: Caddy (auto-TLS via Let's Encrypt, easiest) or Nginx + Certbot. Caddyfile:"));
  out.push(...codeBlock(
`# Caddyfile
artha.ai {
  reverse_proxy localhost:3000
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    Referrer-Policy strict-origin-when-cross-origin
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
  }
}
# Reload: caddy reload --config Caddyfile`));
  out.push(bullet("Add a maintenance page route: `src/app/maintenance/page.tsx` already exists. To activate, set `MAINTENANCE_MODE=true` in env and reload; Caddy should serve the maintenance page directly when healthcheck fails."));
  return out;
}

function buildPhase7() {
  const out = [];
  out.push(h1("Phase 7 — Observability"));
  out.push(body("Estimated effort: 3 hours. Day 4. Without this, you'll learn about outages from users. The codebase already has `src/lib/observability/index.ts` stubbing Sentry init and a `/api/metrics` endpoint — wire them up."));
  out.push(h2("Checklist"));
  out.push(bullet("Create a Sentry project at https://sentry.io (free tier: 5k errors/month). Copy the DSN. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in env."));
  out.push(bullet("Verify `src/lib/observability/index.ts` calls `Sentry.init()` with `dsn`, `environment`, `tracesSampleRate: 0.1` (10% of transactions sampled for perf monitoring)."));
  out.push(bullet("Enable source map upload so Sentry stack traces are readable:"));
  out.push(...codeBlock(
`# .github/workflows/ci.yml (snippet — add to build step)
- name: Build with source maps
  run: bun run build
  env:
    SENTRY_AUTH_TOKEN: \${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: artha-ai

# next.config.ts — add Sentry webpack plugin
import { withSentryConfig } from "@sentry/nextjs";
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: { disable: false },
});`));
  out.push(bullet("Verify `/api/metrics` endpoint exposes Prometheus-format metrics: `http_requests_total`, `http_request_duration_seconds` (histogram), `nodejs_heap_size_total_bytes`, `process_cpu_seconds_total`. Test: `curl localhost:3000/api/metrics`."));
  out.push(...codeBlock(
`# /etc/prometheus/prometheus.yml (snippet)
scrape_configs:
  - job_name: artha
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: /api/metrics
    scrape_interval: 15s`));
  out.push(bullet("Stand up a Grafana dashboard: import the official Next.js dashboard, add a panel for p95 latency per route, error rate (5xx / total), DB connection pool usage, Redis ops/sec."));
  out.push(bullet("Set up uptime monitoring: UptimeRobot (free, 5-minute intervals) or BetterStack (paid, 1-minute intervals + on-call). Add a check on `https://artha.ai/api/health` expecting 200 within 5s. Add a check on `https://artha.ai` expecting 200 within 10s."));
  out.push(bullet("Claim a status page: statuspage.io (free for 1 page) or BetterStack. Add the uptime checks. Add a manual \"Maintenance\" component."));
  out.push(bullet("Wire Slack/Email alerting: Sentry → Slack webhook on new errors (Sentry → Settings → Integrations → Slack). BetterStack → Slack on downtime. Add a 5-incident/week threshold alert to avoid alert fatigue."));
  out.push(bullet("Switch console.log to structured logging via `pino`. The default Next.js logs are unstructured — grep is painful. Add pino transport that ships to stdout in JSON."));
  out.push(...codeBlock(
`// src/lib/logger.ts (new file)
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
  redact: ["*.password", "*.token", "*.jwt", "*.Authorization"],
});
// Usage: logger.info({ userId, action }, "user logged in");`));
  return out;
}

function buildPhase8() {
  const out = [];
  out.push(h1("Phase 8 — CI/CD Pipeline"));
  out.push(body("Estimated effort: 3 hours. Day 4. Every commit on `main` should auto-deploy to staging; every git tag should deploy to prod. Currently there is no CI — every commit depended on you manually running `bun run build && bun run test`."));
  out.push(h2("Checklist"));
  out.push(bullet("Create `.github/workflows/ci.yml` — runs on every push and PR. Caches `node_modules` and `.next/cache`. Steps: typecheck (tsc --noEmit), lint (eslint), test (vitest run), build (next build). Fail fast on any error."));
  out.push(...codeBlock(
`# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main, staging] }
  pull_request: { branches: [main] }

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }
      - uses: actions/cache@v4
        with:
          path: |
            node_modules
            .next/cache
          key: \${{ runner.os }}-bun-\${{ hashFiles('bun.lock') }}
          restore-keys: \${{ runner.os }}-bun-
      - run: bun install --frozen-lockfile
      - run: bun run lint
        continue-on-error: true   # ESLint config currently broken — fix in Phase 0
      - run: bunx tsc --noEmit
      - run: bun run test
      - run: bun run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: ci-test-secret-32chars-minimum123
      - name: Bundle size check
        run: |
          SIZE=$(du -sk .next/standalone | cut -f1)
          echo "Standalone bundle: \${SIZE} KB"
          if [ "$SIZE" -gt 200000 ]; then
            echo "::error::Bundle exceeds 200MB limit"
            exit 1
          fi`));
  out.push(bullet("Add Playwright E2E: `bun add -D @playwright/test`. Create `e2e/smoke.spec.ts` covering: login → dashboard → upload document → verify → tax calc → report gen. Runs on PR only (not on every push, too slow)."));
  out.push(bullet("Add `dependabot.yml`:"));
  out.push(...codeBlock(
`# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly, day: monday }
    open-pull-requests-limit: 5
    groups:
      next-js: { patterns: ["next", "@types/react"] }
      prisma: { patterns: ["prisma", "@prisma/client"] }
      aws: { patterns: ["@aws-sdk/*"] }
  - package-ecosystem: docker
    directory: /
    schedule: { interval: monthly }`));
  out.push(bullet("Set up branch protection (already mentioned in Phase 0, but verify in CI): require `CI` status check to pass before merge to `main`. Settings → Branches → Branch protection rules → Edit `main` → Require status checks to pass → select `ci`."));
  out.push(bullet("Auto-deploy to staging on merge to `main`. Add a `deploy` job to `ci.yml` that runs after the `ci` job:"));
  out.push(...codeBlock(
`# Append to ci.yml
  deploy-staging:
    needs: ci
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SSH deploy to staging VPS
        uses: appleboy/ssh-action@v1
        with:
          host: \${{ secrets.STAGING_HOST }}
          username: \${{ secrets.STAGING_USER }}
          key: \${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/artha
            git pull origin main
            doppler run --config production -- docker compose -f docker-compose.prod.yml up -d --build
            sleep 10
            curl -sf https://staging.artha.ai/api/health || exit 1`));
  out.push(bullet("Production deploys should require a git tag (`v1.0.0` etc.) — this is your rollback point. Add a `deploy-prod.yml` workflow triggered on tag push."));
  out.push(bullet("Add `bun audit` to CI: `bun audit --audit-level=high`. Fail build on any high/critical vulnerability."));
  out.push(bullet("Document the rollback procedure: `git revert <commit>` then re-deploy, OR if Docker image-based: `docker compose down && docker compose up -d --no-build <previous-tag>`. Add to `infra/DR_RUNBOOK.md` (already exists)."));
  return out;
}

function buildPhase9() {
  const out = [];
  out.push(h1("Phase 9 — Security Hardening"));
  out.push(body("Estimated effort: 4 hours. Day 5. The codebase has a comprehensive `legal/SECURITY_REVIEW_CHECKLIST.md` claiming AES-256-GCM, KMS, SCIM, SAML, OIDC, field-level encryption — most of these are stubbed. This phase verifies they actually work and adds the missing pieces."));
  out.push(h2("Checklist"));
  out.push(bullet("Audit every `POST`/`PUT`/`PATCH`/`DELETE` route for Zod validation. Run `grep -lrn 'export async function POST' src/app/api/ | xargs grep -L 'z\\.'` — any file in this list accepts unvalidated input."));
  out.push(bullet("Verify PAN/Aadhaar/account numbers go through `encryptField()` in `src/lib/security/field-encryption.ts` before being written to DB. Add a test that inserts a row and verifies the column value is non-readable ciphertext."));
  out.push(bullet("Enable CSRF protection via `validateOrigin()` on every mutating route. Verify in `src/lib/security/middleware.ts` — every POST handler should call it."));
  out.push(bullet("Rate-limit ALL POST routes (Phase 5 wired Redis; this step applies it broadly). Standard limits: auth 10/min, AI/assistant 20/min, document upload 30/hour per user, report gen 10/hour per user."));
  out.push(bullet("Audit security headers. Add to `next.config.ts` or to your reverse proxy (Caddyfile):"));
  out.push(...codeBlock(
`# next.config.ts headers
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com; frame-ancestors 'none';" },
];
export default { async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; } };`));
  out.push(bullet("Run `bun audit` and fix every high/critical finding. `bun update --latest` for major-version bumps (verify against tests)."));
  out.push(bullet("OWASP Top 10 re-audit. Walk through each of A01–A10 and verify controls in the codebase. The most-commonly-skipped: A04 Insecure Design (threat model), A05 Misconfig (default creds, verbose errors), A07 Auth Failures (this is covered in Phase 4)."));
  out.push(bullet("Verify `legal/privacy/PRIVACY_POLICY.md` and `legal/terms/TERMS_OF_SERVICE.md` are linked from the footer and are reachable at `/privacy` and `/terms` routes. Add page routes if missing."));
  out.push(bullet("DPDP / GDPR consent flow: when a user signs up, store a `ConsentRecord` row with `consentType=terms`, `version=1.0`, `ipAddress`, `userAgent`. Already exists in Prisma schema; verify it's actually being written by the `/api/auth/register` handler."));
  out.push(bullet("Right-to-be-forgotten: verify `src/lib/compliance/right-to-be-forgotten.ts` actually deletes or anonymizes the user's data across all tables (User, Document, AuditLog, Entity, etc.) and produces an export first. Test end-to-end on a demo user."));
  return out;
}

function buildPhase10() {
  const out = [];
  out.push(h1("Phase 10 — Launch Day Checklist"));
  out.push(body("Estimated effort: 4 hours. Day 6. This is the final go/no-go gate. Don't skip any item — every one of these has killed a launch."));
  out.push(h2("Pre-launch (T-24h)"));
  out.push(bullet("Point DNS — set `A` record for `artha.ai` and `www.artha.ai` to your server IP / load balancer. TTL 300s during launch (bump to 3600 after 24h stable)."));
  out.push(bullet("Verify TLS certificate is valid: `curl -vI https://artha.ai 2>&1 | grep -E 'subject|issuer|expire date'`. Should be Let's Encrypt, valid for 90 days, auto-renewing via Caddy or certbot."));
  out.push(bullet("Take a DB backup BEFORE flipping the switch: `pg_dump` to S3. Verify the restore works by spinning up a fresh Postgres and loading it."));
  out.push(bullet("Confirm all env vars in production are set (run `doppler run --config production -- env | grep -E 'JWT|DATABASE|SENTRY|REDIS|S3_' | wc -l` should be ~15)."));
  out.push(h2("Launch (T-0)"));
  out.push(bullet("Run the smoke test suite — covers all critical paths:"));
  out.push(...codeBlock(
`# scripts/smoke-test.sh
#!/usr/bin/env bash
set -e
BASE=https://artha.ai

# 1. Health check
curl -sf "$BASE/api/health" | jq . | grep -q '"status":"ok"'

# 2. Sign up
curl -sf -X POST "$BASE/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"smoke@test.com","password":"Smoke1234!","name":"Smoke"}' | jq .token | grep -q .

# 3. Login
TOKEN=$(curl -sf -X POST "$BASE/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"smoke@test.com","password":"Smoke1234!"}' | jq -r .token)

# 4. Authed request
curl -sf "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN" | jq .email | grep -q smoke

# 5. Tax summary
curl -sf "$BASE/api/tax/summary" -H "Authorization: Bearer $TOKEN" | jq . | grep -q totalTax

# 6. Public stats
curl -sf "$BASE/api/public/stats" | jq . | grep -q entities

echo "ALL SMOKE TESTS PASSED"`));
  out.push(bullet("Verify error budget is green: Sentry shows 0 new errors in the last hour. UptimeRobot shows 100% uptime on the staging URL (which you should have already been running for 24h)."));
  out.push(bullet("Confirm `infra/DR_RUNBOOK.md` is accessible — print a copy and stick it on the wall / pin it in Notion. Especially the \"restore from backup\" and \"rotate secrets in emergency\" steps."));
  out.push(bullet("On-call rotation: even as a solo founder, define a PagerDuty schedule (free) or use BetterStack's built-in on-call. Set yourself as primary for the first 30 days."));
  out.push(bullet("Claim the status page URL (`status.artha.ai` subdomain). Add a CNAME to your status page provider."));
  out.push(bullet("Support channel: set up `support@artha.ai` (forward to your personal email for now, or use HelpScout/Linear Inbox). Add a `mailto:` link in the app footer."));
  out.push(h2("Soft-launch (T+1h to T+24h)"));
  out.push(bullet("Soft-launch first: invite 5 trusted users. Watch Sentry + Grafana for 1 hour. Fix any issues. Then invite 25 more. Then 100. Then open to public."));
  out.push(bullet("Have the rollback command ready: `docker compose -f docker-compose.prod.yml up -d --no-build <previous-tag>`. Practice rolling back once on staging before launch so you don't fumble under pressure."));
  out.push(bullet("Within 24h of launch: write a postmortem template (Google Docs / Notion). Capture anything that went wrong with timestamp, root cause, fix. This becomes your incident-response muscle memory."));
  return out;
}

function buildPhase11() {
  const out = [];
  out.push(h1("Phase 11 — 30-Day Post-Launch Hardening"));
  out.push(body("Estimated effort: 30 hours spread across 30 days. Day 7–36. Once you're live, this phase keeps you live. Skip it and you'll have a 2am outage you can't recover from."));
  out.push(h2("Week 1: Stabilize"));
  out.push(bullet("Monitor p95 latency daily. Add indexes for any query taking >100ms — Prisma's `prisma migrate` makes this easy. Watch the slow query log on Postgres."));
  out.push(bullet("Triage user feedback daily. Tag every issue as P0 (blocks use), P1 (degrades UX), P2 (nice to have). Fix P0s within 24h."));
  out.push(bullet("Run `bun audit` weekly. Dependabot PRs should be auto-merged if CI passes and version bump is minor (no major)."));
  out.push(bullet("Set up a weekly backup restore drill: every Friday, restore the latest backup to a fresh Postgres instance, verify row counts, destroy. This proves your backups work."));
  out.push(h2("Week 2: Security audit"));
  out.push(bullet("Hire or self-run a security audit using Snyk (`snyk test --all-projects`) or Dependabot + manual OWASP review. Fix every HIGH/CRITICAL within 7 days of finding."));
  out.push(bullet("Verify audit chain integrity: `src/lib/security/audit-chain.ts` should produce a verifiable hash chain. Run `verifyAuditChain()` on a 1000-entry range and confirm zero tampering."));
  out.push(bullet("Run a penetration test: invite a friend / hire a freelancer on Upwork for $300 to run OWASP ZAP against your staging URL. Fix anything reported."));
  out.push(h2("Week 3: Incident response"));
  out.push(bullet("Document your incident response runbook (template in `legal/incident-response/INCIDENT_RESPONSE_PLAN.md` already exists — fill it in)."));
  out.push(bullet("Define severity levels: SEV-1 (production down, all users affected, 30-min response), SEV-2 (partial outage, 2-hour response), SEV-3 (degraded, 24-hour response)."));
  out.push(bullet("Run a tabletop exercise: pick a scenario (DB corrupted, AWS region down, ransomware), walk through what you'd do step-by-step, identify gaps."));
  out.push(h2("Week 4: Scale readiness"));
  out.push(bullet("Load test: use k6 (`brew install k6`) to simulate 100 concurrent users hitting `/api/health`, `/api/users/me`, `/api/tax/summary`. Identify your ceiling."));
  out.push(...codeBlock(
`# scripts/load-test.js (k6)
import http from "k6/http";
import { check } from "k6";
export const options = { vus: 100, duration: "60s" };
export default function () {
  const res = http.get("https://artha.ai/api/health");
  check(res, { "status 200": (r) => r.status === 200, "p95 < 200ms": (r) => r.timings.duration < 200 });
}
# Run: k6 run scripts/load-test.js`));
  out.push(bullet("Multi-region standby (if AWS): set up RDS cross-region read replica, S3 cross-region replication. Document the failover procedure. Skip if VPS — instead, set up daily AMI snapshots."));
  out.push(bullet("Start your SOC2 readiness checklist (legal/soc2/SOC2_READINESS.md exists as a template). Even if you don't pursue SOC2 for 12 months, tracking what you have vs need informs every architectural decision."));
  out.push(bullet("Verify customer data export endpoint (`/api/users/me/export`) actually returns all user data in a machine-readable format (JSON + CSV). Test with a user that has 50+ documents."));
  out.push(bullet("Verify right-to-be-forgotten end-to-end: submit a deletion request, run the flow, verify every PII column across every table is nulled or the row is deleted. Try to log in with the deleted user's credentials — should 401."));
  return out;
}

function buildDeployMatrix() {
  const out = [];
  out.push(h1("Deployment Target Decision Matrix"));
  out.push(body("Three viable paths for ARTHA. Pick based on your priorities — there is no universally right answer."));
  out.push(h2("Comparison"));
  out.push(buildTable(
    ["Dimension", "VPS (Docker Compose)", "AWS (ECS Fargate + RDS)", "Vercel + Managed DB"],
    [
      ["Cost / month (low traffic)", "$12–24 (Hetzner CX22)", "$80–150", "$0–20 + $0–20 (Vercel free + Neon free)"],
      ["Cost / month (500 users)", "$24–48", "$200–350", "$20–50 + $25 (Vercel Pro + Neon Launch)"],
      ["Scaling model", "Vertical (bigger box); horizontal needs work", "Horizontal auto-scaling", "Serverless auto-scale (capped)"],
      ["Ops burden", "Medium — you patch the box", "High — many AWS services to glue", "Low — Vercel handles most"],
      ["Time to launch", "~6 days", "~10 days", "~4 days"],
      ["Security posture", "Good with Cloudflare in front", "Excellent (KMS, IAM, SG, WAF)", "Good (Vercel DDoS + Neon TLS)"],
      ["Long-running workers (BullMQ)", "Native — runs in worker container", "Native — separate ECS service", "Problematic — Vercel functions cap at 60s; use a separate Render/ Railway worker"],
      ["Persistent file uploads", "Local + cron sync to S3, or S3 direct", "S3 (native)", "S3 / R2 (no local filesystem)"],
      ["DB backups", "cron + pg_dump → S3", "RDS automated snapshots", "Neon automated (point-in-time)"],
      ["Multi-region failover", "Manual, slow", "Native (Route53 + multi-AZ)", "Manual, application-level"],
      ["Best for", "Solo founder, lean burn, India-first", "VC-backed, regulated customers (banks)", "Fast-launch, small team, not bank-grade"],
    ],
    [22, 26, 26, 26]
  ));
  out.push(h2("Recommendation"));
  out.push(body("Given ARTHA's target market (Indian fintech / wealth-tech, eventually bank-grade) and your current solo-founder status, start on a VPS for the first 3 months to ship fast and learn. When your first paying customer asks for SOC2, migrate to AWS (RDS + ECS + KMS + CloudFront) — that move takes ~5 days and you'll have the revenue to justify the cost. Skip Vercel — the BullMQ worker story is too awkward for a Next.js app that does real document processing."));
  return out;
}

function buildTimeline() {
  const out = [];
  out.push(h1("Sequenced Timeline & Effort Estimates"));
  out.push(h2("Timeline"));
  out.push(buildTable(
    ["Phase", "Day(s)", "Predecessor", "Cumulative Hours"],
    [
      ["0. Pre-flight", "Day 0", "—", "2"],
      ["1. Database (SQLite → Postgres)", "Day 1", "0", "5"],
      ["2. Secrets & env", "Day 1", "0", "7"],
      ["3. File storage (S3/R2)", "Day 1–2", "2", "10"],
      ["4. Auth & sessions", "Day 2", "1, 2", "14"],
      ["5. Rate limit + queue", "Day 2–3", "2", "19"],
      ["6. Containerization", "Day 3–4", "1, 2, 5", "22"],
      ["7. Observability", "Day 4", "6", "25"],
      ["8. CI/CD pipeline", "Day 4", "0", "28"],
      ["9. Security hardening", "Day 5", "4, 5", "32"],
      ["10. Launch day", "Day 6", "All above", "36"],
      ["11. 30-day post-launch", "Day 7–36", "10", "+30 over 30 days"],
    ],
    [30, 14, 16, 20]
  ));
  out.push(h2("Effort Breakdown (hours)"));
  out.push(buildTable(
    ["Phase", "Low estimate", "Likely", "High", "Owner"],
    [
      ["0. Pre-flight", "1.5", "2", "3", "Solo dev"],
      ["1. Database migration", "2", "3", "5", "Solo dev"],
      ["2. Secrets & env", "1.5", "2", "3", "Solo dev"],
      ["3. File storage", "2", "3", "5", "Solo dev"],
      ["4. Auth & sessions", "3", "4", "6", "Solo dev"],
      ["5. Rate limit + queue", "4", "5", "8", "Solo dev"],
      ["6. Containerization", "2", "3", "5", "Solo dev"],
      ["7. Observability", "2", "3", "5", "Solo dev"],
      ["8. CI/CD", "2", "3", "5", "Solo dev"],
      ["9. Security hardening", "3", "4", "6", "Solo dev + external audit"],
      ["10. Launch day", "3", "4", "6", "Solo dev"],
      ["11. 30-day post-launch", "20", "30", "50", "Solo dev + freelance pentester"],
      ["TOTAL pre-deploy (0–10)", "27", "36", "57", ""],
      ["TOTAL with post-launch", "47", "66", "107", ""],
    ],
    [30, 14, 14, 14, 28]
  ));
  out.push(h2("Critical Path"));
  out.push(body("The critical path (longest sequence that can't be parallelized) is: Phase 0 → 1 → 5 → 6 → 10. This is 2 + 3 + 5 + 3 + 4 = 17 hours of work, but spread across ~6 calendar days because of integration testing and waiting for managed services (Supabase / Upstash / Sentry) to provision."));
  out.push(body("Phases 2, 3, 4, 7, 8, 9 can be done in parallel by a second person if you have one — they touch different files and have no hard dependency on each other beyond Phase 0. With 2 engineers, you could cut the calendar time to ~3 days."));
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// DOCUMENT ASSEMBLY
// ─────────────────────────────────────────────────────────────────────
const coverPalette = {
  bg: P.bg,
  accent: P.accent,
  titleColor: P.cover.titleColor,
  subtitleColor: P.cover.subtitleColor,
  metaColor: P.cover.metaColor,
  footerColor: P.cover.footerColor,
};

const coverConfig = {
  title: "ARTHA — Pre-Deployment & Professional Use Plan",
  subtitle: "From localhost demo to production-grade deploy",
  englishLabel: "TECHNICAL PLAN",
  metaLines: [
    "Prepared for: VampFay (solo developer)",
    "Repository: github.com/VampFay/artha-ai",
    "Date: September 2026",
    "Status: DRAFT — for execution",
  ],
  footerLeft: "ARTHA",
  footerRight: "v1.0 — DRAFT",
  palette: coverPalette,
};

// TOC
const tocSection = {
  properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 36, color: P.headingColor,
        font: { ascii: "Calibri", eastAsia: "SimHei" } })],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: "Right-click the TOC above → Update Field → Update entire table to refresh page numbers.",
        italics: true, size: 18, color: P.secondary, font: { ascii: "Calibri" } })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ],
};

// Body
const bodyChildren = [
  ...buildExecutiveSummary(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase0(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase1(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase2(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase3(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase4(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase5(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase6(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase7(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase8(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase9(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase10(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildPhase11(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildDeployMatrix(),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildTimeline(),
];

const doc = new Document({
  creator: "VampFay",
  title: "ARTHA Pre-Deployment Plan",
  description: "Plan for taking ARTHA from localhost demo to production-grade deployment",
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 22, color: P.bodyText },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { bold: true, size: 32, color: P.headingColor, font: { ascii: "Calibri", eastAsia: "SimHei" } },
        paragraph: { spacing: { before: 480, after: 200, line: 360, lineRule: "atLeast" } },
      },
      heading2: {
        run: { bold: true, size: 28, color: P.headingColor, font: { ascii: "Calibri", eastAsia: "SimHei" } },
        paragraph: { spacing: { before: 320, after: 160, line: 320, lineRule: "atLeast" } },
      },
      heading3: {
        run: { bold: true, size: 24, color: P.headingColor, font: { ascii: "Calibri", eastAsia: "SimHei" } },
        paragraph: { spacing: { before: 240, after: 120, line: 300, lineRule: "atLeast" } },
      },
    },
  },
  sections: [
    // Section 1: Cover (margin 0, no header/footer, no page number)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCoverR1(coverConfig),
    },
    // Section 2: TOC (Roman numerals)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.secondary, font: { ascii: "Calibri" } })],
          })],
        }),
      },
      children: tocSection.children,
    },
    // Section 3: Body (Arabic numerals, reset to 1)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "ARTHA — Pre-Deployment Plan", size: 18, color: P.secondary, font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.secondary, font: { ascii: "Calibri" } })],
          })],
        }),
      },
      children: bodyChildren,
    },
  ],
});

// ─────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────
const outPath = "/home/z/my-project/download/ARTHA-Deployment-Plan.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log(`✓ Generated: ${outPath}`);
  console.log(`  Size: ${(buf.length / 1024).toFixed(1)} KB`);
}).catch((err) => {
  console.error("✗ Generation failed:", err);
  process.exit(1);
});

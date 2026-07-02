"""Generate atomic-step breakdown files for all FinSight AI phases.

Cleaner rewrite using list-of-parts + join, so we never rely on
multi-line string concatenation that breaks across statements.
"""

from pathlib import Path

PHASES_DIR = Path("/home/z/my-project/finsight-ai/docs/phases")
PHASES_DIR.mkdir(parents=True, exist_ok=True)


def step(num, action, verify, on_failure=""):
    parts = [f"\n### Step {num}\n", f"\n- **Action**: {action}\n", f"\n- **Verify**: {verify}\n"]
    if on_failure:
        parts.append(f"\n- **On failure**: {on_failure}\n")
    return "".join(parts)


def phase_file(filename, goal, prereqs, ponytail, steps, exit_criteria, pitfalls):
    """Render a single phase markdown file from structured parts."""
    content = f"""# {filename.replace('-', ' ').replace('.md', '').title()}

## Goal
{goal}

## Prerequisites
{prereqs}

## Ponytail focus
{ponytail}

## Atomic steps
{''.join(steps)}

## Phase exit criteria
{exit_criteria}

## Common pitfalls
{pitfalls}
"""
    path = PHASES_DIR / filename
    path.write_text(content)
    print(f"  wrote {path}")


# ============================================================================

phase_file(
    "ui-01-research-flow.md",
    goal="Understand the user journey before building any screen. Spend 6 hours here, save 30 hours of rework later.",
    prereqs="- The source plan (`FinSight AI Implementation Plan.docx`) read in full.\n- A place to write notes (Markdown in `docs/srs/`).",
    ponytail="**Rung 1 — Does this need to exist at all?** This phase exists to *delete* features before they cost you a week of code. Every 'skip this' decision here is a phase you don't build.",
    steps=[
        step("S-UI1.1", "Create `docs/srs/` directory. Create empty files: `personas.md`, `journey.md`, `pain-points.md`, `feature-priority.md`, `ui-flow.md`.", "`ls docs/srs/` shows 5 files."),
        step("S-UI1.2", "Write 4 personas in `personas.md`. Template per persona: Name / Age / Occupation / Income source / Financial confidence (1-5) / Goal / Frustration. Personas: (1) First-time taxpayer, 23, fresh graduate; (2) Salaried employee, 28, 80k/month; (3) Student with internship income, 21; (4) Freelancer, 26, irregular income.", "Each persona has all 7 fields filled.", "If you can't fill a field, you don't know the user well enough — interview a real person matching that persona."),
        step("S-UI1.3", "Map the user journey in `journey.md` as a numbered list: Login → Consent → Upload → Processing → Verify → Tax readiness → Financial health → Assistant → Report download. For each step write: what the user does / what they feel / what they need to know.", "Every step has all 3 sub-fields."),
        step("S-UI1.4", "List pain points in `pain-points.md`. From original plan §6: 'user does not know which documents are needed', 'does not understand tax regime difference', 'does not know whether extracted values are correct', 'does not understand why financial health score is low'. Add 2 more you discovered while writing personas.", "At least 6 pain points listed, each with the persona it affects."),
        step("S-UI1.5", "Write `feature-priority.md` as a 3-column table: Feature | Priority (P0/P1/P2) | Why. P0 = MVP, P1 = strong FYP, P2 = nice-to-have. Cross-reference original plan §18 MVP list.", "Every feature from §2 of the original plan appears exactly once."),
        step("S-UI1.6", "Draw the UI flow diagram. Use Mermaid in `ui-flow.md`. Nodes = pages, edges = user actions. Use `charts` skill if you want a PNG version too.", "Mermaid renders without syntax errors (paste into https://mermaid.live to check).", "If a node has 0 in-edges, it's unreachable — either delete it or add a path."),
        step("S-UI1.7", "Commit + tag. `git add docs/srs/ docs/phases/ui-01-research-flow.md && git commit -m 'ui-1: user research, personas, journey, flow' && git tag ui-1-complete`.", "`git tag` lists `ui-1-complete`."),
    ],
    exit_criteria="""- [ ] 4 personas written
- [ ] User journey mapped with 9 steps
- [ ] ≥6 pain points documented
- [ ] Feature priority table complete
- [ ] UI flow diagram renders
- [ ] Committed + tagged""",
    pitfalls="""- **Skipping this phase** because 'I know what I want to build'. You don't. Trust the process.
- **Writing personas that are just you**. If all 4 personas are 22-year-old CS students, you've done it wrong.
- **Inventing features during this phase**. The point is to *cut* features, not add them. Use Rung 1.
- **Drawing the flow before writing the journey**. The journey informs the flow, not the other way around.""",
)

# ============================================================================

phase_file(
    "ui-02-wireframing.md",
    goal="Produce low-fidelity layouts for every screen before writing any frontend code. A wireframe is cheap; a coded component is expensive.",
    prereqs="- UI-1 complete (flow diagram tells you which screens to wireframe).",
    ponytail="**Rung 1 — Does this screen need to exist?** If a screen isn't on the user journey, don't wireframe it.",
    steps=[
        step("S-UI2.0", "Pick your tool. Excalidraw (free, fast, hand-drawn feel) or Figma (free tier, more polish). Don't use pen/paper — you need to share these.", "Tool opens, you can create a frame."),
        step("S-UI2.1", "Landing page. Sections: hero (1-line value prop + CTA 'Get started'), 3-feature highlight, 'How it works' 3-step, footer with disclaimer. No real copy — use Lorem Ipsum if you must.", "Wireframe has 4 sections, fits on one screen at desktop width."),
        step("S-UI2.2", "Login/register page. Two tabs or a toggle. Email + password. 'Forgot password' link (we won't build it — Rung 1). Show the privacy promise: 'Your documents are encrypted and never shared.'", "Form has email, password, submit button."),
        step("S-UI2.3", "Consent page. One paragraph of plain-text consent (from §3 of original plan), 'Accept and Continue' + 'Cancel' buttons. Link to privacy details (Rung 1: skip building the linked page for FYP).", "Consent text is visible without scrolling on mobile."),
        step("S-UI2.4", "Main dashboard. Layout: top nav (logo, user menu), left sidebar (Dashboard / Documents / Tax / Finance / Goals / Assistant / Reports / Settings), main area with 6 cards: Tax Readiness Score, Financial Health Score, Monthly Income, Monthly Expenses, Savings Rate, Missing Documents. Each card is a rectangle with a title + big number + small subtitle.", "All 6 cards visible on desktop. On mobile (375px), cards stack vertically."),
        step("S-UI2.5", "Document upload page. Left: upload dropzone (drag-and-drop + click), file type selector (dropdown), supported types hint. Right: uploaded documents list with status badges (Processing / Ready / Needs verification / Error). Delete button per row.", "Dropzone + document list both visible on first render."),
        step("S-UI2.6", "Processing status page. Per document: animated progress bar (or spinner), current step text ('Extracting text...', 'Detecting type...', 'Extracting fields...'), estimated time. Auto-refresh.", "Status updates without full page reload (sketch the polling/SSE arrow)."),
        step("S-UI2.7", "Data verification page. For each extracted field: label (left), extracted value (center), confidence badge (green/yellow/red), 'Edit' + 'Verify' buttons (right). Below: source preview (snippet of original text with the value highlighted). 'Verify all' button at bottom.", "At least 3 sample fields shown. Confidence colors match the 90/70 thresholds from §5 of original plan."),
        step("S-UI2.8", "Tax readiness page. Top: big circular score (0-100). Below: 5 cards — Income Summary, Deduction Summary, Regime Comparison (old vs new with difference), Missing Documents, Warnings. Each card expandable. 'Download report' button top-right.", "Score is the visual anchor; cards are secondary."),
        step("S-UI2.9", "Financial health page. Top: big score. Left: Income vs Expense bar chart (last 6 months). Right: Category-wise pie chart. Below: Savings Rate, Emergency Fund Status, Subscription Leakage — each as a metric card with a one-line explanation. 'Top 3 Improvement Suggestions' card at bottom.", "Charts have axes labels. Score is the anchor."),
        step("S-UI2.10", "Goal simulator page. Form (left): goal name, target amount, current amount, monthly contribution, target date. Output (right): progress bar, projected completion date, shortfall, 'Try different scenarios' slider. Suggested goals as chips: Emergency fund, Laptop, Vacation.", "Form has 5 inputs. Output updates when inputs change (note: 'live calculation')."),
        step("S-UI2.11", "AI assistant page. Chat UI: message list (user right, assistant left), input box at bottom. Above input: suggested questions as chips ('Why is my tax score low?', 'What documents are missing?', 'How can I improve savings?').", "Chat layout works on mobile (input stays pinned to bottom)."),
        step("S-UI2.12", "Report download page. 3 cards: CA-Ready Tax Summary, Financial Health Report, Goal Simulation Report. Each card: name, 1-line description, 'Last generated: <date>' or 'Not generated yet', Download button, Regenerate button.", "3 cards visible. Empty state is clear when no report exists."),
        step("S-UI2.13", "Settings/privacy page. Sections: Profile (name, email — read-only), Consent History (table: consent type / accepted / revoked), Data Controls (Delete all documents / Delete account / Export summary), Audit Log (last 20 actions table).", "All 4 sections visible. Delete buttons are styled as 'danger' (red)."),
        step("S-UI2.14", "Screen flow diagram. In Excalidraw or as a Mermaid graph in `docs/srs/ui-flow.md`. Edges labeled with the user action ('click upload', 'verify fields', etc.).", "Every wireframe screen appears in the flow. No orphans."),
        step("S-UI2.15", "Review all wireframes against the user journey from UI-1. Every journey step has a corresponding screen. If not, you missed a wireframe.", "Cross-check matrix in `docs/srs/journey-to-screen.md` (just a 2-column table)."),
        step("S-UI2.16", "Commit + tag. `git add docs/srs/ && git commit -m 'ui-2: wireframes for all 13 pages + screen flow' && git tag ui-2-complete`.", "`git tag` lists `ui-2-complete`."),
    ],
    exit_criteria="""- [ ] 13 wireframes created
- [ ] Screen flow diagram complete
- [ ] Journey-to-screen cross-check matrix written
- [ ] Committed + tagged""",
    pitfalls="""- **Adding color/typography now**. Wireframes are grayscale. Visual design is UI-3.
- **Wireframing pages not in the user journey**. Rung 1 — cut them.
- **Making the dashboard too dense**. The plan §5.1 explicitly says 'avoid overloaded dashboards'. Less is more.
- **Skipping the verification page wireframe** because 'it's just a form'. This is the highest-friction page in the app — wireframe it carefully.""",
)

# ============================================================================

phase_file(
    "ui-03-design-system.md",
    goal="Lock the visual language before coding. Every shadcn/ui customization, every Tailwind token, every chart color comes from this phase.",
    prereqs="- UI-2 complete (wireframes show what components you need).",
    ponytail="**Rung 4 — Native platform features first.** Use CSS custom properties and Tailwind tokens. Don't pull in a styled-components theme engine. shadcn/ui is already installed — use its tokens.",
    steps=[
        step("S-UI3.1", "Color palette. Define in HSL for Tailwind. Primary: deep blue `hsl(221 83% 53%)` (trust). Accent: emerald `hsl(142 71% 45%)` (positive/success). Warning: amber `hsl(38 92% 50%)`. Danger: red `hsl(0 84% 60%)`. Neutral grays: 0, 50, 100, 200, 400, 600, 900. Background: white. Foreground: `hsl(221 39% 11%)`.", "Write to `docs/design-system.md` as a table with hex + HSL."),
        step("S-UI3.2", "Typography. Font: Inter (Latin) + Noto Sans (Devanagari fallback). Sizes (rem): xs 0.75, sm 0.875, base 1, lg 1.125, xl 1.25, 2xl 1.5, 3xl 1.875, 4xl 2.25, 5xl 3. Line height: 1.5 body, 1.2 headings. Weight: 400 body, 500 medium, 600 semibold, 700 bold.", "Add to `docs/design-system.md`."),
        step("S-UI3.3", "Spacing scale (Tailwind defaults work). 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px). Card padding: 6. Section gap: 12. Page padding: 6 mobile / 8 desktop.", "Document in `docs/design-system.md`."),
        step("S-UI3.4", "Component primitives. Document the shadcn/ui components you'll use: Button (variants: default/outline/ghost/destructive), Input, Select, Dialog, Card, Alert, Badge, Progress, Table, Tooltip, Toast. For each: when to use + key props. Don't customize yet — use defaults.", "List in `docs/design-system.md`. If a need isn't covered by shadcn, document the custom component needed."),
        step("S-UI3.5", "States. For every component, define 4 states: loading (spinner skeleton), empty (icon + 1-line message + CTA), error (red Alert + retry), success (green Toast, 3s auto-dismiss).", "Add to `docs/design-system.md`. Sketch in Excalidraw if helpful."),
        step("S-UI3.6", "Chart colors. For Recharts: assign each category a color from the palette. Order: primary blue, emerald, amber, red, violet, cyan, pink, gray. Bank statement categories (§7 of plan) get fixed colors: Food=amber, Rent=red, Travel=cyan, Shopping=violet, Subscriptions=pink, Investment=emerald, EMI=red-dark.", "Document in `docs/design-system.md`."),
        step("S-UI3.7", "Iconography. Use `lucide-react` (shadcn default). Don't mix icon libraries. Sizes: 16 (inline), 20 (button), 24 (card header), 32 (empty state).", "Add to `docs/design-system.md`."),
        step("S-UI3.8", "Accessibility rules. Min contrast 4.5:1 (use WebAIM contrast checker). Focus ring: 2px primary color. Don't rely on color alone for status (always pair with icon/text). Form labels always visible (no placeholder-only).", "Add to `docs/design-system.md`."),
        step("S-UI3.9", "Write the file. Compile all the above into a single `docs/design-system.md` with sections: Palette / Typography / Spacing / Components / States / Charts / Icons / A11y.", "File exists, ~400-600 lines, every section has a concrete value."),
        step("S-UI3.10", "Commit + tag. `git add docs/design-system.md && git commit -m 'ui-3: design system tokens, components, states, a11y rules' && git tag ui-3-complete`.", "`git tag` lists `ui-3-complete`."),
    ],
    exit_criteria="""- [ ] `docs/design-system.md` complete with all 8 sections
- [ ] Every value is concrete (no 'TBD')
- [ ] Committed + tagged""",
    pitfalls="""- **Choosing neon colors**. Plan §5.3 says 'avoid neon-heavy design'. Finance needs trust = calm colors.
- **Too many font sizes**. 9 sizes is already a lot. Don't add more.
- **Customizing shadcn components now**. Defaults first; customize in Phase 12 when you see them in context.
- **Skipping accessibility**. Plan §5.5 implies mobile-friendly; a11y is part of that. Do it now, not later.""",
)

# ============================================================================

phase_file(
    "phase-00-setup.md",
    goal="Have a running frontend + backend + database by end of phase. Nothing else. No business logic yet.",
    prereqs="- UI-1, UI-2, UI-3 complete.",
    ponytail="**Rung 5 — Use what the scaffolder gives you.** Don't hand-roll Next.js config. Don't write a custom FastAPI app factory. Use the official starters.",
    steps=[
        step("S-0.1", "Create the GitHub repo. Name: `finsight-ai`. Private. Add README with project title + one-line description + link to original plan. Don't init with README (we have one).", "`git remote -v` shows your GitHub URL."),
        step("S-0.2", "Initialize frontend. `cd /home/z/my-project/finsight-ai && npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias '@/*' --use-pnpm --no-eslint --yes`. Then `cd frontend && pnpm dlx shadcn@latest init -d`.", "`cd frontend && pnpm dev` starts on http://localhost:3000 and shows the Next.js default page.", "If shadcn init fails, run `pnpm dlx shadcn@latest init` and answer prompts: style=new-york, base color=slate, css variables=yes."),
        step("S-0.3", "Add frontend deps: `pnpm add recharts react-hook-form @hookform/resolvers zod lucide-react`. Add dev: `pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-next prettier prettier-plugin-tailwindcss`.", "`pnpm install` completes with no errors. `pnpm lint` runs."),
        step("S-0.4", "Initialize backend. `cd /home/z/my-project/finsight-ai && mkdir backend && cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install fastapi uvicorn[standard] sqlalchemy[asyncio] alembic asyncpg pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart pdfplumber pymupdf pytesseract pillow reportlab openai python-dotenv`. Pin: `pip freeze > requirements.txt`.", "`uvicorn app.main:app --reload` runs and `curl http://localhost:8000/health` returns `{\"status\":\"ok\"}` (after S-0.5)."),
        step("S-0.5", "Create backend structure. `backend/app/__init__.py`, `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/core/security.py`. `main.py` has a `/health` endpoint returning `{\"status\":\"ok\"}`. `config.py` reads `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM=HS256`, `JWT_EXPIRE_MINUTES=1440` from env.", "`python -c 'from app.main import app'` imports without error."),
        step("S-0.6", "Install ruff. `pip install ruff`. Add `backend/pyproject.toml` with ruff config: line-length=100, target Python 3.11, select=['E','F','I','N','W','B','UP','SIM']. Run `ruff check app/`.", "`ruff check app/` returns 0 issues."),
        step("S-0.7", "Write `docker-compose.yml` at project root. Services: `db` (postgres:15-alpine, env POSTGRES_USER/PASSWORD/DB, volume `pgdata`, port 5432), `backend` (build `./backend`, env `DATABASE_URL=postgresql+asyncpg://finsight:finsight@db:5432/finsight`, port 8000, depends_on db), `frontend` (build `./frontend`, port 3000, depends_on backend).", "`docker-compose up -d` starts all 3 services. `docker-compose ps` shows all 'up'.", "If postgres won't start, check port 5432 isn't already in use: `lsof -i :5432`."),
        step("S-0.8", "Backend Dockerfile. `backend/Dockerfile`: `FROM python:3.11-slim`, install system deps (`libpq-dev gcc tesseract-ocr`), copy requirements, `pip install -r requirements.txt`, copy app, `CMD [\"uvicorn\",\"app.main:app\",\"--host\",\"0.0.0.0\",\"--port\",\"8000\"]`.", "`docker-compose build backend` succeeds."),
        step("S-0.9", "Frontend Dockerfile. `frontend/Dockerfile`: `FROM node:20-alpine`, copy package files, `pnpm install --frozen-lockfile`, copy src, `pnpm build`, `CMD [\"pnpm\",\"start\"]`. Add `frontend/.dockerignore` for `node_modules` and `.next`.", "`docker-compose build frontend` succeeds."),
        step("S-0.10", "Write `.env.example` at project root with all env vars: `DATABASE_URL=postgresql+asyncpg://finsight:finsight@localhost:5432/finsight`, `JWT_SECRET=change-me-in-prod`, `JWT_ALGORITHM=HS256`, `JWT_EXPIRE_MINUTES=1440`, `OPENAI_API_KEY=`, `UPLOAD_DIR=./uploads`, `MAX_UPLOAD_MB=10`.", "File exists. `cp .env.example .env` and the app still boots (with empty OPENAI_API_KEY)."),
        step("S-0.11", "Write `.gitignore`. Include: `__pycache__/`, `*.pyc`, `.venv/`, `node_modules/`, `.next/`, `dist/`, `build/`, `*.log`, `.env`, `uploads/`, `reports/*.pdf`, `*.sqlite3`, `.DS_Store`, `.idea/`, `.vscode/`.", "`git status` is clean (no node_modules or .venv showing as untracked)."),
        step("S-0.12", "Write root `README.md`. Sections: title, one-line description, architecture diagram (Mermaid), stack, setup (`docker-compose up`), dev (`cd backend && uvicorn app.main:app --reload` + `cd frontend && pnpm dev`), env vars table, license (MIT).", "README renders cleanly on GitHub (preview)."),
        step("S-0.13", "Copy ponytail's `AGENTS.md` to project root: `cp /home/z/my-project/ponytail/AGENTS.md /home/z/my-project/finsight-ai/AGENTS.md`. This auto-loads ponytail rules in any ponytail-aware agent (Cursor, Codex, Claude Code, etc.).", "`cat AGENTS.md | head -5` shows ponytail rules."),
        step("S-0.14", "Set up pre-commit. `pip install pre-commit`. Write `.pre-commit-config.yaml` with hooks: ruff (backend), ruff-format (backend), eslint (frontend, language: node), prettier (frontend). `pre-commit install`.", "`git commit` runs the hooks. Try committing a file with an unused import — the commit should be rejected."),
        step("S-0.15", "First real commit. `git add -A && git commit -m 'phase-0: project scaffold (next.js + fastapi + postgres + docker)'`. Then `git tag phase-0-complete`.", "`git log` shows one commit. `git tag` shows `phase-0-complete`."),
        step("S-0.16", "Smoke test. `docker-compose down -v && docker-compose up -d --build`. Wait 30s. `curl http://localhost:8000/health` → `{\"status\":\"ok\"}`. `curl http://localhost:3000` → HTML response. `docker-compose exec db psql -U finsight -d finsight -c '\\dt'` → no tables yet (expected).", "All 3 services respond. No errors in `docker-compose logs`.", "If backend can't reach db, check `DATABASE_URL` host is `db` (service name), not `localhost`."),
    ],
    exit_criteria="""- [ ] Repo on GitHub
- [ ] Frontend boots (Next.js default page)
- [ ] Backend `/health` returns ok
- [ ] Postgres running in Docker
- [ ] `docker-compose up` works end-to-end
- [ ] `.env.example`, `.gitignore`, `README.md` exist
- [ ] `AGENTS.md` (ponytail rules) at project root
- [ ] Pre-commit hooks installed
- [ ] Committed + tagged `phase-0-complete`""",
    pitfalls="""- **Skipping Docker**. You'll regret it when you deploy. Set it up now.
- **Adding business-logic deps too early**. We installed pdfplumber, pytesseract etc. now because they're core. Don't add `celery`, `redis`, `kafka` — not needed for FYP.
- **Customizing shadcn theme before using it**. Defaults first. Customize in Phase 12.
- **Committing `.env`**. The `.gitignore` rule must work — verify with `git status` after `cp .env.example .env`.""",
)

# ============================================================================

phase_file(
    "phase-01-database.md",
    goal="Have a versioned, migrated PostgreSQL schema with all 11 tables from §6 of the original plan. Seed data loads cleanly.",
    prereqs="- Phase 0 complete (docker-compose up works, Postgres reachable).",
    ponytail="**Rung 4 — DB constraints over app code.** Every foreign key, every CHECK, every NOT NULL lives in the DB. App-level validation is for user-friendly errors only, not data integrity.",
    steps=[
        step("S-1.1", "Init Alembic. `cd backend && alembic init alembic`. Edit `alembic.ini`: set `sqlalchemy.url = ` (we'll override via env). Edit `alembic/env.py` to read `DATABASE_URL` from env and import `app.models` so autogenerate sees them.", "`alembic current` runs without error (returns empty, no migrations yet)."),
        step("S-1.2", "Create `backend/app/models/__init__.py` and `backend/app/models/base.py` with `Base = declarative_base()`. Create `backend/app/models/user.py` with the `User` model: `id` (UUID PK, default `uuid4`), `name` (str, not null), `email` (str, unique, not null, indexed), `password_hash` (str, not null), `created_at` (datetime, server_default now()), `updated_at` (datetime, onupdate now()).", "`python -c 'from app.models.user import User; print(User.__table__)'` prints the table definition."),
        step("S-1.3", "`user_consents` table. Model `UserConsent`: `id` (UUID PK), `user_id` (FK users.id, ondelete CASCADE, indexed), `consent_type` (str, e.g. 'document_processing'), `consent_text` (Text), `accepted_at` (datetime), `revoked_at` (datetime, nullable). CHECK constraint: not both null.", "Model imports cleanly. `alembic revision --autogenerate -m 'add user_consents'` produces a migration with the table."),
        step("S-1.4", "`documents` table. Model `Document`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `document_type` (str, CHECK in ['salary_slip','form16','bank_statement','rent_receipt','insurance_receipt','loan_certificate','investment_statement','other']), `file_name` (str), `file_path` (str), `file_hash` (str, indexed — for dedup), `file_size_bytes` (int), `mime_type` (str), `processing_status` (str, CHECK in ['pending','processing','extracted','verified','failed'], default 'pending'), `confidence_score` (float, nullable), `error_message` (str, nullable), `created_at`, `updated_at`. Unique constraint on `(user_id, file_hash)`.", "Migration generated. Two uploads with same hash for same user should fail the second insert."),
        step("S-1.5", "`extracted_fields` table. Model `ExtractedField`: `id` (UUID PK), `document_id` (FK documents.id, cascade, indexed), `field_name` (str, indexed), `field_value` (Text — store as string, cast in app), `confidence_score` (float, CHECK 0 <= x <= 1), `verified_by_user` (bool, default false), `source_snippet` (Text, nullable), `created_at`. Index on `(document_id, field_name)`.", "Migration generated. Confidence score CHECK rejects values > 1."),
        step("S-1.6", "`incomes` table. Model `Income`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `income_type` (str, CHECK in ['salary','interest','rental','other']), `source` (str), `amount` (Numeric(12,2), CHECK >= 0), `month` (int, CHECK 1-12), `financial_year` (str, e.g. '2024-25'), `document_id` (FK documents.id, nullable), `verified` (bool, default false), `created_at`.", "Migration generated. CHECK rejects negative amounts."),
        step("S-1.7", "`expenses` table. Model `Expense`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `transaction_date` (date, indexed), `description` (str), `category` (str, CHECK in the 13 categories from §7 of plan), `amount` (Numeric(12,2), CHECK > 0), `document_id` (FK, nullable), `created_at`. Composite index on `(user_id, transaction_date)`.", "Migration generated."),
        step("S-1.8", "`deductions` table. Model `Deduction`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `deduction_type` (str, e.g. '80C','80D','80G','HRA','HomeLoanInterest'), `amount` (Numeric(12,2), CHECK >= 0), `financial_year` (str), `document_id` (FK, nullable), `verified` (bool, default false), `created_at`.", "Migration generated."),
        step("S-1.9", "`tax_estimations` table. Model `TaxEstimation`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `financial_year` (str), `gross_income` (Numeric(12,2)), `total_deductions` (Numeric(12,2)), `taxable_income_old_regime` (Numeric(12,2)), `taxable_income_new_regime` (Numeric(12,2)), `estimated_tax_old_regime` (Numeric(12,2)), `estimated_tax_new_regime` (Numeric(12,2)), `recommended_regime` (str, CHECK in ['old','new']), `computed_at` (datetime).", "Migration generated."),
        step("S-1.10", "`financial_health_scores` table. Model `FinancialHealthScore`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `month` (date — first day of month, indexed), `savings_rate` (float), `debt_to_income_ratio` (float), `emergency_fund_months` (float), `subscription_total` (Numeric(12,2)), `score` (int, CHECK 0-100), `computed_at` (datetime). Unique on `(user_id, month)`.", "Migration generated. Unique constraint prevents duplicate monthly scores."),
        step("S-1.11", "`goals` table. Model `Goal`: `id` (UUID PK), `user_id` (FK, cascade, indexed), `goal_name` (str), `target_amount` (Numeric(12,2), CHECK > 0), `current_amount` (Numeric(12,2), default 0), `monthly_contribution` (Numeric(12,2), default 0), `target_date` (date, nullable), `expected_return_rate` (float, default 0.0), `created_at`.", "Migration generated."),
        step("S-1.12", "`audit_logs` table. Model `AuditLog`: `id` (UUID PK), `user_id` (FK, cascade, indexed — nullable for unauthenticated events like failed login), `action` (str, indexed), `details` (JSONB — structured details, NOT sensitive values), `ip_address` (str, nullable), `timestamp` (datetime, indexed, server_default now()). Partition by month if volume grows (Rung 1: skip for FYP).", "Migration generated."),
        step("S-1.13", "Generate the consolidated migration. `cd backend && alembic revision --autogenerate -m 'phase-1: initial schema (11 tables)'`. Review the generated file. Make sure all CHECK constraints and indexes are present (autogenerate sometimes misses them).", "Migration file exists in `alembic/versions/`. SQL looks right.", "If autogenerate missed a CHECK, edit the migration file by hand — don't rely on the next autogenerate."),
        step("S-1.14", "Apply migration. `alembic upgrade head`. Verify: `docker-compose exec db psql -U finsight -d finsight -c '\\dt'` shows all 11 tables + `alembic_version`.", "All 11 tables present."),
        step("S-1.15", "Generate ER diagram. Use the `charts` skill — it has a Mermaid ER renderer. Save to `docs/architecture/er-diagram.mmd` and a PNG render to `docs/architecture/er-diagram.png`. Show all 11 tables, their columns, and FK relationships.", "Mermaid renders without error. PNG is readable."),
        step("S-1.16", "Seed data script. `backend/scripts/seed.py`: creates 2 demo users (password 'demo1234'), uploads 3 sample documents, runs through extraction (mocked), creates 1 goal. Idempotent — running twice should not duplicate. Use `--reset` flag to truncate first.", "`python scripts/seed.py` runs. `python scripts/seed.py` again doesn't duplicate. `python scripts/seed.py --reset` truncates and re-seeds."),
        step("S-1.17", "Commit + tag. `git add -A && git commit -m 'phase-1: 11-table schema, alembic migrations, ER diagram, seed script' && git tag phase-1-complete`.", "`git tag` lists `phase-1-complete`."),
    ],
    exit_criteria="""- [ ] 11 tables created via Alembic migration
- [ ] All FKs have `ondelete=CASCADE` where appropriate
- [ ] All CHECK constraints enforced (test by inserting bad data — should fail)
- [ ] Indexes on every FK and frequently-queried column
- [ ] ER diagram in `docs/architecture/`
- [ ] Seed script runs idempotently
- [ ] Committed + tagged""",
    pitfalls="""- **Forgetting `ondelete=CASCADE`**. Without it, deleting a user leaves orphaned documents. Set it on every FK that points to users.
- **Storing amounts as float**. Use `Numeric(12,2)` — financial data needs exact precision.
- **Missing CHECK constraints**. The DB should reject invalid data even if the app has a bug.
- **Storing computed values**. Don't store `taxable_income` if it's just `gross - deductions` — compute it. The plan says 'avoid storing duplicate calculated data unless needed' (§6 optimization rules). Exception: `tax_estimations` is a snapshot for historical comparison, that's fine.
- **Skipping the seed script**. You'll need test data for every subsequent phase. Build it once here.""",
)

# ============================================================================

phase_file(
    "phase-02-auth-consent.md",
    goal="A user can register, log in, accept/revise consent, and access protected routes. JWT-based. Passwords hashed with bcrypt. No document processing without consent.",
    prereqs="- Phase 1 complete (users + user_consents tables exist).",
    ponytail="**NEVER LAZY HERE.** This is a security boundary. Rung 1 (YAGNI) does not apply — every validation, every check, every audit log entry stays. Full stop.",
    steps=[
        step("S-2.1", "Password hashing util. `backend/app/core/security.py`: `hash_password(plain: str) -> str` using `passlib.context.CryptContext(schemes=['bcrypt'])`. `verify_password(plain, hashed) -> bool`. `create_access_token(data: dict, expires_minutes: int = 1440) -> str` using `python-jose`. `decode_access_token(token) -> dict`.", "Unit test: `hash_password('x')` != 'x'. `verify_password('x', hash)` is True. Token decodes back to original data."),
        step("S-2.2", "Auth schemas. `backend/app/schemas/auth.py`: `UserCreate` (name, email, password — min 8 chars, regex for at least 1 letter + 1 digit), `UserLogin` (email, password), `UserOut` (id, name, email, created_at — never password_hash), `TokenOut` (access_token, token_type='bearer'). Use Pydantic v2 with `email_str=True`.", "`UserCreate(email='not-email')` raises ValidationError."),
        step("S-2.3", "`POST /auth/register`. `backend/app/routers/auth.py`: receive `UserCreate`, check email not already in DB (409 if exists), hash password, insert user, return `UserOut` + `TokenOut`. Log to `audit_logs` action='register'.", "`curl -X POST localhost:8000/auth/register -H 'Content-Type: application/json' -d '{\"name\":\"Demo\",\"email\":\"demo@x.com\",\"password\":\"demo1234\"}'` returns 201 with token.", "If 500, check `JWT_SECRET` env is set."),
        step("S-2.4", "`POST /auth/login`. Receive `UserLogin`, fetch user by email (404 if not found), verify password (401 if wrong), issue JWT, return `TokenOut`. Log to `audit_logs` action='login' or 'login_failed'.", "Login with demo user returns 200 + token. Wrong password returns 401."),
        step("S-2.5", "`POST /auth/logout`. Stateless JWT is anti-pattern (Rung 1: skip token blocklist for FYP). Just return 200 + tell client to delete token. Log to `audit_logs` action='logout'.", "Endpoint returns 200.", "Note in code: `# ponytail: stateless logout, client discards token. upgrade: token blocklist if we add multi-device session control.`"),
        step("S-2.6", "`get_current_user` dependency. `backend/app/core/deps.py`: `async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User`. Decode JWT (401 if invalid/expired), fetch user from DB (401 if not found), return user.", "Calling `/users/me` with valid token returns the user. Without token returns 401."),
        step("S-2.7", "`require_consent` dependency. `async def require_consent(user = Depends(get_current_user), db = Depends(get_db)) -> User`: query `user_consents` for this user where `consent_type='document_processing'` AND `accepted_at IS NOT NULL` AND `revoked_at IS NULL`. 403 if not found. Returns user.", "Without consent, calling `/documents` POST returns 403 with `{\"detail\":\"Consent required\"}`."),
        step("S-2.8", "`GET /users/me`. Returns `UserOut` for the authenticated user. Uses `get_current_user`.", "Returns the logged-in user's data, no password_hash field."),
        step("S-2.9", "`DELETE /users/me`. Hard-delete (with cascade). Confirm with password in request body. Delete user → cascade deletes documents, extracted_fields, etc. (because of `ondelete=CASCADE`). Also delete uploaded files from disk (we'll wire this in Phase 11, for now just DB delete). Log to `audit_logs` action='account_deleted'.", "After delete, login with that user fails with 404."),
        step("S-2.10", "`POST /consent/accept`. Body: `{consent_type, consent_text}`. Server validates `consent_text` matches the current consent text (config in `app/core/config.py`). Insert `UserConsent` row with `accepted_at=now()`. If a previous consent was revoked, this creates a new row (history preserved). Log to `audit_logs`.", "Calling this endpoint twice creates 2 rows in `user_consents`."),
        step("S-2.11", "`POST /consent/revoke`. Body: `{consent_type}`. Find the latest accepted consent for this user+type, set `revoked_at=now()`. After this, `/documents` POST returns 403 again. Log to `audit_logs` action='consent_revoked'.", "Revoke, then try `/documents` POST → 403."),
        step("S-2.12", "`GET /consent/history`. Returns list of all consent events for this user (both accept and revoke), sorted by `accepted_at` desc.", "Returns the right shape: `[{consent_type, consent_text, accepted_at, revoked_at}]`."),
        step("S-2.13", "Frontend: API client. `frontend/src/lib/api.ts`: `fetch` wrapper. Add `apiFetch(url, options)` that auto-adds `Authorization: Bearer <token>` from localStorage. On 401, redirect to `/login`.", "Calling `apiFetch('/users/me')` after login returns the user object."),
        step("S-2.14", "Frontend: auth store. `frontend/src/stores/auth.ts`: Zustand store (or React Context). State: `user`, `token`, `consentGiven`. Actions: `login`, `register`, `logout`, `fetchMe`, `checkConsent`. Persist token to localStorage.", "After `login`, `user` is set. After `logout`, both null."),
        step("S-2.15", "Frontend: login/register page. Route `/login`. shadcn Tabs: 'Login' / 'Register'. Forms use react-hook-form + zod. On success, navigate to `/consent` if consent not given, else `/dashboard`.", "Can register, log in, land on dashboard."),
        step("S-2.16", "Frontend: consent page. Route `/consent`. Shows the consent text (fetch from `/consent/current-text` — add this endpoint, returns the canonical text). 'Accept and Continue' + 'Cancel' buttons. Accept calls `/consent/accept`. Cancel logs out.", "Accepting navigates to `/dashboard`. Cancel returns to `/login`."),
        step("S-2.17", "Frontend: protected route wrapper. `frontend/src/components/ProtectedRoute.tsx`: checks `auth.token` exists. If not, redirect to `/login`. If token but no consent, redirect to `/consent`. Wrap every authenticated page.", "Visiting `/dashboard` without login redirects to `/login`."),
        step("S-2.18", "Integration test. `backend/tests/test_auth.py`: register → login → /users/me → consent/accept → /consent/history → consent/revoke → /consent/history. Use `pytest` + `httpx.AsyncClient`. Run with `pytest tests/test_auth.py -v`.", "All tests pass. ≥5 test cases."),
        step("S-2.19", "Security check. Verify: (a) password never appears in any API response, (b) JWT contains only `sub` (user_id) and `exp` — no PII, (c) `audit_logs` rows are written for every auth event, (d) 401 vs 403 vs 404 are correctly distinguished (don't leak whether email exists via 404 on login — return 401 'invalid credentials').", "Manual review: grep `password` in `app/schemas/auth.py` — should only be in `UserCreate` and `UserLogin`, never in `UserOut` or `TokenOut`.", "If login returns 404 for unknown email, that's an info leak — fix it to return 401."),
        step("S-2.20", "Commit + tag. `git add -A && git commit -m 'phase-2: auth (register/login/logout), consent (accept/revoke/history), JWT, frontend pages' && git tag phase-2-complete`.", "`git tag` lists `phase-2-complete`."),
    ],
    exit_criteria="""- [ ] Register, login, logout work end-to-end
- [ ] JWT issued on login, validated on every protected route
- [ ] Passwords bcrypt-hashed
- [ ] Consent required for document operations
- [ ] Consent history visible
- [ ] Account deletion cascades
- [ ] Audit log entries written for every auth event
- [ ] No PII in JWT, no password in any response
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Returning 404 on login for unknown email**. Info leak. Return 401 'invalid credentials' for both unknown email and wrong password.
- **Storing JWT in cookies without HttpOnly + SameSite**. If you switch to cookies, set both. For FYP, localStorage is fine.
- **Forgetting to revoke consent**. The `require_consent` dep must check `revoked_at IS NULL`, not just `accepted_at IS NOT NULL`.
- **Not logging failed logins**. Audit log should record both success and failure (without the password, obviously).
- **Skipping the audit log entirely**. Phase 11 will need it; build it now.""",
)

# ============================================================================

phase_file(
    "phase-03-upload.md",
    goal="User can upload a financial document (PDF/JPG/PNG/CSV/XLSX), the system stores it, dedups via hash, and shows a processing status badge. No OCR or extraction yet — that's Phase 4.",
    prereqs="- Phase 2 complete (auth + consent gates work).",
    ponytail="**Rung 3 — stdlib for file ops.** `hashlib.sha256`, `pathlib.Path`, `shutil.copyfileobj`. No need for any file-upload library beyond what FastAPI gives you (`UploadFile`).",
    steps=[
        step("S-3.1", "Document schemas. `backend/app/schemas/document.py`: `DocumentOut` (id, document_type, file_name, file_size_bytes, mime_type, processing_status, confidence_score, error_message, created_at), `DocumentListOut` (items: list[DocumentOut], total: int). Pydantic v2.", "Schemas import cleanly."),
        step("S-3.2", "Upload validation util. `backend/app/services/upload.py`: `validate_upload(file: UploadFile) -> None`. Checks: (1) extension in allowed set {pdf, jpg, jpeg, png, csv, xlsx}, (2) mime type matches extension (use stdlib `mimetypes`), (3) size <= MAX_UPLOAD_MB (read in chunks of 64KB to avoid loading whole file into memory). Raise `HTTPException(400)` with a useful message on each failure.", "Test: upload a 11MB file → 400. Upload a .txt → 400. Upload a .pdf that's actually a .txt renamed → 400 (if magic bytes checked) or accepted (if only extension checked)."),
        step("S-3.3", "File hash + dedup. In `services/upload.py`: `compute_file_hash(file: UploadFile) -> str`. Read file in chunks, update `hashlib.sha256()`, return hex digest. Reset file position with `await file.seek(0)` after.", "Two uploads of the same file produce the same hash. Different files produce different hashes."),
        step("S-3.4", "Store file to disk. `services/upload.py`: `save_file(file: UploadFile, user_id: str, doc_id: str) -> Path`. Path format: `UPLOAD_DIR/{user_id}/{doc_id}.{ext}`. Use `pathlib.Path.mkdir(parents=True, exist_ok=True)`. Stream to disk with `shutil.copyfileobj` in 64KB chunks.", "After upload, file exists on disk at the expected path."),
        step("S-3.5", "`POST /documents` endpoint. `backend/app/routers/documents.py`: multipart form with `file` and `document_type` (the user picks the type — auto-detection comes in Phase 4). Deps: `require_consent`. Flow: validate → hash → check if `(user_id, file_hash)` already exists (409 if so) → save to disk → insert Document row with `processing_status='pending'` → return `DocumentOut`. Log to `audit_logs` action='document_uploaded'.", "`curl -F 'file=@sample.pdf' -F 'document_type=salary_slip' -H 'Authorization: Bearer <token>' localhost:8000/documents` returns 201 with the document object."),
        step("S-3.6", "`GET /documents` endpoint. Returns `DocumentListOut` for the current user. Paginate: `?page=1&size=20`. Order by `created_at DESC`. Use `LIMIT` + `OFFSET` in SQL (Rung 6: pagination is one-liner with SQLAlchemy `offset().limit()`).", "Returns 20 items max per page. `?page=2` returns the next 20."),
        step("S-3.7", "`GET /documents/{id}` endpoint. Returns single `DocumentOut`. Verify the document belongs to the current user (403 if not — don't 404, that leaks existence).", "Fetching own document works. Fetching another user's document returns 403."),
        step("S-3.8", "`DELETE /documents/{id}` endpoint. Verify ownership. Delete file from disk (`Path.unlink(missing_ok=True)`). Delete DB row (cascade deletes extracted_fields). Log to `audit_logs` action='document_deleted'.", "After delete, file is gone from disk, DB row gone, GET returns 404."),
        step("S-3.9", "Frontend: upload component. `frontend/src/components/FileUploader.tsx`. Native HTML5 drag-and-drop. On drop/click: POST to `/documents` with `FormData`. Show progress bar using `fetch`'s `XMLHttpRequest` (or `axios` if you must — but Rung 4: try native first).", "Drag a PDF onto the dropzone, see progress bar fill, see success toast."),
        step("S-3.10", "Frontend: document type selector. shadcn Select with the 8 types from §3 of plan. Required before upload. Saves the chosen type with the upload.", "Can't upload without picking a type. Selecting 'Salary Slip' and uploading sends `document_type=salary_slip`."),
        step("S-3.11", "Frontend: documents list. `frontend/src/features/documents/DocumentList.tsx`. Table: file name, type, status badge, size, created_at, actions (delete). Status badge colors: pending=gray, processing=blue, extracted=green, verified=emerald, failed=red. Polling: refresh every 5s when any document is in 'pending' or 'processing' state.", "Upload a doc, see it appear in the list with 'pending' badge. Badge eventually updates (manually for now, since no processing yet)."),
        step("S-3.12", "Frontend: documents page. Route `/documents`. Layout: left = FileUploader + type selector, right = DocumentList. Empty state: 'No documents yet. Upload your first one.'", "Visiting `/documents` shows the upload UI. Empty state shows when no documents."),
        step("S-3.13", "Integration test. `backend/tests/test_documents.py`: register → consent → upload salary_slip → GET list (1 item) → GET by id → upload same file again (409) → DELETE → GET list (0 items).", "All tests pass."),
        step("S-3.14", "Commit + tag. `git add -A && git commit -m 'phase-3: document upload, dedup, list, delete, frontend UI' && git tag phase-3-complete`.", "`git tag` lists `phase-3-complete`."),
    ],
    exit_criteria="""- [ ] Upload works for PDF, JPG, PNG, CSV, XLSX
- [ ] Invalid types/sizes rejected with clear error
- [ ] Duplicate file (same hash) rejected
- [ ] Files stored on disk under `uploads/{user_id}/{doc_id}.{ext}`
- [ ] List endpoint paginated
- [ ] Delete removes both file and DB row
- [ ] Frontend upload UI with progress + status badges
- [ ] Multi-user isolation (can't access another user's docs)
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Loading whole file into memory**. For a 10MB PDF this works, but it doesn't scale. Use chunks from day 1.
- **Trusting the file extension**. A `.pdf` could be a `.exe`. Check magic bytes (PDF starts with `%PDF`, PNG with `\\x89PNG`, etc.).
- **Storing files with original names**. Use the doc_id as the filename — original names can have weird chars, path traversal attacks, etc. Keep original name in DB only.
- **Not deduping**. A user uploading the same salary slip twice clutters their dashboard. Hash-based dedup is cheap.
- **Forgetting audit logs**. Document upload/delete are state-changing actions on sensitive data. Log them.""",
)

# ============================================================================

phase_file(
    "phase-04-ocr-processing.md",
    goal="Convert uploaded documents into clean text + tables. Detect document type. Update `processing_status`. No field extraction yet — that's Phase 5.",
    prereqs="- Phase 3 complete (uploads work).\n- Tesseract installed (it's in the Dockerfile from Phase 0).",
    ponytail="**Rung 5 — installed deps first.** `pdfplumber` + `pytesseract` + `pillow`. Don't add `easyocr` or `paddleocr` unless `pytesseract` demonstrably fails on your test fixtures.",
    steps=[
        step("S-4.1", "Sample fixtures. Place in `sample-data/`: 1 salary slip (PDF with text), 1 Form 16 (PDF with text), 1 bank statement (PDF with text + tables), 1 scanned salary slip (image PDF — generate by scanning or use a sample image). Name them clearly: `salary_slip_sample.pdf`, `form16_sample.pdf`, etc.", "`ls sample-data/` shows the fixtures."),
        step("S-4.2", "PDF text extractor. `backend/app/services/extractors/pdf.py`: `extract_text(path: Path) -> str`. Use `pdfplumber.open(path) as pdf: return '\\n\\n'.join(page.extract_text() or '' for page in pdf.pages)`. If text is empty or <50 chars, raise `NeedsOCR` exception.", "Calling `extract_text` on `salary_slip_sample.pdf` returns the visible text. On scanned PDF, raises `NeedsOCR`."),
        step("S-4.3", "OCR fallback. `backend/app/services/extractors/ocr.py`: `ocr_pdf(path: Path) -> str`. Use `pymupdf.open(path)` to render each page to a PIL image at 300 DPI, then `pytesseract.image_to_string(img)`. Concatenate pages.", "Calling `ocr_pdf` on the scanned PDF returns text.", "If tesseract not found, check `tesseract` is in PATH in the container."),
        step("S-4.4", "Image preprocessing (improves OCR accuracy). Before passing to tesseract: convert to grayscale (`img.convert('L')`), increase contrast (Pillow `ImageOps.autocontrast`), optionally binarize with a threshold. Skip upscaling (Rung 1: 300 DPI is enough).", "OCR output on preprocessed image is more accurate than raw. Spot-check a few values."),
        step("S-4.5", "Text cleanup. `backend/app/services/extractors/cleanup.py`: `clean_text(text: str) -> str`. Strip excess whitespace, normalize unicode (NFKC), remove non-printable chars, collapse multiple blank lines. Don't strip digits or punctuation — those carry financial info.", "Input with weird whitespace/unicode returns clean text. Regex test: `re.search(r'\\s{3,}', clean_text(messy))` is None."),
        step("S-4.6", "Table extractor. `backend/app/services/extractors/tables.py`: `extract_tables(path: Path) -> list[list[list[str]]]`. Use `pdfplumber.open(path) as pdf: for page in pdf.pages: tables = page.extract_tables()`. Returns 3D list: table → row → cell.", "Calling on `bank_statement_sample.pdf` returns at least 1 table with rows."),
        step("S-4.7", "Document type detector. `backend/app/services/extractors/detector.py`: `detect_doc_type(text: str) -> str | None`. Regex rules from §4 of plan: 'Form 16' → form16, 'Net Salary' or 'Pay Slip' → salary_slip, 'Statement of Account' → bank_statement, 'Premium Receipt' → insurance_receipt, 'Interest Certificate' → loan_certificate. Return None if no match (we'll fall back to the user-supplied type from upload).", "Detector returns the right type for each sample fixture."),
        step("S-4.8", "Processing orchestrator. `backend/app/services/pipeline.py`: `async def process_document(doc_id: str, db: AsyncSession) -> None`. Steps: (1) set status='processing', (2) detect file type by extension, (3) if PDF: try text extract, fall back to OCR, (4) clean text, (5) detect doc type from text, (6) extract tables if PDF, (7) store text + tables in a JSONB column on `documents` (`raw_text`, `extracted_tables`), (8) set status='extracted', confidence_score=1.0 (will be refined in Phase 5). On exception: set status='failed', error_message=str(e).", "Upload a doc → status goes pending → processing → extracted. Check DB: `documents.raw_text` is populated."),
        step("S-4.9", "Wire pipeline to upload. In `POST /documents` (Phase 3), after saving the file, kick off `process_document` as a background task using `BackgroundTasks` from FastAPI. Don't await it — return the response immediately with status='pending'.", "Upload returns immediately with status='pending'. A few seconds later, status becomes 'extracted'."),
        step("S-4.10", "Cleanup temp files. After OCR, delete any temp images created (Pillow images in `/tmp`). The `ocr_pdf` function should use `tempfile.NamedTemporaryFile` and clean up in a `finally` block.", "After processing, `/tmp` has no leftover images from this run."),
        step("S-4.11", "Reprocess endpoint. `POST /documents/{id}/reprocess`. Re-runs the pipeline. Useful for development. Sets status back to 'pending' first.", "Calling reprocess on a doc resets it to pending, then re-extracts."),
        step("S-4.12", "Frontend: processing status page. Route `/documents/{id}`. Shows: file info, status badge (auto-refreshes every 3s while pending/processing), extracted text preview (read-only, in a `<pre>` block), extracted tables (rendered as HTML tables).", "Visiting this page right after upload shows status changing live. Once extracted, shows the text."),
        step("S-4.13", "Integration test. `backend/tests/test_processing.py`: upload salary_slip_sample.pdf → poll until status='extracted' → assert `documents.raw_text` contains 'Basic' or 'HRA'. Upload scanned PDF → assert OCR was used (check `audit_logs` or a debug field).", "Tests pass. Both text PDF and scanned PDF produce text."),
        step("S-4.14", "Commit + tag. `git add -A && git commit -m 'phase-4: PDF text + OCR fallback + tables + type detection pipeline' && git tag phase-4-complete`.", "`git tag` lists `phase-4-complete`."),
    ],
    exit_criteria="""- [ ] Text PDFs extract text via pdfplumber
- [ ] Scanned PDFs OCR via pytesseract
- [ ] Image preprocessing applied
- [ ] Tables extracted from PDFs
- [ ] Document type detected via regex
- [ ] Processing pipeline orchestrator works
- [ ] Status updates: pending → processing → extracted/failed
- [ ] Frontend shows live status + extracted text
- [ ] Temp files cleaned up
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Running OCR on every PDF**. Plan §4 explicitly says: try text extraction first, OCR only if it fails. OCR is 100x slower.
- **Synchronous processing**. Don't await the pipeline in the upload handler — return immediately. Use FastAPI `BackgroundTasks` (Rung 5: don't add Celery for FYP).
- **Storing extracted text in a new table**. For FYP, a JSONB column on `documents` is simpler. Add a separate `document_text` table only if you hit performance issues (you won't).
- **Not cleaning temp files**. OCR creates Pillow images in `/tmp`. They pile up. Use `tempfile` + `finally`.
- **Magic-numbering DPI**. 300 DPI is the standard for OCR. Don't tweak without measuring.""",
)

# ============================================================================

phase_file(
    "phase-05-ai-extraction.md",
    goal="Extract structured financial fields from document text. 3-layer strategy: regex → tables → LLM (only when needed). Confidence scores on every field. User can verify/edit.",
    prereqs="- Phase 4 complete (text + tables extracted).",
    ponytail="**Rung 3 — `re` stdlib is Layer 1.** Don't reach for an LLM until regex demonstrably fails. Plan §5 explicitly says this.",
    steps=[
        step("S-5.1", "Field schemas. `backend/app/schemas/extraction.py`: `ExtractedFieldOut` (id, document_id, field_name, field_value, confidence_score, verified_by_user, source_snippet), `FieldExtractionResult` (field_name, value, confidence, source_snippet). Pydantic v2.", "Schemas import cleanly."),
        step("S-5.2", "Layer 1: regex extractor base. `backend/app/services/extraction/regex_base.py`: `find_field(text: str, patterns: list[str], field_name: str) -> FieldExtractionResult | None`. Try each pattern in order, return first match. Confidence: 0.9 if exact match, 0.75 if fuzzy. `source_snippet`: 50 chars around the match.", "Test: `find_field('Basic Salary: 25000', [r'Basic Salary:?\\s*(\\d+)'], 'basic_salary')` returns `{value: '25000', confidence: 0.9}`."),
        step("S-5.3", "Layer 1: salary slip extractor. `backend/app/services/extraction/salary_slip.py`: `extract(text: str) -> list[FieldExtractionResult]`. Patterns for: employee_name, employer_name, month, basic_salary, hra, gross_salary, pf_deduction, professional_tax, net_salary. Use named groups for readability.", "Run on `salary_slip_sample.pdf` text → all 9 fields extracted with confidence ≥0.7."),
        step("S-5.4", "Layer 1: Form 16 extractor. `backend/app/services/extraction/form16.py`. Patterns for: employee_pan (regex `[A-Z]{5}[0-9]{4}[A-Z]`), employer_tan (regex `[A-Z]{4}[0-9]{5}[A-Z]`), gross_salary, deductions, taxable_income, tds_deducted, financial_year (regex `\\d{4}-\\d{2}` or `FY\\s+\\d{4}-\\d{2}`).", "Run on `form16_sample.pdf` text → fields extracted. PAN/TAN match the regex exactly."),
        step("S-5.5", "Layer 1: bank statement extractor. `backend/app/services/extraction/bank_statement.py`. Use the table extractor output from Phase 4, not the raw text — tables are cleaner. Parse each row into: date (regex `\\d{2}/\\d{2}/\\d{4}` or `\\d{2}-\\d{2}-\\d{4}`), description, debit, credit, balance. Return as a list of transactions.", "Run on `bank_statement_sample.pdf` → list of transactions with all 5 fields each."),
        step("S-5.6", "Layer 1: insurance receipt extractor. `backend/app/services/extraction/insurance.py`. Patterns for: policyholder_name, premium_amount (regex `Premium.*?(\\d+(?:,\\d+)*)`), policy_type, payment_date, insurer_name.", "Run on a sample insurance receipt → fields extracted."),
        step("S-5.7", "Layer 1: loan certificate extractor. `backend/app/services/extraction/loan.py`. Patterns for: borrower_name, loan_account_number, interest_amount, principal_amount, financial_year.", "Run on a sample loan certificate → fields extracted."),
        step("S-5.8", "Layer 2: table extractor (already done in Phase 4, wire it here). For bank statements, use table output. For salary slips with tabular layout, also try tables. Convert table cells to field-value pairs using header detection.", "For a tabular salary slip, Layer 2 finds fields Layer 1 missed (e.g. when 'Basic' is a row label and '25000' is the next column)."),
        step("S-5.9", "Layer 3: LLM extractor (fallback only). `backend/app/services/extraction/llm.py`: `extract_missing(text: str, doc_type: str, missing_fields: list[str]) -> list[FieldExtractionResult]`. Uses `openai` SDK (chat completion with structured output). Prompt: 'Extract these fields from the document text: {missing_fields}. Return JSON: {field_name: {value, confidence}}.' Confidence from LLM = 0.6 (always lower than regex, because regex is more trustworthy for exact matches). Skip if `OPENAI_API_KEY` is empty (Rung 1: optional).", "If OPENAI_API_KEY set, LLM extracts fields regex missed. If not set, function returns empty list (graceful degradation).", "Mark: `# ponytail: LLM fallback only, regex first. upgrade: local LLM if API costs matter.`"),
        step("S-5.10", "Confidence scoring. Already done in each layer. Consolidate in `extraction/__init__.py`: `extract_fields(text: str, tables: list, doc_type: str) -> list[FieldExtractionResult]`. Strategy: (1) run Layer 1, (2) for any expected field not found, try Layer 2, (3) for any still missing, try Layer 3. Take the highest-confidence result per field.", "Running on salary_slip_sample returns all expected fields with confidence scores."),
        step("S-5.11", "Save to DB. In pipeline orchestrator (Phase 4 `process_document`), after text extraction, call `extract_fields(...)`. Insert each result into `extracted_fields` table. Update `documents.confidence_score` to the average of all field confidences. Set status='extracted'.", "After processing, `extracted_fields` table has rows for the document. `documents.confidence_score` is set."),
        step("S-5.12", "`GET /documents/{id}/fields` endpoint. Returns list of `ExtractedFieldOut` for a document. Apply masking to sensitive fields (PAN, account number) — Phase 11 will formalize masking, but apply basic masking now: `mask_pan(pan) -> 'ABCDE****F'`, `mask_account(acc) -> 'XXXX1234'`.", "Returns fields with masked sensitive values."),
        step("S-5.13", "`POST /documents/{id}/fields/{field_id}/verify` endpoint. Body: `{value: str}` (the user may have edited). Update `extracted_fields.field_value` and set `verified_by_user=true`. Log to `audit_logs`.", "Calling with edited value updates the row. `verified_by_user` is true."),
        step("S-5.14", "`POST /documents/{id}/verify-all` endpoint. Marks all fields as verified without edits. For high-confidence fields, this is the fast path.", "All fields for the doc have `verified_by_user=true` after calling."),
        step("S-5.15", "Frontend: verification UI. Route `/documents/{id}/verify`. For each field: label, value (in an editable input if confidence < 0.9, read-only with 'Edit' button otherwise), confidence badge (green ≥0.9, yellow 0.7-0.9, red <0.7), source snippet (collapsible). 'Verify all' button at top. Per-field 'Verify' button. Auto-save on blur (debounced 500ms).", "Visit the page, see all fields. Edit a low-confidence field, see it save. Click 'Verify all', all fields show as verified."),
        step("S-5.16", "Frontend: confidence-driven UX. Fields with confidence ≥0.9 auto-collapse (user just clicks 'Verify all'). Fields with confidence <0.7 auto-expand with a yellow highlight and the source snippet visible. Make the user's eyes go to the things that need attention.", "Loading the page: high-confidence fields collapsed, low-confidence expanded."),
        step("S-5.17", "Integration test. `backend/tests/test_extraction.py`: process salary_slip_sample → GET fields → assert basic_salary extracted → edit a field → verify → re-GET → assert verified_by_user=true. Process form16_sample → assert PAN matches the regex exactly.", "All tests pass."),
        step("S-5.18", "Commit + tag. `git add -A && git commit -m 'phase-5: 3-layer field extraction (regex/table/LLM), confidence scores, verification UI' && git tag phase-5-complete`.", "`git tag` lists `phase-5-complete`."),
    ],
    exit_criteria="""- [ ] 5 document types have regex extractors
- [ ] Table extraction works for tabular layouts
- [ ] LLM fallback works (or gracefully degrades if no API key)
- [ ] Every extracted field has a confidence score
- [ ] Source snippet stored for every field
- [ ] Verification UI shows fields with confidence-driven UX
- [ ] User can edit + verify
- [ ] Sensitive fields masked in API responses
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Calling the LLM for every field**. Plan §5 explicitly says don't. Regex first, LLM only for what regex misses.
- **No source snippet**. Without the snippet, the user can't verify — they're just trusting the machine. Always store it.
- **Storing extracted values without confidence**. Useless for the verification UX. Every field needs a confidence score.
- **Masking in the frontend only**. Mask in the API response. The frontend should never see the raw PAN.
- **Editing a field resets confidence**. Should it? Probably set confidence=1.0 (user-verified) when edited. Document this in code.""",
)

# ============================================================================

phase_file(
    "phase-06-tax-readiness.md",
    goal="Compute gross income, deductions, old vs new regime tax, missing documents, mismatches, and a tax readiness score. Show on a clean card-based UI.",
    prereqs="- Phase 5 complete (extracted + verified fields).",
    ponytail="**Rung 6 — one-liner formulas.** Tax slab calculation is a `sum()` with a sliding window. Don't build a class hierarchy for it.",
    steps=[
        step("S-6.1", "Tax config. `backend/app/core/tax_config.py`: FY 2024-25 slabs. Old regime: 0-2.5L=0%, 2.5L-5L=5%, 5L-10L=20%, 10L+=30%. New regime: 0-3L=0%, 3L-7L=5%, 7L-10L=10%, 10L-12L=15%, 12L-15L=20%, 15L+=30%. Standard deduction: 50k (salaried). Cess: 4% on tax. Mark: `# ponytail: hardcoded FY24-25 slabs. upgrade: slab history table if multi-year support needed.`", "Config loads. Values match the official Indian tax slabs for FY 24-25."),
        step("S-6.2", "Income aggregation service. `backend/app/services/tax/income.py`: `aggregate_income(user_id, financial_year, db) -> IncomeSummary`. Pull from `incomes` table (where verified=true). Sum by type. Return: salary_total, interest_total, other_total, gross_income.", "For a user with 12 months salary + bank interest, returns the right totals."),
        step("S-6.3", "Deduction aggregation service. `backend/app/services/tax/deductions.py`: `aggregate_deductions(user_id, fy, db) -> DeductionSummary`. Pull from `deductions` table (verified=true). Sum by type. Apply caps: 80C max 1.5L, 80D max 25k (self) / 50k (parents), HRA exemption formula (simplified: lowest of actual HRA, 50% basic for metro, 10% basic for non-metro). Return total_deductions with breakdown.", "For a user with 80C=2L, returns 1.5L (cap applied). HRA exemption calc matches expectations."),
        step("S-6.4", "Old regime calculator. `backend/app/services/tax/calculators/old_regime.py`: `calculate_tax(gross_income, total_deductions, salary_income) -> TaxBreakdown`. Taxable = gross - deductions - standard_deduction (50k if salary > 0). Apply slabs. Add 4% cess. Return: taxable_income, tax_before_cess, cess, total_tax.", "Test: gross=10L, deductions=1.5L, salary=10L → taxable=8L → tax = 0+12500+60000=72500 → cess=2900 → total=75400."),
        step("S-6.5", "New regime calculator. `backend/app/services/tax/calculators/new_regime.py`: `calculate_tax(gross_income, salary_income) -> TaxBreakdown`. No deductions (new regime doesn't allow 80C etc.). Standard deduction 50k if salary > 0. Taxable = gross - 50k. Apply new slabs. Add 4% cess.", "Test: gross=10L, salary=10L → taxable=9.5L → tax = 0+20000+30000+7500=57500 → cess=2300 → total=59800. New regime wins for this case."),
        step("S-6.6", "Regime comparison service. `backend/app/services/tax/comparison.py`: `compare_regimes(user_id, fy, db) -> RegimeComparison`. Run both calculators. Return: old_tax, new_tax, difference (old - new), recommended_regime ('old' if old_tax < new_tax else 'new'), savings_amount.", "For the test case above: recommended='new', savings=15600."),
        step("S-6.7", "Missing document detector. `backend/app/services/tax/missing_docs.py`: `detect_missing(user_id, fy, db) -> list[MissingDoc]`. Rules: (1) salary income exists but no Form 16 → missing. (2) HRA deduction exists but no rent receipt → missing. (3) 80D deduction but no insurance receipt → missing. (4) Home loan interest deduction but no loan certificate → missing. (5) Investment deduction (80C) but no investment statement → missing. Each MissingDoc: {doc_type, reason, severity (high/medium/low)}.", "For a user with salary but no Form 16, returns [{doc_type: 'form16', reason: 'Salary detected but Form 16 missing', severity: 'high'}]."),
        step("S-6.8", "Mismatch detector. `backend/app/services/tax/mismatches.py`: `detect_mismatches(user_id, fy, db) -> list[Mismatch]`. Rules: (1) Sum of monthly salary slips != Form 16 gross salary (allow 1% tolerance). (2) Bank salary credits != declared salary (allow 5% tolerance). (3) TDS on Form 16 != expected TDS from tax calc. (4) Deduction amount has no supporting document. Each Mismatch: {field_a, value_a, field_b, value_b, expected_relationship, severity}.", "For a user with salary slips summing to 12L but Form 16 showing 11.5L, returns a mismatch."),
        step("S-6.9", "Tax readiness score. `backend/app/services/tax/score.py`: `compute_score(user_id, fy, db) -> TaxReadinessScore`. Formula (from §6 of plan): Document Completeness (40 pts — starts at 40, -10 per missing doc, min 0), Data Verification (25 pts — % of fields verified * 25), Income Consistency (20 pts — starts at 20, -10 per mismatch), Deduction Proof (15 pts — starts at 15, -5 per deduction without doc). Score = sum, clamped 0-100.", "For a fully-verified user with no missing docs/mismatches: score=100. For a user with 2 missing docs and 1 mismatch: 40-20+25+20-10+15=70."),
        step("S-6.10", "Cache the computation. Store result in `tax_estimations` table with `computed_at`. Add a `is_stale` check: if any related income/deduction/document has `updated_at` > `tax_estimations.computed_at`, recompute. Otherwise return cached. Rung 4: DB-driven cache, no Redis.", "First call: computes + caches. Second call (no changes): returns cache. Third call (after editing income): recomputes."),
        step("S-6.11", "`GET /tax/summary` endpoint. Deps: `get_current_user`. Returns: {score, regime_comparison, income_summary, deduction_summary, missing_documents, mismatches, computed_at}. Apply masking to PAN etc.", "Calling this returns the full tax summary in one request."),
        step("S-6.12", "Frontend: tax readiness page. Route `/tax`. Layout: top — big circular score with explanation ('Your score is reduced because rent receipts and insurance proof are missing.'). Below — 5 cards in a responsive grid: Income Summary, Deduction Summary, Regime Comparison (old vs new with the recommended badge), Missing Documents (each with a 'Upload now' link), Warnings (mismatches). 'Download report' button top-right (Phase 10 wires it).", "Page loads, shows score, cards populate. Hovering/tapping each card expands details."),
        step("S-6.13", "Frontend: regime comparison card. Side-by-side old vs new. Show: taxable income, tax before cess, cess, total tax. Highlight the recommended one with a green border + 'Recommended' badge. Show savings amount in green.", "Visually clear which regime wins and by how much."),
        step("S-6.14", "Unit tests. `backend/tests/test_tax.py`: test each calculator with known inputs. Test missing docs detector with various scenarios. Test mismatch detector. Test score calculation. Use `pytest.mark.parametrize` for slab tests. Target: ≥20 test cases.", "All tests pass. Coverage of `services/tax/` ≥ 90%."),
        step("S-6.15", "Integration test. `backend/tests/test_tax_integration.py`: register → consent → upload salary_slip + form16 → verify fields → GET /tax/summary → assert score is reasonable (>50), regime comparison present, missing docs list present.", "Test passes."),
        step("S-6.16", "Commit + tag. `git add -A && git commit -m 'phase-6: tax readiness engine (slabs, deductions, regime comparison, missing docs, mismatches, score)' && git tag phase-6-complete`.", "`git tag` lists `phase-6-complete`."),
    ],
    exit_criteria="""- [ ] Old + new regime tax calculators work
- [ ] Regime comparison recommends the cheaper one
- [ ] Missing document detector flags at least 5 scenarios
- [ ] Mismatch detector catches at least 4 scenarios
- [ ] Tax readiness score 0-100 with explainable factors
- [ ] Results cached in `tax_estimations` table
- [ ] `/tax/summary` endpoint returns everything in one call
- [ ] Frontend page shows score + 5 cards + explanations
- [ ] Unit + integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Hardcoding slabs in multiple places**. One config file. The plan §6 optimization rules explicitly call this out.
- **Recomputing tax on every page load**. Cache it. Recompute only when inputs change.
- **Showing tables instead of cards**. Plan §6 says 'use cards'. The tax page is dense — cards make it scannable.
- **No explanation for the score**. A number alone is meaningless. Always explain *why* the score is what it is (§5.3 of plan).
- **HRA exemption too simplified**. Real HRA involves metro/non-metro, actual rent paid, basic salary %. If your simplification differs from real IT rules, mark it with a `ponytail:` comment and add a disclaimer in the UI.""",
)

# ============================================================================

phase_file(
    "phase-07-financial-health.md",
    goal="Classify expenses, compute savings rate, debt-to-income, emergency fund, subscription leakage. Show on a visual dashboard with charts.",
    prereqs="- Phase 5 complete (bank statement transactions extracted).",
    ponytail="**Rung 3 — `collections.Counter` and `defaultdict` for classification.** Don't pull in scikit-learn just to categorize 13 transaction types. Keyword matching is enough for FYP.",
    steps=[
        step("S-7.1", "Category config. `backend/app/core/finance_config.py`: dict mapping each of the 13 categories to a list of keywords. Example: `{'Food': ['SWIGGY', 'ZOMATO', 'RESTAURANT', 'KHAANA', 'DOMINOS'], 'Travel': ['UBER', 'OLA', 'IRCTC', 'METRO', 'FUEL'], 'Subscriptions': ['NETFLIX', 'PRIME', 'SPOTIFY', 'HOTSTAR', 'DISNEY'], ...}`. Mark: `# ponytail: keyword classifier, 13 categories. upgrade: ML classifier if accuracy < 80% on real data.`", "Config loads. 13 categories, each with ≥3 keywords."),
        step("S-7.2", "Expense classifier. `backend/app/services/finance/classify.py`: `classify_transaction(description: str) -> str`. Uppercase the description, iterate categories, return first match. Default to 'Other' if no match. Store the category on the `expenses` row (already exists from Phase 1).", "Test: 'SWIGGY order #123' → 'Food'. 'NETFLIX monthly' → 'Subscriptions'. 'ATM withdrawal' → 'Cash Withdrawal'."),
        step("S-7.3", "Bulk classify. `services/finance/classify.py`: `classify_user_expenses(user_id, db) -> int` (returns count classified). Iterate all `expenses` rows where `category IS NULL` or `category = 'Other'`. Update each. Skip rows already categorized (idempotent).", "Running once classifies all unclassified. Running again classifies 0 (idempotent)."),
        step("S-7.4", "Wire classifier to pipeline. In Phase 5's pipeline, after extracting bank statement transactions (Layer 2), insert them as `expenses` rows with `category=NULL`. Then call `classify_user_expenses`. Mark: `# ponytail: classify-on-insert, no background job. upgrade: queue if volume > 10k transactions.`", "Upload a bank statement → expenses table populated + categorized."),
        step("S-7.5", "Savings rate calc. `services/finance/metrics.py`: `savings_rate(user_id, month, db) -> float`. Monthly savings = monthly income - monthly expenses. Savings rate = savings / income * 100. Return as percentage. Handle divide-by-zero (income=0 → rate=0).", "Income 80k, expenses 50k → rate = 37.5."),
        step("S-7.6", "Expense ratio. Same file: `expense_ratio(user_id, month, db) -> float`. Expenses / income * 100. Basically 100 - savings_rate, but compute independently for clarity.", "Income 80k, expenses 50k → ratio = 62.5."),
        step("S-7.7", "Debt-to-income ratio. `debt_to_income(user_id, month, db) -> float`. Monthly EMI / monthly income * 100. EMI = sum of expenses where category='EMI / Loan'.", "Income 80k, EMI 20k → ratio = 25."),
        step("S-7.8", "Emergency fund months. `emergency_fund_months(user_id, db) -> float`. Emergency fund = `user_entered_savings` (a new column on users, or a separate `user_settings` table — pick `user_settings` for cleanliness). Monthly essential expenses = sum of expenses where category in ['Rent', 'Food', 'Medical', 'EMI / Loan']. Return fund / essential_expenses. If essential = 0, return 0.", "Fund 3L, essential 50k → 6 months."),
        step("S-7.9", "Subscription leakage. `subscription_total(user_id, month, db) -> float`. Sum of expenses where category='Subscriptions' for the month. Track over 3 months to detect unused subscriptions (Rung 1: skip 'unused' detection for FYP, just show the total).", "Returns the total monthly subscription spend."),
        step("S-7.10", "Financial health score. `services/finance/score.py`: `compute_score(user_id, month, db) -> FinancialHealthScore`. Weighted: savings_rate (30 pts, full marks at ≥30%), debt_to_income (25 pts, full marks at ≤20%), emergency_fund_months (25 pts, full marks at ≥6 months), expense_stability (10 pts — stddev of last 3 months expenses, full marks if low), subscription_control (10 pts — full marks if subscriptions < 5% of income). Each component scaled linearly. Total 0-100.", "For a healthy user: score ~85. For a user with high debt and no emergency fund: score ~40."),
        step("S-7.11", "Store monthly snapshot. Insert/update `financial_health_scores` row for this user+month. Unique constraint from Phase 1 prevents duplicates.", "Calling `compute_score` twice for the same month updates the row, doesn't insert a new one."),
        step("S-7.12", "Top spending categories. `services/finance/insights.py`: `top_categories(user_id, month, db, n=3) -> list[CategorySpend]`. Group by category, sum amount, order desc, take n. Each: {category, amount, percentage_of_total}.", "Returns the top 3 categories with amounts and percentages."),
        step("S-7.13", "Improvement suggestions. `services/finance/insights.py`: `improvement_suggestions(score, metrics) -> list[str]`. Rule-based: if savings_rate < 20%, suggest 'Increase savings rate'. If debt_to_income > 30%, suggest 'Reduce debt'. If emergency_fund < 3 months, suggest 'Build emergency fund'. Etc. Return top 3.", "For a user with low savings + high debt, returns 2-3 actionable suggestions."),
        step("S-7.14", "`GET /finance/summary` endpoint. Returns: {score, savings_rate, expense_ratio, debt_to_income, emergency_fund_months, subscription_total, income_vs_expense_6months, category_breakdown, top_categories, suggestions, computed_at}.", "Returns everything the dashboard needs in one call."),
        step("S-7.15", "Frontend: financial health dashboard. Route `/finance`. Top: big score with one-line explanation. Left: Income vs Expense bar chart (last 6 months) — Recharts. Right: Category-wise pie chart. Below: 4 metric cards (Savings Rate, Debt-to-Income, Emergency Fund, Subscriptions) — each shows value + a one-line explanation. Bottom: 'Top 3 Improvement Suggestions' card.", "Page loads with charts rendering. Charts have axis labels. Colors from design system."),
        step("S-7.16", "Frontend: transaction list. Below the dashboard, a paginated table of transactions (date, description, category, amount). Filterable by category. Paginated 50/page.", "Can filter by 'Food', see only Food transactions. Pagination works."),
        step("S-7.17", "Classifier unit tests. `backend/tests/test_classify.py`: parametrized tests for each category (≥3 keywords tested). Edge cases: empty description, unknown keywords, mixed case.", "All tests pass. ≥40 test cases."),
        step("S-7.18", "Metrics unit tests. `backend/tests/test_finance_metrics.py`: savings rate, D/I, emergency fund, score — each with known inputs.", "All tests pass."),
        step("S-7.19", "Commit + tag. `git add -A && git commit -m 'phase-7: financial health engine (classifier, metrics, score, dashboard with charts)' && git tag phase-7-complete`.", "`git tag` lists `phase-7-complete`."),
    ],
    exit_criteria="""- [ ] 13 expense categories with keyword classifier
- [ ] Classifier ≥80% accurate on sample bank statements
- [ ] Savings rate, expense ratio, D/I, emergency fund, subscriptions all computed
- [ ] Financial health score 0-100 with weighted components
- [ ] Monthly snapshots stored
- [ ] Top categories + improvement suggestions
- [ ] `/finance/summary` returns everything in one call
- [ ] Frontend dashboard with bar + pie charts
- [ ] Transaction list with category filter + pagination
- [ ] Unit + integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Reprocessing the whole bank statement every dashboard load**. Categorize once, store, query the stored category. Plan §7 explicitly says this.
- **Sending raw transactions to the frontend**. Paginate. The dashboard only needs summaries + the latest 50 transactions.
- **Pulling in scikit-learn**. Rung 1: keyword classifier is enough for FYP. Add ML only if accuracy is provably bad.
- **No improvement suggestions**. The score alone is useless — always pair with suggestions (§5.3 explainability).
- **Charts without axis labels**. Recharts makes it easy to forget. Always label.""",
)

# ============================================================================

phase_file(
    "phase-08-goal-simulator.md",
    goal="User creates a financial goal, sees projected completion date, shortfall, and scenarios. Deterministic math, no AI.",
    prereqs="- Phase 7 complete (savings rate available for suggestions).",
    ponytail="**Rung 7 — minimum code that works.** Compound interest is one formula. Don't build a 'simulation engine' with strategy classes. One function, deterministic, explainable.",
    steps=[
        step("S-8.1", "Goal schemas. `backend/app/schemas/goal.py`: `GoalCreate` (goal_name, target_amount, current_amount=0, monthly_contribution=0, target_date=None, expected_return_rate=0.0), `GoalOut` (all fields + id + projected_completion_date + shortfall), `GoalUpdate` (partial fields).", "Schemas import cleanly."),
        step("S-8.2", "`POST /goals` endpoint. Deps: `get_current_user`. Validate: target_amount > 0, monthly_contribution >= 0, expected_return_rate between 0 and 0.3 (0-30%). Insert goal. Return `GoalOut` with computed projection. Log to audit_logs.", "Creating a goal returns it with projection fields populated."),
        step("S-8.3", "`GET /goals` endpoint. List user's goals. Paginate 20/page.", "Returns list of goals."),
        step("S-8.4", "`GET /goals/{id}` endpoint. Single goal with full projection.", "Returns one goal."),
        step("S-8.5", "`PATCH /goals/{id}` endpoint. Update fields. Recompute projection. Return updated goal.", "Updating monthly_contribution updates projected_completion_date."),
        step("S-8.6", "`DELETE /goals/{id}` endpoint. Delete goal. Log to audit_logs.", "Goal gone after delete."),
        step("S-8.7", "Projection service. `backend/app/services/goals/projection.py`: `project_goal(goal: Goal) -> GoalProjection`. Future value of current amount + future value of monthly contributions, both with `expected_return_rate`. Formula: FV_lump = current * (1+r)^n, FV_contributions = monthly * (((1+r)^n - 1) / r) where r = monthly_rate, n = months until target_date (or until target reached). Binary search for the month when FV >= target → that's projected_completion_date. Shortfall = target - projected_FV_at_target_date. Return: {projected_completion_date, projected_amount_at_target_date, shortfall, months_to_target, monthly_contribution_needed_to_meet_target}.", "Test: target=1L, current=0, monthly=8334, rate=0%, target_date=12 months → projected_completion = 12 months, shortfall=0."),
        step("S-8.8", "Scenario comparison. `services/goals/projection.py`: `compare_scenarios(goal: Goal) -> list[Scenario]`. Vary monthly_contribution: current, current * 1.25, current * 1.5, and 'needed to meet target on time'. For each, return the projected completion date. Rung 1: 4 scenarios is enough, skip Monte Carlo.", "Returns 4 scenarios with different completion dates."),
        step("S-8.9", "Savings rate suggestion. `services/goals/suggestions.py`: `suggest_monthly_contribution(user_id, goal, db) -> float`. If user's current savings rate > 20%, suggest using 50% of monthly savings for the goal. Otherwise suggest a flat 10% of income. Return the suggestion — don't auto-apply.", "For a user saving 10k/month, suggests 5k/month for the goal."),
        step("S-8.10", "Frontend: goal creation form. Route `/goals/new`. Fields: goal_name (text), target_amount (number, INR formatted), current_amount (number, default 0), monthly_contribution (slider 0-50000), target_date (date picker — native `<input type='date'>`), expected_return_rate (slider 0-15%, default 0%). Live projection: as user types, show projected completion date + shortfall below the form. Use `useDeferredValue` for debounce.", "Form submits, creates goal, redirects to `/goals/{id}`."),
        step("S-8.11", "Frontend: goal list page. Route `/goals`. Cards for each goal: name, target, current progress bar, projected completion, 'View' button. 'New goal' button at top.", "Goals appear as cards. Progress bar fills based on current/target."),
        step("S-8.12", "Frontend: goal detail page. Route `/goals/{id}`. Top: goal name, big progress bar with current/target. Left: editable form (same as creation, pre-filled). Right: projection panel — projected completion date (big), shortfall (red if > 0), monthly needed to meet on time. Below: scenario comparison table (4 rows). Below: timeline chart (Recharts line chart showing balance over time).", "Page loads, all panels populate. Editing the form updates the projection live."),
        step("S-8.13", "Suggested goals. On `/goals` page, show 4 chips for common goals: 'Emergency fund', 'Laptop', 'Vacation', 'Diwali gifts'. Clicking pre-fills the creation form with sensible defaults (e.g. Emergency fund: target = 6 * monthly essential expenses, target_date = 12 months out).", "Clicking 'Emergency fund' pre-fills the form with the right target."),
        step("S-8.14", "Unit tests. `backend/tests/test_goals.py`: projection formula with various inputs. Edge cases: monthly_contribution=0 (should project 'never'), target already met (projected = today), negative rate (reject).", "All tests pass. ≥10 test cases."),
        step("S-8.15", "Commit + tag. `git add -A && git commit -m 'phase-8: goal simulator (CRUD, projection, scenarios, frontend)' && git tag phase-8-complete`.", "`git tag` lists `phase-8-complete`."),
    ],
    exit_criteria="""- [ ] Goal CRUD endpoints
- [ ] Projection formula correct (verified against manual calc)
- [ ] 4 scenario comparison
- [ ] Monthly contribution suggestion based on savings rate
- [ ] Frontend creation form with live projection
- [ ] Goal list + detail pages
- [ ] Suggested goals chips
- [ ] Timeline chart on detail page
- [ ] Unit tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Using AI for projection math**. Plan §8 says: 'Do not use AI for simple math.' It's a compound interest formula.
- **Monte Carlo simulation**. Rung 1: deterministic is enough for FYP.
- **Storing projected_completion_date in DB**. It's derived from current state. Compute on read, don't store.
- **No shortfall display**. If the user can't meet the goal on time, that's the most important info — show it prominently.
- **Forgetting the 'never' case**. If monthly_contribution=0 and current < target, projected_completion = None / 'Never'. Handle it.""",
)

# ============================================================================

phase_file(
    "phase-09-ai-assistant.md",
    goal="A chat interface where the user asks questions about *their own* financial data. The assistant answers only from verified user data — never invents values, never gives investment advice.",
    prereqs="- Phase 6 (tax summary), Phase 7 (finance summary), Phase 8 (goals) complete.",
    ponytail="**Rung 5 — use `openai` SDK directly.** Don't build an abstraction layer. Don't add LangChain. One function, one prompt, one completion.",
    steps=[
        step("S-9.1", "Assistant schemas. `backend/app/schemas/assistant.py`: `AskRequest` (question: str), `AskResponse` (answer: str, sources: list[str], suggested_followups: list[str]). Sources = the data the answer was based on (e.g. ['tax.summary', 'finance.score']).", "Schemas import cleanly."),
        step("S-9.2", "Data fetcher. `backend/app/services/assistant/context.py`: `build_context(user_id, db) -> str`. Calls the existing services (tax summary, finance summary, goals list) and returns a structured string: 'User financial summary: Gross income: X. Tax score: Y. Savings rate: Z. Top spending category: A. Goals: [list]'. Do NOT include raw transactions or raw documents. Summaries only. Mask sensitive fields.", "Returns a string ≤2000 chars containing the user's verified financial snapshot."),
        step("S-9.3", "Prompt builder. `services/assistant/prompt.py`: `build_prompt(question: str, context: str) -> list[ChatMessage]`. System message: 'You are FinSight AI, a financial assistant. Answer ONLY from the provided user data. If the answer is not in the data, say \"I don't have enough data to answer that.\" Never invent numbers. Never give investment advice. Never recommend specific stocks or funds. Be concise (max 3 sentences). End with a suggested follow-up question.' User message: question + context.", "Function returns 2 messages: system + user."),
        step("S-9.4", "LLM client. `backend/app/services/assistant/llm.py`: `ask_llm(messages: list[ChatMessage]) -> str`. Uses `openai` SDK. Model: 'gpt-4o-mini' (cheap, fast, good enough). Temperature: 0.3 (deterministic-ish). Max tokens: 200. Returns the assistant message content. Skip if `OPENAI_API_KEY` empty — return a graceful 'Assistant not configured' message. Mark: `# ponytail: gpt-4o-mini, no streaming. upgrade: streaming + local model if cost matters.`", "Calling with a real question returns a real answer. Calling with no API key returns the fallback message."),
        step("S-9.5", "Suggested questions. `services/assistant/suggestions.py`: `suggested_questions(user_id, db) -> list[str]`. Rule-based, picks 4 based on user state: if tax score < 70 → 'Why is my tax readiness score low?'; if missing docs → 'What documents are missing?'; if savings rate < 20% → 'How can I improve my savings rate?'; always include 'Explain my spending pattern'. Returns 4 questions.", "Returns 4 contextual questions. Different users get different suggestions."),
        step("S-9.6", "Grounding validation. `services/assistant/validate.py`: `validate_answer(answer: str, context: str) -> bool`. Simple check: if the answer contains a number, that number must appear in the context. If not, replace the answer with 'I don't have enough data to answer that specifically.' This is a safety net against hallucination.", "Test: an answer with a fabricated number (not in context) → validation fails → fallback message returned."),
        step("S-9.7", "`POST /assistant/ask` endpoint. Deps: `get_current_user`. Flow: build context → build prompt → call LLM → validate answer → return AskResponse with sources. Log to audit_logs (action='assistant_asked', details={question, answer_length} — not the full content for privacy). Rate limit: 20 requests/hour/user (Rung 5: use `slowapi` if you must, or a simple in-memory counter — for FYP in-memory is fine).", "Posting a question returns an answer + sources + followups. Posting 21 times in an hour returns 429."),
        step("S-9.8", "`GET /assistant/suggestions` endpoint. Returns the 4 suggested questions.", "Returns 4 strings."),
        step("S-9.9", "Frontend: assistant page. Route `/assistant`. Layout: chat UI (message list, input box pinned to bottom). Above input: suggested question chips (clickable, fill the input). User messages on right (primary color), assistant on left (gray). Loading state: 3-dot animation while waiting. Each assistant message has a small 'Sources: tax.summary, finance.score' line below.", "Type a question, get an answer. Click a suggestion chip, input fills. Loading state shows."),
        step("S-9.10", "Frontend: chat history. Store the last 20 messages in localStorage (Rung 1: skip server-side chat history for FYP). On page load, restore. 'Clear chat' button to wipe.", "Refresh the page → chat history is still there. Click 'Clear chat' → history wiped."),
        step("S-9.11", "Frontend: source attribution. Each assistant message shows which data sources it used. Clicking a source scrolls to that section in the relevant page (e.g. clicking 'tax.summary' opens `/tax`).", "Clicking a source navigates to the right page."),
        step("S-9.12", "Integration test. `backend/tests/test_assistant.py`: ask 'Why is my tax readiness score low?' with a user who has missing docs → assert the answer mentions the missing docs. Ask 'What's Apple's stock price?' → assert the response refuses (no investment advice). Ask with no API key → assert graceful fallback.", "All tests pass."),
        step("S-9.13", "Commit + tag. `git add -A && git commit -m 'phase-9: AI assistant (LLM, grounding, suggestions, chat UI)' && git tag phase-9-complete`.", "`git tag` lists `phase-9-complete`."),
    ],
    exit_criteria="""- [ ] `/assistant/ask` endpoint with LLM integration
- [ ] Grounding validation prevents hallucination
- [ ] Suggested questions adapt to user state
- [ ] Assistant refuses investment advice
- [ ] Sources attributed in every answer
- [ ] Rate limited (20/hour)
- [ ] Frontend chat UI with history + suggestions
- [ ] Graceful fallback when API key missing
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Sending raw documents to the LLM**. Plan §9 says: 'Do not send full raw documents.' Send only the structured summaries.
- **No grounding validation**. LLMs hallucinate. Always validate that numbers in the answer exist in the context.
- **Letting the assistant give investment advice**. The plan §9 explicitly forbids this. The system prompt must enforce it. The validation step must catch violations.
- **No rate limit**. LLM calls cost money. Even a simple in-memory counter prevents abuse.
- **Storing chat history server-side**. Rung 1: skip for FYP. localStorage is enough. If you need it later, add a `chat_messages` table.""",
)

# ============================================================================

phase_file(
    "phase-10-reports.md",
    goal="Generate 3 PDF reports: CA-Ready Tax Summary, Financial Health, Goal Simulation. Professional layout, disclaimer on every report.",
    prereqs="- Phases 6, 7, 8 complete.",
    ponytail="**Rung 5 — ReportLab.** Don't build an HTML→PDF pipeline. ReportLab's `SimpleDocTemplate` + `Paragraph` is enough for FYP.",
    steps=[
        step("S-10.1", "ReportLab base template. `backend/app/services/reports/base.py`: `class ReportBase` with common helpers: header (logo + report title + generated date), footer (page number + disclaimer), section heading, paragraph, table, spacing. Use Noto Serif SC for body, Noto Sans SC for headings.", "Calling `ReportBase` methods produces valid ReportLab flowables."),
        step("S-10.2", "CA-Ready Tax Summary report. `backend/app/services/reports/tax_summary.py`: `generate(user_id, db) -> bytes`. Sections: (1) User details (name, masked PAN), (2) Uploaded documents (table), (3) Income summary (table), (4) Deduction summary (table), (5) TDS summary, (6) Old vs New regime comparison (table), (7) Missing documents (list), (8) Mismatch warnings (list), (9) Verified extracted fields (table), (10) Disclaimer ('Not a substitute for professional CA advice'). Returns PDF bytes.", "Calling `generate` returns valid PDF bytes. Opening the PDF shows all 10 sections."),
        step("S-10.3", "Financial Health report. `backend/app/services/reports/finance_health.py`: `generate(user_id, db) -> bytes`. Sections: (1) User details, (2) Monthly income + expenses (table), (3) Savings rate (with explanation), (4) Debt-to-income ratio, (5) Emergency fund status, (6) Top spending categories (table), (7) Subscription leakage, (8) Financial health score (with breakdown), (9) Improvement suggestions, (10) Disclaimer.", "PDF generates with all sections."),
        step("S-10.4", "Goal Simulation report. `backend/app/services/reports/goal_simulation.py`: `generate(goal_id, db) -> bytes`. Sections: (1) User details, (2) Goal name + target, (3) Current savings, (4) Monthly contribution, (5) Expected completion date, (6) Scenario comparison (table), (7) Shortfall (if any), (8) Disclaimer ('Not investment advice').", "PDF generates with all sections."),
        step("S-10.5", "Report caching. Store generated PDFs in `reports/{user_id}/{report_type}_{timestamp}.pdf`. Add a `reports` table: id, user_id, report_type, file_path, generated_at, content_hash. Before generating, check if a report with the same content_hash exists (i.e. data hasn't changed). If yes, return the existing file. Rung 4: file-based cache, no Redis.", "Generate report → file exists. Generate again with no data changes → returns same file (check `generated_at`). Generate after editing data → new file."),
        step("S-10.6", "`POST /reports/{type}/generate` endpoint. type in {tax_summary, finance_health, goal_simulation}. For goal_simulation, requires `goal_id` in body. Calls the right generator. Returns `{report_id, download_url}`. Log to audit_logs.", "Calling generate returns a report_id. File exists on disk."),
        step("S-10.7", "`GET /reports/{id}/download` endpoint. Verifies ownership. Streams the PDF file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename=...`. Use `FileResponse` from FastAPI.", "Downloading via curl saves a valid PDF."),
        step("S-10.8", "`GET /reports` endpoint. Lists user's reports: report_type, generated_at, file_size. Paginate 20/page.", "Returns list of generated reports."),
        step("S-10.9", "`DELETE /reports/{id}` endpoint. Delete file from disk + DB row. Log to audit_logs.", "After delete, file gone, DB row gone."),
        step("S-10.10", "Frontend: reports page. Route `/reports`. 3 cards: CA-Ready Tax Summary, Financial Health, Goal Simulation. Each: name, 1-line description, 'Last generated: <date>' or 'Not generated yet', 'Download' button (disabled if not generated), 'Regenerate' button. Below: list of all generated reports with download/delete buttons.", "Page loads. Click 'Regenerate' on tax summary → spinner → 'Last generated: just now'. Click 'Download' → PDF saves."),
        step("S-10.11", "Sample report fixture. Generate the 3 reports using the seed user from Phase 1. Save to `reports/samples/`. Useful for demo (Phase 16) and supervisor review.", "3 sample PDFs exist in `reports/samples/`."),
        step("S-10.12", "Integration test. `backend/tests/test_reports.py`: generate tax_summary → assert PDF starts with `%PDF`. Generate twice with no data changes → assert same content_hash. Edit income → generate → assert new content_hash. Download → assert 200 + application/pdf.", "All tests pass."),
        step("S-10.13", "Commit + tag. `git add -A && git commit -m 'phase-10: report generation (3 PDF reports, caching, download UI)' && git tag phase-10-complete`.", "`git tag` lists `phase-10-complete`."),
    ],
    exit_criteria="""- [ ] 3 PDF report generators (tax, finance, goal)
- [ ] Every report has a disclaimer
- [ ] Reports cached (no regen if data unchanged)
- [ ] Download endpoint streams PDF correctly
- [ ] Reports list page
- [ ] Sample reports generated for demo
- [ ] Integration tests pass
- [ ] Committed + tagged""",
    pitfalls="""- **Regenerating on every page load**. Plan §10 explicitly says don't. Cache.
- **No disclaimer**. Critical for a financial app. Every report.
- **HTML→PDF via headless browser**. Rung 5: ReportLab is enough, much lighter than Playwright.
- **Storing generated PDFs in DB**. Filesystem + path in DB. BLOBs in Postgres are an anti-pattern.
- **No content_hash**. Without it, you can't tell if data changed. Always hash the input data and store.""",
)

# ============================================================================

phase_file(
    "phase-11-privacy-security.md",
    goal="Make the system trustworthy: masking, audit logs, real deletion, consent management UI. This is mostly consolidation of security work done in earlier phases.",
    prereqs="- Phases 2-10 complete.",
    ponytail="**NEVER LAZY HERE.** Security boundary. Every checklist item from §11 of the original plan, fully implemented.",
    steps=[
        step("S-11.1", "Masking util. `backend/app/core/masking.py`: `mask_pan(pan) -> str` (ABCDE****F format), `mask_account(acc) -> str` (XXXX1234 — last 4), `mask_email(email) -> str` (f***@gmail.com), `mask_phone(phone) -> str` (+91 *****12345). Each function: if input is None or too short, return empty string. Don't raise.", "Unit tests: `mask_pan('ABCDE1234F')` → 'ABCDE****F'. `mask_email('john@gmail.com')` → 'j***@gmail.com'."),
        step("S-11.2", "Apply masking in API responses. Audit every schema in `app/schemas/`. Any field that contains PAN, account number, phone, or full email must be masked in the `*Out` schema. Use Pydantic field validators. The DB stores the raw value; the API returns masked.", "Grep `pan` in `app/schemas/` → every occurrence is masked. Calling `/users/me` returns masked email."),
        step("S-11.3", "Audit log writer. `backend/app/core/audit.py`: `async def log_audit(db, user_id, action, details, ip_address=None)`. Inserts a row in `audit_logs`. Called from every state-changing endpoint. Already wired in earlier phases — audit this step ensures consistency. NEVER log sensitive values in `details` (no passwords, no PAN, no full account numbers).", "Grep `log_audit` in `app/routers/` → every POST/PATCH/DELETE has a call. Sample `audit_logs` row's `details` has no sensitive values."),
        step("S-11.4", "Audit log viewer. `GET /audit-log?page=1&size=50`. Returns last N audit log entries for the current user. Fields: action, details, ip_address, timestamp. Paginated.", "Calling this returns the user's audit history."),
        step("S-11.5", "Real file deletion. Audit `DELETE /documents/{id}` and `DELETE /users/me`. Both must: (1) delete the file from disk using `Path.unlink(missing_ok=True)`, (2) delete any extracted temp files, (3) delete the DB row (cascade handles related rows), (4) log to audit_logs. Verify with a test: upload → check file exists → delete → check file gone.", "After delete, `ls uploads/{user_id}/` shows no file. DB row gone."),
        step("S-11.6", "Delete all documents. `DELETE /documents/all`. Deletes all documents for the current user. Same flow as single delete, batched. Log to audit_logs with `details={count: N}`.", "Upload 3 docs → call delete-all → 0 docs remain. Files gone."),
        step("S-11.7", "Export summary. `GET /users/me/export`. Returns a JSON file with all the user's data (profile, consents, documents metadata — not file contents, extracted fields, tax estimations, finance scores, goals, audit logs). The user can download this for their records. Format: a single JSON file (Rung 1: skip ZIP).", "Downloading returns a JSON file with all the user's data."),
        step("S-11.8", "Frontend: settings page. Route `/settings`. Sections: (1) Profile (read-only name + masked email), (2) Consent History (table from `/consent/history`), (3) Data Controls — buttons: 'Export my data', 'Delete all documents' (with confirm dialog), 'Delete my account' (with double confirm: type 'DELETE' to confirm), (4) Audit Log (table from `/audit-log`, paginated).", "Page loads with all 4 sections. Delete buttons have confirmation dialogs. Account deletion requires typing 'DELETE'."),
        step("S-11.9", "Security unit tests. `backend/tests/test_security.py`: (a) user A cannot GET user B's document (403), (b) user A cannot DELETE user B's document (403), (c) user A cannot download user B's report (403), (d) masking functions produce expected output, (e) audit log entry written for every state-changing action, (f) deleted document's file is gone from disk, (g) JWT with invalid signature rejected, (h) expired JWT rejected.", "All tests pass. ≥15 test cases."),
        step("S-11.10", "Security review checklist. Run through the §11 checklist from the original plan. Document any deviations in `docs/security-review.md`. Mark deviations with `ponytail:` comments explaining the ceiling and upgrade path.", "`docs/security-review.md` exists, every checklist item marked ✅ or ⚠️ (with ponytail: comment)."),
        step("S-11.11", "Commit + tag. `git add -A && git commit -m 'phase-11: privacy + security (masking, audit log, deletion, settings UI)' && git tag phase-11-complete`.", "`git tag` lists `phase-11-complete`."),
    ],
    exit_criteria="""- [ ] Masking applied to every sensitive field in every API response
- [ ] Audit log written for every state-changing action
- [ ] Audit log viewer works
- [ ] File deletion removes from disk
- [ ] Delete all documents works
- [ ] Account deletion works (cascades + removes files)
- [ ] Data export works
- [ ] Settings page complete
- [ ] Security unit tests pass (≥15 cases)
- [ ] Security review document written
- [ ] Committed + tagged""",
    pitfalls="""- **Masking in frontend only**. Mask in the API. The frontend should never see the raw PAN.
- **Logging sensitive values**. Audit log details should be action metadata, not data. Never log PAN, password, full account number.
- **Soft delete**. Rung 1: skip soft delete for FYP. When user says delete, delete. (Exception: keep audit_logs — those are about accountability, not user data.)
- **No export feature**. GDPR-style data export builds trust. Build it.
- **Account deletion without confirmation**. One misclick and the user loses everything. Double confirmation required.""",
)

# ============================================================================

phase_file(
    "phase-12-frontend.md",
    goal="Take the working-but-ugly frontend and make it production-quality: dashboard, navigation, states (loading/empty/error/success), responsive, accessible, performant.",
    prereqs="- All feature phases (2-11) complete.",
    ponytail="**Rung 4 — native platform features.** CSS transitions over animation libs. `<dialog>` over modal libs. Native form validation as a first line.",
    steps=[
        step("S-12.1", "Dashboard page. Route `/dashboard`. 6 cards from §12 of plan: Tax Readiness Score, Financial Health Score, Monthly Income, Monthly Expenses, Savings Rate, Missing Documents. Each card: title, big number, 1-line subtitle, link to detail page. Top: welcome message + last sync time.", "Page loads in <2s. All 6 cards populate from `/tax/summary` + `/finance/summary`."),
        step("S-12.2", "Navigation. Sidebar (desktop) + bottom nav (mobile). Items: Dashboard, Documents, Tax, Finance, Goals, Assistant, Reports, Settings. Active state highlight. Collapse to hamburger on mobile.", "Sidebar works on desktop. Mobile shows bottom nav. Active page highlighted."),
        step("S-12.3", "Top bar. Shows: app logo (left), page title (center-left), user menu (right — avatar, name, dropdown with 'Settings' and 'Logout').", "Top bar renders. User menu dropdown works."),
        step("S-12.4", "Loading states. Every page that fetches data shows a skeleton loader (not a spinner — skeletons feel faster). shadcn has `Skeleton` component. Use it for cards, lists, tables.", "Throttle network to Slow 3G. Pages show skeletons, then content fills in."),
        step("S-12.5", "Empty states. Every list page handles 0 items: icon, 1-line message, CTA. Examples: Documents empty → 'No documents yet. Upload your first salary slip.' Goals empty → 'No goals yet. Create one to start planning.' Reports empty → 'No reports generated. Click Generate on any report.'", "Visit each page with no data → see the right empty state with CTA."),
        step("S-12.6", "Error states. Every fetch wraps in try/catch. On error: red Alert with the error message + 'Retry' button. Don't show stack traces or technical error codes to the user.", "Stop the backend. Visit dashboard → see 'Could not load dashboard. [Retry]' not a blank page or crash."),
        step("S-12.7", "Success states. Use shadcn `Toast` for action confirmations: 'Document uploaded', 'Field verified', 'Report generated', 'Goal created'. Auto-dismiss after 3s. Green icon.", "Upload a document → green toast 'Document uploaded'."),
        step("S-12.8", "Responsive pass. Test every page at 3 widths: 375px (mobile), 768px (tablet), 1280px (desktop). Fix any overflow, any tiny tap targets (min 44x44px), any text that's unreadable. Use Tailwind's `sm:`, `md:`, `lg:` prefixes.", "Open Chrome DevTools device toolbar. Cycle through 375 / 768 / 1280. Every page looks right."),
        step("S-12.9", "Accessibility pass. (1) Every interactive element is keyboard-navigable (Tab through the whole app). (2) Every image has alt text. (3) Every form input has a label. (4) Color contrast ≥ 4.5:1 (use WebAIM checker). (5) ARIA roles on dynamic content (loading regions, toasts). (6) Focus visible (don't remove focus outlines globally).", "Tab through the app — every button, link, input reachable. Lighthouse Accessibility score ≥90."),
        step("S-12.10", "Performance: lazy load. Wrap heavy pages in `next/dynamic` with `ssr: false`: reports page (ReportLab preview), assistant page (chat UI). Dashboard loads first.", "Lighthouse Performance score ≥80 on dashboard. Reports page doesn't load until visited."),
        step("S-12.11", "Performance: paginate. Every list page (documents, transactions, audit log, reports) paginated. Default 20/page. Server-side pagination (don't fetch 1000 rows and slice in JS).", "Network tab shows requests with `?page=1&size=20`. Doesn't fetch everything."),
        step("S-12.12", "Performance: bundle size. Run `pnpm build && pnpm analyze` (use `@next/bundle-analyzer`). Identify any chunk >200KB. Replace or lazy-load. Target: first load JS <200KB on every page.", "Bundle analyzer shows no chunk >200KB (except charts/recharts which is acceptable on dashboard only)."),
        step("S-12.13", "Currency formatting. Everywhere a currency appears, use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. Don't hand-roll ₹ formatting. One shared util in `lib/format.ts`.", "Grep `₹` in `frontend/src/` — should only be in `lib/format.ts`. Everywhere else uses the function."),
        step("S-12.14", "Date formatting. Use `Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })`. One util in `lib/format.ts`.", "All dates render consistently: '15 Jan 2025'."),
        step("S-12.15", "Landing page. Route `/`. Hero section: headline + subhead + 'Get started' CTA + 'How it works' 3-step. Don't over-design — this is not the focus of the FYP. Use shadcn defaults.", "Visiting `/` shows the landing page. CTA navigates to `/login`."),
        step("S-12.16", "404 page. Route `*`. Simple: 'Page not found' + link to dashboard.", "Visiting `/nonexistent` shows the 404 page."),
        step("S-12.17", "Ponytail review. Run `/ponytail-review` on the diff. Apply any high-priority findings (delete unused components, replace duplicated logic).", "`/ponytail-review` returns 'Lean already. Ship.' or all findings addressed."),
        step("S-12.18", "Commit + tag. `git add -A && git commit -m 'phase-12: frontend polish (dashboard, nav, states, responsive, a11y, perf)' && git tag phase-12-complete`.", "`git tag` lists `phase-12-complete`."),
    ],
    exit_criteria="""- [ ] Dashboard with 6 cards
- [ ] Sidebar + mobile bottom nav
- [ ] Loading skeletons on every fetch page
- [ ] Empty states on every list page
- [ ] Error states with retry
- [ ] Success toasts for actions
- [ ] Responsive at 375 / 768 / 1280
- [ ] Lighthouse a11y ≥90
- [ ] Lighthouse perf ≥80 on dashboard
- [ ] First-load JS <200KB
- [ ] Currency + date formatting consistent
- [ ] Landing + 404 pages
- [ ] Committed + tagged""",
    pitfalls="""- **Spinners instead of skeletons**. Skeletons feel faster. Use them.
- **Hand-rolling currency formatting**. `Intl.NumberFormat` exists. Use it.
- **Removing focus outlines globally**. Accessibility violation. Style them, don't remove.
- **Loading everything upfront**. Lazy load heavy pages.
- **Over-designing the landing page**. It's a FYP, not a SaaS marketing site. Move on.""",
)

# ============================================================================

phase_file(
    "phase-13-backend.md",
    goal="Move business logic to services, DB logic to repositories, thin out route handlers, clean up Swagger docs, remove unused endpoints.",
    prereqs="- All feature phases (2-11) complete.",
    ponytail="**Rung 2 — reuse what's already there.** This phase is consolidation, not new code. Most of the work is moving code, not writing it.",
    steps=[
        step("S-13.1", "Audit current structure. `find backend/app -name '*.py' | xargs wc -l | sort -n`. Identify any file >300 lines — it's doing too much. Identify any router file with business logic (DB queries, calculations) inline.", "List of files >300 lines + routers with inline logic."),
        step("S-13.2", "Move business logic to services. Every router should only: parse request, call service, return response. If a router has a SQL query, a calculation, or a complex branch → move it to `app/services/{domain}/`. Example: tax calculation logic in `routers/tax.py` → already in `services/tax/`. Verify.", "Grep `select(` in `app/routers/` → 0 matches. All queries in services/repositories."),
        step("S-13.3", "Move DB logic to repositories (optional — only if a service has >3 raw SQL queries). `app/repositories/{domain}.py` with functions like `get_user_documents(db, user_id, page, size)`. Service calls repository. Rung 1: skip repository layer if services are already simple — YAGNI.", "If you created repository files, services use them. If not, document why (services were already simple)."),
        step("S-13.4", "Thin route handlers. Every route handler should be ≤10 lines. If longer, extract to service. Verify with `awk '/@router\\./,/^@router\\./' backend/app/routers/*.py | wc -l` per handler — eyeball it.", "Spot-check 3 random handlers — all ≤10 lines."),
        step("S-13.5", "Swagger docs review. Visit `/docs`. Every endpoint should have: summary, description, response codes (200, 400, 401, 403, 404, 500 where applicable), response schema. Add `responses=` parameter to each decorator. Add `summary=` and `description=`.", "`/docs` page shows clean, documented endpoints. No 'Additional Properties: True' defaults."),
        step("S-13.6", "Remove unused endpoints. Grep frontend for API calls. Any backend endpoint not called by the frontend (and not in tests) → delete. Rung 1: YAGNI.", "List of removed endpoints documented in commit message."),
        step("S-13.7", "Error handling. Centralize in `app/core/exceptions.py`: custom exceptions (`NotFoundError`, `ValidationError`, `ConsentRequiredError`, etc.) with `@app.exception_handler` registrations. Routes raise these, FastAPI returns consistent JSON.", "Triggering a Not Found returns `{\"detail\": \"...\", \"code\": \"not_found\"}` consistently."),
        step("S-13.8", "CORS. Review `app/main.py` CORS config. In dev: allow `localhost:3000`. In prod: allow only the deployed domain. Set via env var `CORS_ORIGINS`.", "Dev frontend can call dev backend. curl from random origin → blocked."),
        step("S-13.9", "Request logging. Add `middleware` that logs every request: method, path, status, duration. Use `logging` stdlib. Skip logging request bodies (privacy).", "Logs show every request: `GET /tax/summary 200 45ms`."),
        step("S-13.10", "Health check. `/health` should verify DB connectivity (run `SELECT 1`). Return 200 if ok, 503 if DB down. Useful for Docker healthcheck.", "`docker-compose ps` shows backend as 'healthy'."),
        step("S-13.11", "Ponytail audit. Run `/ponytail-audit`. Apply high-priority findings.", "`/ponytail-audit` returns lean or all high-priority findings addressed."),
        step("S-13.12", "Commit + tag. `git add -A && git commit -m 'phase-13: backend hardening (services, swagger, error handling, health check)' && git tag phase-13-complete`.", "`git tag` lists `phase-13-complete`."),
    ],
    exit_criteria="""- [ ] No business logic in route handlers
- [ ] All route handlers ≤10 lines
- [ ] Swagger docs complete
- [ ] Unused endpoints removed
- [ ] Centralized error handling
- [ ] CORS configured
- [ ] Request logging
- [ ] Health check verifies DB
- [ ] `/ponytail-audit` returns lean or all findings addressed
- [ ] Committed + tagged""",
    pitfalls="""- **Adding a repository layer when services are simple**. Rung 1: YAGNI. Only add it if it reduces duplication.
- **Logging request bodies**. Privacy violation. Log method + path + status + duration, nothing else.
- **CORS allow `*` in production**. Security hole. Lock it down.
- **Skipping the audit**. `/ponytail-audit` will find bloat you missed. Run it.""",
)

# ============================================================================

phase_file(
    "phase-14-quality-optimization.md",
    goal="Pay down debt. Remove dead code. Optimize queries. Hit the §14 checklist from the original plan.",
    prereqs="- Phases 12 + 13 complete.",
    ponytail="**This IS the ponytail phase.** Run `/ponytail-audit`, `/ponytail-debt`, and `/ponytail-review` on the full repo. Apply every high-priority finding.",
    steps=[
        step("S-14.1", "Run `/ponytail-audit` repo-wide. Save output to `docs/audit-results.md`. Review every finding.", "`docs/audit-results.md` exists with the audit output."),
        step("S-14.2", "Apply audit findings. For each finding: delete the dead code, replace stdlib, shrink. Commit after each batch of related fixes.", "After applying, `/ponytail-audit` returns 'Lean already. Ship.' or only low-priority findings remain."),
        step("S-14.3", "Run `/ponytail-debt`. Save to `docs/ponytail-debt-ledger.md`. Review every `ponytail:` comment. For each: decide if it's still needed (keep), can be paid down now (fix), or has no upgrade path (add one or remove the shortcut).", "`docs/ponytail-debt-ledger.md` exists. Every entry has an upgrade path or is marked 'intentional, will not upgrade'."),
        step("S-14.4", "Pay down high-priority debt. Any `ponytail:` comment that names a security, correctness, or performance ceiling → pay it down now. Examples: 'in-memory cache' → if multi-worker is planned, switch to Redis. 'keyword classifier' → if accuracy <80% on real data, add ML.", "All high-priority debt either paid down or documented as 'acceptable for FYP scope'."),
        step("S-14.5", "Remove unused imports. Backend: `ruff check --select F401 app/ --fix`. Frontend: `eslint --fix 'src/**/*.{ts,tsx}'`.", "`ruff check` and `eslint` return 0 issues."),
        step("S-14.6", "Remove unused dependencies. Backend: `pip install pipdeptree && pipdeptree`. Identify any package not in `requirements.txt` that's actually used. Frontend: `pnpm why <package>` for each — if nothing depends on it, remove.", "`requirements.txt` and `package.json` are lean."),
        step("S-14.7", "Remove dead code. `vulture backend/app/` (Python dead code finder). Manually review frontend for unused exports.", "`vulture` returns 0 or only intentionally-unused (e.g. `__init__.py` exports)."),
        step("S-14.8", "DB query optimization. Enable SQLAlchemy echo: `echo=True` on engine. Visit every page. Review the query log. Identify N+1 queries (same query repeated N times). Add `selectinload` or `joinedload` to fix.", "With echo on, dashboard load produces ≤10 queries. No N+1 patterns."),
        step("S-14.9", "Frontend bundle check. `pnpm build && pnpm analyze`. Identify any chunk >200KB. Lazy load it.", "Bundle analyzer shows all chunks <200KB (charts excepted on dashboard)."),
        step("S-14.10", "Performance test. With seed data loaded: dashboard load <2s, tax summary <1.5s, finance summary <1.5s, report generation <5s. Use `time curl ...`.", "All endpoints meet targets. Document in `docs/performance.md`."),
        step("S-14.11", "Final dead-code removal pass. Review `frontend/src/components/` — any component not imported anywhere → delete. Review `backend/app/services/` — any function not called → delete.", "Grep every component name and every function name. All have at least one caller."),
        step("S-14.12", "Cleanup checklist. Run through §14 'No-dead-code checklist' from original plan. Tick every item.", "`docs/cleanup-checklist.md` exists with every item ticked."),
        step("S-14.13", "Commit + tag. `git add -A && git commit -m 'phase-14: code quality + optimization (ponytail audit, debt paid, N+1 fixed, dead code removed)' && git tag phase-14-complete`.", "`git tag` lists `phase-14-complete`."),
    ],
    exit_criteria="""- [ ] `/ponytail-audit` returns lean
- [ ] `/ponytail-debt` ledger reviewed, high-priority paid down
- [ ] No unused imports
- [ ] No unused dependencies
- [ ] No dead code (vulture clean)
- [ ] No N+1 queries
- [ ] Bundle size <200KB per chunk
- [ ] Performance targets met
- [ ] Cleanup checklist complete
- [ ] Committed + tagged""",
    pitfalls="""- **Skipping the ponytail commands**. They exist for this phase. Use them.
- **'I'll fix it later'**. Phase 14 IS later. Fix it now.
- **Removing tests as 'dead code'**. Tests are not dead code. Vulture may flag test fixtures — leave them.
- **Not measuring performance**. 'Feels fast' is not a metric. Time it.
- **Paying down debt that doesn't matter**. Focus on security, correctness, perf. Cosmetic debt can stay.""",
)

# ============================================================================

phase_file(
    "phase-15-testing.md",
    goal="Comprehensive test coverage. Unit + integration + security + performance. Test report document for academic submission.",
    prereqs="- Phase 14 complete (code is clean enough to test).",
    ponytail="**Rung 7 — minimum tests that catch real bugs.** Don't write 500 tests for 50 functions. Write the tests that catch the bugs that would actually ship.",
    steps=[
        step("S-15.1", "Coverage baseline. `pip install pytest pytest-asyncio pytest-cov httpx`. Run `pytest --cov=app --cov-report=html`. Note current coverage.", "`htmlcov/index.html` opens. Coverage % recorded in `docs/test-coverage-baseline.md`."),
        step("S-15.2", "Tax engine unit tests. `tests/test_tax_unit.py`: parametrized slab tests (≥20 cases), deduction caps, HRA exemption, regime comparison, score calculation, missing docs, mismatches. Target coverage of `services/tax/` ≥ 95%.", "Coverage of `services/tax/` ≥ 95%."),
        step("S-15.3", "Finance engine unit tests. `tests/test_finance_unit.py`: classifier (≥40 cases), savings rate, D/I, emergency fund, score, top categories, suggestions. Target coverage of `services/finance/` ≥ 90%.", "Coverage of `services/finance/` ≥ 90%."),
        step("S-15.4", "Extraction unit tests. `tests/test_extraction_unit.py`: each regex extractor with sample text. Confidence scoring. Layer 3 (LLM) mocked.", "Coverage of `services/extraction/` ≥ 85%."),
        step("S-15.5", "Goal simulator unit tests. `tests/test_goals_unit.py`: projection formula, scenarios, edge cases (0 contribution, target already met).", "Coverage of `services/goals/` ≥ 90%."),
        step("S-15.6", "Integration test: full upload pipeline. `tests/test_integration_upload.py`: register → consent → upload salary_slip → poll until extracted → GET fields → verify field → assert verified_by_user=true. Test with both text PDF and scanned PDF.", "Test passes end-to-end. <30s runtime."),
        step("S-15.7", "Integration test: tax estimate flow. `tests/test_integration_tax.py`: upload salary_slip + form16 → verify fields → GET /tax/summary → assert score >50, regime comparison present, missing docs flagged.", "Test passes."),
        step("S-15.8", "Integration test: finance flow. `tests/test_integration_finance.py`: upload bank_statement → categorization runs → GET /finance/summary → assert savings_rate computed, top_categories present, score in 0-100.", "Test passes."),
        step("S-15.9", "Integration test: goal + report. `tests/test_integration_goal_report.py`: create goal → GET projection → POST /reports/goal_simulation → download → assert PDF valid.", "Test passes."),
        step("S-15.10", "Security tests. `tests/test_security.py` (already from Phase 11, verify it's comprehensive). Add: SQL injection attempt on login, XSS attempt in document name, file upload with .pdf extension but .exe content.", "All security tests pass. Injection attempts rejected."),
        step("S-15.11", "Performance tests. `tests/test_performance.py` (or just a script): time 100 dashboard loads, 100 tax summary calls, 10 report generations. Assert p95 < target.", "Performance numbers in `docs/performance.md`."),
        step("S-15.12", "UI smoke tests (optional). `frontend/tests/smoke.spec.ts` using Playwright: visit every page, assert no console errors, assert no 404 API calls. Rung 1: skip if time short.", "If implemented, all smoke tests pass."),
        step("S-15.13", "Test report document. Use the `docx` skill to generate `Test_Report.docx` in `download/`. Sections: Test plan, Test cases (table: ID / Description / Steps / Expected / Actual / Status), Coverage report, Performance report, Known issues, Sign-off.", "`/home/z/my-project/download/Test_Report.docx` exists. Looks professional."),
        step("S-15.14", "Bug fix log. As you test, you'll find bugs. Fix them. Log each: bug description / root cause / fix / commit hash. Save to `docs/bug-fix-log.md`.", "`docs/bug-fix-log.md` exists with all bugs found + fixed."),
        step("S-15.15", "Final coverage check. `pytest --cov=app --cov-report=html`. Target: overall ≥85%.", "Coverage ≥85%."),
        step("S-15.16", "Commit + tag. `git add -A && git commit -m 'phase-15: testing (unit + integration + security + performance + report)' && git tag phase-15-complete`.", "`git tag` lists `phase-15-complete`."),
    ],
    exit_criteria="""- [ ] Overall test coverage ≥85%
- [ ] Tax + finance + extraction + goals ≥90% covered
- [ ] 5 integration test files, all pass
- [ ] Security tests pass
- [ ] Performance tests documented
- [ ] Test report docx generated
- [ ] Bug fix log maintained
- [ ] Committed + tagged""",
    pitfalls="""- **Testing the framework, not your code**. Don't write tests for 'does FastAPI return 200 on a valid request'. Test your business logic.
- **100% coverage obsession**. 85% with the right tests > 100% with trivial tests.
- **No integration tests**. Unit tests don't catch 'the upload pipeline fails because of a missing migration'. Integration tests do.
- **Skipping security tests**. 'It works on my machine' is not a security posture.
- **Forgetting the test report**. Your supervisor wants to see the test plan + results. Use the docx skill.""",
)

# ============================================================================

phase_file(
    "phase-16-demo.md",
    goal="Demo-ready: script, fixtures, PPT, video, polished README. The original plan §16 demo flow must work flawlessly.",
    prereqs="- Phase 15 complete.",
    ponytail="**Rung 1 — skip what doesn't demo well.** Don't show the audit log page. Don't show settings. Show the user journey: upload → verify → tax → finance → goal → assistant → report.",
    steps=[
        step("S-16.1", "Demo data fixtures. Create a deterministic seed: `scripts/seed_demo.py`. Creates 1 demo user (email: demo@finsight.ai, password: demo1234). Pre-loads: 1 salary slip, 1 Form 16, 1 bank statement, 1 insurance receipt, 1 rent receipt (all verified). Pre-computes tax + finance scores. Pre-creates 1 goal. Pre-generates 1 tax summary report. Idempotent.", "Running `python scripts/seed_demo.py` produces a fully-loaded demo account. Login works."),
        step("S-16.2", "Demo script. `docs/demo-script.md`. Step-by-step with screenshots placeholders: (1) open landing page, (2) click 'Get started', (3) login as demo user, (4) consent screen (already accepted, but show the page), (5) dashboard — explain each card, (6) documents page — show verified documents, (7) tax readiness page — explain score, regime comparison, missing docs, (8) financial health page — explain score, charts, suggestions, (9) create a goal — show projection, (10) ask assistant 'Why is my tax score low?' — show grounded answer, (11) reports page — download CA-ready report, (12) settings — show consent history, data controls. Estimated time: 8 minutes.", "`docs/demo-script.md` exists with 12 steps, each with what to say + what to click."),
        step("S-16.3", "PPT. Use the `pptx` skill (or `ppt-expert` agent). ~12 slides: (1) Title, (2) Problem statement, (3) Solution overview, (4) Architecture diagram, (5) Tech stack, (6) Document intelligence demo (screenshots), (7) Tax readiness demo, (8) Financial health demo, (9) Goal simulator demo, (10) AI assistant demo, (11) Privacy + security, (12) Future work + Q&A. Save to `download/FinSight_AI_Demo.pptx`.", "`/home/z/my-project/download/FinSight_AI_Demo.pptx` exists. 12 slides, professional design."),
        step("S-16.4", "Architecture diagram. Use the `charts` skill to produce a clean architecture diagram (Mermaid → PNG). Shows: User → Frontend → API → {Auth, Documents, Extraction, Tax, Finance, Goals, Assistant, Reports} → PostgreSQL. Save to `docs/architecture/system-architecture.png`.", "PNG exists, readable, used in PPT slide 4."),
        step("S-16.5", "Demo video. Screen-record the demo script flow. ~8-10 minutes. Use OBS or QuickTime. Save to `download/FinSight_AI_Demo.mp4`. If file too large, upload to Google Drive and link in README.", "Video exists. Plays back smoothly."),
        step("S-16.6", "Final README polish. Sections: title + tagline, screenshots (4-6), features list, architecture diagram, tech stack table, setup (`docker-compose up`), demo credentials, links to docs (SRS, ER diagram, test report, PPT, video), license. The README should make a stranger want to try the app.", "README renders beautifully on GitHub. All links work."),
        step("S-16.7", "Academic deliverables check. Verify all §19 deliverables exist: project report (docx), SRS (docx), architecture diagram, ER diagram, test report, implementation screenshots, PPT, demo video.", "Checklist in `docs/deliverables-checklist.md` — every item ✅."),
        step("S-16.8", "Final ponytail audit. Run `/ponytail-audit` one last time. Should return 'Lean already. Ship.'", "Audit returns lean."),
        step("S-16.9", "Final commit + tag. `git add -A && git commit -m 'phase-16: demo ready (script, fixtures, PPT, video, README)' && git tag phase-16-complete && git tag v1.0.0`.", "`git tag` lists `phase-16-complete` and `v1.0.0`."),
        step("S-16.10", "Dry run. Run through the demo script end-to-end. Time it. Fix any glitches. Repeat until flawless.", "Demo runs in ≤10 minutes with no errors."),
    ],
    exit_criteria="""- [ ] Demo account with pre-loaded data
- [ ] Demo script document
- [ ] PPT (12 slides)
- [ ] Architecture diagram
- [ ] Demo video
- [ ] Polished README
- [ ] All academic deliverables in place
- [ ] Final ponytail audit clean
- [ ] v1.0.0 tagged
- [ ] Dry run flawless""",
    pitfalls="""- **Demoing with real data**. Use the demo seed. Real data has gaps and looks unfinished.
- **Demoing every page**. Skip settings, skip audit log. Demo the user journey.
- **No PPT**. Academic requirement. Build it.
- **No video**. Some supervisors require it. Build it.
- **Skipping the dry run**. The demo will fail in some way you didn't expect. Dry run catches it.
- **Forgetting the disclaimer**. Every demo must include: 'FinSight AI does not replace a CA or investment adviser.'""",
)

print("\nAll phase files generated.")
print(f"Total: {len(list(PHASES_DIR.glob('*.md')))} files in {PHASES_DIR}")

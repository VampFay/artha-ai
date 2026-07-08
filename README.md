# Artha AI — Wealth Intelligence Platform

> AI-powered wealth intelligence and tax readiness platform. Privacy-first financial dashboard with document extraction, tax engine, portfolio analytics, and CA-ready PDF reports.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-teal) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Push database schema
bun run db:push

# Seed demo accounts
bun run scripts/seed-accounts.ts

# Start development server
bun run dev
```

**Demo Accounts:**
- Test: `test@finsight.ai` / `test1234`
- Admin: `admin@finsight.ai` / `admin1234`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  LoginScreen │  │     AppShell         │  │
│  │  (Canvas +   │  │  ┌────────────────┐  │  │
│  │   Michroma)  │  │  │  Sidebar (Dark) │  │  │
│  │              │  │  │  + Ticker Bar   │  │  │
│  └─────────────┘  │  │  + 14 Views     │  │  │
│                    │  └────────────────┘  │  │
│                    └──────────────────────┘  │
└───────────────────┬─────────────────────────┘
                    │ HTTP (JWT Bearer)
┌───────────────────▼─────────────────────────┐
│            Next.js 16 API Routes             │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │  Auth   │ │ Tax     │ │ Finance       │  │
│  │  (JWT + │ │ Engine  │ │ Engine        │  │
│  │  bcrypt)│ │ (Slabs) │ │ (13 cats)     │  │
│  └─────────┘ └─────────┘ └───────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ Portfolio│ │ Cashflow│ │ Estate        │  │
│  │ API     │ │ API     │ │ API           │  │
│  └─────────┘ └─────────┘ └───────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ AI Chat │ │ Reports │ │ Documents     │  │
│  │ (LLM)   │ │ (PDF)   │ │ (PDF parse)   │  │
│  └─────────┘ └─────────┘ └───────────────┘  │
└───────────────────┬─────────────────────────┘
                    │ Prisma ORM
┌───────────────────▼─────────────────────────┐
│           SQLite / PostgreSQL                │
│  18 Models: User, Document, Income,          │
│  Expense, Goal, Liability, AssetHolding,     │
│  Nominee, Subscription, AuditLog, etc.       │
└─────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 (Turbopack) | App Router, SSR, API routes in one process |
| **UI** | Tailwind CSS 4 + Motion | Utility-first + spring physics animations |
| **Fonts** | Geist + Geist Pixel + Michroma | Terminal aesthetic for numbers, geometric for headings |
| **Backend** | Next.js API Routes | 25+ endpoints with Zod validation |
| **Database** | Prisma ORM + SQLite | Type-safe queries, easy Postgres migration |
| **Auth** | bcryptjs (cost 12) + jose JWT | OWASP-compliant password hashing + token revocation |
| **AI** | z-ai-web-dev-sdk | Real LLM for financial assistant, grounded on user data |
| **PDF** | pdf-parse (extraction) + pdfkit (reports) | Real document parsing + CA-ready PDF generation |
| **Bank Parsing** | papaparse + xlsx | HDFC/ICICI/SBI/Axis/Kotak CSV/XLSX support |

## 📊 Features

### Document Intelligence
- Drag-and-drop PDF/CSV/XLSX upload
- Real PDF text extraction with regex field detection
- Bank statement parser (5 Indian banks, 17 categories)
- Confidence scoring + source snippets
- Field verification workflow

### Tax Engine
- FY 2024-25 Indian tax slabs (Old + New regime)
- Section 87A rebate (no tax if taxable ≤ ₹7L)
- Standard deduction (₹50k old / ₹75k new)
- Regime comparison with savings calculation
- Tax readiness score (0-100) with 4-component breakdown
- Missing document detection

### Financial Health
- 13-category expense classifier (50+ merchant keywords)
- Savings rate, D/I ratio, emergency fund months
- Weighted health score (0-100)
- AI-powered suggestions
- Custom SVG charts (sparklines, gradient bars, donut)

### Portfolio Analytics
- Asset allocation across 5 classes
- Target vs actual allocation table
- Net worth tracking
- Liquidity profile (liquid vs locked)

### Goal Planning
- Compound interest projection
- Binary search for completion date
- Shortfall detection
- 12-month trajectory sparkline

### Estate Planning
- Nominee management with allocation tracking
- Unassigned asset audit
- Will/trust document storage

## 🔒 Security

- **Auth**: bcrypt (cost 12) + JWT with token revocation
- **Rate Limiting**: 5 logins/15min, 3 registrations/hour, 20 LLM requests/hour
- **CSP**: Content-Security-Policy with environment-aware `unsafe-eval`
- **Validation**: Zod schemas on all POST routes
- **File Security**: Documents stored outside `public/`, path traversal prevention
- **Audit Log**: Every action logged with timestamp + IP
- **Consent**: Explicit consent required before document processing, revocable

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # 25+ API routes
│   ├── globals.css    # Design system (Michroma + Geist Pixel)
│   ├── layout.tsx     # Root layout with fonts
│   └── page.tsx       # Entry point (LoginScreen or AppShell)
├── components/
│   ├── ui/            # KineticNumber, Sparkline, GradientBars, etc.
│   ├── app-shell.tsx  # Sidebar + ticker + page router
│   ├── CommandPalette.tsx
│   └── OnboardingFlow.tsx
├── lib/
│   ├── auth.ts        # JWT + bcrypt + token revocation
│   ├── security.ts    # Rate limiting + IP detection
│   ├── tax-engine.ts  # Indian tax slabs + regime comparison
│   ├── finance-engine.ts
│   ├── goal-engine.ts
│   ├── parsers/       # Bank statement parser
│   └── types.ts
├── views/             # 14 page components
│   ├── LoginScreen.tsx
│   ├── DashboardView.tsx
│   ├── TaxView.tsx
│   └── ...
└── prisma/
    └── schema.prisma  # 18 models
```

## 🐳 Docker (Coming Soon)

```bash
docker-compose up  # web + postgres + redis
```

## 📝 License

MIT — Built as a university final-year project.

---

Built with ❤️ using [Next.js](https://nextjs.org), [Prisma](https://prisma.io), and [z-ai-web-dev-sdk](https://docs.z.ai).

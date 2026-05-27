# FinanceChecker Architecture

## Overview

FinanceChecker is a Next.js application that scrapes Israeli banks and credit cards, stores transactions in SQLite, categorizes them via rules, and provides dashboard summaries, statistics, and anomaly detection.

## Architecture Pattern

The app uses **ViewModel / Manager / Coordinator** separation:

| Layer | Purpose | Location |
|-------|---------|----------|
| **ViewModel** | UI state, API calls | `src/viewmodels/` |
| **Manager** | Business logic | `src/managers/` |
| **Coordinator** | Workflow orchestration | `src/coordinators/` |
| **Repository** | Data access | `src/repositories/` |

## Data Flow

```
UI (pages) → ViewModels → API routes → Managers → Repositories → Prisma → SQLite
```

ViewModels call `/api/*` endpoints only; they do not import managers or repositories directly.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19 |
| Database | SQLite via Prisma 6 |
| ORM | Prisma Client |
| Styling | Tailwind CSS 4 |
| Components | Radix UI (shadcn-style) |
| Charts | Recharts |
| Icons | Lucide React |
| Scraping | israeli-bank-scrapers, Puppeteer + stealth |

## Project Parts

### Application (`src/`)

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js App Router pages and API routes |
| `components/` | React components (layout, shared, domain, UI) |
| `coordinators/` | Scrape and import orchestration |
| `managers/` | Business logic (scraping, transactions, categories, stats, anomalies, config) |
| `repositories/` | CRUD and queries (Account, Transaction, Category, CategoryRule) |
| `viewmodels/` | UI state hooks (accounts, transactions, categories, dashboard, statistics) |
| `lib/` | Prisma client, utilities, encryption, scraper adapter |
| `constants/` | Company metadata, default categories |
| `types/` | DTOs, filters, shared types |

### Data Layer (`prisma/`)

- **schema.prisma** – Models: Account, Transaction, Category, CategoryRule, ScrapeRun, Budget, AppSetting
- **migrations/** – Schema changes
- **seed.ts** – Default categories and Hebrew merchant rules

`ScrapeRun` records each per-account scrape attempt, including `status`, `errorType`, `errorMessage`, and `logJson` (the full structured step log for that run).

### Configuration

- **next.config.ts** – External packages for Puppeteer/scrapers
- **patches/** – patch-package patches for israeli-bank-scrapers (rate limiting, anti-detection)

## Key Dependencies (Conceptual)

```
ScrapeCoordinator
  → AccountRepository, ScrapingManager, TransactionImportCoordinator, ConfigEncryptionManager

TransactionImportCoordinator
  → TransactionRepository, CategoryManager

ScrapingManager → scraper-adapter, prisma
TransactionManager → TransactionRepository
CategoryManager → CategoryRuleRepository, TransactionRepository
StatisticsManager → TransactionRepository, CategoryRepository
AnomalyDetectionManager → TransactionRepository
ConfigEncryptionManager → encryption, prisma
```

## Scrape Logging & Diagnostics

Each scrape session is logged through `src/lib/scrape-logging/`:

- `ScrapeRunLogger` buffers timestamped entries (scraper lifecycle steps, info, warnings, errors with stack traces) for one credential-group scrape.
- `ScrapeLogFileWriter` streams those entries to `logs/scrape/<timestamp>_<provider>_<account>.log`.
- The serialized log is also persisted to `ScrapeRun.logJson`, so it is viewable later.
- `scrape-error-messages.ts` maps raw scraper `errorType`s (e.g. `CHANGE_PASSWORD`, `INVALID_PASSWORD`) to clear, user-facing messages.

The **Sync History** page (`src/app/sync-history/`) reads this via `GET /api/scrape/history` and `GET /api/scrape/history/[id]`, showing each run's status, error, and step timeline. Accounts whose latest run requires a password change surface an "Action required" prompt on the account card.

## Tooling

Project agent skills for Claude Code live in `.claude/skills/` (see `.claude/skills/README.md`). They are contributor tooling and have no runtime effect.

## Security

- **Master password** – Required to unlock app; credentials stored encrypted
- **Config** – Encrypted credentials in `config/credentials.enc`; never committed
- **Environment** – Sensitive vars in `.env`; `.env.example` documents non-secret vars

## Entry Points

| Entry | Path | Role |
|-------|------|------|
| Root layout | `src/app/layout.tsx` | Wraps app in `AppShell` |
| Dashboard | `src/app/page.tsx` | Main page |
| Dev server | `npm run dev` | Port 5000 |

## Conventions

- **Path alias** – `@/*` → `./src/*` (tsconfig)
- **Single responsibility** – One concern per file/class
- **Composition** – Prefer composition over inheritance
- **Modular design** – Repositories, managers, and coordinators are reusable and testable

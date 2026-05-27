# FinanceChecker

[![CI](https://github.com/razamit/expense_manager/actions/workflows/ci.yml/badge.svg)](https://github.com/razamit/expense_manager/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)

FinanceChecker is a Next.js personal finance app for pulling transactions from Israeli bank and credit-card accounts, storing them locally, auto-categorizing activity, and surfacing the results in dashboards, statistics, and anomaly views.

The default setup is local-first:

- the web app runs with Next.js
- the database is SQLite through Prisma
- saved scraping credentials are encrypted on disk
- default categories and rules are seeded automatically

## What The App Does

FinanceChecker is built around six core workflows:

- **Dashboard**: overview of balances, recent activity, category totals, and unusual transactions
- **Accounts**: manage bank and card accounts and monitor scrape status
- **Transactions**: inspect, filter, exclude, and recategorize imported transactions
- **Categories**: maintain category trees and auto-categorization rules
- **Statistics**: analyze spending patterns and category breakdowns with charts
- **Sync History**: review every scrape run with a step-by-step log to see exactly why a sync failed
- **Settings**: configure the master password and encrypted credential storage

Under the hood, scraping is handled through `israeli-bank-scrapers` with Puppeteer-based browser automation, while Prisma persists normalized account and transaction data into a local database.

## Main Features

- Automatic scraping for supported Israeli financial institutions
- Local SQLite storage with checked-in Prisma migrations
- Seeded category catalog and merchant-matching rules
- Manual and rule-based transaction categorization
- Dashboard summaries and statistics pages
- Anomaly detection for suspicious or unusual activity
- Per-run scrape logging (on disk and in-app) with clear, actionable failure messages
- Encrypted credential storage protected by a master password
- Patch support for scraper-library fixes via `patch-package`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| Components | Radix UI primitives |
| Database | SQLite |
| ORM | Prisma 6 |
| Charts | Recharts |
| Scraping | `israeli-bank-scrapers`, `puppeteer-extra`, stealth plugin |

## Architecture

The app follows a layered structure so UI state, business logic, and data access stay separate:

| Layer | Responsibility | Location |
| --- | --- | --- |
| ViewModel | Page state and API interaction | `src/viewmodels/` |
| Coordinator | Workflow orchestration | `src/coordinators/` |
| Manager | Business logic | `src/managers/` |
| Repository | Database access | `src/repositories/` |

Runtime flow:

```text
UI pages -> ViewModels -> API routes -> Managers -> Repositories -> Prisma -> SQLite
```

If you want the deeper breakdown, start with:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [src/README.md](./src/README.md)
- [prisma/README.md](./prisma/README.md)
- [patches/README.md](./patches/README.md)

## Project Layout

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router pages and API routes |
| `src/components/` | Reusable UI and feature components |
| `src/viewmodels/` | Page-specific state and data-loading hooks |
| `src/coordinators/` | Multi-step flows such as scraping and transaction import |
| `src/managers/` | Domain logic for transactions, categories, statistics, scraping, and config |
| `src/repositories/` | Prisma-backed data access |
| `src/lib/` | Shared utilities, encryption, Prisma client, scraper adapter |
| `prisma/` | Schema, migrations, and seed script |
| `config/` | Encrypted runtime configuration and credentials |
| `patches/` | `patch-package` fixes applied after install |
| `logs/scrape/` | Per-run scrape logs (git-ignored, generated at runtime) |
| `.claude/skills/` | Project agent skills for Claude Code (see `.claude/skills/README.md`) |
| `docs/` | Supporting documentation and optional local-only design references |

## Requirements

You need the following to run the project locally:

- Node.js 18 or newer
- npm 9 or newer
- Windows, macOS, or Linux

You do **not** need a separate database server for local development. The default configuration uses SQLite at `prisma/dev.db`.

## Quick Start

No terminal needed. Download, unzip, and double-click one file.

1. Download the project ZIP from GitHub (**Code → Download ZIP**) and unzip it.
2. Open the unzipped folder and double-click:
   - **Windows:** `Start.bat`
   - **macOS:** `Start.command`
   - **Linux:** run `bash start.sh` from the folder (file-manager double-click is unreliable)
3. Wait for your browser to open at [http://localhost:5000](http://localhost:5000), then create your master password.

The launcher installs Node.js if missing, installs dependencies, builds a production
bundle, starts the server on port `5000`, and opens your browser automatically.

> **First launch takes a few minutes.** It downloads dependencies and a bundled Chromium,
> then builds the app. Every launch after that is fast: it reuses the installed
> dependencies and the existing build, and starts almost immediately.

To stop the app, close the launcher window (or press `Ctrl+C` in it).

### Unidentified-developer prompts

These scripts are not code-signed, so your OS may warn the first time:

- **Windows (SmartScreen):** if a blue "Windows protected your PC" dialog appears, click
  **More info → Run anyway**.
- **macOS (Gatekeeper):** if macOS blocks `Start.command`, right-click it and choose
  **Open**, then confirm **Open** in the dialog. After the first time it runs normally.

### Advanced: terminal setup

The launcher above wraps the platform setup scripts, which you can also run directly.

**Windows** — production launch (build + run + open browser):

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Launch
```

Without `-Launch`, `setup.ps1` runs the development bootstrap and starts `next dev`:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Optional flags:

- `-Launch` builds and runs the production server on port `5000`, then opens the browser
- `-NoStart` prepares the repo without launching the dev server
- `-SkipNodeInstall` fails instead of trying `winget` or `choco`
- `-SkipInstall` skips `npm ci` and reuses the current `node_modules`
- `-ForceEnv` recreates `.env` from `.env.example`

**macOS / Linux** — production launch:

```bash
bash ./setup.sh --launch
```

Without `--launch`, `setup.sh` runs the development bootstrap and starts `next dev`:

```bash
bash ./setup.sh
```

Optional flags:

- `--launch` builds and runs the production server on port `5000`, then opens the browser
- `--no-start` prepares the repo without launching the dev server
- `--skip-node-install` fails instead of trying the system package manager
- `--skip-install` skips `npm ci` and reuses the current `node_modules`
- `--force-env` recreates `.env` from `.env.example`

When a setup or launch flow completes, open [http://localhost:5000](http://localhost:5000).

On a fresh install, the first screen should be the master-password setup flow.

## Manual Installation

If you want a fully manual install, use the steps below.

### 1. Clone And Install Dependencies

```bash
git clone https://github.com/razamit/expense_manager.git
cd FinanceChecker
npm ci
```

### 2. Create The Environment File

The project ships with a single required variable for local development.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Default value:

```env
DATABASE_URL="file:./dev.db"
```

Prisma resolves SQLite file URLs relative to `prisma/schema.prisma`, so this value points to `prisma/dev.db` on disk.

### 3. Prepare The Database

```bash
npm run db:setup
```

This applies all checked-in Prisma migrations and seeds the default categories and merchant rules.

### 4. Start The Development Server

```bash
npm run dev
```

The app is available at [http://localhost:5000](http://localhost:5000).

### 5. First-Run Flow

After the app opens:

1. create the master password
2. add or unlock encrypted scraping credentials
3. add accounts and run a scrape
4. review imported transactions
5. adjust categories and rules as needed
6. use the dashboard and statistics pages for ongoing analysis

## Production Build

To create and run a production build locally:

```bash
npm run build
npm run start
```

The production server runs on [http://localhost:5000](http://localhost:5000). For a
one-step build-run-and-open flow, use `npm run launch` (or the double-click launchers).

## Environment And Data Files

### `.env`

Created from `.env.example` during setup. For local development it only needs:

```env
DATABASE_URL="file:./dev.db"
```

That value maps to the `prisma/dev.db` SQLite file on disk.

### `prisma/dev.db`

The default SQLite database file used by Prisma.

### `config/credentials.enc`

Encrypted storage for scraped-account credentials. Treat this as sensitive local data even though it is encrypted.

### `logs/scrape/`

Per-run scrape logs written at runtime, one file per sync session (`<timestamp>_<provider>_<account>.log`). Useful for diagnosing scrape failures. Git-ignored.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port `5000` |
| `npm run build` | Build the production bundle |
| `npm run start` | Run the production server on port `5000` |
| `npm run launch` | Build (if needed) and run the production server on port `5000`, then open the browser |
| `npm run lint` | Run ESLint |
| `npm run setup` | Run the shared setup flow and start the dev server |
| `npm run setup:no-start` | Run setup without starting the dev server |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:deploy` | Apply checked-in migrations non-interactively |
| `npm run db:setup` | Apply migrations and seed default data |
| `npm run db:migrate` | Create and apply a new development migration |
| `npm run db:seed` | Run the seed script only |
| `npm run db:reset` | Reset the database using Prisma |

## Security Notes

- The app uses a master password before exposing saved credentials.
- Scraping credentials are stored in encrypted form, not plain text.
- `.env` should remain local to your machine.
- If you publish this repository, do not commit real credentials, live databases, or personal financial data.

## Troubleshooting

### Node.js Is Missing

Use the platform setup scripts first. They try to install Node automatically when possible.

### The App Does Not Start After Setup

Run the no-start setup flow and then start the server manually:

```bash
npm run setup:no-start
npm run dev
```

### I Want A Clean Local Database

```bash
npm run db:reset
```

### Scraping Breaks After A Bank Login Flow Changes

This project depends on scraper integrations that can change when providers update their websites. Check the `patches/` folder and the upstream `israeli-bank-scrapers` package when scraping behavior regresses.

## Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow
- [src/README.md](./src/README.md) for application structure
- [prisma/README.md](./prisma/README.md) for schema, migrations, and seeding
- [patches/README.md](./patches/README.md) for scraper-library patches

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on opening issues and pull requests.

## Security

For vulnerability reports, read [SECURITY.md](./SECURITY.md). Do not open public issues for security problems.

## License

[MIT](./LICENSE)

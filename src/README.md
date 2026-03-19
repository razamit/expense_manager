# Source – Application Code

## Overview

The `src/` folder contains all application code for FinanceChecker: Next.js pages, API routes, components, business logic, and utilities.

## Folder Structure

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js App Router pages and API routes |
| `components/` | React components (layout, shared, domain, UI primitives) |
| `coordinators/` | Workflow orchestration (scrape, import) |
| `managers/` | Business logic (scraping, transactions, categories, stats, anomalies, config) |
| `repositories/` | Data access (Account, Transaction, Category, CategoryRule) |
| `viewmodels/` | UI state hooks for each page/feature |
| `lib/` | Prisma client, utilities, encryption, scraper adapter |
| `constants/` | Company metadata, default categories |
| `types/` | DTOs, filters, shared TypeScript types |

## Data Flow

```
UI (pages) → ViewModels → API routes → Managers → Repositories → Prisma → SQLite
```

ViewModels call `/api/*` endpoints; they do **not** import managers or repositories.

## Path Alias

- `@/*` maps to `./src/*` (see `tsconfig.json`)

## Conventions

- **Single responsibility** – One concern per file/class
- **Composition** – Prefer composition over inheritance
- **Modular** – Repositories, managers, coordinators are reusable and testable

## Folder READMEs

- [app/README.md](./app/README.md) – Pages and layout
- [app/api/README.md](./app/api/README.md) – API routes
- [components/README.md](./components/README.md) – Component structure
- [coordinators/README.md](./coordinators/README.md) – Scrape/import flow
- [managers/README.md](./managers/README.md) – Manager responsibilities
- [repositories/README.md](./repositories/README.md) – Data access layer
- [viewmodels/README.md](./viewmodels/README.md) – ViewModel hooks
- [lib/README.md](./lib/README.md) – Utilities
- [constants/README.md](./constants/README.md) – Constants
- [types/README.md](./types/README.md) – Shared types

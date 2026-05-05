# Prisma – Data Layer

## Overview

This folder contains the Prisma schema, migrations, and seed script for FinanceChecker's SQLite database.

## File Structure

```
prisma/
├── schema.prisma       # Data models and datasource
├── seed.ts             # Seeds categories and Hebrew merchant rules
├── README.md           # This file
└── migrations/
    ├── migration_lock.toml
    ├── 20260225134654_init/
    ├── 20260225143337_add_balance_and_bank_category/
    ├── 20260225185911_add_raw_transaction/
    ├── 20260226115128_add_transaction_excluded_flag/
    └── 20260302101934_add_transaction_fingerprint_index/
```

## Models

| Model | Purpose |
|-------|---------|
| **Account** | Bank/card account (display name, company type, last balance, scrape state) |
| **Transaction** | Scraped transaction (amounts, description, category, exclude flag) |
| **Category** | Spending category (name, icon, color, hierarchy) |
| **CategoryRule** | Auto-categorization rules (pattern, regex, priority) |
| **ScrapeRun** | Run metadata (status, error, transaction counts) |
| **Budget** | Monthly limit per category |
| **AppSetting** | Key-value settings |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:deploy` | Apply checked-in migrations non-interactively |
| `npm run db:setup` | Apply checked-in migrations and seed data |
| `npm run db:migrate` | Create and apply development migrations interactively |
| `npm run db:seed` | Run seed script |
| `npm run db:reset` | Reset DB and re-seed |

## Migrations

For automated setup and fresh clones, use `npm run db:deploy` or `npm run db:setup` so Prisma applies the checked-in migrations without prompting.

Use `npm run db:migrate` only when you are actively developing schema changes and need Prisma to create a new migration.

The DB file is at `prisma/dev.db` by default (or per `DATABASE_URL`).

## Seeding

`seed.ts` seeds:

- Default categories (id, name, icon, color)
- Hebrew merchant rules for auto-categorization

Run after migrations or reset:

```bash
npm run db:seed
```

`seed.ts` uses upserts for the default categories and rules, so rerunning setup does not duplicate those records.

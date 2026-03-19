# Lib – Utilities and Infrastructure

## Overview

Shared utilities, Prisma client, encryption, and scraper adapter.

## Files

| File | Purpose |
|------|---------|
| **prisma.ts** | Singleton Prisma client |
| **date-utils.ts** | getMonthRange, getMonthsAgo, normalizeToDateOnly, formatDate |
| **amount-utils.ts** | formatAmount, detectDirection, absAmount |
| **encryption.ts** | AES-256-GCM encryption, password hashing |
| **utils.ts** | cn() classname helper (clsx + tailwind-merge) |
| **scraper-adapter.ts** | Adapter around israeli-bank-scrapers with Puppeteer stealth |

## Usage

- **prisma** – Import `prisma` from `@/lib/prisma` for all DB access.
- **encryption** – Used by ConfigEncryptionManager for credentials.
- **scraper-adapter** – Used by ScrapingManager; wraps israeli-bank-scrapers with stealth plugin.

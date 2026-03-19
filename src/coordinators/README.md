# Coordinators – Workflow Orchestration

## Overview

Coordinators orchestrate multi-step workflows. They coordinate repositories, managers, and external services.

## Files

| File | Purpose |
|------|---------|
| **ScrapeCoordinator.ts** | Full scrape flow: auth check, scrape run creation, scrape execution, import transactions, update account, complete run |
| **TransactionImportCoordinator.ts** | Import scraped transactions: upsert, auto-categorize, link to scrape run |

## Scrape Flow

```
ScrapeCoordinator
  1. Check unlock (ConfigEncryptionManager)
  2. Load active accounts (AccountRepository)
  3. For each account:
     a. Create ScrapeRun (ScrapingManager)
     b. Execute scrape (ScrapingManager → scraper-adapter)
     c. Import transactions (TransactionImportCoordinator)
     d. Update account lastScrapedAt, lastBalance
     e. Complete ScrapeRun
```

## Import Flow

```
TransactionImportCoordinator
  1. For each scraped transaction:
     a. Upsert into DB (TransactionRepository)
     b. Auto-categorize (CategoryManager)
  2. Link transactions to ScrapeRun
```

## Dependencies

- **ScrapeCoordinator** → AccountRepository, ScrapingManager, TransactionImportCoordinator, ConfigEncryptionManager
- **TransactionImportCoordinator** → TransactionRepository, CategoryManager

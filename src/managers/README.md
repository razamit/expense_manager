# Managers – Business Logic

## Overview

Managers contain business logic. They use repositories for data access and are called by API routes and coordinators.

## Files

| File | Purpose |
|------|---------|
| **ScrapingManager.ts** | Scrape run creation, execution via scraper-adapter, completion |
| **TransactionManager.ts** | Transaction queries, filters, category updates |
| **CategoryManager.ts** | Category rules, auto-categorization logic |
| **StatisticsManager.ts** | Totals, income, spending, trends |
| **AnomalyDetectionManager.ts** | Spending anomaly detection |
| **ConfigEncryptionManager.ts** | Master password, credential encryption, lock state |

## Responsibilities

| Manager | Key Methods | Uses |
|---------|-------------|------|
| ScrapingManager | createRun, executeScrape, completeRun | prisma, scraper-adapter, date-utils |
| TransactionManager | getTransactions, updateCategory, applyFilters | TransactionRepository |
| CategoryManager | categorize, rules CRUD | CategoryRuleRepository, TransactionRepository |
| StatisticsManager | getTotals, getIncome, getSpending, trends | TransactionRepository, CategoryRepository, date-utils |
| AnomalyDetectionManager | getAnomalies | TransactionRepository |
| ConfigEncryptionManager | unlock, lock, getConfig, saveConfig | encryption, prisma, fs |

## Conventions

- Managers do **not** call other managers directly (except via coordinators).
- Managers use repositories for all database access.
- Keep methods focused; split into helper classes if a manager grows.

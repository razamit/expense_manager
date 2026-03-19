# Repositories – Data Access

## Overview

Repositories handle all database access. They use Prisma and expose typed methods for CRUD and queries.

## Files

| File | Purpose |
|------|---------|
| **AccountRepository.ts** | Account CRUD, find by id/active |
| **TransactionRepository.ts** | Transaction CRUD, upsert from scrape, filtered queries |
| **CategoryRepository.ts** | Category CRUD, spending aggregations |
| **CategoryRuleRepository.ts** | Category rule CRUD |

## Responsibilities

| Repository | Key Methods |
|------------|-------------|
| AccountRepository | create, findById, findActive, update |
| TransactionRepository | create, upsertFromScrape, findMany (with filters), updateCategory |
| CategoryRepository | create, findMany, getSpendingByCategory |
| CategoryRuleRepository | create, findMany, findByCategory |

## Conventions

- Repositories return domain objects or DTOs; avoid leaking Prisma types.
- One repository per main entity (Account, Transaction, Category, CategoryRule).
- Complex queries stay in repositories, not in managers.

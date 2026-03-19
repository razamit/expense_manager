# API – Route Handlers

## Overview

Next.js App Router API routes. All routes are under `src/app/api/`. ViewModels call these endpoints; they do not import managers or repositories directly.

## File Structure

```
api/
├── auth/unlock/route.ts         # Master password create/unlock/lock
├── accounts/route.ts            # GET/POST accounts
├── scrape/route.ts              # POST scrape (all or one account)
├── transactions/route.ts        # GET transactions (filters)
├── categories/route.ts          # GET/POST categories
├── category-rules/route.ts      # GET/POST category rules
├── config/route.ts              # GET/POST config (credentials)
├── statistics/
│   ├── totals/route.ts          # Dashboard totals
│   ├── income/route.ts          # Income stats
│   ├── income-vs-expense/route.ts   # Income vs expense
│   ├── spending/route.ts        # Spending by category
│   └── anomalies/route.ts      # Anomaly alerts
└── README.md
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/unlock` | GET, POST | Master password create/unlock/lock |
| `/api/accounts` | GET, POST | List/create accounts |
| `/api/scrape` | POST | Scrape all or one account (`accountId`) |
| `/api/transactions` | GET | List transactions with filters |
| `/api/categories` | GET, POST | List/create categories |
| `/api/category-rules` | GET, POST | List/create category rules |
| `/api/config` | GET, POST | Config (credentials, requires unlock) |
| `/api/statistics/totals` | GET | Dashboard totals |
| `/api/statistics/income` | GET | Income stats |
| `/api/statistics/income-vs-expense` | GET | Income vs expense |
| `/api/statistics/spending` | GET | Spending by category |
| `/api/statistics/anomalies` | GET | Anomaly alerts |

## Authentication / Security

- Scrape, config, and some read operations require the app to be **unlocked** (master password).
- Config credentials are stored encrypted; API routes use `ConfigEncryptionManager` for decrypt/encrypt.

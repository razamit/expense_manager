# ViewModels – UI State Hooks

## Overview

ViewModels are React hooks that manage UI state and call API endpoints. They do **not** import managers or repositories.

## Files

| File | Purpose |
|------|---------|
| **useAccountsViewModel.ts** | Accounts list, create/edit, API calls |
| **useTransactionsViewModel.ts** | Transaction list, filters, category assignment |
| **useCategoriesViewModel.ts** | Categories, rules, CRUD |
| **useDashboardViewModel.ts** | Dashboard totals, anomalies, top categories |
| **useStatisticsViewModel.ts** | Statistics and charts state |

## Pattern

```
Page component
  → useXxxViewModel()
  → Returns { data, loading, error, actions }
  → Actions call fetch('/api/...')
```

## Conventions

- ViewModels only call `/api/*` endpoints.
- Keep state minimal; derive what you can.
- Naming: `use<Feature>ViewModel`.

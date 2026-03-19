# Components

## Overview

React components organized by responsibility: layout, shared, domain-specific, and UI primitives.

## File Structure

```
components/
├── layout/                 # App shell, sidebar, top bar
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── MobileSidebar.tsx
│   └── TopBar.tsx
├── shared/                 # Reusable across features
│   ├── AmountDisplay.tsx
│   ├── MonthPicker.tsx
│   └── MasterPasswordDialog.tsx
├── accounts/               # Account domain
│   ├── AccountCard.tsx
│   └── AccountFormDialog.tsx
├── transactions/           # Transaction domain
│   ├── TransactionTable.tsx
│   ├── TransactionFiltersBar.tsx
│   └── CategoryAssignDialog.tsx
├── categories/             # Category domain
│   ├── CategoryList.tsx
│   └── CategoryRuleEditor.tsx
├── statistics/             # Statistics domain
│   ├── SpendingByCategoryChart.tsx
│   ├── IncomeExpenseTrendChart.tsx
│   └── CategoryBreakdownList.tsx
├── dashboard/              # Dashboard domain
│   ├── SpendingSummaryCard.tsx
│   ├── RecentTransactionsList.tsx
│   ├── TopCategoriesCard.tsx
│   └── AnomalyAlertsList.tsx
└── ui/                     # Radix-based primitives
    ├── button.tsx, card.tsx, input.tsx, label.tsx
    ├── dialog.tsx, select.tsx, switch.tsx, tabs.tsx
    ├── badge.tsx, progress.tsx, scroll-area.tsx
    ├── separator.tsx, tooltip.tsx
    └── ...
```

## Organization

| Folder | Purpose |
|--------|---------|
| **layout** | App shell, navigation, top bar (scrape, lock) |
| **shared** | Reusable components (amounts, month picker, password dialog) |
| **accounts** | Account cards, forms |
| **transactions** | Transaction table, filters, category assignment |
| **categories** | Category list, rule editor |
| **statistics** | Charts and breakdown lists |
| **dashboard** | Dashboard widgets (summary, recent txns, top categories, anomalies) |
| **ui** | Radix-based primitives (shadcn-style) |

## Conventions

- Domain components live in folders named after the domain.
- UI primitives are in `ui/` and are shared.
- Use ViewModels for state; components receive props and callbacks from parent pages.

# App – Pages and Layout

## Overview

Next.js App Router structure: layout, pages, globals, and static assets.

## File Structure

```
app/
├── layout.tsx          # Root layout (metadata, AppShell, globals.css)
├── page.tsx            # Dashboard (/)
├── globals.css         # Global styles
├── accounts/page.tsx   # /accounts – account management
├── transactions/page.tsx   # /transactions – transaction list/filters
├── categories/page.tsx     # /categories – categories and rules
├── statistics/page.tsx    # /statistics – charts and breakdowns
├── settings/page.tsx      # /settings – app settings
└── api/                    # API routes (see api/README.md)
```

## Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Dashboard: totals, recent transactions, top categories, anomalies |
| `/accounts` | `accounts/page.tsx` | Add/edit accounts, view scrape status |
| `/transactions` | `transactions/page.tsx` | Transaction list with filters and category assignment |
| `/categories` | `categories/page.tsx` | Manage categories and auto-categorization rules |
| `/statistics` | `statistics/page.tsx` | Spending charts, income vs expense, category breakdown |
| `/settings` | `settings/page.tsx` | Master password, credentials, app config |

## Layout

- **layout.tsx** – Wraps all pages with `AppShell` (sidebar, top bar, auth/lock, scrape button).
- **globals.css** – Tailwind, CSS variables, global styles.

## Navigation

Sidebar and mobile nav route to the above pages. See `components/layout/Sidebar.tsx` and `MobileSidebar.tsx`.

---
name: new-page
description: Scaffold a new top-level page in FinanceChecker with its viewmodel and sidebar nav entry, matching the project's design system. Use when adding a new route/screen (e.g. "add a reports page", "new settings section as its own page", "add a /budgets page").
---

# Scaffold a new page

Builds a page that already looks like the rest of the app and is reachable from the sidebar. Follow the global web-design rules: light/minimal shadcn aesthetic, Inter, Lucide icons only (no emoji), neutral palette + the existing accent, mobile responsive, **no dark mode**, no border-radius above `rounded-2xl`, no font below 14px.

Read `src/app/accounts/page.tsx` and `src/app/sync-history/page.tsx` as the canonical layout examples before writing.

## Project design tokens / classes (use these, don't invent)

Layout helpers (defined in `src/app/globals.css`):
- `app-page-shell` — page wrapper (spacing + max width).
- `app-eyebrow-label` — small uppercase label above the H1.
- `app-surface-card` — empty-state / surface panel.

Color tokens (Tailwind v4 `--color-*`): `foreground`, `muted-foreground`, `primary`, `destructive`, `outline-variant`, `warning`/`warning-foreground`, `positive`, `card`, `sidebar`, `sidebar-accent`, `sidebar-accent-foreground`. Reuse `src/components/ui/*` (Button, Card, Badge, Dialog, Tabs, ScrollArea, etc.) — do not pull in new UI libraries.

Page header pattern:
```tsx
<div className="app-page-shell">
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-2">
      <p className="app-eyebrow-label">Section</p>
      <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">Title</h1>
      <p className="text-sm text-muted-foreground">One-line description.</p>
    </div>
    {/* optional actions (Button) */}
  </div>
  {/* content; loading/empty states use app-surface-card */}
</div>
```

## Steps

1. **Page** `src/app/<route>/page.tsx`: `"use client"`, default export, uses the header pattern + an `app-surface-card` empty/loading state. Data comes from a viewmodel hook.
2. **ViewModel** `src/viewmodels/use<Name>ViewModel.ts`: fetch via `/api/*` using the `readJson` helper pattern (see `useSyncHistoryViewModel.ts`). If it needs new data, scaffold the API/Manager/Repository with the `scaffold-slice` skill first.
3. **Components**: extract rows/dialogs into `src/components/<feature>/` (keep page <~120 lines; files <500, functions <40).
4. **Sidebar nav**: add an entry to `NAV_ITEMS` in `src/components/layout/Sidebar.tsx` with a Lucide icon imported at the top, placed sensibly in the existing order.

## Verify

`npx tsc --noEmit`. If the app is running, the route hot-reloads; otherwise tell the user to start `npm run dev`. Confirm no dark-mode styles, no emoji, all fonts ≥14px.

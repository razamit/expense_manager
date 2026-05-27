---
name: scaffold-slice
description: Scaffold a full feature slice in FinanceChecker across the ViewModel/API/Manager/Repository layers. Use when adding a new data-backed feature, entity, or endpoint (e.g. "add budgets CRUD", "add a tags feature", "expose X to the UI") that needs DB access wired through to the UI.
---

# Scaffold a feature slice

Enforces the project's strict layering. Data flows **UI → ViewModel → `/api/*` → Manager → Repository → Prisma**. ViewModels NEVER import managers or repositories; they only `fetch` API routes.

Read one existing example of each layer before writing, to match current style:
- Repository: `src/repositories/AccountRepository.ts`
- Manager: `src/managers/ScrapingManager.ts`
- API route: `src/app/api/accounts/route.ts`
- ViewModel: `src/viewmodels/useAccountsViewModel.ts`
- DTO: `src/types/index.ts`

## Conventions (must follow)

- Path alias `@/*` → `src/*`.
- Every API route that touches credentials/scraping checks `ConfigEncryptionManager.isUnlocked()` and returns `401 { error: "App is locked" }` if locked. Pure read-only public data (like `GET /api/accounts`) may skip the lock check — match the sibling routes.
- DTOs are the only shape crossing the network. Define `XxxDTO` in `src/types/index.ts`; map Prisma rows → DTO in the API route (serialize `Date` with `.toISOString()`).
- ViewModels use the local `readJson<T>` helper pattern (see `useAccountsViewModel.ts`) for error handling.
- File-size limits from the global rules: <500 lines/file (split at 400), <40 lines/function. Repositories stay CRUD-only; business logic goes in Managers; multi-step orchestration goes in Coordinators (`src/coordinators/`).
- Prisma 6 (not 7). New models need a migration — see the `db-migrate` skill.

## Steps

1. **Clarify** the entity, its fields, and which operations (list/create/update/delete) the UI needs.
2. **Schema** (if new model): add to `prisma/schema.prisma`, then run the `db-migrate` skill. Add seed data in `prisma/seed.ts` only if needed.
3. **Repository** `src/repositories/<Name>Repository.ts`: static methods doing raw Prisma CRUD/queries, returning Prisma types. No business logic.
4. **Manager** `src/managers/<Name>Manager.ts`: business rules, validation, composing repository calls. Returns domain results.
5. **DTO**: add `<Name>DTO` to `src/types/index.ts`.
6. **API route** `src/app/api/<name>/route.ts`: `GET/POST/PUT/DELETE` as needed; lock-check, parse body, call Manager, map → DTO, return `NextResponse.json`. Mirror error shapes used in `accounts/route.ts`.
7. **ViewModel** `src/viewmodels/use<Name>ViewModel.ts`: `useState`/`useEffect`, fetch the route via `readJson`, expose data + mutation functions that re-fetch on success.
8. **Wire the UI** only if asked (page/components). For a new page use the `new-page` skill.

## Verify

Run `npx tsc --noEmit` and report results. Do not add tests unless the user asks.

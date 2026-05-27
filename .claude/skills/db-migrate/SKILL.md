---
name: db-migrate
description: Run a safe Prisma schema migration in FinanceChecker, handling the Windows dev-server DLL lock. Use after editing prisma/schema.prisma, when adding a model/column, or when the user asks to migrate, regenerate the Prisma client, or fixes an EPERM "query_engine-windows.dll" error.
---

# Safe Prisma migration

SQLite at `prisma/dev.db`, **Prisma 6** (intentionally not 7 — keeps `url = env(...)` stable). Migrations live in `prisma/migrations/`.

## The gotcha

If `npm run dev` (port 5000) is running, it **locks** `node_modules/.prisma/client/query_engine-windows.dll.node`. `prisma generate` then fails with:
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```
`migrate dev` still applies the SQL to the DB, but the generated client (types + in-memory client in the running server) is stale until you regenerate AND restart the server.

## Steps

1. **Check for a running dev server.** It holds the lock:
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, StartTime
   ```
   If one is running, ask the user to stop `npm run dev` (Ctrl+C) — do NOT kill it yourself, they may be using it. You can proceed with `migrate dev` regardless, but `generate` needs it stopped.

2. **Create + apply the migration** with a descriptive snake_case name:
   ```powershell
   npx prisma migrate dev --name <change_description>
   ```
   (`migrate dev` auto-runs `generate` at the end — that's the step that hits the lock.)

3. **If generate failed with EPERM**: have the user stop the dev server, then:
   ```powershell
   npx prisma generate
   ```

4. **Reseed only if required** (new lookup data, or you reset the DB):
   ```powershell
   npm run db:seed
   ```
   Use `npx prisma migrate reset` only when the user explicitly wants to wipe and reseed — it is destructive (drops all data, including scraped transactions and encrypted-credential references).

5. **Tell the user to restart `npm run dev`** so the server loads the regenerated client.

## Verify

`npx tsc --noEmit` — confirms the regenerated client types match the new schema. Report the migration folder name created under `prisma/migrations/`.

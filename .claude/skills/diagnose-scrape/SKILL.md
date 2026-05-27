---
name: diagnose-scrape
description: Diagnose why a bank/credit-card scrape failed in FinanceChecker. Use when a sync/scrape failed, an account shows "Action required" or an error, or the user asks "why did <provider> fail", "what broke in the scrape", or wants to read the scrape log.
---

# Diagnose a failed scrape

Scrape runs are logged two ways:
- **Disk**: `logs/scrape/<ISO-timestamp>_<companyType>_<label>.log` — one file per credential-group scrape, with timestamped steps.
- **DB**: the `ScrapeRun` table (`prisma/dev.db`) — `status`, `errorType`, `errorMessage`, and the full `logJson` per account run.

## Steps

1. **Find the run.** If the user named a provider (e.g. "Visa Cal"), match it in the filename. Otherwise list newest files first and pick the most recent failing one:
   - List: `Get-ChildItem logs/scrape -File | Sort-Object LastWriteTime -Descending | Select-Object -First 10`
   - Read the chosen `.log` with the Read tool.

2. **Read the step timeline.** The last `STEP` line before failure tells you *where* it broke:
   - dies at/after `LOGGING_IN` with no `LOGIN_SUCCESS` → credentials or login-page issue.
   - `CHANGE_PASSWORD` step → provider forces a password reset (see mapping below).
   - reaches `LOGIN_SUCCESS` then fails near `END_SCRAPING` → transaction fetch/parse issue, not login.
   - `error` line shows `Scrape failed [<errorType>]: <message>` and any stack trace under `detail`.

3. **Map the errorType to a cause.** The canonical mapping lives in `src/lib/scrape-logging/scrape-error-messages.ts`. Read it rather than guessing — key types:
   - `CHANGE_PASSWORD` → user must reset the password on the provider site, then update credentials via the account card's **Update password** button.
   - `INVALID_PASSWORD` → wrong saved credentials.
   - `ACCOUNT_BLOCKED` → provider locked the account.
   - `TIMEOUT` → provider site slow/unreachable; retry.
   - `GENERIC` / `GENERAL_ERROR` → unexpected; rely on the stack trace in the log.

4. **Confirm against the DB if the log is missing or ambiguous.** Query the latest run for the account:
   ```powershell
   npx tsx -e "import {prisma} from './src/lib/prisma'; prisma.scrapeRun.findMany({orderBy:{startedAt:'desc'},take:5,include:{account:{select:{displayName:true,companyType:true}}}}).then(r=>{console.log(JSON.stringify(r.map(x=>({acct:x.account.displayName,status:x.status,errorType:x.errorType,errorMessage:x.errorMessage})),null,2));process.exit(0)})"
   ```

## Output

Report: which account/provider, the failing step, the `errorType`, the plain-language cause, and the concrete fix. If it's `CHANGE_PASSWORD`, tell the user to reset on the provider site then use **Update password** on the account card. Do not modify code unless asked — this skill is for diagnosis.

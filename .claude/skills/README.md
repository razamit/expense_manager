# Agent Skills

Project-specific [Claude Code](https://docs.claude.com/en/docs/claude-code) skills for FinanceChecker. They are checked into the repository so every contributor using Claude Code (or a compatible agent) gets the same project-aware workflows.

Each skill is a `SKILL.md` with YAML front matter (`name`, `description`) plus instructions. Skills activate automatically when a request matches their `description`, or can be invoked explicitly (e.g. `/diagnose-scrape`).

| Skill | Use it when… |
| --- | --- |
| [`diagnose-scrape`](diagnose-scrape/SKILL.md) | A scrape/sync failed and you want to know why. Reads the run log + `ScrapeRun` table and maps the `errorType` to a cause and fix. |
| [`scaffold-slice`](scaffold-slice/SKILL.md) | Adding a data-backed feature. Generates the Repository → Manager → DTO → API route → ViewModel layers wired to the project conventions. |
| [`db-migrate`](db-migrate/SKILL.md) | Changing `prisma/schema.prisma`. Runs a safe migration + client regeneration, handling the Windows dev-server DLL lock. |
| [`new-page`](new-page/SKILL.md) | Adding a new screen. Scaffolds a page + viewmodel + sidebar entry using the project's design tokens. |

These skills are optional tooling for contributors. They do not affect the application at runtime.

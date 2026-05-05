# Contributing

Thank you for your interest in FinanceChecker. Contributions are welcome.

## Before You Start

- Open an issue first for any significant change so the approach can be discussed before you invest time coding.
- For small bug fixes or typo corrections, a PR without a prior issue is fine.

## Development Setup

Follow the [Quick Start](README.md#quick-start) in the README to get a working local environment.

```bash
# After setup, verify everything runs
npm run dev
npm run lint
npm run build
```

## Code Style

- TypeScript strict mode — no `any` unless unavoidable and documented.
- All names must be descriptive and intention-revealing.
- Max 500 lines per file; max 30–40 lines per function.
- Follow the existing layer conventions: ViewModel → Manager → Repository.
- Never mix UI logic with business logic directly.

## Architecture

Read [ARCHITECTURE.md](ARCHITECTURE.md) before making structural changes. New features should fit the existing layer model:

| What | Where |
| --- | --- |
| UI state and data loading | `src/viewmodels/` |
| Business logic | `src/managers/` |
| Workflow orchestration | `src/coordinators/` |
| Database access | `src/repositories/` |

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add export to CSV on transactions page
fix: prevent duplicate transactions on re-scrape
docs: update setup instructions for macOS
```

## Pull Requests

1. Branch from `main`.
2. Keep PRs focused — one concern per PR.
3. Fill in the PR template.
4. Ensure `npm run lint` and `npm run build` pass before opening the PR.

## Sensitive Data

**Do not commit:**

- Real bank credentials or session tokens.
- `config/credentials.enc`.
- `.env` files with live values.
- `prisma/dev.db` or any database file containing real transactions.

## Reporting Issues

Use the GitHub issue templates:

- **Bug report** — unexpected behavior or crashes.
- **Feature request** — new functionality or improvements.

For security vulnerabilities, read [SECURITY.md](SECURITY.md) and do **not** open a public issue.

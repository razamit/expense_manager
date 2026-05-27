# Claude Configuration

This folder holds [Claude Code](https://docs.claude.com/en/docs/claude-code) configuration for FinanceChecker.

## Structure

```
.claude/
├── README.md            # This file
├── skills/              # Project agent skills (committed, shared)
└── settings.local.json  # Local permissions (gitignored, per-developer)
```

## Contents

- **`skills/`** — Project-specific agent skills checked into the repo so all contributors share the same project-aware workflows. See [`skills/README.md`](skills/README.md).
- **`settings.local.json`** — Per-developer tool/permission settings. Git-ignored; never committed. Application secrets and environment variables live in `.env` at the project root, not here.

## Notes for agents

- Use `skills/` for project workflows (diagnosing scrapes, scaffolding features, migrations, new pages).
- Do not rely on `settings.local.json` for application logic; it is agent/IDE configuration only.

# Claude Configuration

## Overview

This folder contains Claude/Cursor agent configuration for the FinanceChecker project. It defines permissions and environment-specific settings.

## File Structure

```
.claude/
├── README.md           # This file
├── settings.local.json # Local permissions (allow Bash, WebFetch, etc.)
└── settings.json       # Optional shared settings (if present)
```

## Purpose

- **settings.local.json** – Defines which shell commands and tools agents are allowed to run (e.g., patch-package, sqlite3, prisma). Not committed; local to each developer/agent environment.

## For Agents

- Use this folder only for understanding project tooling permissions.
- Do not rely on `settings.local.json` for application logic; it is IDE/agent config.
- Application secrets and env vars live in `.env` at project root.

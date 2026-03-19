# Constants

## Overview

Static configuration and metadata used across the app.

## Files

| File | Purpose |
|------|---------|
| **company-metadata.ts** | Israeli banks/cards metadata (credential fields, company types) |
| **default-categories.ts** | Default category presets (id, name, icon, color) |

## Usage

- **company-metadata** – Used in account forms and scraper to know which fields to ask for (e.g., username, password, id).
- **default-categories** – Seeded by `prisma/seed.ts`; referenced when creating or displaying categories.

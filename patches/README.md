# Patches

## Overview

This folder contains `patch-package` patches for npm dependencies. Patches are applied automatically via `postinstall` in `package.json`.

## Current Patches

| Package | Purpose |
|---------|---------|
| **israeli-bank-scrapers** | Adjustments for rate limiting, anti-detection, or compatibility with the scraping flow |

## File Structure

```
patches/
├── README.md
└── israeli-bank-scrapers+6.7.1.patch
```

## Usage

- **Apply patches:** Run `npm install` (or `postinstall` runs `patch-package`).
- **Create/update patch:** After editing files in `node_modules/<package>`, run:

  ```bash
  npx patch-package <package-name>
  ```

- **Remove patch:** Delete the `.patch` file and reinstall.

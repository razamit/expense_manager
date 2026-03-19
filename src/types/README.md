# Types – Shared TypeScript Types

## Overview

DTOs, filters, and shared types used across the app.

## File

**index.ts** – Exports all types:

- **DTOs**: AccountDTO, TransactionDTO, CategoryDTO, CategoryRuleDTO, ScrapeRunDTO, etc.
- **Filters**: TransactionFilters, date ranges
- **Dashboard/Stats**: DashboardSummary, AnomalyAlert, spending/income types

## Usage

- Import from `@/types` for consistent types across ViewModels, API routes, and components.
- DTOs map to API request/response shapes.

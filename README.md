# FinanceChecker

Personal finance application that scrapes Israeli banks and credit cards, categorizes transactions, and provides spending insights, statistics, and anomaly detection.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **SQLite** (via Prisma, no separate install needed)

## Setup

1. **Clone and install:**

   ```bash
   cd FinanceChecker
   npm install
   ```

2. **Environment:**

   Copy `.env.example` to `.env` and set `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

   For local SQLite:

   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. **Database:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run:**

   ```bash
   npm run dev
   ```

   App runs at [http://localhost:5000](http://localhost:5000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (port 5000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Prisma generate |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed categories |
| `npm run db:reset` | Reset DB (migrate + seed) |

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for architecture, data flow, and technology stack.

Folder-specific docs:

- [src/README.md](./src/README.md) – Application structure
- [prisma/README.md](./prisma/README.md) – Schema, migrations, seeding
- [patches/README.md](./patches/README.md) – Package patches

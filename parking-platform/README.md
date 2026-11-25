# Parking Platform (Next.js + Go + PostgreSQL)

Standalone application migrated out of WordPress (`parking-system`), designed to run completely independently and support full data migration from WordPress MySQL.

## Structure
- `backend/` — Go API (Fiber v2 + PostgreSQL + `pgx/v5` + `sqlc` + `robfig/cron`)
  - `db/migrations/` — PostgreSQL schema (`users`, `locations`, `vehicle_types`, `parking_spaces`, `parking_blackouts`, `customer_vehicles`, `coupons`, `parking_bookings`, `parking_checklists`, `rental_packages`, `car_rentals`, `drivers`, `ride_assignments`, `payments`)
  - `db/queries/` — SQL queries for `sqlc generate`
  - `cmd/api/` — Main HTTP server + LINE OA cron scheduler
  - `cmd/migrate-wp/` — WordPress MySQL -> PostgreSQL data migrator
- `frontend/` — Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + TanStack Query
- `docker-compose.yml` — PostgreSQL 16 + Redis 7 + Go API

## Quick Start

1. Copy environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Start PostgreSQL, Redis, and Go API via Docker:
   ```powershell
   docker compose up -d --build
   ```
3. Run Next.js Frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
4. Generate `sqlc` Go code (requires `sqlc` installed or via Docker `sqlc/sqlc`):
   ```powershell
   docker run --rm -v "${PWD}/backend:/src" -w /src sqlc/sqlc generate
   ```

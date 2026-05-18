# BuyForce V3

A group-buying platform where users join together to unlock bulk discounts on products.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (Pages Router, Turbopack) |
| Backend | NestJS + TypeORM |
| Database | PostgreSQL 16 (via Docker) |
| Mobile | React Native (Expo) |
| Auth | JWT (jsonwebtoken) |

---

## Project Structure

```
BuyForceV3/
├── client/          # Next.js web frontend (port 3000)
├── client-mobile/   # Expo React Native app
├── nest-api/        # NestJS backend API (port 4000)
├── docker-compose.yml
└── db.sql           # Initial database schema
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm or yarn

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Snep3/BuyForceV3.git
cd BuyForceV3
```

---

### 2. Start the PostgreSQL database

Docker Compose spins up a PostgreSQL 16 container and loads the initial schema automatically.

```bash
docker compose up -d
```

This creates:
- Container: `my-postgres-fresh`
- Database: `BuyForce_sql`
- User: `postgres`
- Password: `123456`
- Port: `5438` (mapped from internal 5432)

---

### 3. Backend (NestJS API)

#### Create the env file

Create `nest-api/.env` — **this file is gitignored and must be created manually**:

```env
# Database
DB_HOST=localhost
DB_PORT=5438
DB_USER=postgres
DB_PASSWORD=123456
DB_DATABASE=BuyForce_sql
DB_SSL=false

# Server
PORT=4000
NODE_ENV=development

# Auth
JWT_SECRET=replace_this_with_a_long_random_secret
```

> For production, set `NODE_ENV=production`, `DB_SSL=true`, and use a strong `JWT_SECRET`.

#### Install and run

```bash
cd nest-api
npm install
npm run start:dev
```

The API will be available at `http://localhost:4000`.

In development mode TypeORM automatically syncs the database schema — no manual migrations needed.

---

### 4. Web Frontend (Next.js)

#### Create the env file (optional)

By default the frontend points to `http://localhost:4000`. If your API runs elsewhere, create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-deployed-api.com
```

If this file doesn't exist, `http://localhost:4000` is used automatically.

#### Install and run

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

### 5. Mobile App (Expo) — optional

```bash
cd client-mobile
npm install
npx expo start
```

The mobile app reads the API URL from its own config. Make sure your machine's local IP is reachable from the device/emulator.

---

## Environment Variable Reference

### `nest-api/.env`

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5438` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `123456` |
| `DB_DATABASE` | Database name | `BuyForce_sql` |
| `DB_SSL` | Enable SSL for DB connection | `false` (local) / `true` (cloud) |
| `PORT` | Port the API listens on | `4000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `JWT_SECRET` | Secret key for signing JWTs | any long random string |

### `client/.env.local`

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:4000` |

---

## Default Admin Account

When running for the first time, register an account normally via `/register`, then manually set `is_admin = true` in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Admin panel is available at `/admin/products` and `/admin/groups`.

---

## Production Deployment Notes

1. Set `NODE_ENV=production` in the backend env — this disables TypeORM auto-sync and query logging.
2. If you add new database columns after deploying to production, you must run the `ALTER TABLE` manually since auto-sync is off. Example for the discount column:
   ```sql
   ALTER TABLE groups ADD COLUMN IF NOT EXISTS "discountPercent" numeric DEFAULT 0;
   ```
3. Set `DB_SSL=true` when using a cloud database (Railway, Supabase, Neon, etc.).
4. Use a strong, unique `JWT_SECRET` — do not reuse the development value.
5. Set `NEXT_PUBLIC_API_URL` in the frontend to your deployed API URL.

---

## Key Features

- Group buying with real-time participant progress bars
- Discount percentage per group (admin-configurable)
- Countdown timers on group deals
- Wishlist for products and groups
- Order tracking
- Admin panel for managing products and groups
- Push notifications for group milestones (join, threshold, completion)
- JWT authentication with auto token refresh

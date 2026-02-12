# Platform Joki (Garapin) — Project Documentation

Indonesia Freelance Marketplace with escrow payments, tier-based freelancer progression, real-time chat, and admin moderation.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Local Development Setup](#local-development-setup)
4. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
5. [Railway Deployment (Backend)](#railway-deployment-backend)
6. [Security & Mitigations](#security--mitigations)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Database & Seeding](#database--seeding)
9. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Zustand   |
| Backend  | Node.js, Express, TypeScript, Prisma ORM                                   |
| Database | PostgreSQL (Supabase)                                                      |
| Payments | Midtrans (Snap)                                                            |
| Realtime | Supabase Realtime                                                          |
| Storage  | Supabase Storage                                                           |

---

## Project Structure

```
platform-joki/
├── backend/              # Express API server
│   ├── prisma/           # Schema, migrations, seed
│   ├── src/
│   │   ├── config/       # Env validation (Zod), DB, CORS
│   │   ├── middleware/   # Auth, RBAC, validation, rate limiter, sanitize
│   │   ├── modules/      # Domain modules (auth, user, project, bid, chat, etc.)
│   │   ├── services/     # Midtrans, tier
│   │   ├── jobs/         # Cron jobs (auto-dispute)
│   │   ├── routes/       # Route aggregator
│   │   ├── app.ts        # Express app setup
│   │   └── index.ts      # Server bootstrap + graceful shutdown
│   └── railway.json      # Railway deployment config
├── frontend/             # Next.js web app
│   └── src/
│       ├── app/          # App Router pages + layouts
│       ├── components/   # UI components (shadcn, layout, auth, chat, project)
│       ├── lib/          # API client, Supabase, utils
│       ├── stores/       # Zustand state (auth)
│       └── hooks/        # Custom hooks (realtime)
└── DOCUMENTATION.md      # This file
```

---

## Local Development Setup

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** (or Supabase project)
- **Midtrans** sandbox account (for payments)

### 1. Clone and Install

```bash
git clone <repo-url>
cd platform-joki

# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
```

### 2. Configure Environment

Edit `backend/.env` and `frontend/.env.local` with your credentials. See [Environment Variables Reference](#environment-variables-reference).

### 3. Setup Database

```bash
cd backend
npx prisma db push
ADMIN_SEED_PASSWORD=your-password npx prisma db seed
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend (port 4000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

---

## Vercel Deployment (Frontend)

### Prerequisites

- GitHub repository connected to Vercel
- Vercel account

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your Git repository
3. Set **Root Directory** to `frontend`
4. Framework Preset: **Next.js** (auto-detected)

### Step 2: Build Configuration

| Setting        | Value                     |
| -------------- | ------------------------- |
| Root Directory | `frontend`                |
| Build Command  | `npm run build` (default) |
| Output Directory | `.next` (default)       |
| Install Command | `npm install` (default) |

### Step 3: Environment Variables

Add these in Vercel Dashboard → **Project Settings** → **Environment Variables**:

| Variable                     | Description                                   | Required |
| --------------------------- | --------------------------------------------- | -------- |
| `NEXT_PUBLIC_API_URL`       | Backend API URL (e.g. `https://your-api.railway.app/api`) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase project URL                          | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                  | Yes      |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans client key (SB-Mid-client-xxx for sandbox) | Yes |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `true` or `false`                        | Yes      |
| `NEXT_PUBLIC_APP_ENV`       | `staging` or `production` (optional; use `staging` for previews) | No |

### Step 4: Deploy

- **Production**: Push to `main` → automatic deploy
- **Preview**: Push to other branches → preview deployment with unique URL

### Step 5: Staging Banner (Optional)

Set `NEXT_PUBLIC_APP_ENV=staging` for preview deployments to show the amber “STAGING ENVIRONMENT” banner and `noindex` headers.

---

## Railway Deployment (Backend)

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected

### Step 1: Create New Project

1. Go to Railway Dashboard → **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository
4. Set **Root Directory** to `backend` (or deploy only the backend folder)

### Step 2: Build Configuration

Railway uses `railway.json` in the backend directory:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

- **Build**: Nixpacks runs `npm install`, `prisma generate`, and `npm run build`
- **Start**: Runs `node dist/index.js`
- **Restart**: On failure, up to 10 retries

### Step 3: Add PostgreSQL (Optional)

If not using Supabase:

1. Railway Dashboard → **New** → **Database** → **PostgreSQL**
2. Connect the database to your backend service
3. Use the generated `DATABASE_URL` as an env var

### Step 4: Environment Variables

Add these in Railway → **Variables**:

| Variable              | Description                                    | Required |
| --------------------- | ---------------------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string (Supabase or Railway) | Yes   |
| `DIRECT_URL`          | Same as DATABASE_URL (for Prisma migrations)   | Yes      |
| `JWT_SECRET`          | Min 16 chars, strong random string             | Yes      |
| `JWT_REFRESH_SECRET`  | Min 16 chars, different from JWT_SECRET        | Yes      |
| `MIDTRANS_SERVER_KEY` | Midtrans server key                            | Yes      |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key                            | Yes      |
| `MIDTRANS_IS_PRODUCTION` | `true` or `false`                          | Yes      |
| `SUPABASE_URL`        | Supabase project URL                           | Yes      |
| `SUPABASE_SERVICE_KEY`| Supabase service role key                      | Yes      |
| `PORT`                | Railway sets this automatically (usually 3000) | Auto     |
| `NODE_ENV`            | `production`                                   | Yes      |
| `FRONTEND_URL`        | Vercel URL, e.g. `https://your-app.vercel.app` | Yes      |
| `CORS_ORIGINS`        | Comma-separated origins (optional, overrides FRONTEND_URL) | No |
| `PLATFORM_FEE_PERCENT`| Fee percentage 0–100 (default: 15)             | No       |

### Step 5: Database Migrations

Run migrations before first deploy or after schema changes:

**Option A — Railway CLI**

```bash
railway run npx prisma migrate deploy
```

**Option B — Manual**

```bash
cd backend
DATABASE_URL="your-railway-or-supabase-url" npx prisma migrate deploy
```

### Step 6: Seed Admin User (Optional)

```bash
railway run ADMIN_SEED_PASSWORD=your-secure-password npx prisma db seed
```

### Step 7: Get Backend URL

After deploy, copy the public URL (e.g. `https://your-service.railway.app`) and use it in Vercel as `NEXT_PUBLIC_API_URL` + `/api`.

---

## Security & Mitigations

### 1. CORS

- **Config**: `backend/src/config/cors.ts`
- **Allowed origins**: From `CORS_ORIGINS` or `FRONTEND_URL` (comma-separated)
- **Credentials**: `true` for cookie/auth if used
- **Mitigation**: Only listed origins can call the API from the browser; requests without `Origin` (e.g. health checks) are allowed

### 2. Rate Limiting

| Route  | Limit              | Window   |
| ------ | ------------------ | -------- |
| General API | 500 requests  | 15 min   |
| Auth routes | 20 requests   | 15 min   |
| Chat       | 60 requests   | 1 min    |

**Files**: `backend/src/middleware/rateLimiter.ts`  
**Mitigation**: Reduces brute-force and abuse; returns `429 Too Many Requests` when exceeded.

### 3. Input Sanitization (XSS)

- **File**: `backend/src/middleware/sanitize.ts`
- **Behavior**: Sanitizes request body: encodes `<`, `>`, strips `javascript:`, removes event handlers (`on*=`)
- **Applied**: On all JSON/urlencoded body via `sanitizeBody` middleware

### 4. Helmet

- **Usage**: `app.use(helmet())` in `app.ts`
- **Mitigation**: Sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)

### 5. JWT Authentication

- **Algorithm**: HS256
- **Access token**: 15 min default
- **Refresh token**: 7 days default
- **Validation**: `authenticate` and `optionalAuth` middleware in `auth.ts`

### 6. Trust Proxy

- **When**: `NODE_ENV !== 'development'`
- **Behavior**: `app.set('trust proxy', 1)` for correct client IP and protocol behind Railway/Heroku

### 7. Staging No-Index

- **When**: `NEXT_PUBLIC_APP_ENV=staging`
- **Headers**: `X-Robots-Tag: noindex, nofollow`
- **Mitigation**: Prevents staging/preview URLs from being indexed

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable              | Description                                  | Example |
| --------------------- | -------------------------------------------- | ------- |
| `DATABASE_URL`        | PostgreSQL connection string                 | `postgresql://...` |
| `DIRECT_URL`          | Same as DATABASE_URL for migrations          | Same    |
| `JWT_SECRET`          | JWT signing secret (min 16 chars)            | Strong random string |
| `JWT_REFRESH_SECRET`  | Refresh token secret (min 16 chars)          | Strong random string |
| `JWT_EXPIRES_IN`      | Access token TTL                             | `15m`   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL                         | `7d`    |
| `MIDTRANS_SERVER_KEY` | Midtrans server key                          | `SB-Mid-server-xxx` |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key                          | `SB-Mid-client-xxx` |
| `MIDTRANS_IS_PRODUCTION` | `true` or `false`                        | `false` |
| `SUPABASE_URL`        | Supabase project URL                         | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY`| Supabase service role key                    | `eyJ...` |
| `PORT`                | Server port                                  | `4000`  |
| `NODE_ENV`            | `development` / `staging` / `production`     | `development` |
| `FRONTEND_URL`        | Frontend origin(s), comma-separated          | `http://localhost:3000` |
| `CORS_ORIGINS`        | Explicit CORS origins (overrides FRONTEND_URL) | `https://app.vercel.app` |
| `PLATFORM_FEE_PERCENT`| Platform fee 0–100                           | `15`    |
| `ADMIN_SEED_PASSWORD` | Admin password for seed (optional)           | Used in `prisma db seed` |

### Frontend (`frontend/.env.local`)

| Variable                      | Description                     | Example |
| ----------------------------- | ------------------------------- | ------- |
| `NEXT_PUBLIC_API_URL`         | Backend API base URL            | `http://localhost:4000/api` |
| `NEXT_PUBLIC_SUPABASE_URL`    | Supabase project URL            | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key             | `eyJ...` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans client key         | `SB-Mid-client-xxx` |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `true` or `false`          | `false` |
| `NEXT_PUBLIC_APP_ENV`         | `staging` or omit for prod      | `staging` |

---

## Database & Seeding

### Prisma Commands

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npx prisma generate`| Generate Prisma client               |
| `npx prisma db push` | Sync schema to DB (dev)              |
| `npx prisma migrate dev` | Create and run migrations (dev)  |
| `npx prisma migrate deploy` | Run migrations (prod)          |
| `npx prisma db seed` | Run seed script                      |
| `npx prisma studio`  | Open Prisma Studio                   |

### Seed Contents

- **Categories**: 13 default categories with minimum prices (IDR)
- **Admin user**: `admin@platformjoki.com` (requires `ADMIN_SEED_PASSWORD`)

---

## Troubleshooting

### CORS errors in production

- Ensure `FRONTEND_URL` or `CORS_ORIGINS` includes the exact Vercel URL (e.g. `https://your-app.vercel.app`).
- Include both `https://your-app.vercel.app` and `https://your-app-*.vercel.app` if using preview deploys.

### Database connection failed

- Check `DATABASE_URL` and `DIRECT_URL` (Supabase: use connection pooling URL if needed).
- Add `?connection_limit=10&pool_timeout=30` for production pooling.

### 401 Unauthorized / Token expired

- Access token expires in 15 minutes; refresh token in 7 days.
- Frontend refreshes automatically; if persistent, clear `localStorage` and log in again.

### Prisma client out of sync

```bash
cd backend
npx prisma generate
```

### Railway build fails

- Ensure `railway.json` is in the backend root.
- Verify Node version compatibility (Node >= 18).

### Vercel build fails

- Check `NEXT_PUBLIC_*` vars are set.
- Ensure `NEXT_PUBLIC_API_URL` has no trailing slash.

### Midtrans Snap not loading

- Verify `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` is set.
- Use sandbox keys (`SB-Mid-*`) when `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false`.

---

## Available Scripts

### Backend

| Script                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Dev server with hot reload                 |
| `npm run build`         | Compile TypeScript to `dist/`              |
| `npm start`             | Production server from `dist/`             |
| `npm run prisma:generate` | Generate Prisma client                   |
| `npm run prisma:migrate`  | Run migrations (dev)                     |
| `npm run prisma:seed`     | Seed database                            |
| `npm run prisma:studio`   | Open Prisma Studio                       |

### Frontend

| Script        | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Next.js dev server       |
| `npm run build` | Production build       |
| `npm start`   | Production server        |
| `npm run lint`| Run ESLint               |

---

*Last updated: February 2025*

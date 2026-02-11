# Platform Joki (Garapin)

Indonesia Freelance Marketplace with escrow payments, tier-based freelancer progression, real-time chat, and admin moderation.

## Tech Stack

| Layer    | Technology                                                                |
| -------- | ------------------------------------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend  | Node.js, Express, TypeScript, Prisma ORM                                  |
| Database | PostgreSQL (Supabase)                                                     |
| Payments | Midtrans (Snap)                                                           |
| Realtime | Supabase Realtime                                                         |
| Storage  | Supabase Storage                                                          |

## Project Structure

```
platform-joki/
  backend/          # Express API server
    prisma/         # Schema, migrations, seed
    src/
      config/       # Env validation (Zod), DB, CORS
      middleware/    # Auth, RBAC, validation, error handler, rate limiter
      modules/      # Domain modules (auth, user, project, bid, chat, escrow, payout, dispute, review, admin)
      services/     # Cross-cutting services (Midtrans, tier)
      utils/        # Response helpers, errors, logger, pagination, storage
      jobs/         # Cron jobs (auto-dispute)
      routes/       # Route aggregator
      app.ts        # Express app setup
      index.ts      # Server bootstrap + graceful shutdown
  frontend/         # Next.js web app
    src/
      app/          # App Router pages + layouts
      components/   # UI components (shadcn, layout, auth, chat, project)
      lib/          # API client (per-domain), Supabase, utils, constants
      stores/       # Zustand state (auth)
      schemas/      # Zod form validation schemas
      hooks/        # Custom hooks (realtime messages)
      types/        # TypeScript type definitions
```

## Local Development Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL (or Supabase project)
- Midtrans sandbox account (for payments)

### 1. Clone and install

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

### 2. Configure environment

Edit `backend/.env` and `frontend/.env.local` with your credentials. See each `.env.example` for documentation on every variable.

### 3. Setup database

```bash
cd backend
npx prisma db push          # Apply schema to DB
ADMIN_SEED_PASSWORD=your-password npx prisma db seed   # Seed categories + admin user
```

### 4. Run development servers

```bash
# Terminal 1 - Backend (port 4000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

## Available Scripts

### Backend (`backend/`)

| Script                    | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `npm run dev`             | Start dev server with hot reload (nodemon + ts-node) |
| `npm run build`           | Compile TypeScript to `dist/`                        |
| `npm start`               | Start production server from `dist/`                 |
| `npm run prisma:generate` | Generate Prisma client                               |
| `npm run prisma:migrate`  | Run migrations (dev)                                 |
| `npm run prisma:seed`     | Seed database                                        |
| `npm run prisma:studio`   | Open Prisma Studio                                   |

### Frontend (`frontend/`)

| Script          | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start Next.js dev server |
| `npm run build` | Production build         |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |

## Quality Checks

```bash
# Backend
cd backend
npx prisma generate
npx tsc --noEmit

# Frontend
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

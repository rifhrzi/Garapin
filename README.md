# Platform Joki - Indonesia Freelance Marketplace

A local (Indonesia-first) freelance marketplace platform where clients post projects, freelancers bid, and the platform acts as escrow holder, mediator, and quality controller.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Shadcn/UI |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Payments | Xendit (Invoice + Disbursement) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime |
| Deployment | Vercel (frontend) + Railway (backend) |

## Project Structure

```
platform-joki/
├── frontend/          # Next.js 14 application
├── backend/           # Express.js API server
│   ├── prisma/        # Database schema & migrations
│   └── src/           # Application source code
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for PostgreSQL + Storage + Realtime)
- Xendit account (for payments)

### Backend Setup

```bash
cd backend
cp .env.example .env    # Fill in your environment variables
npm install
npx prisma generate
npx prisma db push      # Push schema to database
npx prisma db seed      # Seed categories
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local   # Fill in your environment variables
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend API on `http://localhost:4000`.

## User Roles

- **Client** - Posts projects, selects freelancers, manages escrow
- **Freelancer** - Browses projects, submits bids, delivers work
- **Admin** - Manages disputes, audits chat, controls user tiers

## Freelancer Tiers

| Tier | Requirements |
|------|-------------|
| Bronze Crafter | Default (new freelancer) |
| Silver Builder | 5+ projects, 4.0+ rating, 80%+ completion |
| Gold Specialist | 15+ projects, 4.3+ rating, 85%+ completion, <10% disputes |
| Platinum Master | 30+ projects, 4.5+ rating, 90%+ completion, <5% disputes |
| Legend Partner | 50+ projects, 4.7+ rating, 95%+ completion, <3% disputes |

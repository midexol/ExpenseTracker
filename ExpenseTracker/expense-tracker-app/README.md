# Quest Log

A gamified expense tracker and quest (todo) list. Log spending, complete quests, keep your
streak alive, and unlock achievements. Built with Next.js 16 (App Router), TypeScript, Prisma +
SQLite, and real Web Push notifications — no UI framework, hand-written CSS design system.

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx tsx prisma/seed.ts   # seeds the achievement definitions
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`.

## Environment variables

Copy `.env.example` to `.env` and fill in real values:

- `DATABASE_URL` — SQLite file path, e.g. `file:./prisma/dev.db`. Swap the `provider` in
  `prisma/schema.prisma` (and the adapter in `src/lib/prisma.ts`) if you'd rather point this at
  Postgres/MySQL for production.
- `SESSION_SECRET` — random string used to sign session JWTs.
- `CRON_SECRET` — random string; the reminders cron endpoint requires this as a bearer token.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with
  `npx web-push generate-vapid-keys`.

## Reminders

`/api/cron/reminders` checks every user with an active push subscription and sends:

- a nudge if they have quests due today/overdue, and
- a nudge in the evening (local time) if they haven't logged any spending yet that day.

It's guarded by `CRON_SECRET` (sent as `Authorization: Bearer <secret>`). `vercel.json` wires up
an hourly Vercel Cron job hitting this route in production. If you're not on Vercel, point any
external scheduler (cron-job.org, GitHub Actions, etc.) at the same URL with that header.

## Design

The UI is a hand-built "HUD" theme (cut-corner panels, flat accent colors, no gradients, no
component library) living in `src/components/ui` and `src/app/globals.css`. Gamification logic
(XP curve, streaks, achievement checks) is centralized in `src/lib/gamification.ts`.

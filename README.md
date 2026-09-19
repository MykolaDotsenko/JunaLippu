# JunaLippu

JunaLippu is a full-stack railway-booking portfolio app for searching Finnish train journeys, choosing an available seat, authenticating with Google, and creating a reservation.

The current product scope is intentionally focused: **one-way journeys for one passenger**. The goal is a short, reliable booking flow rather than exposing incomplete features.

## Stack

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- tRPC + Zod
- Prisma ORM
- SQLite
- NextAuth with Google OAuth
- pnpm
- GitHub Actions CI

## Product flow

```text
Search
  ↓
Choose train
  ↓
Choose class + seat
  ↓
Review booking
  ↓
Google sign-in (if needed)
  ↓
Reservation confirmed
```

The UI is mobile-first and uses explicit loading, empty and error states throughout the booking flow.

## Reliability model

The browser never acts as the source of truth for booking price or timing.

The server:

- validates the trip and route segment;
- validates that departure occurs before arrival;
- validates that the selected seat belongs to the selected train and travel class;
- calculates the journey duration;
- calculates the price;
- creates the reservation for the authenticated user;
- prevents the same physical seat from being booked twice on the same trip;
- reloads the final confirmation from the authenticated reservation record.

A database constraint on `(trip_id, seat_id)` provides the final duplicate-booking guard.

## Demo timetable

The bundled railway CSV dataset contains historical **2024 service data**.

The search UI queries the database for available service dates after a route is selected and only enables dates that actually contain a direct demo journey.

## Architecture

```text
Next.js UI
   |
   v
tRPC client
   |
   v
Zod-validated procedures
   |
   v
Prisma ORM
   |
   v
SQLite railway database
```

The railway data model covers trains, cars, seats, routes, trips, stops, stop times, service calendars, users and reservations.

## Local setup

### Requirements

- Node.js 20+
- pnpm 9+
- SQLite 3

### Install

```bash
pnpm install
cp .env.example .env
```

Configure Google OAuth credentials in `.env`.

### Create the database

```bash
pnpm db:push
```

The historical railway CSV files are stored in `prisma/`. See `prisma/README.txt` for the legacy import instructions.

### Start

```bash
pnpm dev
```

Open http://localhost:3000.

## Authentication

Reservations require an authenticated user. Google OAuth is configured through NextAuth.

Expected environment variables:

```text
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

## Payment scope

JunaLippu does **not** collect card details or process real money.

The review screen clearly identifies this as a portfolio demo, and the final action creates only a reservation record in the application database.

## CI

Pull requests run:

```text
pnpm install
prisma validate
prisma generate
pnpm lint
pnpm build
```

## Historical context

The project started as a team learning project in 2024. The later refactor preserves the original railway domain and dataset while replacing hardcoded booking paths, fake authentication/payment UI and fixed-position layouts with a real tRPC/Prisma booking flow and responsive interface.

## Remaining production work

A real ticketing product would still require:

- segment-aware seat inventory for partially overlapping journeys;
- reservation holds and expiry semantics;
- transactional payment integration;
- automated unit, integration and end-to-end tests;
- accessibility testing with axe and assistive technologies;
- observability and audit logging;
- production database migrations and deployment infrastructure.

## Disclaimer

JunaLippu is an educational portfolio project and is not affiliated with VR Group or any railway operator.

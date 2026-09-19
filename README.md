# JunaLippu

JunaLippu is a full-stack railway booking demo for searching Finnish train journeys, selecting an available seat, authenticating with Google, and creating a reservation.

## Stack

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- tRPC + Zod
- Prisma ORM
- SQLite
- NextAuth with Google OAuth
- pnpm

## Architecture

```text
Browser UI
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

## Booking flow

1. Load stations from the database.
2. Select departure/arrival stations and date.
3. Search compatible trips.
4. Select travel class.
5. Load seats that are not already reserved for the selected trip.
6. Authenticate with Google.
7. Create the reservation.

A database constraint on `(trip_id, seat_id)` prevents the same physical seat from being reserved twice on the same trip.

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

This is a portfolio/demo application. It creates a real booking record in the application database, but it does **not** process real money or collect card data.

## Data integrity

The current implementation validates:

- departure and arrival are different points on the same trip;
- departure occurs before arrival;
- the requested seat exists;
- reservation creation requires an authenticated user;
- a seat cannot be booked twice for the same trip.

## Historical context

The project started as a team learning project in 2024. The production-readiness refactor keeps the original railway domain and dataset while replacing hardcoded booking paths with the actual tRPC/Prisma backend.

## Remaining production work

Before using a system like this for real ticket sales, it would still need:

- segment-aware seat inventory for overlapping partial journeys;
- transactional payment integration;
- stronger booking expiry/hold semantics;
- automated unit/integration/E2E tests;
- observability and audit logging;
- production database migrations and deployment infrastructure.

## Disclaimer

JunaLippu is an educational portfolio project and is not affiliated with VR Group or any railway operator.

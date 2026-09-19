# JunaLippu

JunaLippu is a full-stack railway-booking portfolio application for searching Finnish train journeys, choosing an available seat, authenticating with Google, and creating a reservation.

The product scope is intentionally focused: **one-way journeys for one passenger**. The goal is a short, reliable booking flow rather than exposing incomplete features.

## Stack

- Next.js 15.5 + React 18 + TypeScript
- Tailwind CSS
- tRPC 11 + TanStack Query 5 + Zod
- Prisma ORM 6
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

The UI is mobile-first and has explicit loading, empty, invalid-link and error recovery states throughout the booking flow.

## Reliability model

The browser is never the source of truth for booking-critical data.

The server:

- resolves the selected trip and route segment;
- validates that departure occurs before arrival;
- loads journey time, service date and train details from the database;
- validates that the selected seat belongs to the selected train and travel class;
- re-checks seat availability on review and reservation;
- calculates journey duration;
- calculates money in integer cents;
- creates the reservation for the authenticated user;
- reloads the confirmation from the authenticated reservation record.

### Segment-aware seat inventory

Seat occupancy is represented by `ReservationSegment` rows.

A database unique constraint on:

```text
trip_id + seat_id + stop_sequence
```

prevents overlapping reservations even under concurrent requests.

This also allows the same physical seat to be reused later on the same train when journey segments do not overlap.

## Demo timetable

The bundled railway CSV dataset contains historical sample data.

Each `Trip` now has an explicit `service_date`; application logic no longer derives dates from the format of `trip_id`.

The search UI queries the database for available service dates after a route is selected and only enables dates that contain a direct demo journey.

## Architecture

```text
Next.js Pages UI
   |
   v
tRPC 11 client
   |
   v
Zod-validated procedures
   |
   v
Booking/search domain logic
   |
   v
Prisma ORM
   |
   v
SQLite
```

The architecture intentionally stays small. Domain invariants live near the booking/search procedures instead of being split across unnecessary repository/facade/service layers.

## Local setup

### Requirements

- Node.js 22 recommended
- pnpm 9+
- SQLite 3

### Install

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Configure Google OAuth credentials in `.env`.

Production configuration fails fast when required authentication secrets are missing.

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

## Tests

Pure domain utilities:

```bash
pnpm test
```

Database booking invariants and tRPC booking integration:

```bash
pnpm exec prisma db push --force-reset
pnpm test:db
pnpm test:integration
```

The database invariant suite verifies that overlapping seat reservations are rejected while the same seat can be reused on a later non-overlapping segment.

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

Pull requests and pushes to `main` verify:

```text
pnpm install --frozen-lockfile
prisma validate
prisma generate
prisma db push --force-reset
unit tests
database invariant tests
booking integration tests
eslint
next build
```

## Historical context

The project started as a team learning project in 2024. The later refactors preserve the original railway domain and dataset while replacing hardcoded booking paths, fake authentication/payment UI, fixed-position layouts and implicit data conventions with a typed, responsive and database-backed booking flow.

## Remaining real-production work

A commercial ticketing system would still require:

- temporary reservation holds and expiry semantics;
- transactional payment integration;
- browser-level end-to-end and accessibility regression tests;
- observability, audit logging and alerting;
- production migration/deployment infrastructure;
- a production-grade database rather than SQLite.

## Disclaimer

JunaLippu is an educational portfolio project and is not affiliated with VR Group or any railway operator.

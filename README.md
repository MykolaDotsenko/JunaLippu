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
Search                /
  ↓
Choose train          /trains
  ↓
Choose class + seat   /seats
  ↓
Review booking        /review
  ↓
Google sign-in (if needed)
  ↓
Reservation confirmed /confirmation
  ↓
Past reservations     /bookings
```

The earlier PascalCase routes (`/BookingJourney`, `/Journey`, `/ReviewBooking`,
`/BookingSuccess`) permanently redirect to the routes above, so links shared
before the rename still resolve.

The UI is mobile-first and has explicit loading, empty, invalid-link and error recovery states throughout the booking flow.

## Reliability model

The browser is never the source of truth for booking-critical data.

The server:

- resolves the selected trip and route segment;
- validates that departure occurs before arrival;
- loads journey time, service date and train details from the database;
- validates that the selected seat belongs to the selected train and travel class;
- re-checks seat availability on review and reservation;
- calculates journey duration, including journeys that run past midnight;
- calculates money in integer cents;
- creates the reservation for the authenticated user;
- reloads the confirmation from the authenticated reservation record;
- scopes every reservation read to the authenticated owner.

### Segment-aware seat inventory

Seat occupancy is represented by `ReservationSegment` rows.

A database unique constraint on:

```text
trip_id + seat_id + stop_sequence
```

prevents overlapping reservations even under concurrent requests.

This also allows the same physical seat to be reused later on the same train when journey segments do not overlap.

The constraint — not the availability check — is what makes concurrency safe: a
unique-violation from a racing request is translated into a seat conflict, and
an integration test reserves the same seat twice in parallel to prove exactly
one booking survives.

### Repeated station calls

A trip may call at the same station twice (loop and turnaround services), so a
single station lookup is ambiguous. Search and booking pair the earliest
departure that still has a later arrival, which keeps the journey deterministic
and always directionally valid.

## Demo timetable

The bundled railway CSV dataset contains historical sample data.

Each `Trip` now has an explicit `service_date`; application logic no longer derives dates from the format of `trip_id`.

The search UI queries the database for available service dates after a route is selected, only enables dates that contain a direct demo journey, opens the calendar on the first such date, and states the covered range in the form.

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

Production configuration fails fast when required authentication secrets are
missing. In development the Google provider is simply not registered when its
credentials are absent, and the reason is logged.

### Create the database

```bash
pnpm db:migrate
```

The schema is owned by the migrations in `prisma/migrations`. Use
`pnpm exec prisma migrate dev --name what_changed` for schema changes; CI fails
when `schema.prisma` and the migrations disagree.

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

Static checks:

```bash
pnpm typecheck
pnpm format:check
pnpm lint
```

Database booking invariants and tRPC booking/search integration:

```bash
pnpm db:migrate
pnpm test:db
pnpm test:integration
```

These suites take over the database named by `DATABASE_URL`.

Mobile browser smoke/E2E:

```bash
node tests/e2e-seed.mjs
pnpm exec playwright install chromium
pnpm test:e2e
```

The database invariant suite verifies that overlapping seat reservations are rejected while the same seat can be reused on a later non-overlapping segment.

The integration suites additionally cover reservation ownership, pagination,
unauthenticated access, invalid and reversed segments, loop services, overnight
journeys and concurrent booking of the same seat.

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
prisma migrate deploy
migration/schema drift check
tsc --noEmit
prettier --check
eslint
unit tests
database invariant tests
booking and search integration tests
next build
mobile Chromium E2E
```

## Historical context

The project started as a team learning project in 2024. The later refactors preserve the original railway domain and dataset while replacing hardcoded booking paths, fake authentication/payment UI, fixed-position layouts and implicit data conventions with a typed, responsive and database-backed booking flow.

## Remaining real-production work

A commercial ticketing system would still require:

- temporary reservation holds and expiry semantics;
- reservation cancellation and refund handling;
- transactional payment integration;
- automated accessibility regression tests;
- log aggregation, tracing, alerting and audit trails on top of the structured
  request logging that exists today;
- deployment infrastructure and a production-grade database rather than SQLite;
- multi-passenger and return journeys, and localisation beyond English.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the setup, the checks to run before
a pull request and the rules that any change to the booking path has to respect.

## License

[MIT](LICENSE).

## Disclaimer

JunaLippu is an educational portfolio project and is not affiliated with VR Group or any railway operator.

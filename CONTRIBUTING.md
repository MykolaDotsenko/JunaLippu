# Contributing

JunaLippu is a portfolio project, but it is maintained like a small production
service: every change ships with the checks that protect the booking
invariants.

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm setup
pnpm dev
```

Node.js 22 and pnpm 9 are expected. Google OAuth credentials are optional in
development — sign-in is disabled and the reason is logged when they are
missing.

## Before opening a pull request

Run the same checks CI runs:

```bash
pnpm typecheck
pnpm format:check   # pnpm format rewrites
pnpm lint
pnpm test
pnpm test:db
pnpm test:integration
pnpm build
```

Browser tests need a production build:

```bash
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Database, integration, and browser suites create their own temporary SQLite
database. They never reuse the `DATABASE_URL` from your normal development
environment, and destructive helpers refuse to run outside the repository test
runner.

## Database changes

The schema is owned by `prisma/migrations`, not by `prisma db push`.

```bash
pnpm exec prisma migrate dev --name what_changed
```

CI compares the migrated database against `prisma/schema.prisma` and fails when
they differ, so a schema edit without its migration cannot merge.

## Where the rules live

Booking invariants belong next to the tRPC procedures in
`src/server/api/routers/`, and anything that can be decided without I/O belongs
in `src/server/api/lib/journey.ts` so it can be unit tested.

Two rules carry the product:

- the browser is never trusted for booking-critical data — the server resolves
  the trip, segment, seat, class and price itself;
- seat occupancy is enforced by the `trip_id + seat_id + stop_sequence` unique
  constraint, not by an availability check alone.

A change that touches either needs a test that would fail without it.

Changes to the bundled CSV data or home-page quick-start routes also need the
dataset-contract suite to stay green. Do not rely only on synthetic fixtures
for timetable assumptions.

## Frontend conventions

**The URL owns anything a user could share, bookmark or restore.** Route,
service date, travel class and seat all live in the query string; components
read them from `router.query` and write them back with `router.replace(...,
{ shallow: true })`. Do not mirror them into `useState` and re-sync with an
effect — see React's ["You Might Not Need an
Effect"](https://react.dev/learn/you-might-not-need-an-effect).

**Cache lifetime is a decision, not a default.** Seat availability is fetched
with `staleTime: 0` because a stale seat map sells a taken seat. The station
list, service dates, timetables and fares come from a fixed dataset and use
`staleTime: Infinity`. A query with neither is a query nobody has thought
about.

**A fare is not a seat.** `booking.getQuote` prices a journey for a class;
`booking.getReview` validates a specific seat before the commit. Keeping them
apart is what stops every seat click costing a round trip.

**Mutually exclusive choices are radio groups.** Travel class and seat
selection use `role="radiogroup"` with `useRadioGroup`, which implements the
roving tabindex and arrow-key behaviour from the [WAI-ARIA Authoring
Practices](https://www.w3.org/WAI/ARIA/apg/patterns/radio/). `aria-pressed`
describes an independent toggle and is wrong for a one-of-many choice.

**Layout.** `src/components/` holds shared components, `src/components/<route>/`
route-scoped ones, `src/hooks/` reusable hooks, and `src/utils/` framework-free
helpers. Components are plain functions with typed props, not `React.FC`.

**Client bundles.** Importing `~/env` into a component pulls zod into every
client bundle. Read `NEXT_PUBLIC_*` values from `process.env` in client code;
Next.js inlines them at build time.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):

```text
feat: add reservation list
fix: pair loop-service stops deterministically
test: cover search router procedures
docs: document migration workflow
```

Keep one logical change per commit, and rebase rather than pile up repeated
"fix" commits with the same message.

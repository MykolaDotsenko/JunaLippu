# Contributing

JunaLippu is a portfolio project, but it is maintained like a small production
service: every change ships with the checks that protect the booking
invariants.

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:migrate
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

Browser tests need a built app and a seeded database:

```bash
node tests/e2e-seed.mjs
pnpm exec playwright install chromium
pnpm test:e2e
```

The integration and browser suites take over the database named by
`DATABASE_URL`. Point it at a scratch file rather than a database whose
contents you care about.

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

Database and demo timetable

Recommended setup

1) Apply the migration history:
   pnpm db:migrate

2) Load the bundled historical demo timetable:
   pnpm db:seed

Or run both:
   pnpm setup

The seed uses Prisma directly, is idempotent for an already-complete demo
dataset, and refuses to overwrite a partially populated or unrelated railway
database.

The schema is owned by prisma/migrations. Do not use prisma db push as the
normal workflow because it changes the schema without recording a migration.

Existing databases

For a database that predates the migration history, verify it matches
prisma/schema.prisma before recording the baseline:

   pnpm exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code

Only when that reports no drift:

   pnpm exec prisma migrate resolve --applied 0_init
   pnpm db:migrate

CSV dataset

The historical source files remain in prisma/*.csv:

1_Train.csv
2_Car.csv
3_Seat.csv
4_Train_composition.csv
5_Trip.csv
6_Route.csv
7_Stop_time.csv
8_Stop.csv
9_Calendar.csv

Trip rows use:
   trip_id,route_id,service_id,service_date

Seat.csv is a legacy five-column source and still contains an obsolete third
availability column. The application seed intentionally ignores that legacy
column and maps the remaining values into the current four-field Seat model.

For that reason direct sqlite3 ".import ... Seat" is no longer a supported
setup path. Use pnpm db:seed so the legacy source format is translated and the
resulting row counts are verified.

Authentication and reservation tables, including ReservationSegment, are not
part of the CSV dataset. They are populated by application usage.

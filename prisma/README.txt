Database setup

1) Create/update the SQLite schema:
   pnpm db:migrate

   The schema is owned by prisma/migrations. Do not use `prisma db push`:
   it applies the schema without recording a migration, and CI fails when
   the database and prisma/schema.prisma disagree.

   For a database that predates the migrations (created with `db push` or
   by the CSV import below), record the baseline once first:
   pnpm exec prisma migrate resolve --applied 0_init

2) Generate Prisma Client:
   pnpm prisma generate

3) Optional: inspect the database:
   pnpm prisma studio

Legacy CSV import

The railway dataset is stored in prisma/*.csv. The Trip CSV now has four columns:

trip_id,route_id,service_id,service_date

where service_date is an explicit YYYY-MM-DD value used by application queries.

To import with sqlite3:

1) Open the prisma directory.
2) Start sqlite3 and open db.sqlite.
3) Enable CSV mode:
   .mode csv
4) Import in dependency order:

.import path/prisma/1_Train.csv Train
.import path/prisma/2_Car.csv Car
.import path/prisma/3_Seat.csv Seat
.import path/prisma/4_Train_composition.csv Train_composition
.import path/prisma/6_Route.csv Route
.import path/prisma/9_Calendar.csv Calendar
.import path/prisma/5_Trip.csv Trip
.import path/prisma/8_Stop.csv Stop
.import path/prisma/7_Stop_time.csv Stop_time

Authentication/reservation tables and ReservationSegment are intentionally empty after dataset import. They are populated by application usage.

For automated CI tests the repository uses a fresh SQLite database created with:
   pnpm db:migrate

import assert from "node:assert/strict";
import test from "node:test";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3(
  { url: process.env.DATABASE_URL ?? "file:./ci.db" },
  { timestampFormat: "unixepoch-ms" },
);
const db = new PrismaClient({ adapter });

const reset = async () => {
  await db.reservationSegment.deleteMany();
  await db.reservation.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
  await db.stop_time.deleteMany();
  await db.trip.deleteMany();
  await db.route.deleteMany();
  await db.train_composition.deleteMany();
  await db.seat.deleteMany();
  await db.car.deleteMany();
  await db.train.deleteMany();
  await db.stop.deleteMany();
  await db.calendar.deleteMany();
};

test("segment uniqueness prevents overlapping double booking but allows reuse later", async () => {
  await reset();

  const user = await db.user.create({ data: { email: "test@example.com" } });
  await db.calendar.create({
    data: {
      service_id: "svc",
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  });
  await db.train.create({ data: { train_id: 1, train_number: "IC1" } });
  await db.car.create({ data: { car_id: 1 } });
  await db.seat.create({
    data: { seat_id: 1, seat_number: 7, car_id: 1, travel_class: 2 },
  });
  await db.train_composition.create({
    data: { train_id: 1, car_id: 1, car_number: 1 },
  });
  await db.route.create({
    data: { route_id: "route", route_long_name: "A-B-C", train_id: 1 },
  });
  await db.trip.create({
    data: {
      trip_id: "trip",
      route_id: "route",
      service_id: "svc",
      service_date: "2024-05-06",
    },
  });
  await Promise.all([
    db.stop.create({ data: { stop_id: "A", stop_name: "A" } }),
    db.stop.create({ data: { stop_id: "B", stop_name: "B" } }),
    db.stop.create({ data: { stop_id: "C", stop_name: "C" } }),
  ]);

  const reservation = await db.reservation.create({
    data: {
      user_id: user.id,
      seat_id: 1,
      trip_id: "trip",
      dep_stop_id: "A",
      arriv_stop_id: "B",
      price_cents: 1000,
      departure_time: "10:00:00",
      arrival_time: "11:00:00",
      segments: {
        create: [{ trip_id: "trip", seat_id: 1, stop_sequence: 0 }],
      },
    },
  });

  assert.ok(reservation.reservation_id > 0);

  await assert.rejects(
    db.reservation.create({
      data: {
        user_id: user.id,
        seat_id: 1,
        trip_id: "trip",
        dep_stop_id: "A",
        arriv_stop_id: "B",
        price_cents: 1000,
        departure_time: "10:00:00",
        arrival_time: "11:00:00",
        segments: {
          create: [{ trip_id: "trip", seat_id: 1, stop_sequence: 0 }],
        },
      },
    }),
    (error) =>
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002",
  );

  const laterReservation = await db.reservation.create({
    data: {
      user_id: user.id,
      seat_id: 1,
      trip_id: "trip",
      dep_stop_id: "B",
      arriv_stop_id: "C",
      price_cents: 1000,
      departure_time: "11:05:00",
      arrival_time: "12:00:00",
      segments: {
        create: [{ trip_id: "trip", seat_id: 1, stop_sequence: 1 }],
      },
    },
  });

  assert.ok(laterReservation.reservation_id > reservation.reservation_id);
});

test.after(async () => {
  await reset();
  await db.$disconnect();
});

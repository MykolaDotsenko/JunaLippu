import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";

import { createCaller } from "../src/server/api/root";
import { db } from "../src/server/db";

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

const seed = async () => {
  await reset();

  const user = await db.user.create({
    data: { email: "booking-integration@example.com" },
  });

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
    db.stop.create({ data: { stop_id: "A", stop_name: "Alpha" } }),
    db.stop.create({ data: { stop_id: "B", stop_name: "Beta" } }),
    db.stop.create({ data: { stop_id: "C", stop_name: "Gamma" } }),
  ]);

  await Promise.all([
    db.stop_time.create({
      data: {
        trip_id: "trip",
        stop_id: "A",
        arrival_time: "10:00:00",
        departure_time: "10:00:00",
        stop_sequence: 0,
      },
    }),
    db.stop_time.create({
      data: {
        trip_id: "trip",
        stop_id: "B",
        arrival_time: "11:00:00",
        departure_time: "11:05:00",
        stop_sequence: 1,
      },
    }),
    db.stop_time.create({
      data: {
        trip_id: "trip",
        stop_id: "C",
        arrival_time: "12:00:00",
        departure_time: "12:00:00",
        stop_sequence: 2,
      },
    }),
  ]);

  return user;
};

void test("booking procedures enforce segment availability end to end", async () => {
  const user = await seed();
  const caller = createCaller({
    db,
    session: {
      user: {
        id: user.id,
        email: user.email,
        name: null,
        image: null,
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    },
  });

  const firstLeg = {
    seat_id: 1,
    trip_id: "trip",
    dep_stop_id: "A",
    arriv_stop_id: "B",
    travel_class: 2 as const,
  };

  const review = await caller.booking.getReview(firstLeg);
  assert.equal(review.departure_stop_name, "Alpha");
  assert.equal(review.arrival_stop_name, "Beta");
  assert.equal(review.service_date, "2024-05-06");
  assert.equal(review.seat_number, 7);
  assert.ok(review.price > 0);

  const reservation = await caller.booking.createReservation(firstLeg);
  assert.ok(reservation.reservation_id > 0);

  await assert.rejects(
    caller.booking.getReview(firstLeg),
    (error) =>
      error instanceof TRPCError &&
      error.code === "CONFLICT",
  );

  const secondLegReview = await caller.booking.getReview({
    ...firstLeg,
    dep_stop_id: "B",
    arriv_stop_id: "C",
  });
  assert.equal(secondLegReview.departure_stop_name, "Beta");
  assert.equal(secondLegReview.arrival_stop_name, "Gamma");
});

void test.after(async () => {
  await reset();
  await db.$disconnect();
});

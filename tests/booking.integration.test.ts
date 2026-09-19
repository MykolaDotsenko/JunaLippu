import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";
import { type Session } from "next-auth";

import { createCaller } from "../src/server/api/root";
import { db } from "../src/server/db";
import {
  createCalendar,
  createStops,
  createTrain,
  createTrip,
  passingCall,
  resetDatabase,
} from "./support/railway";

const sessionFor = (userId: string): Session => ({
  user: { id: userId, email: null, name: null, image: null },
  expires: new Date(Date.now() + 60_000).toISOString(),
});

const callerFor = (userId: string | null) =>
  createCaller({ db, session: userId ? sessionFor(userId) : null });

const seed = async () => {
  await resetDatabase();

  const [user, otherUser] = await Promise.all([
    db.user.create({ data: { email: "booking-integration@example.com" } }),
    db.user.create({ data: { email: "someone-else@example.com" } }),
  ]);

  await createCalendar("svc");
  await createStops([
    { id: "A", name: "Alpha" },
    { id: "B", name: "Beta" },
    { id: "C", name: "Gamma" },
  ]);
  await createTrain({
    trainId: 1,
    trainNumber: "IC1",
    routeId: "route",
    cars: [
      {
        carId: 1,
        carNumber: 1,
        seats: [
          { seatId: 1, seatNumber: 7, travelClass: 2 },
          { seatId: 2, seatNumber: 8, travelClass: 2 },
          { seatId: 3, seatNumber: 1, travelClass: 1 },
        ],
      },
    ],
  });
  await createTrip({
    tripId: "trip",
    routeId: "route",
    serviceId: "svc",
    serviceDate: "2024-05-06",
    calls: [
      passingCall("A", "10:00:00", 0),
      { stopId: "B", arrival: "11:00:00", departure: "11:05:00", sequence: 1 },
      passingCall("C", "12:00:00", 2),
    ],
  });

  return { user, otherUser };
};

const firstLeg = {
  seat_id: 1,
  trip_id: "trip",
  dep_stop_id: "A",
  arriv_stop_id: "B",
  travel_class: 2 as const,
};

const isTRPCErrorWithCode = (code: TRPCError["code"]) => (error: unknown) =>
  error instanceof TRPCError && error.code === code;

void test("booking procedures enforce segment availability end to end", async () => {
  const { user } = await seed();
  const caller = callerFor(user.id);

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
    isTRPCErrorWithCode("CONFLICT"),
  );

  const secondLegReview = await caller.booking.getReview({
    ...firstLeg,
    dep_stop_id: "B",
    arriv_stop_id: "C",
  });
  assert.equal(secondLegReview.departure_stop_name, "Beta");
  assert.equal(secondLegReview.arrival_stop_name, "Gamma");
});

void test("getQuote prices a journey without naming a seat", async () => {
  const { user } = await seed();
  const caller = callerFor(user.id);

  const segment = {
    trip_id: "trip",
    dep_stop_id: "A",
    arriv_stop_id: "B",
  };

  const second = await caller.booking.getQuote({
    ...segment,
    travel_class: 2 as const,
  });
  assert.equal(second.departure_stop_name, "Alpha");
  assert.equal(second.arrival_stop_name, "Beta");
  assert.equal(second.service_date, "2024-05-06");
  assert.equal(second.travel_class, 2);
  assert.ok(second.price > 0);

  const first = await caller.booking.getQuote({
    ...segment,
    travel_class: 1 as const,
  });
  assert.ok(first.price > second.price);

  // The quote must not change once a seat in that class is taken, because the
  // fare does not depend on which seat is picked.
  await caller.booking.createReservation(firstLeg);
  const afterBooking = await caller.booking.getQuote({
    ...segment,
    travel_class: 2 as const,
  });
  assert.equal(afterBooking.price, second.price);
});

void test("getQuote rejects the same invalid segments as the rest of the API", async () => {
  await seed();
  const caller = callerFor(null);

  await assert.rejects(
    caller.booking.getQuote({
      trip_id: "trip",
      dep_stop_id: "C",
      arriv_stop_id: "A",
      travel_class: 2 as const,
    }),
    isTRPCErrorWithCode("BAD_REQUEST"),
  );
  await assert.rejects(
    caller.booking.getQuote({
      trip_id: "nope",
      dep_stop_id: "A",
      arriv_stop_id: "B",
      travel_class: 2 as const,
    }),
    isTRPCErrorWithCode("NOT_FOUND"),
  );
});

void test("a reserved seat disappears from the seat map for overlapping legs", async () => {
  const { user } = await seed();
  const caller = callerFor(user.id);

  const segment = {
    trip_id: "trip",
    dep_stop_id: "A",
    arriv_stop_id: "C",
    travel_class: 2 as const,
  };

  const before = await caller.booking.getSeat(segment);
  assert.deepEqual(
    before.map((seat) => seat.seat_id),
    [1, 2],
  );

  await caller.booking.createReservation(firstLeg);

  const after = await caller.booking.getSeat(segment);
  assert.deepEqual(
    after.map((seat) => seat.seat_id),
    [2],
  );

  const onward = await caller.booking.getSeat({
    ...segment,
    dep_stop_id: "B",
  });
  assert.deepEqual(
    onward.map((seat) => seat.seat_id).sort((a, b) => a - b),
    [1, 2],
  );
});

void test("invalid segments are rejected before any reservation is created", async () => {
  const { user } = await seed();
  const caller = callerFor(user.id);

  await assert.rejects(
    caller.booking.getReview({
      ...firstLeg,
      dep_stop_id: "C",
      arriv_stop_id: "A",
    }),
    isTRPCErrorWithCode("BAD_REQUEST"),
  );

  await assert.rejects(
    caller.booking.getReview({ ...firstLeg, arriv_stop_id: "A" }),
    isTRPCErrorWithCode("BAD_REQUEST"),
  );

  await assert.rejects(
    caller.booking.getReview({ ...firstLeg, seat_id: 3 }),
    isTRPCErrorWithCode("BAD_REQUEST"),
  );

  await assert.rejects(
    caller.booking.getReview({ ...firstLeg, trip_id: "nope" }),
    isTRPCErrorWithCode("NOT_FOUND"),
  );
  await assert.rejects(
    caller.booking.getReview({ ...firstLeg, seat_id: 4242 }),
    isTRPCErrorWithCode("NOT_FOUND"),
  );

  assert.equal(await db.reservation.count(), 0);
  assert.equal(await db.reservationSegment.count(), 0);
});

void test("reservations require authentication", async () => {
  await seed();

  await assert.rejects(
    callerFor(null).booking.createReservation(firstLeg),
    isTRPCErrorWithCode("UNAUTHORIZED"),
  );
  await assert.rejects(
    callerFor(null).booking.listReservations({}),
    isTRPCErrorWithCode("UNAUTHORIZED"),
  );

  assert.equal(await db.reservation.count(), 0);
});

void test("a reservation is only readable by the user who created it", async () => {
  const { user, otherUser } = await seed();

  const reservation = await callerFor(user.id).booking.createReservation(
    firstLeg,
  );

  const owned = await callerFor(user.id).booking.getReservation({
    reservation_id: reservation.reservation_id,
  });
  assert.equal(owned.reservation_id, reservation.reservation_id);

  await assert.rejects(
    callerFor(otherUser.id).booking.getReservation({
      reservation_id: reservation.reservation_id,
    }),
    isTRPCErrorWithCode("NOT_FOUND"),
  );
});

void test("listReservations returns only the caller's reservations, newest first", async () => {
  const { user, otherUser } = await seed();
  const caller = callerFor(user.id);

  const first = await caller.booking.createReservation(firstLeg);
  const second = await caller.booking.createReservation({
    ...firstLeg,
    dep_stop_id: "B",
    arriv_stop_id: "C",
  });
  await callerFor(otherUser.id).booking.createReservation({
    ...firstLeg,
    seat_id: 2,
  });

  const mine = await caller.booking.listReservations({});
  assert.deepEqual(
    mine.items.map((item) => item.reservation_id),
    [second.reservation_id, first.reservation_id],
  );
  assert.equal(mine.nextCursor, null);
  assert.equal(mine.items[0]?.departure_stop_name, "Beta");
  assert.equal(mine.items[0]?.seat_number, 7);

  const theirs = await callerFor(otherUser.id).booking.listReservations({});
  assert.equal(theirs.items.length, 1);
});

void test("listReservations pages through results with a cursor", async () => {
  const { user } = await seed();
  const caller = callerFor(user.id);

  const first = await caller.booking.createReservation(firstLeg);
  const second = await caller.booking.createReservation({
    ...firstLeg,
    dep_stop_id: "B",
    arriv_stop_id: "C",
  });

  const page1 = await caller.booking.listReservations({ limit: 1 });
  assert.deepEqual(
    page1.items.map((item) => item.reservation_id),
    [second.reservation_id],
  );
  assert.equal(page1.nextCursor, first.reservation_id);

  const page2 = await caller.booking.listReservations({
    limit: 1,
    cursor: page1.nextCursor,
  });
  assert.deepEqual(
    page2.items.map((item) => item.reservation_id),
    [first.reservation_id],
  );
  assert.equal(page2.nextCursor, null);
});

void test("concurrent reservations for the same seat produce exactly one booking", async () => {
  const { user, otherUser } = await seed();

  const results = await Promise.allSettled([
    callerFor(user.id).booking.createReservation(firstLeg),
    callerFor(otherUser.id).booking.createReservation(firstLeg),
  ]);

  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.ok(
    rejected[0]?.status === "rejected" &&
      isTRPCErrorWithCode("CONFLICT")(rejected[0].reason),
    "the losing request must be reported as a seat conflict",
  );

  assert.equal(await db.reservation.count(), 1);
  assert.equal(await db.reservationSegment.count({ where: { seat_id: 1 } }), 1);
});

void test.after(async () => {
  await resetDatabase();
  await db.$disconnect();
});

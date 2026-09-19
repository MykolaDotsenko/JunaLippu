import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";

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

const caller = createCaller({ db, session: null });

const HELSINKI = "SH";
const TAMPERE = "ST";
const OULU = "SO";
const KUOPIO = "SK";

const seed = async () => {
  await resetDatabase();

  await createCalendar("search-svc");
  await createStops([
    { id: HELSINKI, name: "Helsinki" },
    { id: TAMPERE, name: "Tampere" },
    { id: OULU, name: "Oulu" },
    { id: KUOPIO, name: "Kuopio" },
  ]);

  await createTrain({
    trainId: 11,
    trainNumber: "IC11",
    routeId: "search-route",
    cars: [
      {
        carId: 11,
        carNumber: 1,
        seats: [{ seatId: 11, seatNumber: 1, travelClass: 2 }],
      },
    ],
  });

  const calls = [
    passingCall(HELSINKI, "7:00:00", 0),
    passingCall(TAMPERE, "09:00:00", 1),
    passingCall(OULU, "13:00:00", 2),
  ];

  await createTrip({
    tripId: "morning-06",
    routeId: "search-route",
    serviceId: "search-svc",
    serviceDate: "2024-05-06",
    calls,
  });

  await createTrip({
    tripId: "evening-06",
    routeId: "search-route",
    serviceId: "search-svc",
    serviceDate: "2024-05-06",
    calls: [
      passingCall(HELSINKI, "21:00:00", 0),
      passingCall(TAMPERE, "23:00:00", 1),
      passingCall(OULU, "27:00:00", 2),
    ],
  });

  await createTrip({
    tripId: "morning-07",
    routeId: "search-route",
    serviceId: "search-svc",
    serviceDate: "2024-05-07",
    calls,
  });

  await createTrip({
    tripId: "loop-08",
    routeId: "search-route",
    serviceId: "search-svc",
    serviceDate: "2024-05-08",
    calls: [
      passingCall(HELSINKI, "08:00:00", 0),
      passingCall(KUOPIO, "10:00:00", 1),
      passingCall(HELSINKI, "12:00:00", 2),
    ],
  });
};

void test("getStationName lists every station alphabetically", async () => {
  await seed();

  const stations = await caller.search.getStationName();
  assert.deepEqual(
    stations.map((station) => station.stop_name),
    ["Helsinki", "Kuopio", "Oulu", "Tampere"],
  );
});

void test("getAvailableDates returns sorted, de-duplicated service dates", async () => {
  await seed();

  const dates = await caller.search.getAvailableDates({
    dep_stop_id: HELSINKI,
    arriv_stop_id: OULU,
  });

  assert.deepEqual(dates, ["2024-05-06", "2024-05-07"]);
});

void test("getAvailableDates ignores the reverse direction", async () => {
  await seed();

  const dates = await caller.search.getAvailableDates({
    dep_stop_id: OULU,
    arriv_stop_id: HELSINKI,
  });

  assert.deepEqual(dates, []);
});

void test("getAvailableDates finds legs that only a loop service provides", async () => {
  await seed();

  const outbound = await caller.search.getAvailableDates({
    dep_stop_id: HELSINKI,
    arriv_stop_id: KUOPIO,
  });
  assert.deepEqual(outbound, ["2024-05-08"]);

  const inbound = await caller.search.getAvailableDates({
    dep_stop_id: KUOPIO,
    arriv_stop_id: HELSINKI,
  });
  assert.deepEqual(inbound, ["2024-05-08"]);
});

void test("getAvailableDates rejects a route to the same station", async () => {
  await seed();

  await assert.rejects(
    caller.search.getAvailableDates({
      dep_stop_id: HELSINKI,
      arriv_stop_id: HELSINKI,
    }),
    (error) => error instanceof TRPCError && error.code === "BAD_REQUEST",
  );
});

void test("getSchedule returns priced journeys ordered by departure time", async () => {
  await seed();

  const schedule = await caller.search.getSchedule({
    dep_stop_id: HELSINKI,
    arriv_stop_id: OULU,
    travel_date: "2024-05-06",
  });

  assert.deepEqual(
    schedule.map((trip) => trip.trip_id),
    ["morning-06", "evening-06"],
  );

  const [morning, evening] = schedule;

  assert.equal(morning?.train_number, "IC11");
  assert.equal(morning?.departure_time, "7:00:00");
  assert.equal(morning?.arrival_time, "13:00:00");
  assert.equal(morning?.duration_seconds, 21600);
  assert.equal(morning?.duration, "6 h 00 min");
  assert.ok((morning?.min_price ?? 0) > 0);

  assert.equal(evening?.arrival_time, "27:00:00");
  assert.equal(evening?.duration_seconds, 21600);
  assert.equal(evening?.min_price, morning?.min_price);
});

void test("getSchedule returns nothing for a date without a direct journey", async () => {
  await seed();

  const schedule = await caller.search.getSchedule({
    dep_stop_id: HELSINKI,
    arriv_stop_id: OULU,
    travel_date: "2024-05-08",
  });

  assert.deepEqual(schedule, []);
});

void test("getSchedule ignores trips travelled in the wrong direction", async () => {
  await seed();

  const schedule = await caller.search.getSchedule({
    dep_stop_id: OULU,
    arriv_stop_id: TAMPERE,
    travel_date: "2024-05-06",
  });

  assert.deepEqual(schedule, []);
});

void test("getSchedule prices a partial leg lower than the full journey", async () => {
  await seed();

  const [full] = await caller.search.getSchedule({
    dep_stop_id: HELSINKI,
    arriv_stop_id: OULU,
    travel_date: "2024-05-06",
  });
  const [partial] = await caller.search.getSchedule({
    dep_stop_id: HELSINKI,
    arriv_stop_id: TAMPERE,
    travel_date: "2024-05-06",
  });

  assert.ok(full && partial);
  assert.ok(partial.min_price < full.min_price);
});

void test.after(async () => {
  await resetDatabase();
  await db.$disconnect();
});

import assert from "node:assert/strict";
import test from "node:test";

import { readCsvRows } from "../scripts/lib/csv";
import { DEMO_ROUTES } from "../src/domain/demoRoutes";
import {
  compareGtfsTimes,
  journeyDurationSeconds,
  timeToSeconds,
} from "../src/server/api/lib/journey";

const readRows = (file: string) =>
  readCsvRows(new URL(`../prisma/${file}`, import.meta.url));

const tripDates = new Map(
  readRows("5_Trip.csv").map(([tripId, , , serviceDate]) => [
    tripId ?? "",
    serviceDate ?? "",
  ]),
);

const stopNames = new Map(
  readRows("8_Stop.csv").map(([stopId, stopName]) => [
    stopId ?? "",
    stopName ?? "",
  ]),
);

type StopCall = {
  stopId: string;
  tripId: string;
  arrival: string;
  departure: string;
  sequence: number;
};

const stopCalls: StopCall[] = readRows("7_Stop_time.csv").map(
  ([stopId, tripId, arrival, departure, sequence]) => ({
    stopId: stopId ?? "",
    tripId: tripId ?? "",
    arrival: arrival ?? "",
    departure: departure ?? "",
    sequence: Number(sequence),
  }),
);


const trainIds = new Set(readRows("1_Train.csv").map(([trainId]) => trainId ?? ""));
const carIds = new Set(readRows("2_Car.csv").map(([carId]) => carId ?? ""));
const compositionRows = readRows("4_Train_composition.csv");

const callsByTrip = new Map<string, StopCall[]>();
for (const call of stopCalls) {
  const calls = callsByTrip.get(call.tripId) ?? [];
  calls.push(call);
  callsByTrip.set(call.tripId, calls);
}
for (const calls of callsByTrip.values()) {
  calls.sort((left, right) => left.sequence - right.sequence);
}

void test("legacy CSV referential anomalies stay explicit and bounded", () => {
  const orphanCompositions = compositionRows.filter(
    ([trainId, carId]) => !trainIds.has(trainId ?? "") || !carIds.has(carId ?? ""),
  );
  assert.equal(orphanCompositions.length, 2);
  assert.deepEqual(
    [...new Set(orphanCompositions.map(([trainId]) => trainId))],
    ["110002"],
  );

  const orphanStopTimes = stopCalls.filter(
    (call) => !stopNames.has(call.stopId) || !tripDates.has(call.tripId),
  );
  assert.equal(orphanStopTimes.length, 6);
  assert.deepEqual(
    [...new Set(orphanStopTimes.map((call) => call.stopId))],
    ["VKA_0"],
  );
});

void test("every shipped timetable value is valid GTFS time", () => {
  for (const call of stopCalls) {
    assert.notEqual(
      timeToSeconds(call.arrival),
      null,
      `invalid arrival time ${call.arrival} in ${call.tripId}`,
    );
    assert.notEqual(
      timeToSeconds(call.departure),
      null,
      `invalid departure time ${call.departure} in ${call.tripId}`,
    );
  }
});

void test("every quick-start route has at least one bookable service date", () => {
  for (const route of DEMO_ROUTES) {
    const dates = new Set<string>();

    for (const [tripId, calls] of callsByTrip) {
      const departures = calls.filter((call) => call.stopId === route.from);
      const arrivals = calls.filter((call) => call.stopId === route.to);

      for (const departure of departures) {
        const arrival = arrivals.find(
          (candidate) => candidate.sequence > departure.sequence,
        );
        if (!arrival) continue;

        if (
          journeyDurationSeconds(departure.departure, arrival.arrival) !== null
        ) {
          const serviceDate = tripDates.get(tripId);
          if (serviceDate) dates.add(serviceDate);
          break;
        }
      }
    }

    assert.ok(
      dates.size > 0,
      `${route.label} must have at least one valid service date`,
    );

    const [fromName, toName] = route.label.split(" → ");
    assert.equal(stopNames.get(route.from), fromName);
    assert.equal(stopNames.get(route.to), toName);
  }
});

void test("numeric GTFS ordering handles the real single-digit-hour dataset", () => {
  const sample = ["10:00:00", "14:04:00", "5:04:00", "7:04:00", "8:04:00"];

  assert.deepEqual([...sample].sort(compareGtfsTimes), [
    "5:04:00",
    "7:04:00",
    "8:04:00",
    "10:00:00",
    "14:04:00",
  ]);

  assert.ok(
    stopCalls.some((call) => /^\d:/.test(call.departure)),
    "fixture must keep exercising single-digit GTFS hours",
  );
  assert.ok(
    stopCalls.some((call) => !call.departure.endsWith(":00")),
    "fixture must keep exercising non-zero GTFS seconds",
  );
});

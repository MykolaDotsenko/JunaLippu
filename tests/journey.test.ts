import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  FIRST_CLASS_FARE_MULTIPLIER,
  journeyDurationMinutes,
  minutesToDuration,
  pickJourneyStops,
  SECOND_CLASS_FARE_CENTS_PER_HOUR,
  segmentSequences,
  timeToMinutes,
} from "../src/server/api/lib/journey";

void test("timeToMinutes parses timetable times", () => {
  assert.equal(timeToMinutes("07:25:00"), 445);
  assert.equal(timeToMinutes("09:26:00"), 566);
});

void test("minutesToDuration formats compact journey durations", () => {
  assert.equal(minutesToDuration(121), "2 h 01 min");
  assert.equal(minutesToDuration(60), "1 h 00 min");
  assert.equal(minutesToDuration(0), "0 h 00 min");
});

void test("pricing uses integer cents and class multiplier", () => {
  const secondClass = calculateJourneyPriceCents(120, 2);
  const firstClass = calculateJourneyPriceCents(120, 1);

  assert.equal(secondClass, 3840);
  assert.equal(firstClass, 5760);
  assert.equal(centsToEuros(secondClass), 38.4);
});

void test("pricing follows the published tariff constants", () => {
  assert.equal(
    calculateJourneyPriceCents(60, 2),
    SECOND_CLASS_FARE_CENTS_PER_HOUR,
  );
  assert.equal(
    calculateJourneyPriceCents(60, 1),
    Math.round(SECOND_CLASS_FARE_CENTS_PER_HOUR * FIRST_CLASS_FARE_MULTIPLIER),
  );
  assert.equal(Number.isInteger(calculateJourneyPriceCents(37, 1)), true);
});

void test("journeyDurationMinutes measures same-day journeys", () => {
  assert.equal(journeyDurationMinutes("07:25:00", "09:26:00"), 121);
  assert.equal(journeyDurationMinutes("10:00:00", "10:00:00"), 0);
});

void test("journeyDurationMinutes handles journeys past midnight", () => {
  assert.equal(journeyDurationMinutes("23:50:00", "24:30:00"), 40);
  assert.equal(journeyDurationMinutes("22:00:00", "30:00:00"), 480);
  assert.equal(journeyDurationMinutes("23:00:00", "31:00:00"), 480);
});

void test("journeyDurationMinutes rejects an arrival before its departure", () => {
  assert.equal(journeyDurationMinutes("23:50:00", "00:30:00"), null);
  assert.equal(journeyDurationMinutes("12:00:00", "11:00:00"), null);
});

void test("journeyDurationMinutes rejects unparsable times", () => {
  assert.equal(journeyDurationMinutes("not-a-time", "09:26:00"), null);
  assert.equal(journeyDurationMinutes("07:25:00", "oops"), null);
});

void test("pickJourneyStops pairs the earliest valid departure and arrival", () => {
  const journey = pickJourneyStops(
    [{ stop_sequence: 3 }],
    [{ stop_sequence: 7 }],
  );

  assert.deepEqual(journey, {
    departure: { stop_sequence: 3 },
    arrival: { stop_sequence: 7 },
  });
});

void test("pickJourneyStops rejects segments travelled in the wrong direction", () => {
  assert.equal(
    pickJourneyStops([{ stop_sequence: 9 }], [{ stop_sequence: 4 }]),
    null,
  );
  assert.equal(pickJourneyStops([{ stop_sequence: 1 }], []), null);
  assert.equal(
    pickJourneyStops([{ stop_sequence: 2 }], [{ stop_sequence: 2 }]),
    null,
  );
});

void test("pickJourneyStops stays deterministic on loop services", () => {
  const departures = [{ stop_sequence: 8 }, { stop_sequence: 2 }];
  const arrivals = [{ stop_sequence: 10 }, { stop_sequence: 5 }];

  assert.deepEqual(pickJourneyStops(departures, arrivals), {
    departure: { stop_sequence: 2 },
    arrival: { stop_sequence: 5 },
  });

  assert.deepEqual(
    pickJourneyStops(
      [{ stop_sequence: 9 }, { stop_sequence: 1 }],
      [{ stop_sequence: 4 }],
    ),
    { departure: { stop_sequence: 1 }, arrival: { stop_sequence: 4 } },
  );
});

void test("segmentSequences covers every leg except the arrival call", () => {
  assert.deepEqual(segmentSequences(2, 5), [2, 3, 4]);
  assert.deepEqual(segmentSequences(0, 1), [0]);
  assert.deepEqual(segmentSequences(4, 4), []);
});

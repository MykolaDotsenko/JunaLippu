import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  compareGtfsTimes,
  FIRST_CLASS_FARE_MULTIPLIER,
  journeyDurationSeconds,
  SECOND_CLASS_FARE_CENTS_PER_HOUR,
  secondsToDuration,
  segmentSequences,
  timeToSeconds,
  pickJourneyStops,
} from "../src/server/api/lib/journey";

void test("timeToSeconds parses the full GTFS time value", () => {
  assert.equal(timeToSeconds("07:25:39"), 26739);
  assert.equal(timeToSeconds("7:05:00"), 25500);
  assert.equal(timeToSeconds("31:00:00"), 111600);
});

void test("timeToSeconds rejects malformed GTFS times", () => {
  for (const value of [
    "",
    "07",
    "07:25",
    "07:99:00",
    "07:25:60",
    "07:25:garbage",
    "-1:00:00",
    " 07:25:00",
  ]) {
    assert.equal(timeToSeconds(value), null, value);
  }
});

void test("compareGtfsTimes sorts numeric GTFS time, not text", () => {
  assert.ok(compareGtfsTimes("7:00:00", "10:00:00") < 0);
  assert.ok(compareGtfsTimes("24:30:00", "9:00:00") > 0);
  assert.equal(compareGtfsTimes("7:00:00", "07:00:00"), 0);
});

void test("secondsToDuration rounds only the human-readable label", () => {
  assert.equal(secondsToDuration(121 * 60), "2 h 01 min");
  assert.equal(secondsToDuration(47 * 60 + 39), "0 h 48 min");
  assert.equal(secondsToDuration(0), "0 h 00 min");
});

void test("pricing uses exact elapsed seconds and integer cents", () => {
  const secondClass = calculateJourneyPriceCents(120 * 60, 2);
  const firstClass = calculateJourneyPriceCents(120 * 60, 1);

  assert.equal(secondClass, 3840);
  assert.equal(firstClass, 5760);
  assert.equal(centsToEuros(secondClass), 38.4);

  assert.equal(calculateJourneyPriceCents(47 * 60 + 39, 2), 1525);
});

void test("pricing follows the published tariff constants", () => {
  assert.equal(
    calculateJourneyPriceCents(60 * 60, 2),
    SECOND_CLASS_FARE_CENTS_PER_HOUR,
  );
  assert.equal(
    calculateJourneyPriceCents(60 * 60, 1),
    Math.round(SECOND_CLASS_FARE_CENTS_PER_HOUR * FIRST_CLASS_FARE_MULTIPLIER),
  );
  assert.equal(Number.isInteger(calculateJourneyPriceCents(37 * 60 + 17, 1)), true);
});

void test("journeyDurationSeconds preserves GTFS seconds", () => {
  assert.equal(journeyDurationSeconds("07:25:00", "09:26:00"), 7260);
  assert.equal(journeyDurationSeconds("10:00:00", "10:47:39"), 2859);
  assert.equal(journeyDurationSeconds("10:00:00", "10:00:00"), 0);
});

void test("journeyDurationSeconds handles journeys past midnight", () => {
  assert.equal(journeyDurationSeconds("23:50:00", "24:30:00"), 2400);
  assert.equal(journeyDurationSeconds("22:00:00", "30:00:00"), 28800);
  assert.equal(journeyDurationSeconds("23:00:00", "31:00:00"), 28800);
});

void test("journeyDurationSeconds rejects an arrival before its departure", () => {
  assert.equal(journeyDurationSeconds("23:50:00", "00:30:00"), null);
  assert.equal(journeyDurationSeconds("12:00:00", "11:00:00"), null);
  assert.equal(journeyDurationSeconds("12:00:50", "12:00:10"), null);
});

void test("journeyDurationSeconds rejects unparsable times", () => {
  assert.equal(journeyDurationSeconds("not-a-time", "09:26:00"), null);
  assert.equal(journeyDurationSeconds("07:25:00", "oops"), null);
  assert.equal(journeyDurationSeconds("07:99:00", "09:26:00"), null);
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

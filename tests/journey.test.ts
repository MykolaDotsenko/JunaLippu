import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  findForwardStopPair,
  minutesToDuration,
  timeToMinutes,
} from "../src/server/api/lib/journey.ts";

void test("timeToMinutes parses regular and GTFS-style times", () => {
  assert.equal(timeToMinutes("07:25:00"), 445);
  assert.equal(timeToMinutes("09:26:00"), 566);
  assert.equal(timeToMinutes("25:10:00"), 1510);
  assert.throws(() => timeToMinutes("09:99:00"), RangeError);
  assert.throws(() => timeToMinutes("invalid"), RangeError);
});

void test("minutesToDuration validates and formats journey durations", () => {
  assert.equal(minutesToDuration(121), "2 h 01 min");
  assert.throws(() => minutesToDuration(-1), RangeError);
  assert.throws(() => minutesToDuration(1.5), RangeError);
});

void test("pricing uses integer cents and class multiplier", () => {
  const secondClass = calculateJourneyPriceCents(120, 2);
  const firstClass = calculateJourneyPriceCents(120, 1);

  assert.equal(secondClass, 3840);
  assert.equal(firstClass, 5760);
  assert.equal(centsToEuros(secondClass), 38.4);
  assert.throws(() => calculateJourneyPriceCents(-1, 2), RangeError);
});

void test("findForwardStopPair handles repeated station occurrences", () => {
  const pair = findForwardStopPair(
    [{ stop_sequence: 8 }, { stop_sequence: 2 }],
    [{ stop_sequence: 1 }, { stop_sequence: 9 }, { stop_sequence: 5 }],
  );

  assert.deepEqual(pair, {
    departure: { stop_sequence: 2 },
    arrival: { stop_sequence: 5 },
  });

  assert.equal(
    findForwardStopPair([{ stop_sequence: 5 }], [{ stop_sequence: 4 }]),
    null,
  );
});

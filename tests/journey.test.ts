import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  minutesToDuration,
  timeToMinutes,
} from "../src/server/api/lib/journey.ts";

test("timeToMinutes parses timetable times", () => {
  assert.equal(timeToMinutes("07:25:00"), 445);
  assert.equal(timeToMinutes("09:26:00"), 566);
});

test("minutesToDuration formats compact journey durations", () => {
  assert.equal(minutesToDuration(121), "2 h 01 min");
});

test("pricing uses integer cents and class multiplier", () => {
  const secondClass = calculateJourneyPriceCents(120, 2);
  const firstClass = calculateJourneyPriceCents(120, 1);

  assert.equal(secondClass, 3840);
  assert.equal(firstClass, 5760);
  assert.equal(centsToEuros(secondClass), 38.4);
});

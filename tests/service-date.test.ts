import assert from "node:assert/strict";
import test from "node:test";

import { formatServiceDate } from "../src/utils/serviceDate";

void test("formatServiceDate renders an ISO service date for humans", () => {
  assert.equal(formatServiceDate("2024-05-06"), "06 May 2024");
  assert.equal(formatServiceDate("2024-12-31"), "31 Dec 2024");
  assert.equal(formatServiceDate("2024-01-01"), "01 Jan 2024");
});

void test("formatServiceDate is not shifted by the host timezone", () => {
  assert.ok(formatServiceDate("2024-05-06").startsWith("06"));
});

void test("formatServiceDate passes through anything it cannot parse", () => {
  assert.equal(formatServiceDate(""), "");
  assert.equal(formatServiceDate("not-a-date"), "not-a-date");
  assert.equal(formatServiceDate("2024-05"), "2024-05");
  assert.equal(formatServiceDate("2024-02-31"), "2024-02-31");
  assert.equal(formatServiceDate("2024-13-01"), "2024-13-01");
});

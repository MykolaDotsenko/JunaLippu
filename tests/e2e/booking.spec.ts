import { expect, test } from "@playwright/test";

const TRAINS_URL =
  "/trains?depStopId=E2EA&arrivStopId=E2EC&departureCity=Alpha&arrivalCity=Gamma&startDate=2024-05-06";

test("booking flow reaches server-verified review", async ({ page }) => {
  await page.goto(TRAINS_URL);

  await expect(
    page.getByRole("heading", { name: "Alpha → Gamma" }),
  ).toBeVisible();
  await expect(page.getByText("Train IC901")).toBeVisible();

  await page.getByRole("link", { name: "Select" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose class and seat" }),
  ).toBeVisible();
  await expect(
    page.getByText("Alpha → Gamma · 07:25:00–09:26:00"),
  ).toBeVisible();

  await page.getByRole("radio", { name: "Car 1, seat 7" }).click();
  await expect(page).toHaveURL(/seatId=901/);
  await expect(page.getByText(/€\d+\.\d{2}/)).toBeVisible();

  await page.getByRole("button", { name: "Review booking" }).click();

  await expect(
    page.getByRole("heading", { name: "Review your booking" }),
  ).toBeVisible();
  await expect(page.getByText("2024-05-06 · 07:25:00–09:26:00")).toBeVisible();
  await expect(page.getByText("Car 1 · Seat 7")).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
});

test("invalid deep link recovers safely", async ({ page }) => {
  await page.goto("/seats");
  await expect(
    page.getByRole("heading", { name: "Journey details are missing." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to search" }),
  ).toBeVisible();
});

test("legacy booking links still resolve", async ({ page }) => {
  await page.goto(
    "/BookingJourney?depStopId=E2EA&arrivStopId=E2EC&departureCity=Alpha&arrivalCity=Gamma&startDate=2024-05-06",
  );

  await expect(page).toHaveURL(/\/trains\?/);
  await expect(
    page.getByRole("heading", { name: "Alpha → Gamma" }),
  ).toBeVisible();

  await page.goto("/Journey");
  await expect(page).toHaveURL(/\/seats$/);
});

test("unknown routes render the 404 page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This page does not exist." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to search" }),
  ).toBeVisible();
});

test("bookings page asks a guest to sign in", async ({ page }) => {
  await page.goto("/bookings");

  await expect(
    page.getByRole("heading", { name: "My bookings" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sign in to see your bookings" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
});

test("the search form only offers dates the demo dataset covers", async ({
  page,
}) => {
  await page.goto("/");

  const serviceDate = page.getByLabel("Service date");
  await expect(serviceDate).toBeDisabled();

  await page.getByLabel("From").selectOption("E2EA");
  await page.getByLabel("To").selectOption("E2EC");

  await expect(
    page.getByText(/Demo timetable covers 06 May 2024/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Search trains" }),
  ).toBeDisabled();

  await expect(serviceDate).toBeEnabled();
  await expect(serviceDate.locator("option")).toHaveText([
    "Choose service date",
    "06 May 2024",
  ]);

  await serviceDate.selectOption("2024-05-06");
  await expect(
    page.getByRole("button", { name: "Search trains" }),
  ).toBeEnabled();

  await page.getByRole("button", { name: "Search trains" }).click();
  await expect(page).toHaveURL(/\/trains\?/);
  await expect(
    page.getByRole("heading", { name: "Alpha → Gamma" }),
  ).toBeVisible();
});

test("a valid deep link never serves the missing-details state", async ({
  request,
}) => {
  const response = await request.get(
    "/seats?tripId=e2e-trip&depStopId=E2EA&arrivStopId=E2EC",
  );
  const html = await response.text();

  expect(html).not.toContain("Journey details are missing.");
  expect(html).toContain('aria-label="Loading"');
});

test("the seat page keeps its choices in the URL", async ({ page }) => {
  await page.goto(TRAINS_URL);
  await page.getByRole("link", { name: "Select" }).click();

  const secondClass = page.getByRole("radio", { name: "2nd class" });
  const firstClass = page.getByRole("radio", { name: "1st class" });
  await expect(secondClass).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: "Car 1, seat 7" }).click();
  await expect(page).toHaveURL(/seatId=901/);

  await page.reload();
  await expect(
    page.getByRole("radio", { name: "Car 1, seat 7" }),
  ).toHaveAttribute("aria-checked", "true");

  await firstClass.click();
  await expect(page).toHaveURL(/travelClass=1/);
  await expect(page).not.toHaveURL(/seatId=/);
  await expect(firstClass).toHaveAttribute("aria-checked", "true");
});

test("seats are reachable with arrow keys, not only Tab", async ({ page }) => {
  await page.goto(
    "/seats?tripId=e2e-trip&depStopId=E2EA&arrivStopId=E2EC&travelClass=2",
  );

  const seat = page.getByRole("radio", { name: "Car 1, seat 7" });
  await expect(seat).toBeVisible();

  await seat.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/seatId=902/);
  await expect(
    page.getByRole("radio", { name: "Car 1, seat 8" }),
  ).toHaveAttribute("aria-checked", "true");

  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/seatId=901/);
});

test("the search form keeps the query in the URL", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("From").selectOption("E2EA");
  await expect(page).toHaveURL(/from=E2EA/);
  await page.getByLabel("To").selectOption("E2EC");
  await expect(page).toHaveURL(/to=E2EC/);

  await page.getByLabel("Service date").selectOption("2024-05-06");
  await expect(page).toHaveURL(/date=2024-05-06/);

  await page.reload();
  await expect(page.getByLabel("From")).toHaveValue("E2EA");
  await expect(page.getByLabel("To")).toHaveValue("E2EC");
  await expect(page.getByLabel("Service date")).toHaveValue("2024-05-06");
  await expect(
    page.getByRole("button", { name: "Search trains" }),
  ).toBeEnabled();
});

test("a failed dates request is reported, not shown as no dates", async ({
  page,
}) => {
  await page.route("**/api/trpc/search.getAvailableDates*", (route) =>
    route.abort("failed"),
  );

  await page.goto("/");
  await page.getByLabel("From").selectOption("E2EA");
  await page.getByLabel("To").selectOption("E2EC");

  await expect(
    page.getByText("We could not load service dates."),
  ).toBeVisible();
  await expect(page.getByText("No dates available")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Search trains" }),
  ).toBeDisabled();
});

test("verified quick-start routes always expose a service date", async ({
  page,
}) => {
  for (const route of [
    { label: "Imatra → Lappeenranta", date: "01 Jun 2024" },
    { label: "Tampere → Jyväskylä", date: "01 Jul 2024" },
  ]) {
    await page.goto("/");
    await page.getByRole("link", { name: new RegExp(route.label) }).click();

    const serviceDate = page.getByLabel("Service date");
    await expect(serviceDate).toBeEnabled();
    await expect(serviceDate.locator("option")).toContainText([route.date]);
  }
});

test("confirmation asks a guest to authenticate before loading private data", async ({
  page,
}) => {
  await page.goto("/confirmation?reservationId=123");

  await expect(
    page.getByRole("heading", { name: "Sign in to view this reservation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(
    page.getByText("We could not load this reservation."),
  ).toHaveCount(0);
});

test("server-error recovery never claims a reservation was not created", async ({
  page,
}) => {
  await page.goto("/500");

  await expect(
    page.getByRole("heading", { name: "Something went wrong on our side." }),
  ).toBeVisible();
  await expect(page.getByText("No reservation was created.")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Check My bookings" }),
  ).toBeVisible();
});

test("responses include the baseline browser security headers", async ({
  request,
}) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});

import { expect, test } from "@playwright/test";

const TRAINS_URL =
  "/trains?depStopId=E2EA&arrivStopId=E2EC&departureCity=Alpha&arrivalCity=Gamma&startDate=2024-05-06";

test("mobile booking flow reaches server-verified review", async ({ page }) => {
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

  await page.getByRole("button", { name: "Seat 7" }).click();
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

  await page.getByLabel("From").selectOption("E2EA");
  await page.getByLabel("To").selectOption("E2EC");

  await expect(
    page.getByText(/Demo timetable covers 2024-05-06/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Search trains" }),
  ).toBeDisabled();
});

import { expect, test } from "@playwright/test";

test("mobile booking flow reaches server-verified review", async ({ page }) => {
  await page.goto(
    "/BookingJourney?depStopId=E2EA&arrivStopId=E2EC&departureCity=Alpha&arrivalCity=Gamma&startDate=2024-05-06",
  );

  await expect(page.getByRole("heading", { name: "Alpha → Gamma" })).toBeVisible();
  await expect(page.getByText("Train IC901")).toBeVisible();

  await page.getByRole("link", { name: "Select" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose class and seat" }),
  ).toBeVisible();
  await expect(page.getByText("Alpha → Gamma · 07:25:00–09:26:00")).toBeVisible();

  await page.getByRole("button", { name: "Seat 7" }).click();
  await expect(page.getByText(/€\d+\.\d{2}/)).toBeVisible();

  await page.getByRole("button", { name: "Review booking" }).click();

  await expect(
    page.getByRole("heading", { name: "Review your booking" }),
  ).toBeVisible();
  await expect(page.getByText("2024-05-06 · 07:25:00–09:26:00")).toBeVisible();
  await expect(page.getByText("Car 1 · Seat 7")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
});

test("invalid deep link recovers safely", async ({ page }) => {
  await page.goto("/Journey");
  await expect(
    page.getByRole("heading", { name: "Journey details are missing." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to search" })).toBeVisible();
});

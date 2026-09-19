import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
};

const expectNoSeriousAccessibilityViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const serious = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(serious).toEqual([]);
};

test("homepage search reaches server-verified review", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("From").selectOption("E2EA");
  await page.getByLabel("To").selectOption("E2EC");

  const dateInput = page.getByLabel("Service date");
  await expect(dateInput).toBeEnabled();
  await dateInput.selectOption("2024-05-06");

  await page.getByRole("button", { name: "Search trains" }).click();

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

  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
});

test("forged display labels cannot alter server-authoritative route", async ({ page }) => {
  await page.goto(
    "/BookingJourney?depStopId=E2EA&arrivStopId=E2EC&departureCity=Paris&arrivalCity=Tokyo&startDate=2024-05-06",
  );

  await expect(page.getByRole("heading", { name: "Alpha → Gamma" })).toBeVisible();
  await expect(page.getByText("Paris → Tokyo")).toHaveCount(0);
});

test("invalid booking deep links recover safely", async ({ page }) => {
  await page.goto("/BookingJourney");
  await expect(
    page.getByRole("heading", { name: "Journey search details are invalid." }),
  ).toBeVisible();

  await page.goto("/Journey");
  await expect(
    page.getByRole("heading", { name: "Journey details are missing." }),
  ).toBeVisible();

  await page.goto("/ReviewBooking");
  await expect(
    page.getByRole("heading", { name: "Booking details are missing." }),
  ).toBeVisible();

  await page.goto("/BookingSuccess");
  await expect(
    page.getByRole("heading", { name: "Reservation number is missing." }),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

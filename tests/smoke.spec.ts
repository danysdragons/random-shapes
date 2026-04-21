import { expect, test } from "@playwright/test";

test("built app renders the training surface", async ({ page }) => {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("./");

  await expect(
    page.getByRole("heading", { name: "Random Shape Whiteboard" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /New board/ })).toBeVisible();
  await expect(page.getByText("Guided workout")).toBeVisible();
  await expect(page.getByText("Drill instructions")).toBeVisible();
  await expect(page.locator(".board-surface svg")).toBeVisible();

  await page.getByText("Pacing details").click();
  await expect(page.getByText("Tempo ladder", { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

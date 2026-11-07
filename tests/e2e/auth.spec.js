const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:3000";
// Unique username per test — the DB persists between tests in the same run
const uniqueUser = () => `user_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/register`);
});

test("e2e 1 — a visitor can register and reach the dashboard", async ({ page }) => {
  const user = uniqueUser();
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', "SuperSecret123");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("heading")).toContainText(user);
});

test("e2e 2 — a user can log out and log back in", async ({ page }) => {
  const user = uniqueUser();
  // register first
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', "SuperSecret123");
  await page.click('button[type="submit"]');
  await page.click("text=Log out");
  await expect(page).toHaveURL(/\/login/);
  // log back in
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', "SuperSecret123");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("heading")).toContainText(user);
});

test("e2e 3 — invalid login shows an error and stays on the login page", async ({ page }) => {
  const user = uniqueUser();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', "wrongpassword");
  await page.click('button[type="submit"]');
  await expect(page.locator(".err")).toContainText("Invalid username or password");
  await expect(page).toHaveURL(/\/login/);
});
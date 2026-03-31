import { test, expect } from "@playwright/test";

test.describe("Public Routes", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBeDefined();
  });

  test("API routes return 401 when unauthenticated", async ({ request }) => {
    const res = await request.get("/api/ideas");
    expect(res.status()).toBe(401);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    expect(await page.title()).toContain("ForgeOS");
  });

  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("text=Create your account")).toBeVisible();
  });
});

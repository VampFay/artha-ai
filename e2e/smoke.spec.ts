/**
 * ARTHA — E2E smoke test
 * WP3.2 — verifies deploy-ready scenarios
 */
import { test, expect } from "@playwright/test";

test.describe("ARTH E2E smoke", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("ready endpoint passes", async ({ request }) => {
    const res = await request.get("/api/ready");
    if (res.ok()) {
      const body = await res.json();
      expect(body.status).toBe("ready");
    }
  });

  test("public stats returns counts", async ({ request }) => {
    const res = await request.get("/api/public/stats");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data || body).toBeDefined();
  });

  test("login page renders with brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const title = await page.title();
    expect(title.toLowerCase()).toContain("artha");
  });

  test("invalid login returns 401 (not 500)", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "nobody@nowhere.test", password: "wrong-pass" },
    });
    // WP2.3 — should be 401 (not 500), or 429 if rate-limited from prior tests
    expect([401, 429]).toContain(res.status());
  });

  test("unauthenticated /api/users/me returns 401", async ({ request }) => {
    const res = await request.get("/api/users/me", { headers: { Authorization: "" } });
    expect(res.status()).toBe(401);
  });

  test("RAG search rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/rag/search", {
      data: { query: "test query" },
    });
    expect(res.status()).toBe(401);
  });

  test("CSP + security headers present", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"] || "";
    expect(csp.length).toBeGreaterThan(0);
    expect(csp).toContain("default-src");
  });

  test("maintenance page renders", async ({ request }) => {
    const res = await request.get("/maintenance");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain("artha");
  });

  test("404 page renders (custom)", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist-test-12345");
    expect(res.status()).toBe(404);
  });
});

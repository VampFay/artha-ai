// Full demo recording using Playwright directly.
// Uses text-based selectors for nav links (more robust than role-based).

const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const path = require("path");
const fs = require("fs");

const OUT = "/home/z/my-project/download/FinSight_AI_Demo.webm";
const BASE = "http://127.0.0.1:3000";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickNav(page, text) {
  // Try multiple strategies to find nav links
  const strategies = [
    () => page.locator(`nav a:has-text("${text}")`).first(),
    () => page.getByRole("link", { name: text }).first(),
    () => page.locator(`a:has-text("${text}")`).first(),
  ];
  for (const strategy of strategies) {
    try {
      const loc = strategy();
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loc.click();
        return true;
      }
    } catch {}
  }
  return false;
}

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.dirname(OUT), size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  try {
    // === Scene 1: Landing page ===
    console.log("[1/13] Landing page");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await sleep(2500);

    // === Scene 2: Click Get Started → Login ===
    console.log("[2/13] → Login page");
    await page.getByRole("button", { name: "Get Started — Free" }).click();
    await page.waitForURL("**/login", { timeout: 10000 });
    await sleep(2000);

    // === Scene 3: Fill login form ===
    console.log("[3/13] Login");
    await page.getByPlaceholder("you@example.com").fill("demo@finsight.ai");
    await sleep(500);
    await page.getByPlaceholder("Min 8 chars, 1 letter + 1 digit").fill("demo1234");
    await sleep(600);
    const loginButtons = await page.getByRole("button", { name: "Login" }).all();
    await loginButtons[loginButtons.length - 1].click();
    await sleep(3000);

    // === Scene 4: Dashboard ===
    console.log("[4/13] Dashboard");
    await sleep(2500);
    await page.mouse.wheel(0, 300);
    await sleep(2000);

    // === Scene 5: Documents ===
    console.log("[5/13] Documents");
    if (await clickNav(page, "Documents")) {
      await page.waitForURL("**/documents", { timeout: 10000 }).catch(() => {});
      await sleep(2500);
    } else {
      console.log("  could not find Documents nav");
      await page.goto(`${BASE}/documents`, { waitUntil: "networkidle" });
      await sleep(2500);
    }

    // === Scene 6: Tax Readiness ===
    console.log("[6/13] Tax Readiness");
    if (await clickNav(page, "Tax Readiness")) {
      await page.waitForURL("**/tax", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/tax`, { waitUntil: "networkidle" });
    }
    await sleep(2500);
    await page.mouse.wheel(0, 400);
    await sleep(2000);
    await page.mouse.wheel(0, 400);
    await sleep(1500);

    // === Scene 7: Financial Health ===
    console.log("[7/13] Financial Health");
    if (await clickNav(page, "Financial Health")) {
      await page.waitForURL("**/finance", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/finance`, { waitUntil: "networkidle" });
    }
    await sleep(3000);
    await page.mouse.wheel(0, 250);
    await sleep(2000);

    // === Scene 8: Goals ===
    console.log("[8/13] Goals");
    if (await clickNav(page, "Goals")) {
      await page.waitForURL("**/goals", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/goals`, { waitUntil: "networkidle" });
    }
    await sleep(2000);

    // === Scene 9: Goal detail ===
    console.log("[9/13] Goal detail");
    try {
      await page.getByText("Emergency Fund", { exact: false }).first().click({ timeout: 5000 });
      await sleep(2500);
      await page.mouse.wheel(0, 200);
      await sleep(2000);
    } catch {
      console.log("  goal card not found");
    }

    // === Scene 10: AI Assistant ===
    console.log("[10/13] AI Assistant");
    if (await clickNav(page, "Assistant")) {
      await page.waitForURL("**/assistant", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
    }
    await sleep(2000);
    // Try clicking suggested question
    try {
      const suggestion = page.getByRole("button", { name: "Why is my tax readiness score low?" });
      if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await suggestion.click();
        await sleep(4000);
      } else {
        // Type the question
        await page.getByPlaceholder("Ask a question...").fill("Why is my tax readiness score low?");
        await sleep(500);
        await page.getByRole("button", { name: "Send" }).click();
        await sleep(4000);
      }
    } catch (err) {
      console.log("  assistant interaction failed:", err.message);
    }

    // === Scene 11: Reports ===
    console.log("[11/13] Reports");
    if (await clickNav(page, "Reports")) {
      await page.waitForURL("**/reports", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
    }
    await sleep(2000);
    await page.mouse.wheel(0, 250);
    await sleep(1500);

    // === Scene 12: Settings ===
    console.log("[12/13] Settings");
    if (await clickNav(page, "Settings")) {
      await page.waitForURL("**/settings", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    }
    await sleep(2500);
    await page.mouse.wheel(0, 350);
    await sleep(2000);

    // === Scene 13: Dashboard + Logout ===
    console.log("[13/13] Dashboard + Logout");
    if (await clickNav(page, "Dashboard")) {
      await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    }
    await sleep(2000);
    try {
      await page.getByRole("button", { name: "Logout" }).click({ timeout: 5000 });
      await sleep(2500);
    } catch {
      console.log("  logout button not found");
    }

    console.log("Demo complete!");
  } catch (err) {
    console.error("Error during demo:", err.message);
  } finally {
    await context.close();
    await browser.close();

    // Find and rename the video
    const dir = path.dirname(OUT);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".webm"));
    if (files.length > 0) {
      const webmFiles = files
        .map((f) => ({ name: f, path: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
      fs.renameSync(webmFiles[0].path, OUT);
      const stats = fs.statSync(OUT);
      console.log(`Video saved: ${OUT} (${(stats.size / 1024).toFixed(0)} KB)`);
    }
  }
})();

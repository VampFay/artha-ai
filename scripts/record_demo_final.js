// Self-contained demo recorder.
// Starts backend + frontend as child processes, seeds, then records the full demo.
// Everything runs in one Node process so nothing gets killed between steps.

const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const OUT = "/home/z/my-project/download/FinSight_AI_Demo.webm";
const BACKEND_DIR = "/home/z/my-project/finsight-ai/backend";
const FRONTEND_DIR = "/home/z/my-project/finsight-ai/frontend";
const BASE_FE = "http://127.0.0.1:3000";
const BASE_BE = "http://127.0.0.1:8000";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForServer(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 302) resolve();
          else if (Date.now() - start > timeoutMs) reject(new Error("timeout"));
          else setTimeout(check, 1000);
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) reject(new Error("timeout"));
          else setTimeout(check, 1000);
        });
    };
    check();
  });
}

async function clickNav(page, text) {
  const strategies = [
    () => page.locator(`nav a:has-text("${text}")`).first(),
    () => page.locator(`a:has-text("${text}")`).first(),
    () => page.getByRole("link", { name: text }).first(),
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
  let backendProc, frontendProc;

  try {
    // === 1. Kill any leftover servers ===
    console.log("[setup] killing leftover processes...");
    try { execSync("pkill -f 'uvicorn app.main'", { stdio: "ignore" }); } catch {}
    try { execSync('pkill -f "next dev"', { stdio: "ignore" }); } catch {}
    try { execSync('pkill -f "next-server"', { stdio: "ignore" }); } catch {}
    await sleep(2000);

    // === 2. Start backend ===
    console.log("[setup] starting backend...");
    fs.rmSync(path.join(BACKEND_DIR, "finsight.db"), { force: true });
    backendProc = spawn("python3", ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: "sqlite+aiosqlite:///./finsight.db" },
      stdio: ["ignore", "ignore", "ignore"],
      detached: false,
    });
    await waitForServer(`${BASE_BE}/health`);
    console.log("[setup] backend ready");

    // === 3. Start frontend ===
    console.log("[setup] starting frontend...");
    frontendProc = spawn("pnpm", ["dev"], {
      cwd: FRONTEND_DIR,
      stdio: ["ignore", "ignore", "ignore"],
      detached: false,
    });
    await waitForServer(BASE_FE, 40000);
    console.log("[setup] frontend ready");

    // === 4. Seed demo data ===
    console.log("[setup] seeding...");
    execSync("python3 scripts/seed.py", {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: "sqlite+aiosqlite:///./finsight.db" },
      stdio: "ignore",
    });
    execSync("python3 scripts/seed_demo_data.py", {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: "sqlite+aiosqlite:///./finsight.db" },
      stdio: "ignore",
    });
    console.log("[setup] seed complete");

    // === 5. Launch browser + record ===
    console.log("[record] launching browser...");
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: path.dirname(OUT), size: { width: 1440, height: 900 } },
    });
    const page = await context.newPage();

    // Scene 1: Landing
    console.log("[1/13] Landing page");
    await page.goto(BASE_FE, { waitUntil: "networkidle" });
    await sleep(2500);

    // Scene 2: Get Started
    console.log("[2/13] → Login page");
    await page.getByRole("button", { name: "Get Started — Free" }).click();
    await page.waitForURL("**/login", { timeout: 10000 });
    await sleep(2000);

    // Scene 3: Login
    console.log("[3/13] Login");
    await page.getByPlaceholder("you@example.com").fill("demo@finsight.ai");
    await sleep(500);
    await page.getByPlaceholder("Min 8 chars, 1 letter + 1 digit").fill("demo1234");
    await sleep(600);
    const loginButtons = await page.getByRole("button", { name: "Login" }).all();
    await loginButtons[loginButtons.length - 1].click();
    await sleep(3000);
    console.log("  url after login:", page.url());

    // Scene 4: Dashboard
    console.log("[4/13] Dashboard");
    await sleep(2500);
    await page.mouse.wheel(0, 300);
    await sleep(2000);

    // Scene 5: Documents
    console.log("[5/13] Documents");
    await clickNav(page, "Documents");
    await page.waitForURL("**/documents", { timeout: 10000 }).catch(() => {});
    await sleep(2500);

    // Scene 6: Tax
    console.log("[6/13] Tax Readiness");
    await clickNav(page, "Tax Readiness");
    await page.waitForURL("**/tax", { timeout: 10000 }).catch(() => {});
    await sleep(2500);
    await page.mouse.wheel(0, 400);
    await sleep(2000);
    await page.mouse.wheel(0, 400);
    await sleep(1500);

    // Scene 7: Finance
    console.log("[7/13] Financial Health");
    await clickNav(page, "Financial Health");
    await page.waitForURL("**/finance", { timeout: 10000 }).catch(() => {});
    await sleep(3000);
    await page.mouse.wheel(0, 250);
    await sleep(2000);

    // Scene 8: Goals
    console.log("[8/13] Goals");
    await clickNav(page, "Goals");
    await page.waitForURL("**/goals", { timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // Scene 9: Goal detail
    console.log("[9/13] Goal detail");
    try {
      await page.getByText("Emergency Fund", { exact: false }).first().click({ timeout: 5000 });
      await sleep(2500);
      await page.mouse.wheel(0, 200);
      await sleep(2000);
    } catch { console.log("  goal not found"); }

    // Scene 10: Assistant
    console.log("[10/13] AI Assistant");
    await clickNav(page, "Assistant");
    await page.waitForURL("**/assistant", { timeout: 10000 }).catch(() => {});
    await sleep(2000);
    try {
      const suggestion = page.getByRole("button", { name: "Why is my tax readiness score low?" });
      if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await suggestion.click();
        await sleep(4000);
      } else {
        await page.getByPlaceholder("Ask a question...").fill("Why is my tax score low?");
        await sleep(500);
        await page.getByRole("button", { name: "Send" }).click();
        await sleep(4000);
      }
    } catch (err) { console.log("  assistant err:", err.message.slice(0, 80)); }

    // Scene 11: Reports
    console.log("[11/13] Reports");
    await clickNav(page, "Reports");
    await page.waitForURL("**/reports", { timeout: 10000 }).catch(() => {});
    await sleep(2000);
    await page.mouse.wheel(0, 250);
    await sleep(1500);

    // Scene 12: Settings
    console.log("[12/13] Settings");
    await clickNav(page, "Settings");
    await page.waitForURL("**/settings", { timeout: 10000 }).catch(() => {});
    await sleep(2500);
    await page.mouse.wheel(0, 350);
    await sleep(2000);

    // Scene 13: Dashboard + Logout
    console.log("[13/13] Dashboard + Logout");
    await clickNav(page, "Dashboard");
    await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
    await sleep(2000);
    try {
      await page.getByRole("button", { name: "Logout" }).click({ timeout: 5000 });
      await sleep(2500);
    } catch { console.log("  logout not found"); }

    console.log("[record] demo complete!");
    await context.close();
    await browser.close();

    // Rename video
    const dir = path.dirname(OUT);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".webm"))
      .map((f) => ({ name: f, path: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0) {
      if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
      fs.renameSync(files[0].path, OUT);
      const stats = fs.statSync(OUT);
      console.log(`[done] video: ${OUT} (${(stats.size / 1024).toFixed(0)} KB)`);
    }
  } catch (err) {
    console.error("[fatal]", err.message);
  } finally {
    if (backendProc) backendProc.kill();
    if (frontendProc) frontendProc.kill();
    process.exit(0);
  }
})();

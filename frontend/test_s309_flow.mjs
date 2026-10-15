import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure()?.errorText));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESP:', response.status(), response.url());
    }
  });

  // Login as HR Recruiter
  console.log("Logging in as hr@company.com...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "hr@company.com");
  await page.fill('input[type="password"]', "company123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check /recruiter
  console.log("Navigating to /recruiter...");
  await page.goto("http://localhost:3000/recruiter", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recruiter_workspace.png"), fullPage: true });

  // Click on "Soạn tin tuyển dụng" on the first approved requisition
  const draftBtn = page.locator('button:has-text("Soạn tin tuyển dụng")').first();
  if (await draftBtn.count() > 0) {
    console.log("Clicking 'Soạn tin tuyển dụng'...");
    await draftBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recruiter_draft_modal.png"), fullPage: false });
    console.log("Draft modal opened successfully!");
  } else {
    console.log("No approved requisition button found on page!");
  }

  // Check /recruiter/jobs
  console.log("Navigating to /recruiter/jobs...");
  await page.goto("http://localhost:3000/recruiter/jobs", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recruiter_jobs.png"), fullPage: true });

  await browser.close();
  console.log("Finished test run!");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

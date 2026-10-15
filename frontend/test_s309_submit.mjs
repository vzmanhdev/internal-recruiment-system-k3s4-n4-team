import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-screenshots");

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESP:', response.status(), response.url());
    }
  });

  // Login
  console.log("Logging in as hr@company.com...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "hr@company.com");
  await page.fill('input[type="password"]', "company123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Go to /recruiter
  console.log("Navigating to /recruiter...");
  await page.goto("http://localhost:3000/recruiter", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click on "Soạn tin tuyển dụng"
  const draftBtn = page.locator('button:has-text("Soạn tin tuyển dụng")').first();
  if (await draftBtn.count() > 0) {
    console.log("Clicking 'Soạn tin tuyển dụng'...");
    await draftBtn.click();
    await page.waitForTimeout(1000);

    // Switch to Preview tab
    console.log("Switching to preview tab...");
    await page.click('button:has-text("Xem trước công khai")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_draft_preview.png") });

    // Switch back to edit tab
    console.log("Switching back to edit tab...");
    await page.click('button:has-text("Biên tập nội dung")');
    await page.waitForTimeout(1000);

    // Click "Lưu bản nháp tin"
    console.log("Submitting form: click 'Lưu bản nháp tin'...");
    await page.click('button:has-text("Lưu bản nháp tin")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_after_draft_submit.png") });
    console.log("Submit completed!");
  } else {
    console.error("No draft button found!");
  }

  await browser.close();
}

run().catch(console.error);

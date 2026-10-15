import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-screenshots");

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // 1. Login
  console.log("1. Logging in...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "hr@company.com");
  await page.fill('input[type="password"]', "company123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Go to /recruiter/jobs
  console.log("2. Navigating to /recruiter/jobs...");
  await page.goto("http://localhost:3000/recruiter/jobs", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 3. Click "Soạn tin từ yêu cầu đã duyệt (S3-09)"
  console.log("3. Clicking 'Soạn tin từ yêu cầu đã duyệt (S3-09)'...");
  await page.click('button:has-text("Soạn tin từ yêu cầu đã duyệt (S3-09)")');
  await page.waitForTimeout(1000);

  // 4. Select an approved requisition in the picker modal
  console.log("4. Selecting an approved requisition...");
  const approvedItem = page.locator('text=Đã duyệt ✓ (Sẵn sàng soạn tin)').first();
  await approvedItem.click();
  await page.waitForTimeout(500);

  // 5. Click "Tiến hành soạn tin"
  console.log("5. Clicking 'Tiến hành soạn tin'...");
  await page.click('button:has-text("Tiến hành soạn tin")');
  await page.waitForTimeout(1500);

  // Take screenshot of JobDraftFromRequisitionModal open from /recruiter/jobs
  const shotPath = path.join(SCREENSHOT_DIR, "jobs_page_draft_modal_open.png");
  await page.screenshot({ path: shotPath });
  console.log("✓ Saved screenshot:", shotPath);

  // 6. Test client validation: empty title & click submit
  console.log("6. Testing client validation (empty title)...");
  await page.fill('input[value*="Kỹ sư"], input[value*="Chuyên Viên"], input[placeholder*="Chuyên viên"]', "");
  await page.click('button:has-text("Lưu bản nháp tin")');
  await page.waitForTimeout(1000);

  const errorText = await page.textContent('body');
  if (errorText.includes("Vui lòng nhập đầy đủ các mục bắt buộc")) {
    console.log("✓ Client validation triggered correctly for empty title!");
  }

  await browser.close();
  console.log("SUCCESS: All steps executed cleanly!");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

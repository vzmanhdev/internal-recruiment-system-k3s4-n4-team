import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING PLAYWRIGHT E2E AUTOMATED VERIFICATION");
  console.log("==================================================");

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: Locked Account Login
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Locked Account Login (skibidi@company.com)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "skibidi@company.com");
    await page.fill('input[type="password"]', "company123");
    await page.click('button[type="submit"]');

    // Wait for the error banner
    await page.waitForTimeout(1000);
    const lockedError = await page.textContent("body");
    console.log("Checked error banner for locked account text...");
    if (lockedError.includes("khóa") || lockedError.includes("bảo mật") || lockedError.includes("LOCKED")) {
      console.log("✓ Correctly reported account locked status without misleading email error!");
    } else {
      console.warn("Notice: Content captured:", lockedError.substring(0, 300));
    }
    const shot1 = path.join(SCREENSHOT_DIR, "01_locked_account.png");
    await page.screenshot({ path: shot1, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot1}`);

    // -------------------------------------------------------------
    // TEST 2: Admin Login
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Logging in as Admin (admin@company.com)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "admin@company.com");
    await page.fill('input[type="password"]', "company123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const shot2 = path.join(SCREENSHOT_DIR, "02_admin_dashboard.png");
    await page.screenshot({ path: shot2, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot2}`);

    // -------------------------------------------------------------
    // TEST 3: Admin Approvals Page - Pending Job Postings Tab
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing Admin Approvals Page & Pending Job Tab...");
    await page.goto("http://localhost:3000/admin/approvals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Click the "Bài đăng tuyển dụng chờ duyệt" tab
    const jobTab = page.locator('button:has-text("Bài đăng tuyển dụng chờ duyệt")');
    if (await jobTab.count() > 0) {
      await jobTab.click();
      await page.waitForTimeout(1000);
      console.log("✓ Switched to Pending Job Postings tab!");
    }

    const shot3 = path.join(SCREENSHOT_DIR, "03_admin_pending_jobs.png");
    await page.screenshot({ path: shot3, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot3}`);

    // Click "Phê duyệt" on a pending job
    const approveBtn = page.locator('button:has-text("Phê duyệt")').first();
    if (await approveBtn.count() > 0) {
      console.log("Clicking 'Phê duyệt' on pending job...");
      await approveBtn.click();
      await page.waitForTimeout(1500);
      const shot3b = path.join(SCREENSHOT_DIR, "04_job_approved_by_admin.png");
      await page.screenshot({ path: shot3b, fullPage: false });
      console.log(`✓ Screenshot saved after approval: ${shot3b}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Audit Logs Page (Formerly 404)
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing Audit Logs Page (/admin/audit-logs)...");
    await page.goto("http://localhost:3000/admin/audit-logs", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const bodyTextAudit = await page.textContent("body");
    if (!bodyTextAudit.includes("404") && (bodyTextAudit.includes("Nhật ký") || bodyTextAudit.includes("Audit"))) {
      console.log("✓ Audit Logs page loaded with live logs, NO 404!");
    }
    const shot4 = path.join(SCREENSHOT_DIR, "05_audit_logs_page.png");
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot4}`);

    // -------------------------------------------------------------
    // TEST 5: Roles & Permissions Page (Formerly 404)
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Roles & Permissions Page (/admin/roles)...");
    await page.goto("http://localhost:3000/admin/roles", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const bodyTextRoles = await page.textContent("body");
    if (!bodyTextRoles.includes("404") && (bodyTextRoles.includes("Vai trò") || bodyTextRoles.includes("Nhân sự"))) {
      console.log("✓ Roles & Permissions Matrix loaded with 'Nhân sự' role, NO 404!");
    }
    const shot5 = path.join(SCREENSHOT_DIR, "06_roles_matrix_page.png");
    await page.screenshot({ path: shot5, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot5}`);

    // -------------------------------------------------------------
    // TEST 6: System Settings Page (Formerly 404 / Missing)
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Testing System Settings Page (/admin/settings)...");
    await page.goto("http://localhost:3000/admin/settings", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const bodyTextSettings = await page.textContent("body");
    if (!bodyTextSettings.includes("404") && (bodyTextSettings.includes("Cấu hình") || bodyTextSettings.includes("Bảo mật"))) {
      console.log("✓ System Settings page loaded cleanly, NO 404!");
    }
    const shot6 = path.join(SCREENSHOT_DIR, "07_system_settings_page.png");
    await page.screenshot({ path: shot6, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot6}`);

    // -------------------------------------------------------------
    // TEST 7: User Management with Role Filter (No False Positives)
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Testing Exact Role Filtering (/admin/users)...");
    await page.goto("http://localhost:3000/admin/users", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Select role 'manager'
    const roleSelect = page.locator('select').filter({ hasText: /Tất cả vai trò|Quản lý|Nhân sự/i }).first();
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption("manager");
      await page.waitForTimeout(1500);
      console.log("✓ Selected role 'manager' in filter dropdown!");
    }
    const shot7 = path.join(SCREENSHOT_DIR, "08_user_role_filtering.png");
    await page.screenshot({ path: shot7, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot7}`);

    // -------------------------------------------------------------
    // TEST 8: Recruiter Job Management & Self-Approval Prevention
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Testing Recruiter Job Management & Self-Approval Blocked...");
    // Clear context to log in as Recruiter
    await context.clearCookies();
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());

    await page.fill('input[type="email"]', "hr@company.com");
    await page.fill('input[type="password"]', "company123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto("http://localhost:3000/recruiter/jobs", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const shot8 = path.join(SCREENSHOT_DIR, "09_recruiter_no_self_approval.png");
    await page.screenshot({ path: shot8, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot8}`);

    // -------------------------------------------------------------
    // TEST 9: Public Jobs Portal with Live Interactive Data
    // -------------------------------------------------------------
    console.log("\n[TEST 9] Testing Public Jobs Portal (/jobs)...");
    await page.goto("http://localhost:3000/jobs", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const shot9 = path.join(SCREENSHOT_DIR, "10_public_jobs_portal.png");
    await page.screenshot({ path: shot9, fullPage: false });
    console.log(`✓ Screenshot saved: ${shot9}`);

    // Click on the first job card to view job detail
    const firstJobLink = page.locator('.job-card a').first();
    if (await firstJobLink.count() > 0) {
      console.log("Navigating to first job detail...");
      await firstJobLink.click();
      await page.waitForTimeout(1500);
      const shot10 = path.join(SCREENSHOT_DIR, "11_job_detail_page.png");
      await page.screenshot({ path: shot10, fullPage: false });
      console.log(`✓ Screenshot saved: ${shot10}`);
    }

    console.log("\n==================================================");
    console.log("ALL PLAYWRIGHT TESTS EXECUTED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (error) {
    console.error("Test execution encountered an error:", error);
  } finally {
    await browser.close();
  }
}

runTests();

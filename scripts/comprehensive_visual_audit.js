const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/aaditya/.gemini/antigravity/brain/819bc8d9-3c87-427b-b7bb-f9a68b4d2f5e/audit_screens';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  async function snap(name) {
    const p = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    console.log(`Captured: ${name}.png`);
  }

  // Ensure dark mode first
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) {
    await page.keyboard.press('t');
    await page.waitForTimeout(300);
  }

  // --- DARK MODE SCREENS ---
  // 1. Screener
  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  await snap('dark_01_screener');

  // Strategy Weights toggle
  const weightsBtn = page.locator('button:has-text("Weights")').first();
  if (await weightsBtn.count() > 0) {
    await weightsBtn.click();
    await page.waitForTimeout(300);
    await snap('dark_01_strategy_weights_open');
    await weightsBtn.click(); // toggle closed
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      (document.activeElement)?.blur?.();
      document.body?.focus?.();
    });
  }

  // 2. Charts
  await page.keyboard.press('2');
  await page.waitForTimeout(400);
  await snap('dark_02_candlestick_workspace');

  // 3. Correlation
  await page.keyboard.press('3');
  await page.waitForTimeout(400);
  await snap('dark_03_correlation_matrix');

  // 4. Clusters
  await page.keyboard.press('4');
  await page.waitForTimeout(400);
  await snap('dark_04_kmeans_clusters');

  // 5. Heatmap
  await page.keyboard.press('5');
  await page.waitForTimeout(400);
  await snap('dark_05_sector_heatmap');

  // 6. Lakehouse
  await page.keyboard.press('6');
  await page.waitForTimeout(400);
  await snap('dark_06_lakehouse_telemetry');

  // 7. Macro Panel
  await page.keyboard.press('m');
  await page.waitForTimeout(400);
  await snap('dark_07_macro_context_drawer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 8. AI Analyst
  await page.keyboard.press('a');
  await page.waitForTimeout(400);
  await snap('dark_08_ai_analyst_drawer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 9. Symbol Comparison
  await page.keyboard.press('c');
  await page.waitForTimeout(400);
  await snap('dark_09_symbol_comparison_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 10. Tear-Sheet Modal
  await page.keyboard.press('r');
  await page.waitForTimeout(500);
  await snap('dark_10_institutional_report_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 11. Command Palette
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(400);
  await snap('dark_11_command_palette');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 12. Shortcuts
  await page.keyboard.press('?');
  await page.waitForTimeout(400);
  await snap('dark_12_keyboard_shortcuts_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // --- LIGHT MODE SCREENS ---
  await page.keyboard.press('t');
  await page.waitForTimeout(400);

  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  await snap('light_01_screener');

  await page.keyboard.press('2');
  await page.waitForTimeout(300);
  await snap('light_02_candlestick_workspace');

  await page.keyboard.press('3');
  await page.waitForTimeout(300);
  await snap('light_03_correlation_matrix');

  await page.keyboard.press('4');
  await page.waitForTimeout(300);
  await snap('light_04_kmeans_clusters');

  await page.keyboard.press('5');
  await page.waitForTimeout(300);
  await snap('light_05_sector_heatmap');

  await page.keyboard.press('6');
  await page.waitForTimeout(300);
  await snap('light_06_lakehouse_telemetry');

  await page.keyboard.press('c');
  await page.waitForTimeout(400);
  await snap('light_09_symbol_comparison_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.keyboard.press('r');
  await page.waitForTimeout(500);
  await snap('light_10_institutional_report_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.keyboard.press('m');
  await page.waitForTimeout(400);
  await snap('light_07_macro_context_drawer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.keyboard.press('a');
  await page.waitForTimeout(400);
  await snap('light_08_ai_analyst_drawer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Revert back to dark
  await page.keyboard.press('t');
  await page.waitForTimeout(300);

  // --- MOBILE VIEWPORT ---
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_01_dark_screener.png') });

  await browser.close();
  console.log("=== COMPREHENSIVE AUDIT SCREENSHOTS COMPLETED ===");
}

runAudit().catch(console.error);

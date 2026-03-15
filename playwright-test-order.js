/**
 * Playwright E2E Test: Order Amlodipine via Chatbot
 * Tests the full flow: login → chat → order medicine
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const EMAIL = 'atharvasjoshi2005@gmail.com';
const PASSWORD = 'Atharva@2005';
const MEDICINE = 'amlodipine';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[Browser Error]', msg.text());
  });

  try {
    // ── Step 1: Navigate to login ─────────────────────────────────────────────
    console.log('\n[1/5] Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/01-login-page.png' });
    console.log('    ✓ Login page loaded');

    // ── Step 2: Fill credentials ──────────────────────────────────────────────
    console.log('\n[2/5] Filling credentials...');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.clear();
    await emailInput.fill(EMAIL);
    await passwordInput.clear();
    await passwordInput.fill(PASSWORD);
    await page.screenshot({ path: 'screenshots/02-credentials-filled.png' });
    console.log('    ✓ Credentials entered');

    // ── Step 3: Submit login ──────────────────────────────────────────────────
    console.log('\n[3/5] Submitting login...');
    await page.locator('button[type="submit"]').click();

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-after-login.png' });
    console.log(`    ✓ Logged in! Current URL: ${page.url()}`);

    // ── Step 4: Navigate to chat ──────────────────────────────────────────────
    console.log('\n[4/5] Going to chat page...');
    if (!page.url().endsWith('/')) {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    }

    // Wait for chat input to appear (placeholder is dynamic, use type=text inside form)
    const chatInput = page.locator('input[type="text"]').last();
    await chatInput.waitFor({ timeout: 15000 });
    await page.screenshot({ path: 'screenshots/04-chat-page.png' });
    console.log('    ✓ Chat page ready');

    // ── Step 5: Order the medicine ────────────────────────────────────────────
    console.log(`\n[5/5] Ordering "${MEDICINE}" via chatbot...`);
    await chatInput.fill(`I want to order ${MEDICINE} medicine`);
    await page.screenshot({ path: 'screenshots/05-message-typed.png' });

    // Press Enter to send
    await chatInput.press('Enter');
    console.log('    ✓ Message sent, waiting for AI response...');

    // AI message bubbles have class 'rounded-tl-sm', user bubbles have 'rounded-tr-sm'
    // Wait for at least 2 bubbles (user + AI)
    await page.waitForFunction(() => {
      const bubbles = document.querySelectorAll('[class*="rounded-3xl"]');
      return bubbles.length >= 2;
    }, { timeout: 60000 });
    console.log('    ✓ User message bubble appeared');

    await page.screenshot({ path: 'screenshots/05b-user-message.png' });

    // Wait for streaming cursor to disappear (means AI is done responding)
    console.log('    Waiting for AI to finish streaming...');
    await page.waitForFunction(() => {
      // Pulse cursor disappears when streaming is complete
      const pulseCursors = document.querySelectorAll('.animate-pulse');
      // Also check that we have an AI bubble (rounded-tl-sm)
      const aiBubbles = document.querySelectorAll('[class*="rounded-tl-sm"]');
      return aiBubbles.length > 0 && pulseCursors.length === 0;
    }, { timeout: 90000, polling: 1000 });

    await page.screenshot({ path: 'screenshots/06-ai-response.png' });
    console.log('    ✓ AI response complete!');

    // Extract AI message text (last bubble with rounded-tl-sm = AI)
    const aiMessages = await page.locator('[class*="rounded-tl-sm"]').allTextContents();
    console.log('\n    AI Response:');
    aiMessages.forEach(m => console.log(`    > ${m.substring(0, 300).trim()}`));

    console.log('\n✅ TEST PASSED — Screenshots saved in ./screenshots/');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    await page.screenshot({ path: 'screenshots/error.png' });
    process.exitCode = 1;
  } finally {
    console.log('\nBrowser stays open for 5 seconds for inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();

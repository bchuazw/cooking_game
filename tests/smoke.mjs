// Headless smoke test for the current polished first-run dish.
// It verifies that Hainanese Chicken Rice can be opened, played through, and
// completed on a mobile-sized viewport without fatal console/page errors.

import { chromium } from 'playwright';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';

const NOISE_RE = /(Failed to load resource.*manifest|favicon|fonts\.googleapis|fonts\.gstatic|ERR_CERT|AudioContext was not allowed|workbox|service worker|playwright|sw\.js|registerSW)/i;
const FATAL_RE = /(\[pageerror\]|Uncaught|SyntaxError|TypeError|ReferenceError|Cannot read|Cannot access|\[test\])/i;

function attachLogs(page, errs) {
  page.on('console', (msg) => {
    const s = `[${msg.type()}] ${msg.text()}`;
    if (NOISE_RE.test(s)) return;
    if (msg.type() === 'error') errs.push(s);
  });
  page.on('pageerror', (err) => {
    const s = `[pageerror] ${err.message}`;
    if (NOISE_RE.test(s)) return;
    errs.push(s);
  });
}

async function primeEnglishFirstRun(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem(
      'hawker-mama:v1',
      JSON.stringify({
        schema: 1,
        locale: 'en',
        firstLaunchSeen: true,
        acceptedNoticeSeen: true,
        halal: false,
        music: 0,
        sfx: 0,
        voice: 0,
        reducedMotion: true,
        describeStep: false,
        bestStars: {},
        results: [],
        dailyDone: {},
        bestCombo: 0,
      }),
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
}

async function dragMouse(page, from, to, steps = 14) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

async function openChickenRice(page) {
  await page.getByRole('button', { name: /Tap to start/i }).click();
  await page.getByRole('button', { name: /^Hainanese Chicken Rice$/i }).first().click({ force: true });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Start cooking/i }).first().evaluate((el) => el.click());
  await page.getByText('Poach the chicken').waitFor({ timeout: 10000 });
}

async function playChickenRice(page) {
  // Step 1: drag thermometer to the target band.
  await page.mouse.move(354, 650);
  await page.mouse.down();
  await page.mouse.move(354, 430, { steps: 8 });
  await page.waitForTimeout(2400);
  await page.mouse.up();

  // Step 2: drag chicken into the enlarged ice bowl target.
  await page.getByText('Ice bath').waitFor({ timeout: 12000 });
  await page.mouse.move(121, 493);
  await page.mouse.down();
  await page.mouse.move(282, 433, { steps: 14 });
  await page.waitForTimeout(650);
  await page.mouse.up();

  // Step 3: tap the glowing ingredients in order.
  await page.getByText('Rice aromatics').waitFor({ timeout: 12000 });
  for (const name of [/shallot beat 1/i, /garlic beat 2/i, /ginger beat 3/i, /pandan beat 4/i]) {
    await page.getByRole('button', { name }).evaluate((el) => el.click());
    await page.waitForTimeout(250);
  }

  // Step 4: alternate pestle taps.
  await page.getByText('Pound the sauce').waitFor({ timeout: 12000 });
  const left = page.getByRole('button', { name: /left tap/i });
  const right = page.getByRole('button', { name: /right tap/i });
  for (let i = 0; i < 20; i++) {
    await (i % 2 === 0 ? left : right).evaluate((el) => el.click());
    await page.waitForTimeout(25);
  }

  // Step 5: place chicken, place garnish, then paint sauce over the rice.
  await page.getByText('Plate').waitFor({ timeout: 12000 });
  const plateBox = await page.locator('svg[viewBox="0 0 360 460"]').first().boundingBox();
  if (!plateBox) throw new Error('plate svg not found');
  const p = (x, y) => ({
    x: plateBox.x + (x / 360) * plateBox.width,
    y: plateBox.y + (y / 460) * plateBox.height,
  });

  await dragMouse(page, p(70, 320), p(180, 180));
  await page.waitForTimeout(300);
  await dragMouse(page, p(250, 330), p(230, 206));
  await page.waitForTimeout(300);

  await page.mouse.move(p(104, 174).x, p(104, 174).y);
  await page.mouse.down();
  const rows = [164, 170, 176, 182, 186, 160, 174, 184, 168, 180];
  for (let r = 0; r < rows.length; r++) {
    const y = rows[r];
    const xs = r % 2 === 0
      ? [112, 136, 160, 184, 208, 232, 248]
      : [248, 224, 200, 176, 152, 128, 112];
    for (const x of xs) {
      await page.mouse.move(p(x, y).x, p(x, y).y, { steps: 2 });
    }
  }
  await page.mouse.up();
  await page.waitForTimeout(900);

  await page.getByRole('button', { name: /done|I'm done/i }).evaluate((el) => el.click());
  await page.getByText('All done!').waitFor({ timeout: 12000 });
}

async function main() {
  const errs = [];
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  attachLogs(page, errs);

  let bodyText = '';
  try {
    await primeEnglishFirstRun(page);
    await openChickenRice(page);
    await playChickenRice(page);
    bodyText = await page.locator('body').innerText();
    if (!bodyText.includes('All done!')) errs.push('[test] completion screen not reached');
  } catch (e) {
    errs.push(`[test] ${e?.message ?? e}`);
    try {
      await page.screenshot({ path: path.join(os.tmpdir(), 'smoke-chicken-rice-fail.png') });
    } catch {
      // Best-effort screenshot only.
    }
  } finally {
    await page.close();
    await ctx.close();
    await browser.close();
  }

  const fatal = errs.filter((e) => FATAL_RE.test(e) || /\[error\]/.test(e));
  const ok = fatal.length === 0 && bodyText.includes('All done!');
  console.log('\n=== Smoke summary ===');
  console.log(`${ok ? 'OK  ' : 'FAIL'} chicken-rice full mobile playthrough`);
  if (fatal.length) for (const e of fatal.slice(0, 8)) console.log(`     ${e}`);
  if (ok) {
    const resultLines = bodyText.split('\n').filter(Boolean).slice(0, 16).join(' | ');
    console.log(`     ${resultLines}`);
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

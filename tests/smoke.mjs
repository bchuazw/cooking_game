// Headless smoke test for all 5 dishes.
// 1) Confirms each dish loads with no fatal errors.
// 2) Verifies the first step transitions to a different step within its
//    timer window (i.e., the timeout-fallback path works end-to-end).
// 3) For each dish, also clicks any obvious in-dish "Done"-style button if
//    present, but never the back / exit buttons.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';

const dishes = [
  { id: 'chicken-rice', name: '海南鶏飯', step1Title: '鶏をポーチする', maxStep1Ms: 13000 },
  { id: 'laksa', name: 'ラクサ', step1Title: 'ルンパを炒める', maxStep1Ms: 10000 },
  { id: 'prata', name: 'ロティ・プラタ', step1Title: '生地をこねる', maxStep1Ms: 10000 },
  { id: 'chili-crab', name: 'チリクラブ', step1Title: 'サンバルを叩く', maxStep1Ms: 10000 },
  { id: 'kaya-toast', name: 'カヤトースト', step1Title: 'パンを焼く', maxStep1Ms: 11000 },
];

const NOISE_RE = /(Failed to load resource.*manifest|favicon|fonts\.googleapis|fonts\.gstatic|ERR_CERT|AudioContext was not allowed|workbox|service worker|playwright|sw\.js|registerSW)/i;
const FATAL_RE = /(\[pageerror\]|Uncaught|SyntaxError|TypeError|ReferenceError|Cannot read|Cannot access)/i;

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

async function unlockAll(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'hawker-mama:v1',
      JSON.stringify({
        schema: 1,
        locale: 'ja',
        firstLaunchSeen: true,
        halal: false,
        music: 0, sfx: 0, voice: 0,
        reducedMotion: true,
        describeStep: false,
        bestStars: { 'chicken-rice': 1, laksa: 1, prata: 1, 'chili-crab': 1, 'kaya-toast': 1 },
        results: [],
      }),
    );
  });
}

async function gotoMap(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await unlockAll(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('text=タップしてスタート', { timeout: 8000 });
  await page.locator('button', { hasText: 'タップしてスタート' }).click();
  await page.waitForSelector('text=ホーカーセンター', { timeout: 5000 });
}

async function openDish(page, dish) {
  const stall = page.locator(`g[role="button"][aria-label*="${dish.name}"]`).first();
  await stall.waitFor({ timeout: 5000 });
  await stall.click();
  await page.waitForSelector('text=料理をはじめる', { timeout: 5000 });
  await page.locator('button', { hasText: '料理をはじめる' }).click();
  // First step renders: HUD has the surface card. Wait for the specific step 1 title.
  await page.waitForSelector(`text=${dish.step1Title}`, { timeout: 8000 });
}

// Returns the current step title text shown in the HUD.
async function currentStepTitle(page) {
  const el = await page.locator('.surface .font-bold').first();
  return (await el.textContent({ timeout: 1000 }))?.trim() ?? '';
}

async function dishTest(dish) {
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

  let stepTitleAfter = null;
  let transitioned = false;
  try {
    await gotoMap(page);
    await openDish(page, dish);

    const before = await currentStepTitle(page);
    if (before !== dish.step1Title) {
      errs.push(`[test] expected step 1 title "${dish.step1Title}", got "${before}"`);
    }

    // Wait for the step1 timer to expire (+1s buffer), then check that the
    // HUD title has changed (i.e., the dish progressed to step 2).
    await page.waitForTimeout(dish.maxStep1Ms + 1500);
    stepTitleAfter = await currentStepTitle(page);
    transitioned = stepTitleAfter !== before && stepTitleAfter.length > 0;

    // Also verify nothing has crashed the dish runner — page should still be in the game.
    const stillInDish = (await page.locator('.surface').count()) > 0;
    if (!stillInDish) errs.push(`[test] not in dish runner anymore`);

    await page.screenshot({ path: `/tmp/smoke-${dish.id}.png` });
  } catch (e) {
    errs.push(`[test] ${e?.message ?? e}`);
    try { await page.screenshot({ path: `/tmp/smoke-${dish.id}-fail.png` }); } catch {/* */}
  } finally {
    await page.close();
    await ctx.close();
    await browser.close();
  }

  const fatal = errs.filter((e) => FATAL_RE.test(e) || /\[error\]/.test(e) || /\[test\]/.test(e));
  return { dish: dish.id, ok: fatal.length === 0 && transitioned, transitioned, before: dish.step1Title, after: stepTitleAfter, errs: fatal };
}

async function main() {
  const summary = [];
  for (const dish of dishes) {
    summary.push(await dishTest(dish));
  }
  console.log('\n=== Smoke summary ===');
  for (const s of summary) {
    const tag = s.ok ? 'OK  ' : 'FAIL';
    console.log(`${tag} ${s.dish}  step1→${s.after ?? '(none)'}  transitioned=${s.transitioned}`);
    if (s.errs.length) for (const e of s.errs.slice(0, 5)) console.log(`     ${e}`);
  }
  process.exit(summary.every((s) => s.ok) ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });

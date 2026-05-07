// Headless mobile smoke tests for the currently polished dishes.
// They verify that the polished dishes can be opened, played through, and
// completed without fatal console/page errors.

import { chromium } from 'playwright';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';

const NOISE_RE = /(Failed to load resource.*manifest|favicon|fonts\.googleapis|fonts\.gstatic|ERR_CERT|AudioContext was not allowed|workbox|service worker|playwright|sw\.js|registerSW)/i;
const FATAL_RE = /(\[pageerror\]|Uncaught|SyntaxError|TypeError|ReferenceError|Cannot read|Cannot access|\[test\]|\[error\])/i;

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

async function primeEnglishRun(page, bestStars = {}) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((stars) => {
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
        bestStars: stars,
        results: [],
        dailyDone: {},
        bestCombo: 0,
      }),
    );
  }, bestStars);
  await page.reload({ waitUntil: 'networkidle' });
}

async function dragMouse(page, from, to, steps = 14) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

async function circleMouse(page, cx, cy, radius, loops, delay = 6) {
  await page.mouse.move(cx + radius, cy);
  await page.mouse.down();
  for (let i = 1; i <= loops * 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    await page.mouse.move(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    await page.waitForTimeout(delay);
  }
  await page.mouse.up();
}

async function svgPoint(page, x, y) {
  return await page.locator('svg[viewBox="0 0 360 460"]').first().evaluate((svg, p) => {
    const pt = svg.createSVGPoint();
    pt.x = p.x;
    pt.y = p.y;
    const out = pt.matrixTransform(svg.getScreenCTM());
    return { x: out.x, y: out.y };
  }, { x, y });
}

async function openChickenRice(page) {
  await page.getByRole('button', { name: /Tap to start/i }).click();
  await page.getByRole('button', { name: /^Hainanese Chicken Rice$/i }).first().click({ force: true });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Start cooking/i }).first().evaluate((el) => el.click());
  await page.getByText('Poach the chicken').waitFor({ timeout: 10000 });
}

async function playChickenRice(page) {
  await page.mouse.move(354, 650);
  await page.mouse.down();
  await page.mouse.move(354, 430, { steps: 8 });
  await page.waitForTimeout(2400);
  await page.mouse.up();

  await page.getByText('Ice bath').waitFor({ timeout: 12000 });
  await page.mouse.move(121, 493);
  await page.mouse.down();
  await page.mouse.move(282, 433, { steps: 14 });
  await page.waitForTimeout(650);
  await page.mouse.up();

  await page.getByText('Rice aromatics').waitFor({ timeout: 12000 });
  for (const name of [/shallot beat 1/i, /garlic beat 2/i, /ginger beat 3/i, /pandan beat 4/i]) {
    await page.getByRole('button', { name }).evaluate((el) => el.click());
    await page.waitForTimeout(250);
  }

  await page.getByText('Pound the sauce').waitFor({ timeout: 12000 });
  const left = page.getByRole('button', { name: /left tap/i });
  const right = page.getByRole('button', { name: /right tap/i });
  for (let i = 0; i < 20; i++) {
    await (i % 2 === 0 ? left : right).evaluate((el) => el.click());
    await page.waitForTimeout(25);
  }

  await page.getByText('Plate').waitFor({ timeout: 12000 });
  const p = (x, y) => svgPoint(page, x, y);

  await dragMouse(page, await p(70, 320), await p(180, 180));
  await page.waitForTimeout(300);
  await dragMouse(page, await p(250, 330), await p(230, 206));
  await page.waitForTimeout(300);

  const start = await p(104, 174);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const rows = [164, 170, 176, 182, 186, 160, 174, 184, 168, 180];
  for (let r = 0; r < rows.length; r++) {
    const y = rows[r];
    const xs = r % 2 === 0
      ? [112, 136, 160, 184, 208, 232, 248]
      : [248, 224, 200, 176, 152, 128, 112];
    for (const x of xs) {
      const point = await p(x, y);
      await page.mouse.move(point.x, point.y, { steps: 2 });
    }
  }
  await page.mouse.up();
  await page.waitForTimeout(900);

  await page.getByRole('button', { name: /done|I'm done/i }).evaluate((el) => el.click());
  await page.getByText('All done!').waitFor({ timeout: 12000 });
}

async function openLaksa(page) {
  await page.getByRole('button', { name: /Tap to start/i }).click();
  await page.getByText('Two dish beta build').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: /^Laksa$/i }).last().click({ force: true });
  await page.getByText('Katong Laksa').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: /Start cooking/i }).first().evaluate((el) => el.click());
  await page.getByText('Bloom the rempah').waitFor({ timeout: 10000 });
}

async function playLaksa(page) {
  await page.waitForTimeout(1000);
  let point = await svgPoint(page, 272, 230);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  for (let i = 1; i <= 76; i++) {
    const a = (i / 80) * Math.PI * 2;
    point = await svgPoint(page, 180 + Math.cos(a) * 92, 230 + Math.sin(a) * 92);
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();

  await page.getByText('Add in order').waitFor({ timeout: 12000 });
  for (const label of ['stock', 'coconut', 'tau pok']) {
    await page.getByRole('button').filter({ hasText: label }).first().click({ force: true });
    await page.waitForTimeout(260);
  }

  await page.getByText('Noodle bath').waitFor({ timeout: 12000 });
  const hold = page.getByRole('button', { name: /Hold to blanch/i });
  const hb = await hold.boundingBox();
  if (!hb) throw new Error('hold button missing');
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3300);
  await page.mouse.up();

  await page.getByText('Garnish').waitFor({ timeout: 12000 });
  await page.waitForTimeout(600);
  const target = await svgPoint(page, 180, 235);
  for (const token of [[68, 405], [151, 405], [235, 405], [318, 405]]) {
    await dragMouse(page, await svgPoint(page, token[0], token[1]), target, 18);
    await page.waitForTimeout(300);
  }
  await page.getByText('All done!').waitFor({ timeout: 12000 });
}

async function openPrata(page) {
  await page.getByRole('button', { name: /Tap to start/i }).click();
  await page.getByText('Three dish beta build').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: /^Roti Prata$/i }).last().evaluate((el) => el.click());
  await page.getByRole('button', { name: /Start cooking/i }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: /Start cooking/i }).first().evaluate((el) => el.click());
  await page.getByText('Knead the dough').waitFor({ timeout: 10000 });
}

async function playPrata(page) {
  await page.waitForTimeout(700);
  await circleMouse(page, 195, 455, 84, 5);

  await page.getByText('Slap-stretch').waitFor({ timeout: 12000 });
  await page.waitForTimeout(500);
  await page.mouse.move(70, 430);
  await page.mouse.down();
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(i % 2 ? 70 : 320, 430 + (i % 2 ? -8 : 8), { steps: 10 });
    await page.waitForTimeout(55);
  }
  await page.mouse.up();

  await page.getByText('Flick-flip').waitFor({ timeout: 12000 });
  await page.waitForTimeout(500);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /^Flick$/i }).click({ force: true });
    await page.waitForTimeout(1040);
    await page.getByRole('button', { name: /^Catch$/i }).click({ force: true });
    await page.waitForTimeout(560);
  }

  await page.getByText('Fold', { exact: true }).waitFor({ timeout: 12000 });
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: new RegExp(`fold corner ${i}`, 'i') }).click({ force: true });
    await page.waitForTimeout(280);
  }
  await page.getByText('All done!').waitFor({ timeout: 12000 });
}

async function runDish(browser, spec) {
  const errs = [];
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
    await primeEnglishRun(page, spec.bestStars);
    await spec.open(page);
    await spec.play(page);
    bodyText = await page.locator('body').innerText();
    if (!bodyText.includes('All done!')) errs.push('[test] completion screen not reached');
  } catch (e) {
    errs.push(`[test] ${e?.message ?? e}`);
    try {
      await page.screenshot({ path: path.join(os.tmpdir(), `smoke-${spec.id}-fail.png`) });
    } catch {
      // Best-effort screenshot only.
    }
  } finally {
    await page.close();
    await ctx.close();
  }

  const fatal = errs.filter((e) => FATAL_RE.test(e));
  return {
    id: spec.id,
    ok: fatal.length === 0 && bodyText.includes('All done!'),
    fatal,
    bodyText,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const specs = [
    { id: 'chicken-rice', bestStars: {}, open: openChickenRice, play: playChickenRice },
    { id: 'laksa', bestStars: { 'chicken-rice': 3 }, open: openLaksa, play: playLaksa },
    { id: 'prata', bestStars: { 'chicken-rice': 3, laksa: 3 }, open: openPrata, play: playPrata },
  ];

  const results = [];
  try {
    for (const spec of specs) {
      results.push(await runDish(browser, spec));
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Smoke summary ===');
  for (const result of results) {
    console.log(`${result.ok ? 'OK  ' : 'FAIL'} ${result.id} full mobile playthrough`);
    if (result.fatal.length) {
      for (const e of result.fatal.slice(0, 8)) console.log(`     ${e}`);
    } else if (result.bodyText) {
      const resultLines = result.bodyText.split('\n').filter(Boolean).slice(0, 16).join(' | ');
      console.log(`     ${resultLines}`);
    }
  }

  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

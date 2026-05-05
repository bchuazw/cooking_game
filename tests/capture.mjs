// End-to-end screenshot capture for the Hawker Mama README.
// Boots a Chromium at iPhone-12 viewport, walks through the full flow, and
// drops PNGs into handover/screenshots/.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'handover', 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';

let stepNo = 0;
async function shoot(page, name) {
  stepNo++;
  const file = join(OUT, `${String(stepNo).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`📸 ${file.split('/').slice(-2).join('/')}`);
}

async function unlockAll(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'hawker-mama:v1',
      JSON.stringify({
        schema: 1, locale: 'ja',
        firstLaunchSeen: true, halal: false,
        music: 0, sfx: 0, voice: 0,
        reducedMotion: true, describeStep: false,
        bestStars: { 'chicken-rice': 1, laksa: 1, prata: 1, 'chili-crab': 1, 'kaya-toast': 1 },
        results: [],
      }),
    );
  });
}

async function clearAll(page) {
  await page.evaluate(() => localStorage.clear());
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('  pageerror:', e.message));

  // ------- 1. First-launch flow (locale picker) -------
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await clearAll(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('text=日本語', { timeout: 8000 });
  await page.waitForTimeout(400);
  await shoot(page, 'first-launch-locale');

  // ------- 2. First-launch welcome -------
  await page.locator('button', { hasText: '日本語' }).click();
  await page.waitForSelector('text=ようこそ', { timeout: 5000 });
  await page.waitForTimeout(500);
  await shoot(page, 'first-launch-welcome');

  // ------- 3. Title screen -------
  await page.locator('button', { hasText: 'はじめる' }).click();
  await page.waitForSelector('text=タップしてスタート', { timeout: 5000 });
  await page.waitForTimeout(700);
  await shoot(page, 'title-screen');

  // ------- 4. Hawker map -------
  // Pre-unlock all so map shows the full state
  await unlockAll(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'タップしてスタート' }).click();
  await page.waitForSelector('text=ホーカーセンター', { timeout: 5000 });
  await page.waitForTimeout(600);
  await shoot(page, 'hawker-map');

  // ------- 5. Dish intro (Chicken Rice) -------
  await page.locator(`g[role="button"][aria-label*="海南鶏飯"]`).first().click();
  await page.waitForSelector('text=料理をはじめる', { timeout: 5000 });
  await page.waitForTimeout(500);
  await shoot(page, 'dish-intro-chicken-rice');

  // ------- 6. Step 1: Poach (drag thermometer to green band) -------
  await page.locator('button', { hasText: '料理をはじめる' }).click();
  await page.waitForSelector('text=鶏をポーチする', { timeout: 8000 });
  // The thermometer slider is on the right edge. Drag the knob to the middle (green band).
  const sliderRect = await page.locator('div.relative.w-12').first().boundingBox();
  if (sliderRect) {
    const cx = sliderRect.x + sliderRect.width / 2;
    const cy = sliderRect.y + sliderRect.height * 0.4; // upper-middle = hot side, ~80°C
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy + 6);
    await page.waitForTimeout(800);
  }
  await shoot(page, 'step1-poach');
  if (sliderRect) await page.mouse.up();
  // Wait for step 1 timer to expire (12s)
  await page.waitForTimeout(13000);

  // ------- 7. Step 2: Ice bath (drag chicken to bowl) -------
  await page.waitForSelector('text=氷水でしめる', { timeout: 5000 });
  // The pot is left, bowl is right. SVG viewBox 360x380. Drag from container ≈ pot to bowl.
  const stage = await page.locator('div.relative.w-full.aspect-\\[360\\/460\\], div.absolute.inset-0.touch-none').first().boundingBox();
  // Fallback: drag from (90, 580) to (260, 580) which roughly covers pot→bowl on iPhone-12
  await page.mouse.move(90, 540);
  await page.mouse.down();
  await page.mouse.move(280, 540, { steps: 12 });
  await page.waitForTimeout(700);
  await shoot(page, 'step2-icebath');
  await page.mouse.up();
  await page.waitForTimeout(6000); // step 2 max 5.5s + buffer

  // ------- 8. Step 3: Rhythm-tap aromatics -------
  await page.waitForSelector('text=香味野菜を加える', { timeout: 5000 });
  await page.waitForTimeout(900); // let some beats elapse
  // Tap each ingredient button in turn
  const ingredientButtons = page.locator('button[aria-label^="beat"]');
  const ingredientCount = await ingredientButtons.count();
  for (let i = 0; i < ingredientCount; i++) {
    try { await ingredientButtons.nth(i).click({ timeout: 200, force: true }); } catch {/* */}
    await page.waitForTimeout(900);
  }
  await shoot(page, 'step3-aromatics');
  await page.waitForTimeout(2500); // step 3 has 5.5s timer; we've used ~5s

  // ------- 9. Step 4: Pestle (alternating L/R) -------
  await page.waitForSelector('text=タレを叩く', { timeout: 5000 });
  const left = page.locator('button[aria-label="left tap"]');
  const right = page.locator('button[aria-label="right tap"]');
  for (let i = 0; i < 24; i++) {
    try { await (i % 2 === 0 ? left : right).click({ timeout: 100, force: true }); } catch {/* */}
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);
  await shoot(page, 'step4-pestle');
  await page.waitForTimeout(5000); // step 4 has 8s timer

  // ------- 10. Step 5: Plate (drag items + paint sauce) -------
  await page.waitForSelector('text=盛り付け', { timeout: 5000 });
  // Plate area is ~center of the aspect-fixed wrapper. We approximate.
  // wrapper bounding box:
  const wrap = await page.locator('div.aspect-\\[360\\/460\\]').first().boundingBox();
  if (wrap) {
    const w = wrap.width, h = wrap.height;
    const plateCx = wrap.x + w * 0.5;
    const plateCy = wrap.y + h * (180 / 460);

    const drop = async (sx, sy) => {
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(plateCx, plateCy, { steps: 8 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(200);
    };
    // chicken (start ~70, 320 in viewBox)
    await drop(wrap.x + w * (70 / 360), wrap.y + h * (320 / 460));
    // cucumber (start ~230, 330)
    await drop(wrap.x + w * (230 / 360), wrap.y + h * (330 / 460));
    // coriander (start ~290, 330)
    await drop(wrap.x + w * (290 / 360), wrap.y + h * (330 / 460));
    // paint sauce: small circle around plate center
    await page.mouse.move(plateCx - 30, plateCy);
    await page.mouse.down();
    for (let a = 0; a < 18; a++) {
      const ang = (a / 18) * Math.PI * 2;
      await page.mouse.move(plateCx + 25 * Math.cos(ang), plateCy + 12 * Math.sin(ang));
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
  }
  await shoot(page, 'step5-plate');

  // Tap "Done"
  await page.locator('button', { hasText: 'できた！' }).click({ timeout: 1000 }).catch(() => {});
  await page.waitForSelector('text=できあがり', { timeout: 5000 });
  await page.waitForTimeout(800);
  await shoot(page, 'dish-complete');

  // ------- 11. Culture card -------
  await page.locator('button', { hasText: '文化カードを読む' }).click();
  await page.waitForSelector('text=知ってた？', { timeout: 5000 });
  await page.waitForTimeout(500);
  await shoot(page, 'culture-card');

  // ------- 12. Settings -------
  await page.locator('button', { hasText: '戻る' }).click();
  await page.waitForSelector('text=ホーカーセンター', { timeout: 5000 });
  // settings cog
  await page.locator('button[aria-label="設定"]').click();
  await page.waitForSelector('text=設定', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shoot(page, 'settings');

  // ------- 13. Leaderboard -------
  await page.locator('button', { hasText: '戻る' }).click();
  await page.waitForSelector('text=ホーカーセンター', { timeout: 5000 });
  await page.locator('button[aria-label="スコア"]').click();
  await page.waitForSelector('text=スコア', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shoot(page, 'leaderboard');

  // ------- 14. EN locale title -------
  await page.locator('button', { hasText: '戻る' }).click();
  await page.waitForSelector('text=ホーカーセンター', { timeout: 5000 });
  await page.locator('button[aria-label="設定"]').click();
  await page.locator('button', { hasText: 'English' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Back' }).click();
  await page.waitForTimeout(300);
  await shoot(page, 'hawker-map-en');

  // ------- 15. Bonus: Laksa step 1 (rempah bloom) -------
  await page.locator(`g[role="button"][aria-label*="Laksa"]`).first().click();
  await page.waitForSelector('text=Start cooking', { timeout: 5000 });
  await page.locator('button', { hasText: 'Start cooking' }).click();
  await page.waitForSelector('text=Bloom', { timeout: 8000 });
  // Make 3 quick circles in the wok center
  const wrapL = await page.locator('div.aspect-\\[360\\/460\\]').first().boundingBox();
  if (wrapL) {
    const cx = wrapL.x + wrapL.width * 0.5;
    const cy = wrapL.y + wrapL.height * (200 / 460);
    await page.mouse.move(cx + 60, cy);
    await page.mouse.down();
    for (let a = 0; a < 30; a++) {
      const ang = (a / 8) * Math.PI;
      await page.mouse.move(cx + 60 * Math.cos(ang), cy + 50 * Math.sin(ang));
      await page.waitForTimeout(35);
    }
    await page.mouse.up();
  }
  await shoot(page, 'laksa-bloom');

  await browser.close();
  console.log(`\n✅ ${stepNo} screenshots saved to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(2); });

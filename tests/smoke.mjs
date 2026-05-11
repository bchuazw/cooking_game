import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const URL = BASE.includes('?') ? `${BASE}&pixelCheck=1` : `${BASE}?pixelCheck=1`;

const TARGETS = {
  pantry: { name: 'Rice Pantry', x: -1.6, z: -2.0 },
  riceCooker: { name: 'Rice Cooker', x: 1.75, z: -2.0 },
  plate: { name: 'Plate Station', x: -0.15, z: 2.0 },
  fridge: { name: 'Fridge', x: -3.15, z: -1.25 },
  board: { name: 'Cutting Board', x: 0.05, z: -2.0 },
  pot: { name: 'Stock Pot', x: 3.1, z: -0.35 },
  mortar: { name: 'Chili Mortar', x: -2.4, z: 1.6 },
  serve: { name: 'Serve Window', x: 1.75, z: 2.0 },
};

async function readPosition(page) {
  const text = await page.getByTestId('player-position').innerText();
  const [x, z] = text.split(',').map(Number);
  return { x, z };
}

async function holdKeys(page, keys, ms = 90) {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  for (const key of keys) await page.keyboard.up(key);
  await page.waitForTimeout(35);
}

async function moveToStation(page, id) {
  const target = TARGETS[id];
  for (let i = 0; i < 80; i += 1) {
    if (await page.getByTestId('result-stars').count()) return;
    const nearby = await page.getByTestId('nearby-station').innerText();
    if (nearby.includes(target.name)) return;
    const pos = await readPosition(page);
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const keys = [];
    if (Math.abs(dx) > 0.16) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(dz) > 0.16) keys.push(dz > 0 ? 'ArrowDown' : 'ArrowUp');
    if (!keys.length) return;
    await holdKeys(page, keys, 85);
  }
  throw new Error(`Could not reach ${target.name}`);
}

async function waitHeld(page, text, timeout = 9000) {
  const pattern = text instanceof RegExp ? text : new RegExp(text, 'i');
  await page.waitForFunction(
    ([source, flags]) => new RegExp(source, flags).test(document.querySelector('[data-testid="held-item"]')?.textContent ?? ''),
    [pattern.source, pattern.flags],
    { timeout },
  );
}

async function waitResult(page) {
  await page.getByTestId('result-stars').waitFor({ timeout: 10000 });
}

async function playFullOrder(page) {
  await moveToStation(page, 'pantry');
  await waitHeld(page, /uncooked rice/i);

  await moveToStation(page, 'riceCooker');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'fridge');
  await waitHeld(page, /raw chicken/i);

  await moveToStation(page, 'board');
  await waitHeld(page, /cut chicken/i);

  await moveToStation(page, 'pot');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'mortar');
  await waitHeld(page, /chili sauce/i);

  await moveToStation(page, 'plate');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'riceCooker');
  await waitHeld(page, /fragrant rice/i, 12000);

  await moveToStation(page, 'plate');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'pot');
  await waitHeld(page, /poached chicken/i, 12000);

  await moveToStation(page, 'plate');
  await waitHeld(page, /chicken rice/i);

  await moveToStation(page, 'serve');
  await waitResult(page);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const errors = [];
  page.on('pageerror', (error) => errors.push(`[pageerror] ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const fps = await page.evaluate(async () => {
    let frames = 0;
    const start = performance.now();
    return await new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        if (now - start >= 2000) resolve(Math.round((frames * 1000) / (now - start)));
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });

  await page.getByTestId('start-chicken-rice').click();
  await playFullOrder(page);
  const stars = await page.getByTestId('result-stars').innerText();
  const canvasPixels = await page.locator('canvas').first().evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 0;
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let colored = 0;
    for (let i = 0; i < pixels.length; i += 24) {
      if (pixels[i + 3] > 0 && pixels[i] + pixels[i + 1] + pixels[i + 2] > 40) colored += 1;
    }
    return colored;
  });

  await browser.close();

  console.log('\n=== Auto-station mobile smoke ===');
  console.log(`OK stars: ${stars}`);
  console.log(`OK fps sample: ${fps}`);
  console.log(`OK canvas pixels: ${canvasPixels}`);

  if (!stars.includes('\u2605') || fps < 45 || canvasPixels < 1000 || errors.length) {
    errors.forEach((error) => console.log(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

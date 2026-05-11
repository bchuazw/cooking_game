import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const URL = BASE.includes('?') ? `${BASE}&pixelCheck=1` : `${BASE}?pixelCheck=1`;

async function drag(page, from, to, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(45);
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

async function scrubVertical(page, x, topY, bottomY, cycles = 9) {
  await page.mouse.move(x, topY);
  await page.mouse.down();
  await page.waitForTimeout(45);
  for (let i = 0; i < cycles; i++) {
    await page.mouse.move(x, i % 2 ? topY : bottomY, { steps: 5 });
    await page.waitForTimeout(35);
  }
  await page.mouse.up();
}

async function playPrep(page) {
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('chop-timing').click();
    await page.waitForTimeout(720);
  }
}

async function playStir(page) {
  const pad = await page.getByTestId('toss-pad').boundingBox();
  if (!pad) throw new Error('toss pad missing');
  const y = pad.y + pad.height * 0.58;
  for (let i = 0; i < 4; i++) {
    const fromX = pad.x + pad.width * (i % 2 ? 0.82 : 0.18);
    const toX = pad.x + pad.width * (i % 2 ? 0.18 : 0.82);
    await drag(page, { x: fromX, y }, { x: toX, y: y + (i % 2 ? -8 : 8) }, 14);
    await page.waitForTimeout(260);
  }
}

async function playSimmer(page) {
  const rail = await page.getByTestId('simmer-slider').boundingBox();
  if (!rail) throw new Error('simmer slider missing');
  const target = { x: rail.x + rail.width / 2, y: rail.y + rail.height * 0.38 };
  await drag(page, { x: target.x, y: rail.y + rail.height * 0.82 }, target, 12);
  await page.getByRole('heading', { name: 'Make the Chili Sauce' }).waitFor({ timeout: 6500 });
}

async function playSauce(page) {
  for (const id of ['chili', 'ginger', 'garlic', 'lime']) {
    const mortar = await page.getByTestId('mortar-pad').boundingBox();
    const token = await page.getByTestId(`sauce-token-${id}`).boundingBox();
    if (!mortar || !token) throw new Error(`sauce drag targets missing for ${id}`);
    await drag(
      page,
      { x: token.x + token.width / 2, y: token.y + token.height / 2 },
      { x: mortar.x + mortar.width / 2, y: mortar.y + mortar.height / 2 },
      12,
    );
    await page.waitForTimeout(170);
  }
  const pad = await page.getByTestId('mortar-pad').boundingBox();
  if (!pad) throw new Error('mortar pad missing');
  await scrubVertical(page, pad.x + pad.width * 0.52, pad.y + pad.height * 0.28, pad.y + pad.height * 0.84, 10);
}

async function playPlate(page) {
  const targets = {
    rice: { x: 0.38, y: 0.58 },
    chicken: { x: 0.58, y: 0.56 },
    cucumber: { x: 0.52, y: 0.76 },
    chili: { x: 0.73, y: 0.7 },
  };
  for (const id of ['rice', 'chicken', 'cucumber', 'chili']) {
    const plate = await page.getByTestId('plate-drop').boundingBox();
    const token = await page.getByTestId(`plate-token-${id}`).boundingBox();
    if (!plate || !token) throw new Error(`plate target missing for ${id}`);
    await drag(
      page,
      { x: token.x + token.width / 2, y: token.y + token.height / 2 },
      { x: plate.x + plate.width * targets[id].x, y: plate.y + plate.height * targets[id].y },
      14,
    );
    await page.waitForTimeout(180);
  }
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
        if (now - start >= 2500) resolve(Math.round((frames * 1000) / (now - start)));
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });

  await page.getByTestId('start-chicken-rice').click();
  for (const play of [playPrep, playStir, playSimmer, playSauce, playPlate]) {
    await play(page);
    await page.waitForTimeout(850);
  }

  await page.getByTestId('result-stars').waitFor({ timeout: 10000 });
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

  console.log('\n=== Chicken Rice fresh redesign smoke ===');
  console.log(`OK stars: ${stars}`);
  console.log(`OK menu fps sample: ${fps}`);
  console.log(`OK canvas pixels: ${canvasPixels}`);

  if (!stars.includes('\u2605') || canvasPixels < 1000 || errors.length) {
    errors.forEach((error) => console.log(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const PIXEL_BASE = BASE.includes('?') ? `${BASE}&pixelCheck=1` : `${BASE}?pixelCheck=1`;

async function drag(page, from, to, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

async function playSlider(page) {
  const scene = await page.getByTestId('scene-touch').boundingBox();
  if (scene) {
    await page.mouse.click(scene.x + scene.width / 2, scene.y + scene.height * 0.42);
    await page.waitForTimeout(120);
  }
  const rail = await page.getByTestId('slider-rail').boundingBox();
  if (!rail) throw new Error('slider rail missing');
  const x = rail.x + rail.width / 2;
  const y = rail.y + rail.height * 0.5;
  await page.mouse.move(x, rail.y + rail.height * 0.82);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 12 });
  await page.waitForTimeout(1650);
  await page.mouse.up();
}

async function playCut(page) {
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction((index) => {
      const marker = document.querySelector('[data-testid="knife-marker"]');
      const target = document.querySelector(`[data-testid="cut-target-${index}"]`);
      if (!marker || !target) return false;
      const markerRect = marker.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const markerX = markerRect.left + markerRect.width / 2;
      const targetX = targetRect.left + targetRect.width / 2;
      return Math.abs(markerX - targetX) < 8;
    }, i, { timeout: 5000 });
    const scene = await page.getByTestId('scene-touch').boundingBox();
    if (!scene) throw new Error('scene touch missing');
    await page.mouse.click(scene.x + scene.width / 2, scene.y + scene.height * 0.46);
    await page.waitForTimeout(180);
  }
}

async function playSceneSequence(page, count) {
  for (let i = 0; i < count; i++) {
    const scene = await page.getByTestId('scene-touch').boundingBox();
    if (!scene) throw new Error('scene touch missing');
    await page.mouse.click(scene.x + scene.width * (0.45 + i * 0.04), scene.y + scene.height * 0.48);
    await page.waitForTimeout(360);
  }
}

async function playSequence(page, ids) {
  const zone = await page.getByTestId('sequence-drop-zone').boundingBox();
  if (!zone) throw new Error('sequence drop zone missing');
  const target = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
  for (const id of ids) {
    const token = await page.getByTestId(`sequence-${id}`).boundingBox();
    if (!token) throw new Error(`sequence token ${id} missing`);
    await drag(page, { x: token.x + token.width / 2, y: token.y + token.height / 2 }, target, 10);
    await page.waitForTimeout(180);
  }
}

async function playStir(page, loops = 4) {
  const pad = await page.getByTestId('stir-pad').boundingBox();
  if (!pad) throw new Error('stir pad missing');
  const cx = pad.x + pad.width / 2;
  const cy = pad.y + pad.height / 2;
  const radius = Math.min(pad.width, pad.height) * 0.32;
  await page.mouse.move(cx + radius, cy);
  await page.mouse.down();
  for (let i = 1; i <= loops * 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    await page.mouse.move(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    await page.waitForTimeout(6);
  }
  await page.mouse.up();
}

async function playHold(page, ms = 3100) {
  const button = page.getByTestId('hold-button');
  const box = await button.boundingBox();
  if (!box) throw new Error('hold button missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function playSwipes(page) {
  const pad = await page.getByTestId('swipe-pad').boundingBox();
  if (!pad) throw new Error('swipe pad missing');
  const centerY = pad.y + pad.height / 2;
  const leftX = pad.x + pad.width * 0.24;
  const rightX = pad.x + pad.width * 0.76;
  for (let i = 0; i < 6; i++) {
    const goRight = i % 2 === 0;
    await drag(
      page,
      { x: goRight ? leftX : rightX, y: centerY },
      { x: goRight ? rightX : leftX, y: centerY },
      12,
    );
    await page.waitForTimeout(140);
  }
}

async function playPlate(page) {
  const target = await page.getByTestId('plate-target').boundingBox();
  if (!target) throw new Error('plate target missing');
  for (const id of ['rice', 'chicken', 'sauce']) {
    await page.getByTestId(`plate-token-${id}`).click();
    await page.waitForTimeout(220);
  }
}

async function playFold(page) {
  const center = await page.getByTestId('fold-center').boundingBox();
  if (!center) throw new Error('fold center missing');
  const target = { x: center.x + center.width / 2, y: center.y + center.height / 2 };
  for (let i = 0; i < 4; i++) {
    const flap = await page.getByTestId(`fold-${i}`).boundingBox();
    if (!flap) throw new Error(`fold flap ${i} missing`);
    await drag(
      page,
      { x: flap.x + flap.width / 2, y: flap.y + flap.height / 2 },
      target,
      12,
    );
    await page.waitForTimeout(140);
  }
}

async function runDish(page, dishId, steps) {
  await page.getByTestId(`dish-${dishId}`).click();
  for (const step of steps) {
    await step();
    await page.waitForTimeout(1000);
  }
  await page.getByTestId('result-stars').waitFor({ timeout: 10000 });
  const stars = await page.getByTestId('result-stars').innerText();
  if (!stars.includes('★')) throw new Error(`${dishId} produced no stars`);
  await page.getByRole('button', { name: /Choose dish/i }).click();
  await page.getByTestId(`dish-${dishId}`).waitFor({ timeout: 10000 });
  return stars;
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

  await page.goto(PIXEL_BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Hawker Mama').waitFor({ timeout: 10000 });

  const results = [];
  results.push(['chicken-rice', await runDish(page, 'chicken-rice', [
    () => playSlider(page),
    () => playSceneSequence(page, 4),
    () => playCut(page),
    () => playPlate(page),
  ])]);

  const canvasPixels = await page.locator('canvas').first().evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 0;
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let colored = 0;
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] > 0 && pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) colored++;
    }
    return colored;
  });
  if (canvasPixels < 1000) errors.push('[test] three canvas rendered too few colored pixels');

  await browser.close();

  console.log('\n=== Fresh voxel smoke ===');
  for (const [dish, stars] of results) console.log(`OK ${dish}: ${stars}`);
  if (errors.length) {
    for (const error of errors) console.log(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

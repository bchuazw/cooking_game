import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const URL = BASE.includes('?') ? `${BASE}&mobileRegression=1` : `${BASE}?mobileRegression=1`;

const VIEWPORTS = [
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'compact-mobile', width: 375, height: 667 },
];

const TARGETS = {
  pantry: { name: 'Rice Pantry', x: -1.6, z: -2.0 },
  riceCooker: { name: 'Rice Cooker', x: 1.75, z: -2.0 },
  plate: { name: 'Plate Station', x: -0.15, z: 1.38 },
  fridge: { name: 'Fridge', x: -3.15, z: -1.25 },
  board: { name: 'Cutting Board', x: 0.05, z: -2.0 },
  pot: { name: 'Stock Pot', x: 3.35, z: -0.35 },
  mortar: { name: 'Chili Mortar', x: -2.4, z: 1.55 },
  serve: { name: 'Serve Window', x: 1.75, z: 1.38 },
};

function fail(message) {
  throw new Error(message);
}

async function expectPanelFits(page, label) {
  const result = await page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const selectors = ['.top-hud', '.workflow-guide', '.move-pad', '.auto-panel', '.menu-card', '.result-card'];
    const boxes = selectors
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { selector, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
      })
      .filter(Boolean);
    const overflow = boxes.filter((box) => box.left < -1 || box.right > viewport.width + 1 || box.top < -1 || box.bottom > viewport.height + 1);
    const crampedText = Array.from(document.querySelectorAll('button, .order-ticket h2, .order-chip, .status-strip span, .status-strip em, .workflow-step b, .near-pill, .auto-task strong, .auto-panel p, .menu-card h1, .result-card h1'))
      .filter((node) => node instanceof HTMLElement)
      .filter((node) => node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2)
      .map((node) => ({
        text: node.textContent?.trim() ?? '',
        className: node.className,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      }));
    return { overflow, crampedText };
  });
  if (result.overflow.length) fail(`${label}: layout overflow ${JSON.stringify(result.overflow)}`);
  if (result.crampedText.length) fail(`${label}: clipped text ${JSON.stringify(result.crampedText.slice(0, 3))}`);
}

async function sampleFps(page) {
  return await page.evaluate(async () => {
    let frames = 0;
    const start = performance.now();
    return await new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        if (now - start >= 1500) resolve(Math.round((frames * 1000) / (now - start)));
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });
}

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
  fail(`Could not reach ${target.name}`);
}

async function waitHeld(page, text, timeout = 9000) {
  const pattern = text instanceof RegExp ? text : new RegExp(text, 'i');
  await page.waitForFunction(
    ([source, flags]) => new RegExp(source, flags).test(document.querySelector('[data-testid="held-item"]')?.textContent ?? ''),
    [pattern.source, pattern.flags],
    { timeout },
  );
}

async function expectStationEmpty(page, id) {
  await page.waitForFunction(
    (stationId) => document.querySelector(`[data-testid="station-state-${stationId}"]`)?.textContent?.trim() === 'empty',
    id,
    { timeout: 2500 },
  );
}

async function expectPlateStationEmpty(page) {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="plate-station-state"]')?.textContent?.trim() === 'empty',
    undefined,
    { timeout: 2500 },
  );
}

async function playFullOrder(page, viewportName) {
  await moveToStation(page, 'pantry');
  await waitHeld(page, /uncooked rice/i);
  await expectPanelFits(page, `${viewportName}: rice pickup`);

  await moveToStation(page, 'riceCooker');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'fridge');
  await waitHeld(page, /raw chicken/i);

  await moveToStation(page, 'board');
  await waitHeld(page, /cut chicken/i);
  await expectPanelFits(page, `${viewportName}: chicken cut`);

  await moveToStation(page, 'pot');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'mortar');
  await waitHeld(page, /chili sauce/i);
  await expectStationEmpty(page, 'mortar');
  await expectPanelFits(page, `${viewportName}: sauce ready`);

  await moveToStation(page, 'plate');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'riceCooker');
  await waitHeld(page, /fragrant rice/i, 12000);
  await expectStationEmpty(page, 'riceCooker');

  await moveToStation(page, 'plate');
  await waitHeld(page, /empty hands/i);

  await moveToStation(page, 'pot');
  await waitHeld(page, /poached chicken/i, 12000);
  await expectStationEmpty(page, 'pot');

  await moveToStation(page, 'plate');
  await waitHeld(page, /chicken rice/i);
  await expectPlateStationEmpty(page);

  await moveToStation(page, 'serve');
  await page.getByTestId('result-stars').waitFor({ timeout: 10000 });
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
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
  await expectPanelFits(page, `${viewport.name}: menu`);
  const fps = await sampleFps(page);
  if (fps < 45) fail(`${viewport.name}: low frame rate sample (${fps} FPS)`);
  await page.getByTestId('start-chicken-rice').click();
  await page.waitForTimeout(350);
  await expectPanelFits(page, `${viewport.name}: kitchen`);
  await playFullOrder(page, viewport.name);
  await expectPanelFits(page, `${viewport.name}: result`);
  const stars = await page.getByTestId('result-stars').innerText();
  await page.close();

  if (errors.length) fail(`${viewport.name}: browser errors\n${errors.join('\n')}`);
  return { viewport: viewport.name, fps, stars };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, viewport));
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Mobile auto-station regression ===');
  for (const result of results) {
    console.log(`OK ${result.viewport}: ${result.stars} at ${result.fps} FPS sample`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

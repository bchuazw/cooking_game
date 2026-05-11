import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const URL = BASE.includes('?') ? `${BASE}&mobileRegression=1` : `${BASE}?mobileRegression=1`;

const VIEWPORTS = [
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'compact-mobile', width: 375, height: 667 },
];

function fail(message) {
  throw new Error(message);
}

async function drag(page, from, to, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(35);
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

async function scrubVertical(page, x, topY, bottomY, cycles = 9) {
  await page.mouse.move(x, topY);
  await page.mouse.down();
  await page.waitForTimeout(35);
  for (let i = 0; i < cycles; i++) {
    await page.mouse.move(x, i % 2 ? topY : bottomY, { steps: 5 });
    await page.waitForTimeout(35);
  }
  await page.mouse.up();
}

async function expectPanelFits(page, label) {
  const result = await page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const selectors = ['.top-hud', '.play-panel', '.menu-card', '.result-card'];
    const boxes = selectors
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { selector, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      })
      .filter(Boolean);
    const overflow = boxes.filter((box) => box.left < -1 || box.right > viewport.width + 1 || box.top < -1 || box.bottom > viewport.height + 1);
    const crampedText = Array.from(document.querySelectorAll('button, .status-row span, .status-row strong, .step-copy h2, .step-copy p:last-child'))
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
    return { viewport, overflow, crampedText };
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

async function playPrep(page, viewportName) {
  await page.getByTestId('chop-timing').click();
  const cue = await page.getByTestId('chop-timing').innerText();
  if (!/(Perfect|Good|Too early|Too late)/i.test(cue)) fail(`${viewportName}: chop timing tap did not show immediate feedback (${cue})`);
  await page.waitForTimeout(620);
  for (let i = 1; i < 4; i++) {
    await page.getByTestId('chop-timing').click();
    await page.waitForTimeout(650);
  }
  await page.getByRole('heading', { name: 'Toast the Rice' }).waitFor({ timeout: 5000 });
}

async function playRice(page) {
  const pad = await page.getByTestId('toss-pad').boundingBox();
  if (!pad) fail('rice: toss pad missing');
  const y = pad.y + pad.height * 0.58;
  for (let i = 0; i < 4; i++) {
    const fromX = pad.x + pad.width * (i % 2 ? 0.82 : 0.18);
    const toX = pad.x + pad.width * (i % 2 ? 0.18 : 0.82);
    await drag(page, { x: fromX, y }, { x: toX, y: y + (i % 2 ? -8 : 8) }, 14);
    await page.waitForTimeout(260);
  }
  await page.getByRole('heading', { name: 'Poach the Chicken' }).waitFor({ timeout: 5000 });
}

async function playPoach(page, viewportName) {
  const rail = await page.getByTestId('simmer-slider').boundingBox();
  if (!rail) fail('poach: heat rail missing');
  await drag(page, { x: rail.x + rail.width / 2, y: rail.y + rail.height * 0.86 }, { x: rail.x + rail.width / 2, y: rail.y + rail.height * 0.38 }, 12);
  await page.waitForTimeout(250);
  const readyText = await page.getByTestId('stir-pot').innerText();
  if (!/Keep thermometer/i.test(readyText)) fail(`${viewportName}: poach did not enter the green hold zone (${readyText})`);
  await page.getByRole('heading', { name: 'Make the Chili Sauce' }).waitFor({ timeout: 7000 });
}

async function playSauce(page) {
  for (const id of ['chili', 'ginger', 'garlic', 'lime']) {
    const mortar = await page.getByTestId('mortar-pad').boundingBox();
    const token = await page.getByTestId(`sauce-token-${id}`).boundingBox();
    if (!mortar || !token) fail(`sauce: mortar or ${id} token missing`);
    await drag(
      page,
      { x: token.x + token.width / 2, y: token.y + token.height / 2 },
      { x: mortar.x + mortar.width / 2, y: mortar.y + mortar.height / 2 },
      12,
    );
    await page.waitForTimeout(130);
    const added = await page.getByTestId(`sauce-token-${id}`).evaluate((node) => node.classList.contains('done'));
    if (!added) fail(`sauce: dragging ${id} did not add it to the mortar`);
  }
  const pad = await page.getByTestId('mortar-pad').boundingBox();
  if (!pad) fail('sauce: mortar pad missing');
  await scrubVertical(page, pad.x + pad.width * 0.52, pad.y + pad.height * 0.28, pad.y + pad.height * 0.84, 10);
  await page.getByRole('heading', { name: 'Plate the Set' }).waitFor({ timeout: 7000 });
}

async function playPlate(page, viewportName) {
  const targets = {
    rice: { x: 0.38, y: 0.58 },
    chicken: { x: 0.58, y: 0.56 },
    cucumber: { x: 0.52, y: 0.76 },
    chili: { x: 0.73, y: 0.7 },
  };
  let plate = await page.getByTestId('plate-drop').boundingBox();
  let rice = await page.getByTestId('plate-token-rice').boundingBox();
  if (!plate || !rice) fail('plate: drop target or rice token missing');
  await drag(
    page,
    { x: rice.x + rice.width / 2, y: rice.y + rice.height / 2 },
    { x: plate.x + plate.width * targets.rice.x, y: plate.y + plate.height * targets.rice.y },
    14,
  );
  await page.waitForTimeout(220);
  const plateText = await page.locator('.plate-status').innerText();
  if (!/1\/4/.test(plateText)) fail(`${viewportName}: plate drag did not place rice (${plateText})`);
  for (const id of ['chicken', 'cucumber', 'chili']) {
    plate = await page.getByTestId('plate-drop').boundingBox();
    const token = await page.getByTestId(`plate-token-${id}`).boundingBox();
    if (!plate || !token) fail(`plate: ${id} token missing`);
    await drag(
      page,
      { x: token.x + token.width / 2, y: token.y + token.height / 2 },
      { x: plate.x + plate.width * targets[id].x, y: plate.y + plate.height * targets[id].y },
      14,
    );
    await page.waitForTimeout(160);
  }
  await page.getByTestId('result-stars').waitFor({ timeout: 7000 });
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
  await expectPanelFits(page, `${viewport.name}: prep`);
  await page.locator('.coach-hand.show').first().waitFor({ timeout: 2500 });
  await playPrep(page, viewport.name);
  await expectPanelFits(page, `${viewport.name}: rice`);
  await playRice(page);
  await expectPanelFits(page, `${viewport.name}: poach`);
  await playPoach(page, viewport.name);
  await expectPanelFits(page, `${viewport.name}: sauce`);
  await playSauce(page);
  await expectPanelFits(page, `${viewport.name}: plate`);
  await playPlate(page, viewport.name);
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

  console.log('\n=== Mobile usability regression ===');
  for (const result of results) {
    console.log(`OK ${result.viewport}: ${result.stars} at ${result.fps} FPS sample`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

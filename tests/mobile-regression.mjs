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

async function circleDrag(page, center, radius, loops = 0.75, stepsPerLoop = 20) {
  await page.mouse.move(center.x + radius, center.y);
  await page.mouse.down();
  await page.waitForTimeout(35);
  const total = Math.max(8, Math.round(loops * stepsPerLoop));
  for (let i = 1; i <= total; i++) {
    const angle = (Math.PI * 2 * loops * i) / total;
    await page.mouse.move(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
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
  if (!/(Perfect|Good|Too early|Too late)/.test(cue)) fail(`${viewportName}: chop timing tap did not show immediate feedback (${cue})`);
  await page.waitForTimeout(620);
  for (let i = 1; i < 4; i++) {
    await page.getByTestId('chop-button').click();
    await page.waitForTimeout(650);
  }
  await page.getByRole('heading', { name: 'Toast the Rice' }).waitFor({ timeout: 5000 });
}

async function playRice(page) {
  const pad = await page.getByTestId('toss-pad').boundingBox();
  if (!pad) fail('rice: toss pad missing');
  const x = pad.x + pad.width / 2;
  for (let i = 0; i < 4; i++) {
    const band = await page.getByTestId('toss-pad').locator('em').boundingBox();
    if (!band) fail('rice: toss target missing');
    await drag(page, { x, y: pad.y + pad.height * 0.88 }, { x: x - 4 + (i % 2) * 8, y: band.y + band.height / 2 }, 10);
    await page.waitForTimeout(540);
  }
  await page.getByRole('heading', { name: 'Poach the Chicken' }).waitFor({ timeout: 5000 });
}

async function playPoach(page, viewportName) {
  const rail = await page.getByTestId('simmer-slider').boundingBox();
  if (!rail) fail('poach: heat rail missing');
  await drag(page, { x: rail.x + rail.width / 2, y: rail.y + rail.height * 0.86 }, { x: rail.x + rail.width / 2, y: rail.y + rail.height * 0.4 }, 12);
  await page.waitForTimeout(250);
  const readyText = await page.getByTestId('stir-pot').innerText();
  if (!/Circle here to stir|0\/3/.test(readyText)) fail(`${viewportName}: poach did not clearly invite stirring (${readyText})`);
  const pot = await page.getByTestId('stir-pot').boundingBox();
  if (!pot) fail('poach: stir pad missing');
  const center = { x: pot.x + pot.width * 0.5, y: pot.y + pot.height * 0.42 };
  const radius = Math.min(pot.width, pot.height) * 0.2;
  for (let i = 0; i < 3; i++) {
    await circleDrag(page, center, radius, 0.72, 18);
    await page.waitForTimeout(320);
  }
  await page.getByRole('heading', { name: 'Make the Chili Sauce' }).waitFor({ timeout: 7000 });
}

async function playSauce(page) {
  const firstMortar = await page.getByTestId('mortar-pad').boundingBox();
  const chili = await page.getByTestId('sauce-token-chili').boundingBox();
  if (!firstMortar || !chili) fail('sauce: mortar or chili token missing');
  await drag(
    page,
    { x: chili.x + chili.width / 2, y: chili.y + chili.height / 2 },
    { x: firstMortar.x + firstMortar.width / 2, y: firstMortar.y + firstMortar.height / 2 },
    12,
  );
  await page.waitForTimeout(160);
  const chiliAdded = await page.getByTestId('sauce-token-chili').evaluate((node) => node.classList.contains('done'));
  if (!chiliAdded) fail('sauce: dragging chili did not add it to the mortar');
  for (const id of ['ginger', 'garlic', 'lime']) {
    await page.getByTestId(`sauce-token-${id}`).click();
    await page.waitForTimeout(90);
  }
  const pad = await page.getByTestId('mortar-pad').boundingBox();
  if (!pad) fail('sauce: mortar pad missing');
  for (let i = 0; i < 4; i++) {
    await drag(page, { x: pad.x + pad.width * 0.52, y: pad.y + pad.height * 0.28 }, { x: pad.x + pad.width * 0.52, y: pad.y + pad.height * 0.66 }, 8);
    await page.waitForTimeout(220);
  }
  await page.getByRole('heading', { name: 'Plate the Set' }).waitFor({ timeout: 7000 });
}

async function playPlate(page, viewportName) {
  const targets = {
    rice: { x: 0.28, y: 0.52 },
    chicken: { x: 0.56, y: 0.5 },
    cucumber: { x: 0.5, y: 0.78 },
    chili: { x: 0.78, y: 0.68 },
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
  const plateText = await page.getByTestId('plate-drop').innerText();
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

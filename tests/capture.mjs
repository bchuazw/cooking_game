import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/cooking_game/';
const OUT = join(process.cwd(), 'handover', 'screenshots');

mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(OUT, 'voxel-menu-mobile.png'), fullPage: false });
  await page.getByTestId('start-chicken-rice').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'voxel-cooking-mobile.png'), fullPage: false });
  await browser.close();
  console.log(`screenshots saved to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

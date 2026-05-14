# Hawker Mama

Fresh mobile-first browser cooking game inspired by Cooking Mama, rebuilt as a Three.js voxel kitchen about Singapore hawker food.

## Current Build

- Playable dish: Hainanese Chicken Rice.
- The current dish registry exposes one full station-based workflow: rice prep, rice cooker, chicken prep, poach, chili mortar, plating, and serve.
- The game is mobile-first, browser-based, and rendered with real-time Three.js voxel geometry.
- Singapore cuisine learning appears after the rating, so the game stays playable first.
- Draft culture-card material for future dishes may still exist under `content/`, but Laksa and Prata are not currently playable.

Live site: https://bchuazw.github.io/cooking_game/

## Commands

```bash
npm install
npm run dev
npm run build
npm run test:smoke
npm run capture
```

On Windows PowerShell, use `npm.cmd run build` if script execution policy blocks `npm.ps1`.

## Verification

`npm run test:smoke` opens the production preview in mobile Chromium, completes one Hainanese Chicken Rice order, checks that the Three.js canvas renders nonblank pixels, and samples FPS.

`npm run capture` saves current mobile screenshots to `handover/screenshots/`.

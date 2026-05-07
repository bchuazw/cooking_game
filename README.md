# Hawker Mama

Fresh mobile-first browser cooking game inspired by Cooking Mama, rebuilt as a Three.js voxel game about Singapore hawker dishes.

## What It Is

- 3 playable dishes: Hainanese Chicken Rice, Katong Laksa, and Roti Prata.
- Each dish has 3 clear mini-games with immediate feedback and star ratings.
- Singapore cuisine learning appears after the rating, so the game stays playable first.
- Visuals are generated in real time with Three.js voxel geometry. No old raster gameplay assets are used.

Live site: https://bchuazw.github.io/cooking_game/

## Commands

```bash
npm install
npm run dev
npm run build
npm run test:smoke
npm run capture
```

## Verification

`npm run test:smoke` opens the production preview in mobile Chromium and completes all 3 dishes:

- Chicken Rice
- Laksa
- Prata

The smoke also checks that the Three.js canvas initializes.

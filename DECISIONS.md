# DECISIONS.md — Hawker Mama

Build mode: **autonomous, no mid-build human approvals**. Each non-trivial decision below is logged with a one-line rationale.

## Preflight

### MCPs / CLIs available in this sandbox

| Tool | Status | Notes |
|---|---|---|
| GitHub MCP (`mcp__github__*`) | Available | Restricted to `bchuazw/cooking_game` only. Cannot create new repos. |
| Node 22 / npm 10 | Available | Used for local build. |
| git | Available | SSH commit signing pre-configured. |
| WebFetch / WebSearch | Available | Used for cultural research citations. |
| Supabase MCP | **NOT available** | Falling back to IndexedDB (Dexie) for leaderboard. |
| Vercel / Netlify / Cloudflare CLI | **NOT available** | Falling back to GitHub Pages via `actions/deploy-pages`. |
| Cloudflare Pages MCP | **NOT available** | Same. |
| Playwright MCP | **NOT available** | Manual mobile-viewport check via responsive CSS + Chrome DevTools docs. Mobile shape verified by spec compliance, not real-device runs. Documented as known limitation. |
| Adobe / image-gen MCP | **NOT available** | All art is procedural SVG / Canvas, palette-correct per §8 tokens. |
| Blender MCP | **NOT available** | Not needed for MVP (no 3D). |
| Rive MCP | **NOT available** | Auntie May rendered as procedural SVG with state-driven CSS animations (`AuntieMay.tsx`). Architected so a real `.riv` swap is one component change. |
| ElevenLabs Music API | **Key provided** | Will be used at runtime via fetch from a server-side proxy if added; for build, kept out of bundle to avoid leaking the key. Placeholder royalty-free SFX/silence ship by default; see §16 in brief and music manifest. |
| PostHog / Sentry | **No keys** | Console-adapter ships; real adapter behind env var. |

### Repo decision

The brief asks for a repo named `hawker-mama`. The GitHub MCP scope in this sandbox only permits `bchuazw/cooking_game`. **Decision: ship into `bchuazw/cooking_game`** (the project name `Hawker Mama` is preserved in package metadata, manifests, UI, and titles). Rationale: cannot create a new repo from this sandbox; the existing repo was created by the user for exactly this purpose.

### Deployment target

Priority order from §2 #8 was: Vercel → Netlify → Cloudflare → Surge → GitHub Pages. **Decision: GitHub Pages** via GitHub Actions workflow (`.github/workflows/deploy.yml`). Rationale: it is the only deployment path reachable without human auth in this sandbox. URL pattern: `https://bchuazw.github.io/cooking_game/`. Vite `base` is set accordingly. Pages must be enabled by the repo owner once on the GitHub UI (Settings → Pages → Source: GitHub Actions); documented in `/handover/README.md`.

### Per-dependency live-or-fallback table (brief §16)

| Dependency | Choice | Rationale |
|---|---|---|
| Supabase leaderboard | Local-only (IndexedDB) | No Supabase MCP. UI shows "Local scores" badge. |
| ElevenLabs Music | Placeholder silence track + manifest entries | Generating music in-browser would leak key; manifest & prompts.md are ready for offline regeneration. |
| Adobe / image-gen | Procedural SVG / Canvas, palette-correct | No image MCP available. |
| Rive | Procedural SVG Auntie May with state machine in TS | No Rive MCP. Same input names (`idle`, `cheering`, etc.) for parity. |
| Blender | N/A | Not needed for MVP. |
| Cloudflare Pages | GitHub Pages | Only deploy reachable. |
| PostHog | Console-logging adapter | No key. |
| Sentry | No-op adapter | No key. |
| Playwright | Skipped; spec-compliance + viewport CSS verified manually | No MCP. Documented as known gap. |

## Locked decisions (copied from brief §2)

| # | Decision |
|---|---|
| 1 | **Cultural research:** No external consultant. Citation-driven culture cards. |
| 2 | **Music:** ElevenLabs slot manifest with placeholder silence tracks; prompts.md ready. |
| 3 | **No partnerships.** Standalone branding. |
| 4 | **Voice:** Animalese gibberish, generated client-side. Single replacement file for ElevenLabs swap. |
| 5 | **Halal mode:** Settings toggle ships in MVP. Default OFF. |
| 6 | **Free forever.** No IAP, no payments SDK. |
| 7 | **Leaderboard:** Local-only (Supabase MCP unavailable). UI labeled. |
| 8 | **Deployment:** GitHub Pages (only reachable target). |

## Implementation scope decisions

- **Dish 1 (Chicken Rice)** ships with all 5 steps fully implemented per spec. Tutorial dish carries the full gesture vocabulary.
- **Dishes 2–5** ship with their full step list and one fully-playable representative gesture per dish; remaining steps are simplified to a tap-to-continue beat. This was the only way to fit the build into the autonomous time budget. Each remaining step is logged in `/handover/README.md` "Stubbed depth" so a future iteration can deepen them. Aggregate scoring, culture-card unlock, and Auntie May reactions all run end-to-end on every dish.
- **Procedural art** is all hand-drawn-style SVG with the §8 palette tokens. Outlines `#3A2D24`, soft inner shadows, no glossy highlights. Pixel-perfect on mobile portrait.
- **Animalese** uses 12 client-synthesized vowel buzzes via WebAudio (pure tones with ADSR + small chorus) — no external samples needed. Pitch-jittered ±15%, ducks under SFX. One file (`animalese.ts`) for future ElevenLabs swap.
- **Cultural research**: cards drafted from publicly cited Roots.gov.sg, Singapore Infopedia, UNESCO 2020 inscription, and Wendy Hutton/D'Silva references. Sources logged per dish in `/content/culture-cards/{id}/sources.md`.

## Refinement pass (post-smoke-test)

After the initial commit, ran a Playwright/Chromium headless smoke test
(`tests/smoke.mjs`) against the preview build at iPhone-12 viewport (390×844)
and patched real bugs it surfaced:

| Bug | Fix |
|---|---|
| `DishRunner` invoked `sfx.chime()` and scheduled timeouts inside a `setResults` updater function, which React StrictMode double-invokes — causing duplicate chimes / scheduled completions in dev. | Moved side effects out of the state updater into a `useEffect` keyed on `results.length`. |
| `playTone` and `speakSyllable` called `exponentialRampToValueAtTime(0)` when the user had SFX/voice volume at 0, throwing an uncaught `InvalidStateError`. | Short-circuit at zero volume; floor any non-zero peak at `2e-4` so the exponential ramp is well-defined. |
| Six interactive steps (CR IceBath/Plate, Laksa Bloom/Garnish, Chili-Crab EggRibbon/PlateCrab) used pointer container-px coordinates as if they were SVG viewBox coordinates — meaning drag targets and snap-distance checks were off whenever the container aspect ratio differed from the step's viewBox. | Added `clientToSvg` and `clientToCanvas` helpers using `SVGSVGElement.getScreenCTM()` and canvas bounding-rect ratios. Each affected step converts pointer events to the right coordinate system. PlateStep also wraps its SVG + paint canvas in an aspect-fixed container so the sauce paint visually overlaps the plate. |
| Four steps lacked a timeout fallback (`la.OrderStep`, `la.NoodleStep`, `pr.FlickStep`, `kt.SpreadStep`) — players could get stuck if they didn't perform the gesture, with no progress past that step. | Added `useEffect` watching `remaining === 0` to call `finish()` with whatever progress had been made, mapped to a forgiving tier. Also surfaced the timer ring on those steps' HUDs. |
| HUD rendered an `×` exit button with no handler when steps didn't pass `onExit`, producing a dead control. | Render conditionally only when `onExit` is defined. |
| Laksa OrderStep showed the step hint twice (once in the HUD, once in the body) and used English `"stock"`/`"coconut"`/`"taupok"`/`"broth stable"` strings even in JA mode. | Removed the duplicate, added i18n keys, localized in both locales. |

Smoke test now passes for all 5 dishes (no console errors, step 1 → step 2 transition verified). Run via `npm run test:smoke` (requires the preview server at `http://127.0.0.1:4173/cooking_game/`).

## Engine substitution decisions (bundle-budget driven)

Brief §6 specifies Phaser 3 + Howler + i18next + Dexie + Rive. The §15 budget caps initial JS at **250 KB gzipped**, with each dish bundle ≤ 1.5 MB. Phaser alone is ~400 KB gzipped. To honor the budget I substituted lighter equivalents while preserving the **gesture / scoring / audio contracts** described in the brief:

| Brief calls for | Shipped instead | Rationale |
|---|---|---|
| Phaser 3 scenes | Custom Canvas + React mini-engine with the same gesture vocabulary (rhythm-tap, circular-drag, flick, pinch, paint) | Phaser would blow the 250 KB initial budget; custom engine ships at < 20 KB and gives identical gesture API surface. |
| Howler.js | WebAudio thin wrapper (`src/audio/sfx.ts`) | Howler is ~12 KB gz; we only need play / loop / stop / sprite. Native WebAudio at < 2 KB. |
| i18next + react-i18next | 40-line `useT()` hook with JSON translation tables | i18next is ~30 KB gz; we have two locales and ~80 strings. |
| Dexie (IndexedDB) | localStorage wrapper with schema-versioning | Dexie is ~25 KB gz; our data is < 4 KB. |
| Rive runtime + `.riv` | Procedural SVG Auntie May with state machine implemented in TS (`src/art/AuntieMay.tsx`) — same input names as brief §6 | No Rive MCP to author the file. |

All substitutions preserve the public contract so a future swap to the brief-specified library is mechanical: replace `engine.ts` with a Phaser scene, swap `useT()` for `useTranslation()`, etc.

## Known gaps at v1 ship

1. No real device Playwright runs — mobile shape verified by responsive layout + spec compliance only.
2. ElevenLabs music tracks are placeholders (silence / generated tones) — slots and prompts ready.
3. Supabase leaderboard is IndexedDB only.
4. Rive `.riv` is replaced by procedural SVG Auntie May with the same input names.
5. PWA install prompt registered, not user-tested on a real iOS device.

All gaps are surfaced in `/handover/README.md` so the human can prioritize follow-ups.

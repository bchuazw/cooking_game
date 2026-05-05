# Hawker Mama

Mobile-first browser cooking game teaching Singaporean cuisine to a
Japanese audience. Inspired by *Cooking Mama*; built with Vite + React +
TypeScript + Tailwind, custom Canvas/SVG rendering, WebAudio, and a
client-side animalese voice synth.

- **Live preview:** https://bchuazw.github.io/cooking_game/ (after first
  successful workflow run; see `DEPLOY.md`)
- **Build decisions and substitutions:** [`DECISIONS.md`](./DECISIONS.md)
- **Handover (what's live, what's stubbed, walkthrough):** [`handover/README.md`](./handover/README.md)
- **Per-dish cultural sources:** [`content/culture-cards/`](./content/culture-cards)

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produces dist/ (initial JS ~50 KB gz, dish bundles ≤ 21 KB gz)
```

## Project layout

See `DECISIONS.md` § "Engine substitution decisions" for why the ship stack
differs from the brief's nominal stack (bundle-budget driven; Phaser, Howler,
i18next, Dexie, Rive replaced with lighter, contract-equivalent modules).

```
src/
  App.tsx             # screen routing
  main.tsx            # entry
  state/store.ts      # Zustand persisted state
  i18n/               # JA-first i18n
  audio/              # animalese + sfx + music manifest loader
  art/AuntieMay.tsx   # procedural SVG character (Rive shim)
  game/
    engine/           # gestures, scoring, HUD, dish runner
    dishes/           # one folder per dish; each lazy-loaded
  ui/                 # React menu screens
content/culture-cards/<dish>/
  card.{ja,en}.md
  sources.md          # cited primary sources per brief §11
public/
  audio/music/        # manifest + ElevenLabs prompt seeds
  icons/              # PWA icons
handover/             # README, walkthrough, QR
DECISIONS.md
SECRETS.md
DEPLOY.md
```

## License

Code: MIT (or whatever the operator chooses; LICENSE file not added so the
operator can pick deliberately). Per-dish cultural sources retain their own
attributions — see each `sources.md`.

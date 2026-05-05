# SECRETS.md — environment-variable inventory

This file is **never** committed with real values. It documents what the build
expects so a human can paste keys into a `.env.local` (gitignored) or set them
in GitHub Actions secrets.

| Var | Required? | Used by | Effect when absent |
|---|---|---|---|
| `VITE_POSTHOG_KEY` | optional | `src/telemetry/index.ts` | Telemetry logs to console only. |
| `VITE_SENTRY_DSN` | optional | (planned, not wired) | No error reporting. |
| `ELEVENLABS_API_KEY` | optional, **server-side only** | `scripts/generate-music.mjs` (not yet written) for batch music generation | Music slots use placeholder silence tracks (see `public/audio/music/manifest.json`). |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | optional | (planned) leaderboard sync | Leaderboard stays local-only. |

## Operator note

The ElevenLabs key supplied during the initial build was logged for awareness
but **deliberately not committed** — it would otherwise be public on GitHub
Pages bundles. To use it for music generation, run a batch tool locally and
upload the resulting `.opus` / `.m4a` files to `public/audio/music/`, updating
`manifest.json` to reference them. The runtime never needs the key.

# Music slot prompts (ElevenLabs Music)

These prompts seed `manifest.json`. Generate per slot with ElevenLabs Music API,
save outputs as `.opus` (primary) and `.m4a` (fallback) under this directory,
then update `manifest.json` `src` paths to point to the local files.

| Slot | Length | ElevenLabs prompt |
|---|---|---|
| `title_theme` | 60–90s loop | "Warm instrumental theme, light gamelan and erhu over soft acoustic guitar and brushed drums, 90 BPM, major key, evokes morning at a Singapore hawker centre, no vocals, looping" |
| `hawker_map_bed` | 90s loop | "Ambient texture bed, soft mallets, distant kopitiam chatter, no melody, 60 BPM, suitable for a map screen" |
| `dish_complete_sting` | 3–5s | "Short triumphant sting, 4 seconds, gamelan + bell, ascending phrase, joyful" |
| `culture_card_calm` | 45s loop | "Reflective ambient piece, sparse piano with held strings, 70 BPM, contemplative, instrumental" |
| `tutorial_bed` | 45s loop | "Curious instrumental, plucked strings and light percussion, 80 BPM, encouraging" |

## Replacement procedure

1. Generate audio.
2. Place files under `public/audio/music/{slot}.opus` and `{slot}.m4a`.
3. Update `manifest.json` to point each slot to those files (relative to `BASE_URL` they will be served as `audio/music/{slot}.opus`).
4. Rebuild and redeploy. No code changes required; the audio system reads the manifest at runtime.

The placeholder silence tracks currently in `manifest.json` are 32-byte WAV
data URIs so the build is never blocked by missing audio.

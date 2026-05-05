# Walkthrough script — Hawker Mama (≈3 min)

A read-along script for screen-recording a demo. Each beat is a sentence or two; the asterisks `*` are stage directions for the screen.

---

> "This is **Hawker Mama** — a mobile cooking game teaching Singaporean food to a Japanese audience. Built for phones, plays in a browser, no install required."

\* Open the QR with phone camera, or paste the preview URL on desktop. Resize browser to phone width if on desktop. *

> "First launch picks the language. Default is Japanese; the audience is Tokyo."

\* Tap **日本語**, then read the welcome and tap **はじめる**. *

> "Auntie May greets you. Hit **タップしてスタート**."

\* Tap the big sambal-red button. *

> "This is the Hawker Centre — five stalls, four locked at first. Note the UNESCO 2020 inscription in the header — that's our cultural anchor."

\* Pan over the map. Stars beneath the locked stalls show progress. *

> "We start with **海南鶏飯** — Hainanese Chicken Rice. Tap it."

\* Read the dish hook, tap **料理をはじめる**. *

> "Step 1: Poach the chicken. Drag the slider on the right to keep the thermometer in the green band — 75 to 85 degrees. The pot drifts on its own; it's a tracking task, not a one-shot."

\* Drag the slider up and down for ~12 seconds. *

> "Step 2: Ice bath. Drag the chicken into the ice bowl and hold for half a second. The faster you do it, the higher the score."

\* Drag from pot to bowl. *

> "Step 3: Rhythm tap. Four ingredients, four beats — shallot, garlic, ginger, pandan. Watch the dot turn red, then tap."

\* Tap on each pulse. *

> "Step 4: Pound the sauce. Alternate left and right — same side twice in a row is a miss."

\* Alternate left, right, left, right for 8 seconds. *

> "Step 5: Plate. Drag the chicken onto the rice, then the cucumber and coriander, then finger-paint the sauce. Sweet spot is 60 to 85 percent coverage — too much sauce loses points."

\* Drag, drop, paint, then tap **できた！**. *

> "Auntie reacts. Stars appear. Then the culture card — every dish ends here."

\* Tap **文化カードを読む**. *

> "The card is in Japanese, with a 'did you know' callout. Sources are listed at the bottom — Roots.gov.sg, NLB Infopedia, UNESCO. Open `content/culture-cards/<dish>/sources.md` in the repo for full citations."

\* Pull up the source details. *

> "Back to the map — Laksa is unlocked. Each dish unlocks the next."

\* Quick clip of opening Laksa, doing the circular-drag bloom, then exit. *

> "Settings: language toggle, halal mode (off by default; the five MVP dishes are all halal-compatible), music / SFX / voice sliders, reduced motion, describe-step accessibility toggle, and policy links."

\* Tap settings cog, scroll. *

> "Leaderboard shows local scores per dish. Supabase wiring is one env-var swap away."

> "And that's it — five dishes, two languages, culture cards with primary sources, all under 60 KB of initial JS, runs as a PWA. Auntie May is procedural SVG with the same state-machine inputs as a Rive file would have, so she's a one-component swap when art lands."

---

## Timing

| Beat | Approx. seconds |
|---|---|
| Title + first launch | 0:00–0:25 |
| Hawker map context | 0:25–0:40 |
| Chicken rice play | 0:40–2:10 |
| Auntie reaction + culture card | 2:10–2:35 |
| Laksa cameo + settings + leaderboard | 2:35–3:00 |

Pause animations or replay slow segments as needed; the build honors `prefers-reduced-motion` if the recording device has it set.

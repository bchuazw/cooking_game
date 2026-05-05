// Animal-Crossing-style "animalese" gibberish synth.
// Brief §4 / §9: 12 short vowel samples, two-syllable burst per visible JP char,
// pitch-jittered ±15%, ducks under SFX. Ends falling on 。, rising on ？.
//
// Architected as a single replaceable file so a future ElevenLabs voice swap is
// one file replacement (export the same `say()` signature).

import { audio, duckMusic, unduckMusic } from './audio';
import { useApp } from '../state/store';

const VOWELS = ['a', 'i', 'u', 'e', 'o'] as const;
type Vowel = (typeof VOWELS)[number];

// Frequency formants per vowel (rough first-formant), low and high register.
const F: Record<Vowel, [number, number]> = {
  a: [620, 980],
  i: [320, 2700],
  u: [350, 800],
  e: [490, 2300],
  o: [440, 900],
};

function pseudoHash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

function speakSyllable(charSeed: string, base: number, gainMul = 1): Promise<void> {
  return new Promise((resolve) => {
    const c = audio();
    const h = pseudoHash(charSeed);
    const v = VOWELS[h % VOWELS.length];
    const high = (h >> 3) & 1 ? 1 : 0;
    const f = F[v][high];
    const jitter = 1 + (((h >> 5) & 0xff) / 255 - 0.5) * 0.3; // ±15%
    const freq = (base ?? f) * jitter;
    const dur = 90 + (h & 0x1f); // 90–121 ms
    const voiceVol = useApp.getState().voice * gainMul;

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18 * voiceVol, c.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur / 1000);
    g.connect(c.destination);

    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.connect(g);

    // small chorus partial for warmth
    const osc2 = c.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 0.5, c.currentTime);
    const g2 = c.createGain();
    g2.gain.value = 0.04 * voiceVol;
    osc2.connect(g2);
    g2.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + dur / 1000);
    osc2.start();
    osc2.stop(c.currentTime + dur / 1000);
    setTimeout(resolve, dur);
  });
}

interface SayOptions {
  duckBackground?: boolean;
}

let speakingToken = 0;

export async function say(line: string, opts: SayOptions = {}): Promise<void> {
  const myToken = ++speakingToken;
  if (opts.duckBackground !== false) duckMusic(0.5);
  // JP ≈ 2 vowels per char; EN ≈ 1 vowel per 3 chars.
  const isJP = /[぀-ヿ㐀-䶿一-鿿]/.test(line);
  const symbols = Array.from(line);

  // Determine cadence
  const baseFreq = 480;
  const ending = symbols[symbols.length - 1];
  const rise = ending === '？' || ending === '?';
  const fall = ending === '。' || ending === '.';

  let i = 0;
  let counter = 0;
  while (i < symbols.length) {
    if (myToken !== speakingToken) break;
    const ch = symbols[i];
    const isWordy =
      /[\p{L}\p{N}]/u.test(ch) || /[぀-ヿ㐀-䶿一-鿿]/.test(ch);
    if (isWordy) {
      const seed = `${ch}-${counter}`;
      const progress = i / symbols.length;
      const inflect = rise ? 1 + progress * 0.2 : fall ? 1 - progress * 0.15 : 1;
      const sylsPerChar = isJP ? 2 : 1;
      const stride = isJP ? 1 : 3;
      for (let s = 0; s < sylsPerChar; s++) {
        if (myToken !== speakingToken) break;
        await speakSyllable(`${seed}-${s}`, baseFreq * inflect);
      }
      i += stride;
      counter++;
    } else if (ch === ' ' || ch === '　') {
      await new Promise((r) => setTimeout(r, 60));
      i++;
    } else if (ch === '、' || ch === ',') {
      await new Promise((r) => setTimeout(r, 140));
      i++;
    } else {
      i++;
    }
  }
  if (myToken === speakingToken && opts.duckBackground !== false) unduckMusic();
}

export function stopSpeaking(): void {
  speakingToken++;
  unduckMusic();
}

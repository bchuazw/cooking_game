// Tiny WebAudio wrapper. Brief §6 calls for Howler.js; we ship native WebAudio for
// the bundle budget. Same surface area: tap, snap, sizzle, etc.
//
// Music: a manifest-driven audio element pipeline. Placeholder data-URI silence
// tracks ship in /public/audio/music/manifest.json so the build is never blocked.

import { useApp } from '../state/store';

let ctx: AudioContext | null = null;

export function audio(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

// Resume context on first user gesture (iOS Safari requirement).
export function unlockAudio(): void {
  const c = audio();
  if (c.state === 'suspended') void c.resume();
}

// ----- SFX (procedural) -----

type Tone = {
  freq: number;
  type?: OscillatorType;
  ms: number;
  gain?: number;
  slide?: number; // hz delta over duration
  noise?: boolean;
};

function playTone(t: Tone, duckTo = 1): void {
  const c = audio();
  const sfxVol = useApp.getState().sfx;
  // Short-circuit when muted — exponentialRampToValueAtTime forbids 0/sub-denormal targets.
  if (sfxVol <= 0 || c.state === 'closed') return;
  const g = c.createGain();
  const peak = Math.max(0.0002, (t.gain ?? 0.18) * sfxVol * duckTo);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(peak, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t.ms / 1000);
  g.connect(c.destination);

  if (t.noise) {
    // Short noise burst via buffer source.
    const buf = c.createBuffer(1, Math.max(64, Math.floor((c.sampleRate * t.ms) / 1000)), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = t.freq;
    filter.Q.value = 1.2;
    src.connect(filter);
    filter.connect(g);
    src.start();
    src.stop(c.currentTime + t.ms / 1000);
    return;
  }

  const osc = c.createOscillator();
  osc.type = t.type ?? 'sine';
  osc.frequency.setValueAtTime(t.freq, c.currentTime);
  if (t.slide) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, t.freq + t.slide),
      c.currentTime + t.ms / 1000,
    );
  }
  osc.connect(g);
  osc.start();
  osc.stop(c.currentTime + t.ms / 1000);
}

export const sfx = {
  tap: () => {
    playTone({ freq: 700, type: 'triangle', ms: 50, gain: 0.10 });
    playTone({ freq: 1400, type: 'sine', ms: 70, gain: 0.06 });
  },
  snap: () => {
    playTone({ freq: 880, type: 'square', ms: 60, gain: 0.10, slide: 200 });
    playTone({ freq: 1760, type: 'sine', ms: 90, gain: 0.06 });
    playTone({ freq: 2400, ms: 30, gain: 0.04, noise: true });
  },
  chime: () => {
    // bell-like attack + decaying harmonics
    playTone({ freq: 880, type: 'sine', ms: 320, gain: 0.16 });
    setTimeout(() => playTone({ freq: 1320, type: 'sine', ms: 280, gain: 0.12 }), 60);
    setTimeout(() => playTone({ freq: 1760, type: 'sine', ms: 240, gain: 0.08 }), 110);
  },
  star: (tier: 1 | 2 | 3) => {
    const notes = tier === 3 ? [523.25, 659.25, 783.99, 1046.5] : tier === 2 ? [523.25, 659.25, 783.99] : [523.25, 659.25];
    notes.forEach((f, i) =>
      setTimeout(() => {
        playTone({ freq: f, type: 'triangle', ms: 220, gain: 0.18 });
        playTone({ freq: f * 2, type: 'sine', ms: 220, gain: 0.10 });
      }, i * 90),
    );
  },
  error: () => {
    playTone({ freq: 220, type: 'sawtooth', ms: 180, gain: 0.10, slide: -120 });
    playTone({ freq: 440, type: 'sine', ms: 140, gain: 0.06, slide: -100 });
  },
  sizzle: () => {
    // longer band-passed noise for a real sizzle feel
    playTone({ freq: 2400, ms: 360, gain: 0.10, noise: true });
    setTimeout(() => playTone({ freq: 1800, ms: 220, gain: 0.06, noise: true }), 80);
  },
  thud: () => {
    // wood-on-stone — body + click + tail
    playTone({ freq: 80, type: 'sine', ms: 180, gain: 0.22, slide: -30 });
    playTone({ freq: 240, type: 'triangle', ms: 50, gain: 0.10 });
    playTone({ freq: 600, ms: 30, gain: 0.04, noise: true });
  },
  bubble: () => {
    const f = 280 + Math.random() * 120;
    playTone({ freq: f, type: 'sine', ms: 100, gain: 0.06, slide: 80 });
  },
  toastpop: () => {
    playTone({ freq: 110, type: 'square', ms: 70, gain: 0.16, slide: 240 });
    playTone({ freq: 80, type: 'sine', ms: 100, gain: 0.08, slide: -20 });
  },
  pour: () => {
    // continuous-ish pour — short noise bursts
    playTone({ freq: 700, ms: 280, gain: 0.06, noise: true });
    setTimeout(() => playTone({ freq: 800, ms: 200, gain: 0.05, noise: true }), 80);
  },
  whoosh: () => {
    // for screen transitions
    playTone({ freq: 800, ms: 220, gain: 0.05, noise: true, slide: -400 });
  },
  combo: (level: number) => {
    // 5 short rising tones, level scales pitch up
    const base = 660 + level * 60;
    playTone({ freq: base, type: 'triangle', ms: 80, gain: 0.10 });
    setTimeout(() => playTone({ freq: base * 1.5, type: 'sine', ms: 80, gain: 0.08 }), 50);
  },
};

// ----- Ambient bed for the hawker centre — generative kopitiam soundscape.
// Distant chatter (filtered noise), occasional plate clinks, low cooker rumble.

let ambienceCtx: { stop: () => void } | null = null;

export function startAmbience(): void {
  if (ambienceCtx) return;
  const c = audio();
  if (c.state === 'closed') return;
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.exponentialRampToValueAtTime(0.18 * Math.max(0.1, useApp.getState().sfx), c.currentTime + 1.5);

  // chatter: pink noise → bandpass around 800Hz
  const noiseBuf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 850;
  bp.Q.value = 0.6;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.6;
  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(master);
  noise.start();

  // low rumble
  const rumble = c.createOscillator();
  rumble.type = 'sine';
  rumble.frequency.value = 60;
  const rumbleGain = c.createGain();
  rumbleGain.gain.value = 0.2;
  rumble.connect(rumbleGain);
  rumbleGain.connect(master);
  rumble.start();

  // sparse plate clinks
  let clinkInterval: ReturnType<typeof setInterval> | null = null;
  clinkInterval = setInterval(() => {
    if (Math.random() < 0.4) {
      playTone({ freq: 1800 + Math.random() * 600, type: 'sine', ms: 90, gain: 0.05 });
    }
  }, 2400);

  ambienceCtx = {
    stop() {
      try {
        master.gain.cancelScheduledValues(c.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
        setTimeout(() => {
          try { noise.stop(); rumble.stop(); } catch {/* */}
        }, 800);
      } catch {/* */}
      if (clinkInterval) clearInterval(clinkInterval);
      ambienceCtx = null;
    },
  };
}

export function stopAmbience(): void {
  ambienceCtx?.stop();
}

// ----- Music: manifest-backed audio element loop -----

interface MusicTrack {
  slot: string;
  src: string;
  loop: boolean;
  fadeMs?: number;
}

interface MusicManifest {
  tracks: MusicTrack[];
}

let manifest: MusicManifest | null = null;
let currentEl: HTMLAudioElement | null = null;
let currentSlot: string | null = null;
let duck = 1;

export async function loadMusicManifest(base: string): Promise<void> {
  try {
    const res = await fetch(`${base}audio/music/manifest.json`);
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = null;
  }
}

export function playMusic(slot: string): void {
  if (currentSlot === slot) return;
  stopMusic();
  const track = manifest?.tracks.find((t) => t.slot === slot);
  if (!track) return;
  const el = new Audio(track.src);
  el.loop = track.loop;
  el.volume = useApp.getState().music * duck;
  el.play().catch(() => {/* user hasn't gestured yet */});
  currentEl = el;
  currentSlot = slot;
}

export function stopMusic(): void {
  if (currentEl) {
    currentEl.pause();
    currentEl.src = '';
    currentEl = null;
    currentSlot = null;
  }
}

export function setMusicVolume(v: number): void {
  if (currentEl) currentEl.volume = v * duck;
}

// Duck music during gesture windows (brief §4 #6).
export function duckMusic(target = 0.35): void {
  duck = target;
  if (currentEl) currentEl.volume = useApp.getState().music * duck;
}

export function unduckMusic(): void {
  duck = 1;
  if (currentEl) currentEl.volume = useApp.getState().music * duck;
}

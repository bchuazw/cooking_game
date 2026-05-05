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
  tap: () => playTone({ freq: 660, type: 'triangle', ms: 70, gain: 0.14 }),
  snap: () => playTone({ freq: 880, type: 'square', ms: 90, gain: 0.12 }),
  chime: () => {
    playTone({ freq: 880, type: 'sine', ms: 220, gain: 0.16 });
    setTimeout(() => playTone({ freq: 1320, type: 'sine', ms: 220, gain: 0.12 }), 90);
  },
  star: (tier: 1 | 2 | 3) => {
    const base = [660, 990, 1320][tier - 1];
    playTone({ freq: base, type: 'triangle', ms: 240, gain: 0.18 });
    setTimeout(() => playTone({ freq: base * 1.5, type: 'sine', ms: 280, gain: 0.16 }), 120);
  },
  error: () => playTone({ freq: 220, type: 'sawtooth', ms: 220, gain: 0.1, slide: -100 }),
  sizzle: () => playTone({ freq: 1800, ms: 240, gain: 0.08, noise: true }),
  thud: () => playTone({ freq: 90, type: 'sine', ms: 140, gain: 0.22, slide: -40 }),
  bubble: () => playTone({ freq: 320 + Math.random() * 60, type: 'sine', ms: 90, gain: 0.06 }),
  toastpop: () => {
    playTone({ freq: 110, type: 'square', ms: 80, gain: 0.16, slide: 220 });
  },
  pour: () => playTone({ freq: 700, ms: 320, gain: 0.06, noise: true }),
};

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

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/* ─────────────────────────────────────────────────────────
 * FunnelStartModal — scoped soundscape (keyboard-focused)
 *
 * Event map (in the "How do you want to start?" flow):
 *   optionSelect   — user picks one of the 3 cards (drawer expands)
 *   drawerClose    — Back pressed while drawer expanded (collapse)
 *   backClick      — Back pressed while collapsed (exit modal)
 *   continueClick  — Continue CTA
 *   funnelPick     — a reference funnel row is selected
 *   faviconAppear  — favicon pops in on a URL input
 *   linkAdd        — "Add more link" row appended
 *   linkRemove     — a URL row is removed
 *   themeSwitch    — light/dark toggle (swoosh, pack-independent)
 * ───────────────────────────────────────────────────────── */
export type SoundEvent =
  | "optionSelect"
  | "drawerClose"
  | "backClick"
  | "continueClick"
  | "funnelPick"
  | "faviconAppear"
  | "linkAdd"
  | "linkRemove"
  | "themeSwitch";

/* Two engines remain: the original Tone (arpeggiated sine) kept as a baseline,
   and a mechanical "keyboard" engine that models a switch click → body thud
   with tunable brightness, body pitch, and timing — gets tryklack-like
   keypress timbre that varies meaningfully between packs. */
type Engine = "arp" | "keyboard";

type Pack = {
  name: string;
  engine: Engine;
  root: number;   // pitch reference (arp: fundamental; keyboard: unused)
  decay: number;  // base decay (keyboard uses bodyDecay instead)
  gain: number;

  /* arp */
  arpSteps?: number[];
  arpWave?: OscillatorType;

  /* keyboard — click (top transient) */
  clickFreq?: number;     // bandpass center of the click
  clickQ?: number;        // click resonance
  clickDur?: number;      // click length (s)
  clickGain?: number;     // click amplitude 0–1
  clickDelay?: number;    // offset relative to body (s, can be negative)
  clickDown?: boolean;    // true = on keydown (most), false = only on release

  /* keyboard — body (thud under the click) */
  bodyFreq?: number;      // body fundamental (Hz)
  bodyDrop?: number;      // ratio end/start (e.g. 0.6 = drops ~half-octave)
  bodyDecay?: number;     // body decay (s)
  bodyGain?: number;      // body amplitude 0–1
  bodyWave?: OscillatorType;
  bodyNoise?: number;     // noise mix in body 0–1 (adds plastic texture)
  bodyLP?: number;        // lowpass cutoff on body (Hz)
};

export const PACKS: Pack[] = [
  /* 01 — the only survivor from the previous set. */
  { name: "01 · Tone",              engine: "arp",      root: 440, decay: 0.10, gain: 0.45, arpSteps: [0], arpWave: "sine" },

  /* 02 — MX Blue: crisp high click + warm body, classic clicky switch. */
  {
    name: "02 · MX Blue",           engine: "keyboard", root: 0, decay: 0.10, gain: 0.85,
    clickFreq: 4200, clickQ: 8,  clickDur: 0.018, clickGain: 0.85, clickDelay: 0,
    bodyFreq: 220,   bodyDrop: 0.55, bodyDecay: 0.08, bodyGain: 0.55, bodyWave: "triangle", bodyNoise: 0.18, bodyLP: 2600,
  },

  /* 03 — MX Brown: soft click, tactile bump, muted body. */
  {
    name: "03 · MX Brown",          engine: "keyboard", root: 0, decay: 0.09, gain: 0.80,
    clickFreq: 2800, clickQ: 5,  clickDur: 0.012, clickGain: 0.45, clickDelay: 0,
    bodyFreq: 180,   bodyDrop: 0.50, bodyDecay: 0.09, bodyGain: 0.62, bodyWave: "sine",     bodyNoise: 0.12, bodyLP: 1800,
  },

  /* 04 — MX Red: linear, no click, just the bottom-out thump. */
  {
    name: "04 · MX Red",            engine: "keyboard", root: 0, decay: 0.08, gain: 0.82,
    clickFreq: 2200, clickQ: 3,  clickDur: 0.006, clickGain: 0.10, clickDelay: 0,
    bodyFreq: 160,   bodyDrop: 0.45, bodyDecay: 0.10, bodyGain: 0.70, bodyWave: "sine",     bodyNoise: 0.08, bodyLP: 1400,
  },

  /* 05 — Topre: rubber-dome "tok", dampened & round. */
  {
    name: "05 · Topre",             engine: "keyboard", root: 0, decay: 0.10, gain: 0.80,
    clickFreq: 1600, clickQ: 4,  clickDur: 0.010, clickGain: 0.25, clickDelay: 0.002,
    bodyFreq: 210,   bodyDrop: 0.50, bodyDecay: 0.11, bodyGain: 0.68, bodyWave: "sine",     bodyNoise: 0.14, bodyLP: 1500,
  },

  /* 06 — Thocky: deep lubed thunk, very low body. */
  {
    name: "06 · Thocky",            engine: "keyboard", root: 0, decay: 0.12, gain: 0.85,
    clickFreq: 1800, clickQ: 4,  clickDur: 0.008, clickGain: 0.22, clickDelay: 0.003,
    bodyFreq: 130,   bodyDrop: 0.40, bodyDecay: 0.14, bodyGain: 0.78, bodyWave: "sine",     bodyNoise: 0.10, bodyLP: 1100,
  },

  /* 07 — Clacky: bright plastic clack, high body + strong click. */
  {
    name: "07 · Clacky",            engine: "keyboard", root: 0, decay: 0.08, gain: 0.80,
    clickFreq: 5200, clickQ: 10, clickDur: 0.016, clickGain: 0.80, clickDelay: 0,
    bodyFreq: 320,   bodyDrop: 0.60, bodyDecay: 0.07, bodyGain: 0.55, bodyWave: "triangle", bodyNoise: 0.22, bodyLP: 3200,
  },

  /* 08 — Creamy: smooth mid, barely any click (like lubed linears). */
  {
    name: "08 · Creamy",            engine: "keyboard", root: 0, decay: 0.10, gain: 0.80,
    clickFreq: 2400, clickQ: 3,  clickDur: 0.008, clickGain: 0.14, clickDelay: 0,
    bodyFreq: 200,   bodyDrop: 0.50, bodyDecay: 0.11, bodyGain: 0.72, bodyWave: "sine",     bodyNoise: 0.05, bodyLP: 1600,
  },

  /* 09 — Typewriter: sharp metallic ping + mechanical body. */
  {
    name: "09 · Typewriter",        engine: "keyboard", root: 0, decay: 0.12, gain: 0.80,
    clickFreq: 5800, clickQ: 14, clickDur: 0.022, clickGain: 0.90, clickDelay: -0.002,
    bodyFreq: 260,   bodyDrop: 0.55, bodyDecay: 0.09, bodyGain: 0.50, bodyWave: "triangle", bodyNoise: 0.28, bodyLP: 2800,
  },

  /* 10 — Holy Panda: premium tactile, crisp+full. */
  {
    name: "10 · Holy Panda",        engine: "keyboard", root: 0, decay: 0.10, gain: 0.85,
    clickFreq: 3800, clickQ: 9,  clickDur: 0.016, clickGain: 0.65, clickDelay: 0,
    bodyFreq: 200,   bodyDrop: 0.48, bodyDecay: 0.11, bodyGain: 0.72, bodyWave: "sine",     bodyNoise: 0.15, bodyLP: 2200,
  },

  /* 11 — Silent Linear: dampened, very quiet muffled tap. */
  {
    name: "11 · Silent Linear",     engine: "keyboard", root: 0, decay: 0.08, gain: 0.70,
    clickFreq: 1400, clickQ: 2,  clickDur: 0.006, clickGain: 0.05, clickDelay: 0,
    bodyFreq: 150,   bodyDrop: 0.55, bodyDecay: 0.08, bodyGain: 0.55, bodyWave: "sine",     bodyNoise: 0.04, bodyLP: 900,
  },
];

/* Per-event pitch/duration modifiers. Keyboard engine ignores the pitch ratio
   for its fundamental (keyboards don't transpose per-keystroke) but uses the
   chord/stagger array to fire multiple keypresses for multi-tone events. */
type EventShape = {
  pitch: number;
  dur: number;
  chord?: number[];
  stagger?: number;
};

const EVENT_SHAPE: Record<Exclude<SoundEvent, "themeSwitch">, EventShape> = {
  optionSelect:  { pitch: 1.00, dur: 1.00, chord: [1.00, 1.25], stagger: 0.055 },
  drawerClose:   { pitch: 0.92, dur: 1.00, chord: [1.00, 0.85], stagger: 0.055 },
  backClick:     { pitch: 0.80, dur: 0.90 },
  continueClick: { pitch: 1.00, dur: 1.05, chord: [1.00, 1.20, 1.45], stagger: 0.050 },
  funnelPick:    { pitch: 1.00, dur: 0.95, chord: [1.00, 1.25], stagger: 0.035 },
  faviconAppear: { pitch: 1.50, dur: 0.70 },
  linkAdd:       { pitch: 1.10, dur: 0.90 },
  linkRemove:    { pitch: 0.88, dur: 0.80 },
};

/* ── Noise buffer (shared, pink) ────────────────────────────────── */
const noiseBufferCache = new WeakMap<AudioContext, AudioBuffer>();
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const existing = noiseBufferCache.get(ctx);
  if (existing) return existing;
  const len = ctx.sampleRate * 1.0;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  noiseBufferCache.set(ctx, buf);
  return buf;
}

function envGain(
  ctx: AudioContext,
  t: number,
  attack: number,
  decay: number,
  peak = 1,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + Math.max(0.001, attack));
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

/* ── Engines ────────────────────────────────────────────────────── */

function playArp(
  ctx: AudioContext,
  dest: AudioNode,
  pack: Pack,
  freq: number,
  t: number,
  dur: number,
) {
  const steps = pack.arpSteps ?? [0];
  const wave = pack.arpWave ?? "sine";
  const gap = 0.045;
  steps.forEach((semi, i) => {
    const f = freq * Math.pow(2, semi / 12);
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(f, t + i * gap);
    const amp = envGain(ctx, t + i * gap, 0.002, dur, 0.55);
    osc.connect(amp);
    amp.connect(dest);
    osc.start(t + i * gap);
    osc.stop(t + i * gap + dur + 0.05);
  });
}

/* Keyboard: models a mechanical-switch keypress as click + body.
   Click: very short burst of noise through a resonant bandpass — gives the
   "tic" of plastic-on-plastic. Body: short sine/triangle with pitch drop and
   optional noise mixture — simulates the switch bottoming out and the
   keycap resonance. The relative delay between click and body, plus their
   amplitudes and frequencies, shape the character between switches. */
function playKeyboard(
  ctx: AudioContext,
  dest: AudioNode,
  pack: Pack,
  _freq: number,
  t: number,
  _dur: number,
) {
  /* Click transient. */
  if ((pack.clickGain ?? 0) > 0.01) {
    const clickT = t + (pack.clickDelay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(pack.clickFreq ?? 3000, clickT);
    bp.Q.setValueAtTime(pack.clickQ ?? 6, clickT);

    const amp = ctx.createGain();
    const clickDur = pack.clickDur ?? 0.015;
    amp.gain.setValueAtTime(0.0001, clickT);
    amp.gain.exponentialRampToValueAtTime(pack.clickGain ?? 0.5, clickT + 0.0005);
    amp.gain.exponentialRampToValueAtTime(0.0001, clickT + clickDur);

    src.connect(bp);
    bp.connect(amp);
    amp.connect(dest);
    src.start(clickT);
    src.stop(clickT + clickDur + 0.02);
  }

  /* Body (tonal thud). */
  const bodyFreq = pack.bodyFreq ?? 200;
  const bodyDecay = pack.bodyDecay ?? 0.10;
  const bodyGain = pack.bodyGain ?? 0.6;
  const bodyWave = pack.bodyWave ?? "sine";
  const drop = pack.bodyDrop ?? 0.5;

  const osc = ctx.createOscillator();
  osc.type = bodyWave;
  osc.frequency.setValueAtTime(bodyFreq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, bodyFreq * drop), t + bodyDecay * 0.6);

  const bodyLP = ctx.createBiquadFilter();
  bodyLP.type = "lowpass";
  bodyLP.frequency.setValueAtTime(pack.bodyLP ?? 2000, t);
  bodyLP.Q.setValueAtTime(0.6, t);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(bodyGain, t + 0.003);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + bodyDecay);

  osc.connect(bodyLP);
  bodyLP.connect(amp);
  amp.connect(dest);
  osc.start(t);
  osc.stop(t + bodyDecay + 0.03);

  /* Plastic-texture noise inside the body (very short, low-passed). */
  if ((pack.bodyNoise ?? 0) > 0.01) {
    const n = ctx.createBufferSource();
    n.buffer = getNoiseBuffer(ctx);
    const nlp = ctx.createBiquadFilter();
    nlp.type = "lowpass";
    nlp.frequency.setValueAtTime((pack.bodyLP ?? 2000) * 1.5, t);
    const ng = ctx.createGain();
    const nDur = Math.min(0.05, bodyDecay);
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime((pack.bodyNoise ?? 0.1) * 0.6, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + nDur);
    n.connect(nlp);
    nlp.connect(ng);
    ng.connect(dest);
    n.start(t);
    n.stop(t + nDur + 0.02);
  }
}

const ENGINES: Record<Engine, typeof playArp> = {
  arp: playArp,
  keyboard: playKeyboard,
};

/* ── Swooshes (for theme switch) ────────────────────────────────── */

export type Swoosh = {
  name: string;
  dur: number;
  fStart: number;   // bandpass start
  fPeak: number;    // bandpass peak
  fEnd: number;     // bandpass end
  peakRatio: number;// 0–1 of dur
  Q: number;
  gain: number;
  sub?: {
    fStart: number;
    fPeak: number;
    fEnd: number;
    gain: number;
    wave: OscillatorType;
  };
  partials?: { freq: number; gain: number }[]; // added sine layers (sparkle)
  noiseBoost?: number; // amplitude multiplier on the noise layer
  attackRatio?: number; // fraction of dur for noise gain attack (default ~0.15)
};

export const SWOOSHES: Swoosh[] = [
  /* 1 — original soft whoosh (pink noise + sub body). */
  {
    name: "01 · Soft Whoosh", dur: 0.42, fStart: 600, fPeak: 4800, fEnd: 900,
    peakRatio: 0.55, Q: 2.5, gain: 0.9,
    sub: { fStart: 180, fPeak: 420, fEnd: 140, gain: 0.35, wave: "sine" },
  },
  /* 2 — page turn: quick paper flutter, short, no sub. */
  {
    name: "02 · Page Turn", dur: 0.22, fStart: 2000, fPeak: 5000, fEnd: 1200,
    peakRatio: 0.35, Q: 3.5, gain: 0.85, noiseBoost: 1.1,
  },
  /* 3 — tape rewind: high Q, pitched-feeling sweep. */
  {
    name: "03 · Tape Rewind", dur: 0.35, fStart: 300, fPeak: 1800, fEnd: 300,
    peakRatio: 0.5, Q: 7, gain: 0.85,
    sub: { fStart: 220, fPeak: 880, fEnd: 220, gain: 0.30, wave: "sawtooth" },
  },
  /* 4 — breath: gentle air, slow. */
  {
    name: "04 · Breath", dur: 0.60, fStart: 400, fPeak: 2000, fEnd: 400,
    peakRatio: 0.55, Q: 1.2, gain: 0.65, attackRatio: 0.3,
  },
  /* 5 — whip: short fast high-freq sweep. */
  {
    name: "05 · Whip", dur: 0.18, fStart: 1000, fPeak: 6000, fEnd: 1500,
    peakRatio: 0.5, Q: 4, gain: 0.95, noiseBoost: 1.2,
  },
  /* 6 — wind: long, soft, low. */
  {
    name: "06 · Wind", dur: 0.75, fStart: 400, fPeak: 1800, fEnd: 600,
    peakRatio: 0.5, Q: 1.5, gain: 0.75, attackRatio: 0.35,
    sub: { fStart: 90, fPeak: 200, fEnd: 90, gain: 0.30, wave: "sine" },
  },
  /* 7 — shimmer: noise + high sine sparkle partials. */
  {
    name: "07 · Shimmer", dur: 0.50, fStart: 2000, fPeak: 8000, fEnd: 3000,
    peakRatio: 0.55, Q: 2, gain: 0.75,
    partials: [{ freq: 4400, gain: 0.18 }, { freq: 6600, gain: 0.14 }],
  },
  /* 8 — thud swoosh: big sub underneath. */
  {
    name: "08 · Thud Swoosh", dur: 0.40, fStart: 500, fPeak: 3000, fEnd: 800,
    peakRatio: 0.5, Q: 2.2, gain: 0.85,
    sub: { fStart: 70, fPeak: 140, fEnd: 55, gain: 0.55, wave: "sine" },
  },
  /* 9 — synth sweep: tight resonant filter sweep, sawtooth under. */
  {
    name: "09 · Synth Sweep", dur: 0.45, fStart: 400, fPeak: 5000, fEnd: 400,
    peakRatio: 0.55, Q: 5, gain: 0.80,
    sub: { fStart: 140, fPeak: 540, fEnd: 140, gain: 0.28, wave: "sawtooth" },
  },
  /* 10 — slide up: rising only, with rising sub for "lift" feel. */
  {
    name: "10 · Slide Up", dur: 0.40, fStart: 600, fPeak: 2800, fEnd: 4200,
    peakRatio: 0.7, Q: 2, gain: 0.80,
    sub: { fStart: 200, fPeak: 600, fEnd: 900, gain: 0.32, wave: "triangle" },
  },
];

function playSwoosh(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  sw: Swoosh,
) {
  const tPeak = t + sw.dur * sw.peakRatio;
  const tEnd = t + sw.dur;

  /* Noise through swept bandpass. */
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.setValueAtTime(sw.Q, t);
  bp.frequency.setValueAtTime(sw.fStart, t);
  bp.frequency.exponentialRampToValueAtTime(Math.max(40, sw.fPeak), tPeak);
  bp.frequency.exponentialRampToValueAtTime(Math.max(40, sw.fEnd), tEnd);

  const amp = ctx.createGain();
  const attack = sw.dur * (sw.attackRatio ?? 0.15);
  const noiseGain = 0.6 * (sw.noiseBoost ?? 1);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(noiseGain, t + attack);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.05, noiseGain * 0.35), tPeak);
  amp.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  src.connect(bp);
  bp.connect(amp);
  amp.connect(dest);
  src.start(t);
  src.stop(tEnd + 0.05);

  /* Optional sub layer. */
  if (sw.sub) {
    const sub = ctx.createOscillator();
    sub.type = sw.sub.wave;
    sub.frequency.setValueAtTime(sw.sub.fStart, t);
    sub.frequency.exponentialRampToValueAtTime(Math.max(30, sw.sub.fPeak), tPeak);
    sub.frequency.exponentialRampToValueAtTime(Math.max(30, sw.sub.fEnd), tEnd);
    const subAmp = envGain(ctx, t, sw.dur * 0.1, sw.dur * 0.95, sw.sub.gain);
    sub.connect(subAmp);
    subAmp.connect(dest);
    sub.start(t);
    sub.stop(tEnd + 0.05);
  }

  /* Optional sparkle partials. */
  if (sw.partials) {
    sw.partials.forEach((p) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(p.freq * 0.95, t);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 1.15, tPeak);
      osc.frequency.exponentialRampToValueAtTime(p.freq, tEnd);
      const pAmp = envGain(ctx, t, sw.dur * 0.2, sw.dur * 0.85, p.gain);
      osc.connect(pAmp);
      pAmp.connect(dest);
      osc.start(t);
      osc.stop(tEnd + 0.05);
    });
  }
}

export function useSoundscape(
  packIndex = 0,
  masterVolume = 0.75,
  swooshIndex = 0,
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const pack = useMemo(() => {
    const i = Number.isFinite(packIndex) ? packIndex : 0;
    return PACKS[Math.max(0, Math.min(PACKS.length - 1, i))];
  }, [packIndex]);
  const swoosh = useMemo(() => {
    const i = Number.isFinite(swooshIndex) ? swooshIndex : 0;
    return SWOOSHES[Math.max(0, Math.min(SWOOSHES.length - 1, i))];
  }, [swooshIndex]);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (event: SoundEvent) => {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();

      const master = ctx.createGain();
      master.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.005;

      if (event === "themeSwitch") {
        master.gain.value = masterVolume * swoosh.gain;
        playSwoosh(ctx, master, t0, swoosh);
        return;
      }

      master.gain.value = masterVolume * pack.gain;
      const shape = EVENT_SHAPE[event];
      const dur = pack.decay * shape.dur;
      const ratios = shape.chord ?? [1.0];
      const stagger = shape.stagger ?? 0;
      const engine = ENGINES[pack.engine];

      ratios.forEach((ratio, i) => {
        const f = pack.root * shape.pitch * ratio;
        engine(ctx, master, pack, f, t0 + i * stagger, dur);
      });
    },
    [getCtx, pack, swoosh, masterVolume],
  );

  useEffect(() => {
    const ctx = ctxRef.current;
    return () => {
      ctx?.close();
    };
  }, []);

  return {
    play,
    packName: pack.name,
    packCount: PACKS.length,
    swooshName: swoosh.name,
    swooshCount: SWOOSHES.length,
  };
}

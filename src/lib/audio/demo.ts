import { makeClip, type AudioClip } from "./types";

export function makeDemoLoop(): AudioClip {
  const sr = 44100;
  const bpm = 90;
  const bars = 4;
  const beats = bars * 4;
  const dur = (beats * 60) / bpm;
  const n = Math.floor(dur * sr);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const spb = 60 / bpm;

  const kickHits = [0, 4, 8, 12, 2.5, 10.5];
  for (const b of kickHits) {
    addKick(L, R, sr, b * spb, b % 1 === 0 ? 1 : 0.55);
    add808(L, R, sr, b * spb, 55 * (b % 8 === 0 ? 1 : 4 / 3), b % 1 === 0 ? 1.6 : 0.9);
  }

  for (const b of [2, 6, 10, 14]) addSnare(L, R, sr, b * spb, 0.85);
  for (let i = 0; i < beats * 2; i++) {
    const t = (i * spb) / 2;
    const acc = i % 2 === 1 ? 0.55 : 0.32;
    addHat(L, R, sr, t, acc, i % 4 === 0 ? -0.2 : 0.35);
  }

  const chords: [number, number, number, number][] = [
    [220.0, 261.63, 329.63, 0],
    [174.61, 220.0, 261.63, 1],
    [196.0, 246.94, 293.66, 2],
    [164.81, 196.0, 246.94, 3],
  ];
  for (const [a, b, c, bar] of chords) {
    addPad(L, R, sr, bar * 4 * spb, 4 * spb, [a, b, c]);
  }

  const melody = [
    [0, 440],
    [1, 523.25],
    [2.5, 493.88],
    [4, 440],
    [5.5, 349.23],
    [8, 392],
    [9, 440],
    [11, 523.25],
    [12.5, 493.88],
    [14, 440],
  ] as const;
  for (const [beat, f] of melody) addVocal(L, R, sr, beat * spb, 0.45, f);

  addPluck(L, R, sr, 1.5 * spb, 659.25, 0.6);
  addPluck(L, R, sr, 5.5 * spb, 587.33, -0.55);
  addPluck(L, R, sr, 9.5 * spb, 523.25, 0.4);
  addPluck(L, R, sr, 13.5 * spb, 659.25, -0.35);

  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(L[i] ?? 0), Math.abs(R[i] ?? 0));
  }
  const g = 0.55 / peak;
  for (let i = 0; i < n; i++) {
    L[i] *= g;
    R[i] *= g;
  }

  return makeClip("NoDAW 90 BPM demo", sr, [L, R]);
}

function addKick(L: Float32Array, R: Float32Array, sr: number, t: number, amp: number) {
  const n = Math.floor(sr * 0.42);
  const i0 = Math.floor(t * sr);
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const env = Math.exp(-tt * 14);
    const f = 150 * Math.exp(-tt * 18) + 38;
    const s = Math.sin(2 * Math.PI * f * tt) * env * amp;
    const click = Math.exp(-tt * 90) * (Math.random() * 2 - 1) * 0.08 * amp;
    L[i0 + i] += s + click;
    R[i0 + i] += s + click * 0.7;
  }
}

function add808(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  t: number,
  f0: number,
  hold: number,
) {
  const n = Math.floor(sr * hold);
  const i0 = Math.floor(t * sr);
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const f = f0 * (1 + Math.exp(-tt * 30) * 0.5);
    const env = Math.exp(-tt * 1.6);
    const s = Math.sin(2 * Math.PI * f * tt) * env * 0.7;
    L[i0 + i] += s;
    R[i0 + i] += s;
  }
}

function addSnare(L: Float32Array, R: Float32Array, sr: number, t: number, amp: number) {
  const n = Math.floor(sr * 0.28);
  const i0 = Math.floor(t * sr);
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const env = Math.exp(-tt * 18);
    const tone = Math.sin(2 * Math.PI * 190 * tt) * env * 0.25;
    const noise = (Math.random() * 2 - 1) * env * 0.7;
    L[i0 + i] += (tone + noise) * amp;
    R[i0 + i] += (tone + noise * 0.85) * amp;
  }
}

function addHat(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  t: number,
  amp: number,
  pan: number,
) {
  const n = Math.floor(sr * 0.05);
  const i0 = Math.floor(t * sr);
  let hp = 0;
  const gL = (1 - pan) * 0.5 + 0.5;
  const gR = (1 + pan) * 0.5 + 0.5;
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const env = Math.exp(-tt * 70);
    const x = Math.random() * 2 - 1;
    hp = x - hp * 0.4;
    const s = hp * env * amp * 0.35;
    L[i0 + i] += s * gL;
    R[i0 + i] += s * gR;
  }
}

function addPad(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  t: number,
  dur: number,
  freqs: number[],
) {
  const n = Math.floor(sr * dur);
  const i0 = Math.floor(t * sr);
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const fade = Math.min(1, tt / 0.08) * Math.min(1, (dur - tt) / 0.12);
    let sL = 0;
    let sR = 0;
    for (let k = 0; k < freqs.length; k++) {
      const f = freqs[k] ?? 0;
      sL += Math.sin(2 * Math.PI * f * 0.5 * tt + 0.04) * 0.12;
      sR += Math.sin(2 * Math.PI * f * 0.5 * tt - 0.04) * 0.12;
      sL += Math.sin(2 * Math.PI * f * tt + 0.2) * 0.05;
      sR += Math.sin(2 * Math.PI * f * tt - 0.15) * 0.05;
    }
    L[i0 + i] += sL * fade;
    R[i0 + i] += sR * fade;
  }
}

function addVocal(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  t: number,
  dur: number,
  f0: number,
) {
  const n = Math.floor(sr * dur);
  const i0 = Math.floor(t * sr);
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const env = Math.min(1, tt / 0.03) * Math.min(1, (dur - tt) / 0.06) * 0.22;
    const src = Math.sin(2 * Math.PI * f0 * tt) + 0.3 * Math.sin(2 * Math.PI * f0 * 2 * tt);
    const bp = src - y1 * 0.2;
    y2 = y2 * 0.7 + bp * 0.3;
    y1 = bp;
    const s = y2 * env;
    L[i0 + i] += s;
    R[i0 + i] += s * 0.92;
  }
}

function addPluck(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  t: number,
  f: number,
  pan: number,
) {
  const n = Math.floor(sr * 0.55);
  const i0 = Math.floor(t * sr);
  const gL = 0.5 + pan * 0.4;
  const gR = 0.5 - pan * 0.4;
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const tt = i / sr;
    const env = Math.exp(-tt * 7);
    const s =
      (Math.sin(2 * Math.PI * f * tt) + 0.4 * Math.sin(2 * Math.PI * f * 2 * tt)) * env * 0.16;
    L[i0 + i] += s * gL;
    R[i0 + i] += s * gR;
  }
}

import { makeClip, type AudioClip } from "./types";

export function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

export function gainToDb(g: number) {
  if (g <= 1e-12) return -120;
  return 20 * Math.log10(g);
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function mixToMono(clip: AudioClip): Float32Array {
  const n = clip.channels[0]?.length ?? 0;
  const out = new Float32Array(n);
  const ch = clip.channels.length || 1;
  for (let c = 0; c < clip.channels.length; c++) {
    const src = clip.channels[c];
    for (let i = 0; i < n; i++) out[i] += src[i] / ch;
  }
  return out;
}

export function peakOf(channels: Float32Array[]) {
  let p = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > p) p = a;
    }
  }
  return p;
}

export function applyGain(clip: AudioClip, gain: number, name = clip.name): AudioClip {
  return makeClip(
    name,
    clip.sampleRate,
    clip.channels.map((ch) => {
      const o = new Float32Array(ch.length);
      for (let i = 0; i < ch.length; i++) o[i] = ch[i] * gain;
      return o;
    }),
  );
}

export function sliceClip(
  clip: AudioClip,
  startSec: number,
  endSec: number,
  name = clip.name,
): AudioClip {
  const a = clamp(Math.floor(startSec * clip.sampleRate), 0, frameCountSafe(clip));
  const b = clamp(Math.floor(endSec * clip.sampleRate), a + 1, frameCountSafe(clip));
  return makeClip(
    name,
    clip.sampleRate,
    clip.channels.map((ch) => ch.subarray(a, b).slice()),
  );
}

function frameCountSafe(clip: AudioClip) {
  return clip.channels[0]?.length ?? 0;
}

export function nearestZeroCrossing(ch: Float32Array, index: number) {
  const n = ch.length;
  const i0 = clamp(index, 1, n - 2);
  let best = i0;
  let bestAbs = Math.abs(ch[i0]);
  const window = Math.min(2048, n - 2);
  for (let d = 1; d < window; d++) {
    for (const i of [i0 - d, i0 + d]) {
      if (i <= 0 || i >= n - 1) continue;
      const crossed = ch[i] === 0 || ch[i] * ch[i - 1] <= 0;
      if (!crossed) continue;
      const a = Math.abs(ch[i]);
      if (a < bestAbs) {
        bestAbs = a;
        best = i;
        if (a < 1e-5) return i;
      }
    }
  }
  return best;
}

export function applyFades(
  clip: AudioClip,
  fadeInSec: number,
  fadeOutSec: number,
): AudioClip {
  const n = frameCountSafe(clip);
  const fi = Math.min(n, Math.floor(fadeInSec * clip.sampleRate));
  const fo = Math.min(n, Math.floor(fadeOutSec * clip.sampleRate));
  return makeClip(
    clip.name,
    clip.sampleRate,
    clip.channels.map((ch) => {
      const o = new Float32Array(ch);
      for (let i = 0; i < fi; i++) o[i] *= i / fi;
      for (let i = 0; i < fo; i++) o[n - 1 - i] *= i / fo;
      return o;
    }),
  );
}

export function resampleClip(clip: AudioClip, targetRate: number): AudioClip {
  if (clip.sampleRate === targetRate) return clip;
  const ratio = targetRate / clip.sampleRate;
  const nOut = Math.max(1, Math.round(frameCountSafe(clip) * ratio));
  return makeClip(
    clip.name,
    targetRate,
    clip.channels.map((ch) => resampleChannel(ch, nOut)),
  );
}

export function resampleChannel(src: Float32Array, nOut: number): Float32Array {
  const out = new Float32Array(nOut);
  if (src.length === 0) return out;
  const scale = (src.length - 1) / Math.max(1, nOut - 1);
  for (let i = 0; i < nOut; i++) {
    const x = i * scale;
    const i0 = Math.floor(x);
    const i1 = Math.min(src.length - 1, i0 + 1);
    const t = x - i0;
    const y0 = src[i0] ?? 0;
    const y1 = src[i1] ?? 0;
    const y_1 = src[Math.max(0, i0 - 1)] ?? y0;
    const y2 = src[Math.min(src.length - 1, i0 + 2)] ?? y1;
    out[i] = cubic(y_1, y0, y1, y2, t);
  }
  return out;
}

function cubic(y_1: number, y0: number, y1: number, y2: number, t: number) {
  const a = -0.5 * y_1 + 1.5 * y0 - 1.5 * y1 + 0.5 * y2;
  const b = y_1 - 2.5 * y0 + 2 * y1 - 0.5 * y2;
  const c = -0.5 * y_1 + 0.5 * y1;
  return ((a * t + b) * t + c) * t + y0;
}

export function toChannelCount(clip: AudioClip, count: 1 | 2): AudioClip {
  if (count === 1) {
    return makeClip(clip.name, clip.sampleRate, [mixToMono(clip)]);
  }
  const l = clip.channels[0] ?? new Float32Array(0);
  const r = clip.channels[1] ?? new Float32Array(l);
  return makeClip(clip.name, clip.sampleRate, [new Float32Array(l), new Float32Array(r)]);
}

export type Peaks = { min: Float32Array; max: Float32Array };

export function computePeaks(clip: AudioClip, buckets: number): Peaks {
  const n = frameCountSafe(clip);
  const bucketsN = Math.max(1, buckets);
  const min = new Float32Array(bucketsN);
  const max = new Float32Array(bucketsN);
  min.fill(0);
  max.fill(0);
  if (n === 0) return { min, max };
  const chs = clip.channels;
  for (let b = 0; b < bucketsN; b++) {
    const start = Math.floor((b / bucketsN) * n);
    const end = Math.floor(((b + 1) / bucketsN) * n);
    let lo = 0;
    let hi = 0;
    for (let i = start; i < end; i++) {
      let s = 0;
      for (let c = 0; c < chs.length; c++) s += chs[c][i] ?? 0;
      s /= chs.length;
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    min[b] = lo;
    max[b] = hi;
  }
  return { min, max };
}

export type Biquad = {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
  z1: number;
  z2: number;
};

export function biquadLowpass(sr: number, freq: number, q = 0.7071): Biquad {
  const w0 = (2 * Math.PI * freq) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const b0 = (1 - cos) / 2;
  const b1 = 1 - cos;
  const b2 = (1 - cos) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function biquadHighpass(sr: number, freq: number, q = 0.7071): Biquad {
  const w0 = (2 * Math.PI * freq) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const b0 = (1 + cos) / 2;
  const b1 = -(1 + cos);
  const b2 = (1 + cos) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function biquadPeaking(
  sr: number,
  freq: number,
  q: number,
  gainDb: number,
): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const b0 = 1 + alpha * A;
  const b1 = -2 * cos;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * cos;
  const a2 = 1 - alpha / A;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function biquadHighshelf(sr: number, freq: number, gainDb: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const S = 1;
  const alpha = (sin / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
  const b0 = A * (A + 1 + (A - 1) * cos + 2 * Math.sqrt(A) * alpha);
  const b1 = -2 * A * (A - 1 + (A + 1) * cos);
  const b2 = A * (A + 1 + (A - 1) * cos - 2 * Math.sqrt(A) * alpha);
  const a0 = A + 1 - (A - 1) * cos + 2 * Math.sqrt(A) * alpha;
  const a1 = 2 * (A - 1 - (A + 1) * cos);
  const a2 = A + 1 - (A - 1) * cos - 2 * Math.sqrt(A) * alpha;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function biquadProcess(f: Biquad, x: number) {
  const y = f.b0 * x + f.z1;
  f.z1 = f.b1 * x - f.a1 * y + f.z2;
  f.z2 = f.b2 * x - f.a2 * y;
  return y;
}

export function runBiquad(src: Float32Array, proto: Biquad): Float32Array {
  const f = { ...proto, z1: 0, z2: 0 };
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = biquadProcess(f, src[i] ?? 0);
  return out;
}

export function cascade(src: Float32Array, filters: Biquad[]): Float32Array {
  let cur = src;
  for (const f of filters) cur = runBiquad(cur, f);
  return cur;
}

export function onePoleLowpass(src: Float32Array, sr: number, ms: number): Float32Array {
  const out = new Float32Array(src.length);
  const coeff = Math.exp(-1 / ((ms / 1000) * sr));
  let y = 0;
  for (let i = 0; i < src.length; i++) {
    y = src[i] + coeff * (y - src[i]);
    out[i] = y;
  }
  return out;
}

export function addScaled(
  dest: Float32Array,
  src: Float32Array,
  gain: number,
) {
  const n = Math.min(dest.length, src.length);
  for (let i = 0; i < n; i++) dest[i] += src[i] * gain;
}

export function biquadLowshelf(sr: number, freq: number, gainDb: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const S = 1;
  const alpha = (sin / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
  const b0 = A * (A + 1 - (A - 1) * cos + 2 * Math.sqrt(A) * alpha);
  const b1 = 2 * A * (A - 1 - (A + 1) * cos);
  const b2 = A * (A + 1 - (A - 1) * cos - 2 * Math.sqrt(A) * alpha);
  const a0 = A + 1 + (A - 1) * cos + 2 * Math.sqrt(A) * alpha;
  const a1 = -2 * (A - 1 + (A + 1) * cos);
  const a2 = A + 1 + (A - 1) * cos - 2 * Math.sqrt(A) * alpha;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function peakNormalize(clip: AudioClip, targetDb = -0.3): AudioClip {
  const peak = peakOf(clip.channels);
  if (peak <= 1e-12) return clip;
  const target = dbToGain(targetDb);
  const g = target / peak;
  if (Math.abs(g - 1) < 1e-6) return clip;
  return applyGain(clip, g, clip.name);
}

export function tanhSoft(x: number, drive: number) {
  return Math.tanh(x * drive) / Math.tanh(drive);
}

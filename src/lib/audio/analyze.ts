import { peakOf } from "./dsp";
import { makeClip, stereoOf, type AudioClip } from "./types";

export type MixReport = {
  crestDb: number;
  stereoCorr: number;
  dcOffset: number;
  clipCount: number;
  rmsDb: number;
  width: number;
};

export function analyzeMix(clip: AudioClip): MixReport {
  const [l, r] = stereoOf(clip);
  const n = l.length || 1;
  let sumL = 0;
  let sumR = 0;
  let sumSq = 0;
  let sumLR = 0;
  let sumL2 = 0;
  let sumR2 = 0;
  let clips = 0;
  let sideAcc = 0;
  let midAcc = 0;

  for (let i = 0; i < n; i++) {
    const a = l[i] ?? 0;
    const b = r[i] ?? 0;
    sumL += a;
    sumR += b;
    sumSq += a * a + b * b;
    sumLR += a * b;
    sumL2 += a * a;
    sumR2 += b * b;
    if (Math.abs(a) >= 0.999 || Math.abs(b) >= 0.999) clips += 1;
    const mid = (a + b) * 0.5;
    const side = (a - b) * 0.5;
    midAcc += mid * mid;
    sideAcc += side * side;
  }

  const peak = peakOf(clip.channels);
  const rms = Math.sqrt(sumSq / (n * 2));
  const rmsDb = rms <= 1e-12 ? -120 : 20 * Math.log10(rms);
  const peakDb = peak <= 1e-12 ? -120 : 20 * Math.log10(peak);
  const denom = Math.sqrt(sumL2 * sumR2);
  const stereoCorr = denom <= 1e-12 ? 1 : sumLR / denom;
  const dcOffset = (sumL + sumR) / (n * 2);
  const width = midAcc <= 1e-12 ? 0 : Math.sqrt(sideAcc / midAcc);

  return {
    crestDb: peakDb - rmsDb,
    stereoCorr,
    dcOffset,
    clipCount: clips,
    rmsDb,
    width,
  };
}

export function detectActiveRegion(
  clip: AudioClip,
  thresh = 0.008,
  padSec = 0.04,
): { start: number; end: number } {
  const ch = clip.channels[0] ?? new Float32Array(0);
  const n = ch.length;
  if (n === 0) return { start: 0, end: 0 };
  let first = 0;
  let last = n - 1;
  for (let i = 0; i < n; i++) {
    if (Math.abs(ch[i] ?? 0) > thresh) {
      first = i;
      break;
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(ch[i] ?? 0) > thresh) {
      last = i;
      break;
    }
  }
  const pad = Math.floor(padSec * clip.sampleRate);
  const a = Math.max(0, first - pad);
  const b = Math.min(n, last + pad + 1);
  return { start: a / clip.sampleRate, end: Math.max(a + 1, b) / clip.sampleRate };
}

export function invertSum(a: AudioClip, b: AudioClip): AudioClip {
  const n = Math.min(a.channels[0]?.length ?? 0, b.channels[0]?.length ?? 0);
  const sr = a.sampleRate;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const aL = a.channels[0] ?? l;
  const aR = a.channels[1] ?? aL;
  const bL = b.channels[0] ?? l;
  const bR = b.channels[1] ?? bL;
  for (let i = 0; i < n; i++) {
    l[i] = (aL[i] ?? 0) - (bL[i] ?? 0);
    r[i] = (aR[i] ?? 0) - (bR[i] ?? 0);
  }
  return makeClip(`${a.name} null`, sr, a.channels.length === 1 ? [l] : [l, r]);
}

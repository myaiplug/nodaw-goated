import { dbToGain, peakOf, resampleClip } from "./dsp";
import { makeClip, stereoOf, type AudioClip } from "./types";

export type LoudnessReport = {
  lufs: number;
  truePeakDb: number;
  samplePeakDb: number;
  lra: number;
  duration: number;
};

const PRE = {
  b0: 1.53512485958697,
  b1: -2.69169618940638,
  b2: 1.19839281085285,
  a1: -1.69065929318241,
  a2: 0.73248077421585,
};

const RLB = {
  b0: 1.0,
  b1: -2.0,
  b2: 1.0,
  a1: -1.99004745483398,
  a2: 0.99007225036621,
};

function kWeight(src: Float32Array) {
  const n = src.length;
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < n; i++) {
    const x = src[i] ?? 0;
    const y = PRE.b0 * x + z1;
    z1 = PRE.b1 * x - PRE.a1 * y + z2;
    z2 = PRE.b2 * x - PRE.a2 * y;
    a[i] = y;
  }
  z1 = 0;
  z2 = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = RLB.b0 * x + z1;
    z1 = RLB.b1 * x - RLB.a1 * y + z2;
    z2 = RLB.b2 * x - RLB.a2 * y;
    b[i] = y;
  }
  return b;
}

function blockMeanSquares(ch: Float32Array[], sr: number, blockSec: number, hopSec: number) {
  const block = Math.round(blockSec * sr);
  const hop = Math.round(hopSec * sr);
  const n = ch[0]?.length ?? 0;
  const out: number[] = [];
  for (let start = 0; start + block <= n; start += hop) {
    let acc = 0;
    for (const c of ch) {
      let s = 0;
      for (let i = 0; i < block; i++) {
        const v = c[start + i] ?? 0;
        s += v * v;
      }
      acc += s / block;
    }
    out.push(acc);
  }
  return out;
}

function msToLufs(ms: number) {
  if (ms <= 1e-12) return -70;
  return -0.691 + 10 * Math.log10(ms);
}

export function measureLoudness(clip: AudioClip): LoudnessReport {
  const measured = clip.sampleRate === 48000 ? clip : resampleClip(clip, 48000);
  const weighted = measured.channels.map(kWeight);
  const blocks = blockMeanSquares(weighted, 48000, 0.4, 0.1);
  const absKept = blocks.filter((ms) => msToLufs(ms) > -70);
  const absMean =
    absKept.length === 0 ? 0 : absKept.reduce((a, b) => a + b, 0) / absKept.length;
  const relThresh = msToLufs(absMean) - 10;
  const relKept = absKept.filter((ms) => msToLufs(ms) > relThresh);
  const gated =
    relKept.length === 0 ? absMean : relKept.reduce((a, b) => a + b, 0) / relKept.length;
  const lufs = msToLufs(gated);

  const longBlocks = blockMeanSquares(weighted, 48000, 3, 0.1);
  const longAbs = longBlocks.filter((ms) => msToLufs(ms) > -70);
  const longMean =
    longAbs.length === 0 ? 0 : longAbs.reduce((a, b) => a + b, 0) / longAbs.length;
  const longRel = longAbs.filter((ms) => msToLufs(ms) > msToLufs(longMean) - 20);
  const lufsVals = longRel.map(msToLufs).sort((a, b) => a - b);
  const p = (q: number) => {
    if (lufsVals.length === 0) return lufs;
    const i = clampIndex((lufsVals.length - 1) * q, lufsVals.length);
    return lufsVals[i] ?? lufs;
  };
  const lra = Math.max(0, p(0.95) - p(0.1));

  const samplePeak = peakOf(clip.channels);
  const truePeak = truePeakOf(clip);

  return {
    lufs,
    truePeakDb: samplePeak <= 0 ? -120 : 20 * Math.log10(truePeak),
    samplePeakDb: samplePeak <= 0 ? -120 : 20 * Math.log10(samplePeak),
    lra,
    duration: clip.duration,
  };
}

function clampIndex(v: number, n: number) {
  return Math.max(0, Math.min(n - 1, Math.round(v)));
}

function truePeakOf(clip: AudioClip) {
  let peak = peakOf(clip.channels);
  for (const ch of clip.channels) {
    const n = ch.length;
    for (let i = 0; i < n - 1; i++) {
      const a = ch[i] ?? 0;
      const b = ch[i + 1] ?? 0;
      const c0 = ch[Math.max(0, i - 1)] ?? a;
      const c3 = ch[Math.min(n - 1, i + 2)] ?? b;
      for (let k = 1; k < 4; k++) {
        const t = k / 4;
        const s = cubicInterp(c0, a, b, c3, t);
        const abs = Math.abs(s);
        if (abs > peak) peak = abs;
      }
    }
  }
  return peak;
}

function cubicInterp(y_1: number, y0: number, y1: number, y2: number, t: number) {
  const a = -0.5 * y_1 + 1.5 * y0 - 1.5 * y1 + 0.5 * y2;
  const b = y_1 - 2.5 * y0 + 2 * y1 - 0.5 * y2;
  const c = -0.5 * y_1 + 0.5 * y1;
  return ((a * t + b) * t + c) * t + y0;
}

export function applyGainDb(clip: AudioClip, db: number, name = clip.name): AudioClip {
  const g = dbToGain(db);
  return makeClip(
    name,
    clip.sampleRate,
    clip.channels.map((ch) => {
      const o = new Float32Array(ch.length);
      for (let i = 0; i < ch.length; i++) o[i] = ch[i] * g;
      return o;
    }),
  );
}

export function truePeakLimit(clip: AudioClip, ceilingDb = -1): AudioClip {
  const ceiling = dbToGain(ceilingDb);
  const attack = Math.max(1, Math.round(0.004 * clip.sampleRate));
  const release = Math.exp(-1 / (0.08 * clip.sampleRate));
  const [l, r] = stereoOf(clip);
  const n = l.length;
  const env = new Float32Array(n);
  let e = 0;
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(l[i] ?? 0), Math.abs(r[i] ?? 0));
    e = p > e ? p : e * release + p * (1 - release);
    env[i] = e;
  }
  for (let i = n - 2; i >= 0; i--) {
    const ahead = env[Math.min(n - 1, i + attack)] ?? 0;
    if (ahead > (env[i] ?? 0)) env[i] = ahead;
  }
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const need = (env[i] ?? 0) > ceiling ? ceiling / (env[i] ?? 1) : 1;
    outL[i] = (l[i] ?? 0) * need;
    outR[i] = (r[i] ?? 0) * need;
  }
  const channels = clip.channels.length === 1 ? [outL] : [outL, outR];
  return makeClip(clip.name, clip.sampleRate, channels);
}

export function repairToTarget(
  clip: AudioClip,
  targetLufs: number,
  ceilingDb = -1,
): AudioClip {
  const now = measureLoudness(clip);
  const gainDb = targetLufs - now.lufs;
  let out = applyGainDb(clip, gainDb, clip.name);
  const after = measureLoudness(out);
  if (after.truePeakDb > ceilingDb) {
    out = truePeakLimit(out, ceilingDb);
    const again = measureLoudness(out);
    if (again.lufs < targetLufs - 0.4) {
      out = applyGainDb(out, targetLufs - again.lufs);
      out = truePeakLimit(out, ceilingDb);
    }
  }
  return out;
}

export const LUFS_TARGETS = [
  { id: "spotify", label: "Spotify / DSPs", lufs: -14, tp: -1 },
  { id: "apple", label: "Apple Music", lufs: -16, tp: -1 },
  { id: "youtube", label: "YouTube", lufs: -14, tp: -1 },
  { id: "tiktok", label: "TikTok / Reels", lufs: -14, tp: -1 },
  { id: "club", label: "Club / loud", lufs: -9, tp: -0.5 },
  { id: "ebu", label: "EBU R128", lufs: -23, tp: -1 },
  { id: "podcast", label: "Podcast", lufs: -16, tp: -1.5 },
] as const;

export function describeLoudness(report: LoudnessReport, target: number, ceiling: number): string[] {
  const notes: string[] = [];
  const delta = report.lufs - target;
  if (delta > 1.5) {
    notes.push(
      `Integrated is ${delta.toFixed(1)} LU over target. Repair will pull it down so DSP playback does not turn you down.`,
    );
  } else if (delta < -1.5) {
    notes.push(
      `Integrated is ${Math.abs(delta).toFixed(1)} LU under target. Repair will add make-up gain.`,
    );
  } else {
    notes.push(`Integrated is already within a LU and a half of ${target} LUFS.`);
  }
  if (report.truePeakDb > ceiling) {
    notes.push(
      `True peak ${report.truePeakDb.toFixed(1)} dBTP sits over the ${ceiling} dBTP ceiling. Inter-sample peaks will clip on some converters.`,
    );
  } else {
    notes.push(`True peak ${report.truePeakDb.toFixed(1)} dBTP is under the ${ceiling} dBTP ceiling.`);
  }
  if (report.lra > 12) {
    notes.push(
      `Loudness range ${report.lra.toFixed(1)} LU is wide. Punchy, but a platform limiter may ride the chorus.`,
    );
  } else if (report.lra < 4) {
    notes.push(
      `Loudness range ${report.lra.toFixed(1)} LU is tight. Glue is in. Watch for squashed transients.`,
    );
  } else {
    notes.push(`Loudness range ${report.lra.toFixed(1)} LU is a usable mix window.`);
  }
  if (report.samplePeakDb > -0.1) {
    notes.push(`Sample peak is against the rail. The limiter pass will catch it.`);
  }
  return notes.slice(0, 4);
}

import {
  addScaled,
  biquadHighpass,
  biquadLowpass,
  biquadPeaking,
  cascade,
  onePoleLowpass,
  runBiquad,
} from "./dsp";
import { makeClip, stereoOf, type AudioClip, type StemModelId, type StemMode, type StemName, type StemPack } from "./types";

export type SplitQuality = "preview" | "studio" | "hq";

export type SplitOptions = {
  model: StemModelId;
  quality: SplitQuality;
  mode?: StemMode;
  onProgress?: (p: number, detail?: string, phase?: string) => void;
};

const MODEL_TUNE: Record<
  StemModelId,
  { vocal: number; drums: number; bass: number; guitar: number; piano: number; sharpness: number }
> = {
  htdemucs_6s: { vocal: 1, drums: 1, bass: 1, guitar: 1, piano: 1, sharpness: 1.2 },
  htdemucs: { vocal: 1.05, drums: 1.08, bass: 1.05, guitar: 0.72, piano: 0.7, sharpness: 1.35 },
  htdemucs_ft: { vocal: 1.5, drums: 0.85, bass: 0.9, guitar: 0.8, piano: 0.75, sharpness: 1.45 },
};

const HQ_MODELS = new Set<StemModelId>(["htdemucs_6s", "htdemucs", "htdemucs_ft"]);

export async function splitStems(clip: AudioClip, opts: SplitOptions): Promise<StemPack> {
  const { onProgress } = opts;
  onProgress?.(0.02, "Preparing", opts.quality === "hq" ? "download" : "map");
  if (opts.quality === "hq" && HQ_MODELS.has(opts.model)) {
    const { splitDemucsClip } = await import("./demucs");
    const pack = await splitDemucsClip(clip, opts.model, (p) => {
      onProgress?.(p.ratio, p.detail, p.phase);
    });
    return foldMode(pack, opts.mode ?? 6);
  }
  if (opts.quality === "preview") {
    const pack = splitFilterbank(clip, opts.model);
    onProgress?.(1, "Done", "map");
    return foldMode(pack, opts.mode ?? 6);
  }
  const pack = await splitStft(clip, opts);
  return foldMode(pack, opts.mode ?? 6);
}

function foldMode(pack: StemPack, mode: StemMode): StemPack {
  if (mode === 6) return pack;
  if (mode === 4) {
    const other = mixPair(pack.other, pack.guitar, pack.piano, "other");
    return {
      vocals: pack.vocals,
      drums: pack.drums,
      bass: pack.bass,
      guitar: silentLike(pack.guitar),
      piano: silentLike(pack.piano),
      other,
    };
  }
  const other = mixPair(pack.drums, pack.bass, mixPair(pack.guitar, pack.piano, pack.other, "body"), "instrumental");
  return {
    vocals: pack.vocals,
    drums: silentLike(pack.drums),
    bass: silentLike(pack.bass),
    guitar: silentLike(pack.guitar),
    piano: silentLike(pack.piano),
    other,
  };
}

function mixPair(a: AudioClip, b: AudioClip, c: AudioClip, name: string): AudioClip {
  const n = a.channels[0]?.length ?? 0;
  const sr = a.sampleRate;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (const clip of [a, b, c]) {
    addScaled(l, clip.channels[0] ?? l, 1);
    addScaled(r, clip.channels[1] ?? clip.channels[0] ?? r, 1);
  }
  return makeClip(name, sr, [l, r]);
}

function silentLike(clip: AudioClip): AudioClip {
  return makeClip(
    clip.name,
    clip.sampleRate,
    clip.channels.map((ch) => new Float32Array(ch.length)),
  );
}

function splitFilterbank(clip: AudioClip, model: StemModelId): StemPack {
  const sr = clip.sampleRate;
  const [L, R] = stereoOf(clip);
  const n = L.length;
  const t = MODEL_TUNE[model];

  const mid = new Float32Array(n);
  const side = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    mid[i] = ((L[i] ?? 0) + (R[i] ?? 0)) * 0.5;
    side[i] = ((L[i] ?? 0) - (R[i] ?? 0)) * 0.5;
  }

  const bassMono = cascade(mid, [
    biquadLowpass(sr, 180, 0.7),
    biquadLowpass(sr, 180, 0.7),
    biquadPeaking(sr, 70, 0.8, 1.5),
  ]);

  const vocalBand = cascade(mid, [
    biquadHighpass(sr, 220, 0.75),
    biquadLowpass(sr, 3800, 0.75),
    biquadPeaking(sr, 1200, 0.8, 1.2),
  ]);
  const vocalAbs = new Float32Array(n);
  for (let i = 0; i < n; i++) vocalAbs[i] = Math.abs(vocalBand[i] ?? 0);
  const vocalEnv = onePoleLowpass(vocalAbs, sr, 40);
  const instrEnv = onePoleLowpass(vocalAbs, sr, 180);
  const vocals = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const motion = (vocalEnv[i] ?? 0) / ((instrEnv[i] ?? 0) + 1e-5);
    const gate = Math.min(1, Math.max(0, (motion - 0.85) * 2.2));
    vocals[i] = (vocalBand[i] ?? 0) * (0.35 + 0.65 * gate) * t.vocal;
  }

  const hpL = cascade(L, [biquadHighpass(sr, 60, 0.7)]);
  const hpR = cascade(R, [biquadHighpass(sr, 60, 0.7)]);
  const slowL = onePoleLowpass(hpL, sr, 14);
  const slowR = onePoleLowpass(hpR, sr, 14);
  const drumsL = new Float32Array(n);
  const drumsR = new Float32Array(n);
  const hatsL = runBiquad(hpL, biquadHighpass(sr, 6500, 0.7));
  const hatsR = runBiquad(hpR, biquadHighpass(sr, 6500, 0.7));
  for (let i = 0; i < n; i++) {
    drumsL[i] = ((hpL[i] ?? 0) - (slowL[i] ?? 0)) * 1.25 * t.drums + (hatsL[i] ?? 0) * 0.7;
    drumsR[i] = ((hpR[i] ?? 0) - (slowR[i] ?? 0)) * 1.25 * t.drums + (hatsR[i] ?? 0) * 0.7;
  }

  const guitarSide = cascade(side, [
    biquadHighpass(sr, 180, 0.7),
    biquadLowpass(sr, 5200, 0.7),
  ]);
  const guitar = new Float32Array(n);
  for (let i = 0; i < n; i++) guitar[i] = (guitarSide[i] ?? 0) * 1.35 * t.guitar;

  const pianoBand = cascade(mid, [
    biquadHighpass(sr, 140, 0.7),
    biquadLowpass(sr, 4200, 0.7),
  ]);
  const piano = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    piano[i] = ((pianoBand[i] ?? 0) - (vocals[i] ?? 0) * 0.45) * 0.9 * t.piano;
  }

  const bass = new Float32Array(n);
  for (let i = 0; i < n; i++) bass[i] = (bassMono[i] ?? 0) * t.bass;

  const otherL = new Float32Array(n);
  const otherR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = vocals[i] ?? 0;
    const dL = drumsL[i] ?? 0;
    const dR = drumsR[i] ?? 0;
    const b = bass[i] ?? 0;
    const g = guitar[i] ?? 0;
    const p = piano[i] ?? 0;
    otherL[i] = (L[i] ?? 0) - v - dL - b - g - p;
    otherR[i] = (R[i] ?? 0) - v - dR - b - g - p;
  }

  return packFromChannels(clip.name, sr, {
    vocals: [vocals, vocals],
    drums: [drumsL, drumsR],
    bass: [bass, bass],
    guitar: [add(midScale(guitar, 0.25), guitar), add(midScale(guitar, -0.25), guitarInvert(guitar))],
    piano: [piano, piano],
    other: [otherL, otherR],
  });
}

function midScale(src: Float32Array, pan: number) {
  const o = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) o[i] = (src[i] ?? 0) * (1 + pan);
  return o;
}

function guitarInvert(src: Float32Array) {
  const o = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) o[i] = -(src[i] ?? 0);
  return o;
}

function add(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return o;
}

function packFromChannels(
  name: string,
  sr: number,
  chans: Record<StemName, [Float32Array, Float32Array]>,
): StemPack {
  const pack = {} as StemPack;
  (Object.keys(chans) as StemName[]).forEach((k) => {
    pack[k] = makeClip(`${name} ${k}`, sr, [chans[k][0], chans[k][1]]);
  });
  return pack;
}

async function splitStft(clip: AudioClip, opts: SplitOptions): Promise<StemPack> {
  const fftSize = 4096;
  const hop = fftSize / 4;
  const sr = clip.sampleRate;
  const [L, R] = stereoOf(clip);
  const n = L.length;
  const t = MODEL_TUNE[opts.model];
  const window = hann(fftSize);
  const nFrames = Math.max(1, Math.floor((n - fftSize) / hop) + 1);
  const nBins = fftSize / 2 + 1;

  const acc: Record<StemName, [Float32Array, Float32Array]> = {
    vocals: [new Float32Array(n), new Float32Array(n)],
    drums: [new Float32Array(n), new Float32Array(n)],
    bass: [new Float32Array(n), new Float32Array(n)],
    guitar: [new Float32Array(n), new Float32Array(n)],
    piano: [new Float32Array(n), new Float32Array(n)],
    other: [new Float32Array(n), new Float32Array(n)],
  };
  const winSum = new Float32Array(n);

  const prevMag = new Float32Array(nBins);
  const names: StemName[] = ["vocals", "drums", "bass", "guitar", "piano", "other"];
  const pExp = t.sharpness;

  for (let f = 0; f < nFrames; f++) {
    const start = f * hop;
    const reL = new Float32Array(fftSize);
    const imL = new Float32Array(fftSize);
    const reR = new Float32Array(fftSize);
    const imR = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      const w = window[i] ?? 0;
      reL[i] = (L[start + i] ?? 0) * w;
      reR[i] = (R[start + i] ?? 0) * w;
    }
    fftRadix2(reL, imL, false);
    fftRadix2(reR, imR, false);

    const reStem: Record<StemName, [Float32Array, Float32Array]> = emptyStemSpec(fftSize, names);
    const imStem: Record<StemName, [Float32Array, Float32Array]> = emptyStemSpec(fftSize, names);

    for (let k = 0; k < nBins; k++) {
      const freq = (k * sr) / fftSize;
      const lr = reL[k] ?? 0;
      const li = imL[k] ?? 0;
      const rr = reR[k] ?? 0;
      const ri = imR[k] ?? 0;
      const midRe = (lr + rr) * 0.5;
      const midIm = (li + ri) * 0.5;
      const sideRe = (lr - rr) * 0.5;
      const sideIm = (li - ri) * 0.5;
      const magM = Math.hypot(midRe, midIm);
      const magS = Math.hypot(sideRe, sideIm);
      const mag = magM + magS + 1e-12;
      const magPrev = prevMag[k] ?? mag;
      const flux = Math.abs(mag - magPrev);
      prevMag[k] = mag;

      const perc = flux / (mag + 1e-8);
      const harm = 1 / (1 + perc * 6);

      let drums = perc * (freq > 40 ? 1 : 0.2) * (freq < 12000 ? 1 : 0.4) * t.drums;
      let bass = harm * magM * freqGate(freq, 30, 220) * t.bass;
      let vocals =
        magM *
        freqGate(freq, 180, 4200) *
        (1 - perc * 0.6) *
        (magM / (magS + magM)) *
        t.vocal;
      let guitar = (magS * 1.4 + magM * 0.25) * freqGate(freq, 120, 5500) * harm * t.guitar;
      let piano = magM * harm * freqGate(freq, 90, 4300) * (1 - freqGate(freq, 300, 2800) * 0.25) * t.piano;
      if (opts.model === "htdemucs_ft") {
        guitar *= melWeight(freq, 400, 2500);
        piano *= melWeight(freq, 200, 1800);
      }
      let other = mag * 0.22;

      drums = Math.max(1e-8, drums);
      bass = Math.max(1e-8, bass);
      vocals = Math.max(1e-8, vocals);
      guitar = Math.max(1e-8, guitar);
      piano = Math.max(1e-8, piano);
      other = Math.max(1e-8, other);

      const sum =
        Math.pow(drums, pExp) +
        Math.pow(bass, pExp) +
        Math.pow(vocals, pExp) +
        Math.pow(guitar, pExp) +
        Math.pow(piano, pExp) +
        Math.pow(other, pExp);
      const masks: Record<StemName, number> = {
        drums: Math.pow(drums, pExp) / sum,
        bass: Math.pow(bass, pExp) / sum,
        vocals: Math.pow(vocals, pExp) / sum,
        guitar: Math.pow(guitar, pExp) / sum,
        piano: Math.pow(piano, pExp) / sum,
        other: Math.pow(other, pExp) / sum,
      };

      for (const name of names) {
        const m = masks[name];
        reStem[name][0][k] = lr * m;
        imStem[name][0][k] = li * m;
        reStem[name][1][k] = rr * m;
        imStem[name][1][k] = ri * m;
        if (k > 0 && k < fftSize - k) {
          const k2 = fftSize - k;
          reStem[name][0][k2] = (reL[k2] ?? 0) * m;
          imStem[name][0][k2] = (imL[k2] ?? 0) * m;
          reStem[name][1][k2] = (reR[k2] ?? 0) * m;
          imStem[name][1][k2] = (imR[k2] ?? 0) * m;
        }
      }
    }

    for (const name of names) {
      for (const ch of [0, 1] as const) {
        fftRadix2(reStem[name][ch], imStem[name][ch], true);
        const dest = acc[name][ch];
        for (let i = 0; i < fftSize; i++) {
          const idx = start + i;
          if (idx >= n) break;
          dest[idx] += (reStem[name][ch][i] ?? 0) * (window[i] ?? 0);
        }
      }
    }
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      if (idx >= n) break;
      const w = window[i] ?? 0;
      winSum[idx] += w * w;
    }

    if (f % 24 === 0) {
      opts.onProgress?.(0.05 + (f / nFrames) * 0.9, "Studio STFT", "map");
      await yieldFrame();
    }
  }

  for (const name of names) {
    for (const ch of [0, 1] as const) {
      const dest = acc[name][ch];
      for (let i = 0; i < n; i++) {
        const w = winSum[i] || 1;
        dest[i] /= w;
      }
    }
  }

  opts.onProgress?.(1, "Done", "map");
  return packFromChannels(clip.name, sr, acc);
}

function emptyStemSpec(fftSize: number, names: StemName[]) {
  const o = {} as Record<StemName, [Float32Array, Float32Array]>;
  for (const n of names) {
    o[n] = [new Float32Array(fftSize), new Float32Array(fftSize)];
  }
  return o;
}

function freqGate(f: number, lo: number, hi: number) {
  if (f <= lo * 0.5 || f >= hi * 1.6) return 0.02;
  if (f >= lo && f <= hi) return 1;
  if (f < lo) return (f - lo * 0.5) / (lo * 0.5);
  return 1 - (f - hi) / (hi * 0.6);
}

function melWeight(freq: number, c1: number, c2: number) {
  const m = 2595 * Math.log10(1 + freq / 700);
  const a = 2595 * Math.log10(1 + c1 / 700);
  const b = 2595 * Math.log10(1 + c2 / 700);
  const mid = (a + b) / 2;
  const w = Math.exp(-Math.pow((m - mid) / ((b - a) * 0.6 + 1), 2));
  return 0.65 + 0.7 * w;
}

function hann(n: number) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

function fftRadix2(re: Float32Array, im: Float32Array, inverse: boolean) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j] ?? 0;
      re[j] = tr ?? 0;
      const ti = im[i];
      im[i] = im[j] ?? 0;
      im[j] = ti ?? 0;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const ur = re[i + j] ?? 0;
        const ui = im[i + j] ?? 0;
        const vr0 = re[i + j + half] ?? 0;
        const vi0 = im[i + j + half] ?? 0;
        const vr = vr0 * wRe - vi0 * wIm;
        const vi = vr0 * wIm + vi0 * wRe;
        re[i + j] = ur + vr;
        im[i + j] = ui + vi;
        re[i + j + half] = ur - vr;
        im[i + j + half] = ui - vi;
        const nwRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nwRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] = (re[i] ?? 0) / n;
      im[i] = (im[i] ?? 0) / n;
    }
  }
}

function yieldFrame() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

export function mixStems(
  pack: StemPack,
  gains: Record<StemName, number>,
  mutes: Record<StemName, boolean>,
  solos: Record<StemName, boolean>,
): AudioClip {
  const anySolo = STEM_NAMES.some((n) => solos[n]);
  const ref = pack.vocals;
  const n = ref.channels[0]?.length ?? 0;
  const sr = ref.sampleRate;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (const name of STEM_NAMES) {
    const active = anySolo ? solos[name] : !mutes[name];
    if (!active) continue;
    const g = gains[name] ?? 1;
    const clip = pack[name];
    addScaled(l, clip.channels[0] ?? l, g);
    addScaled(r, clip.channels[1] ?? clip.channels[0] ?? r, g);
  }
  return makeClip(`${ref.name} mix`, sr, [l, r]);
}

export function openDrums(pack: StemPack): Record<"kick" | "snare" | "hats", AudioClip> {
  const drums = pack.drums;
  const sr = drums.sampleRate;
  const [L, R] = stereoOf(drums);
  const kickL = cascade(L, [biquadLowpass(sr, 120, 0.7), biquadLowpass(sr, 90, 0.8)]);
  const kickR = cascade(R, [biquadLowpass(sr, 120, 0.7), biquadLowpass(sr, 90, 0.8)]);
  const snareL = cascade(L, [biquadHighpass(sr, 180, 0.7), biquadLowpass(sr, 4800, 0.7)]);
  const snareR = cascade(R, [biquadHighpass(sr, 180, 0.7), biquadLowpass(sr, 4800, 0.7)]);
  const hatsL = runBiquad(L, biquadHighpass(sr, 6500, 0.7));
  const hatsR = runBiquad(R, biquadHighpass(sr, 6500, 0.7));
  return {
    kick: makeClip(`${drums.name} kick`, sr, [kickL, kickR]),
    snare: makeClip(`${drums.name} snare`, sr, [snareL, snareR]),
    hats: makeClip(`${drums.name} hats`, sr, [hatsL, hatsR]),
  };
}

const STEM_NAMES: StemName[] = ["vocals", "drums", "bass", "guitar", "piano", "other"];

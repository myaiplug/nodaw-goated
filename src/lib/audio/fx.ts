/**
 * DeepSplit FX engine, ported from myaiplug/DeepSplit backend/fx_engine.py
 * (pedalboard presets) plus NoDAW bus prints. All local, no plugin host.
 */
import {
  addScaled,
  biquadHighpass,
  biquadHighshelf,
  biquadLowpass,
  biquadPeaking,
  cascade,
  dbToGain,
  onePoleLowpass,
  peakOf,
  runBiquad,
  tanhSoft,
} from "./dsp";
import { truePeakLimit } from "./lufs";
import { makeClip, stereoOf, type AudioClip } from "./types";

export type FxGroup = "bus" | "vocal" | "drum" | "bass" | "other";

export type FxId =
  | "tape"
  | "glue"
  | "radio"
  | "lofi"
  | "phone"
  | "width"
  | "air"
  | "dark"
  | "punch"
  | "clean"
  | "vinyl"
  | "night"
  | "vocal_crystal_clear"
  | "vocal_studio_presence"
  | "vocal_lush_verb"
  | "vocal_dry_tight"
  | "vocal_broadcast"
  | "drum_punchy_kick"
  | "drum_crisp_snare"
  | "drum_room_killer"
  | "drum_bus_glue"
  | "drum_lofi_grit"
  | "bass_sub_focus"
  | "bass_fuzz_box"
  | "bass_even_dynamics"
  | "bass_note_definition"
  | "bass_rumble_eater"
  | "other_stereo_widen"
  | "other_warm_tape"
  | "other_clean_rhythm"
  | "other_shimmer"
  | "other_background";

export const FX_PRESETS: { id: FxId; name: string; blurb: string; group: FxGroup }[] = [
  { id: "tape", name: "Tape", blurb: "Soft saturate, gentle top roll-off.", group: "bus" },
  { id: "glue", name: "808 Glue", blurb: "Low punch, bus compress, clip.", group: "bus" },
  { id: "radio", name: "Radio", blurb: "Mid scoop in, speaker band.", group: "bus" },
  { id: "lofi", name: "Lo-Fi", blurb: "Bit crush and 6 kHz air cut.", group: "bus" },
  { id: "phone", name: "Telephone", blurb: "Narrow band, light grit.", group: "bus" },
  { id: "width", name: "Width", blurb: "Side lift. Mono stays put.", group: "bus" },
  { id: "air", name: "Air Lift", blurb: "High shelf, open the top.", group: "bus" },
  { id: "dark", name: "Darken", blurb: "Low-pass the air, keep body.", group: "bus" },
  { id: "punch", name: "Punch", blurb: "Transient lift on the attack.", group: "bus" },
  { id: "clean", name: "Clean", blurb: "30 Hz high-pass, peak tame.", group: "bus" },
  { id: "vinyl", name: "Vinyl", blurb: "Dust, rumble, dull edges.", group: "bus" },
  { id: "night", name: "Night Bus", blurb: "Club low-end, glued mids.", group: "bus" },
  { id: "vocal_crystal_clear", name: "Crystal Clear", blurb: "80 Hz HPF, gate, 2.5:1.", group: "vocal" },
  { id: "vocal_studio_presence", name: "Studio Presence", blurb: "3 kHz + air, then limit.", group: "vocal" },
  { id: "vocal_lush_verb", name: "Lush Verb", blurb: "Room, chorus, sit back.", group: "vocal" },
  { id: "vocal_dry_tight", name: "Dry Tight", blurb: "Aggressive gate, fast 4:1.", group: "vocal" },
  { id: "vocal_broadcast", name: "Broadcast", blurb: "Heavy compress, loud ceiling.", group: "vocal" },
  { id: "drum_punchy_kick", name: "Punchy Kick", blurb: "60 Hz boost, 400 Hz cut.", group: "drum" },
  { id: "drum_crisp_snare", name: "Crisp Snare", blurb: "Drive, body, snap, room.", group: "drum" },
  { id: "drum_room_killer", name: "Room Killer", blurb: "Gate the wash, keep the hit.", group: "drum" },
  { id: "drum_bus_glue", name: "Drum Glue", blurb: "2:1 bus, tape, limit.", group: "drum" },
  { id: "drum_lofi_grit", name: "Lo-Fi Grit", blurb: "8-bit crush, 4 kHz lid.", group: "drum" },
  { id: "bass_sub_focus", name: "Sub Focus", blurb: "250 Hz lid, slow 4:1.", group: "bass" },
  { id: "bass_fuzz_box", name: "Fuzz Box", blurb: "Hard drive, 800 Hz scoop.", group: "bass" },
  { id: "bass_even_dynamics", name: "Even Dynamics", blurb: "8:1, makeup, ceiling.", group: "bass" },
  { id: "bass_note_definition", name: "Note Definition", blurb: "800 Hz attack, cut mud.", group: "bass" },
  { id: "bass_rumble_eater", name: "Rumble Eater", blurb: "35 Hz HPF, 50 Hz notch.", group: "bass" },
  { id: "other_stereo_widen", name: "Stereo Widen", blurb: "Slow chorus, high sheen.", group: "other" },
  { id: "other_warm_tape", name: "Warm Tape", blurb: "Drive, 14 kHz lid, slow glue.", group: "other" },
  { id: "other_clean_rhythm", name: "Clean Rhythm", blurb: "3:1, 300 Hz cut.", group: "other" },
  { id: "other_shimmer", name: "Shimmer", blurb: "Long verb, deep chorus.", group: "other" },
  { id: "other_background", name: "Background", blurb: "Push back presence, -3 dB.", group: "other" },
];

export const FX_GROUPS: { id: FxGroup; label: string }[] = [
  { id: "bus", label: "Bus print" },
  { id: "vocal", label: "Vocals" },
  { id: "drum", label: "Drums" },
  { id: "bass", label: "Bass" },
  { id: "other", label: "Other" },
];

export function renderFx(clip: AudioClip, id: FxId, mix = 1): AudioClip {
  const sr = clip.sampleRate;
  const [l0, r0] = stereoOf(clip);
  let l: Float32Array = new Float32Array(l0);
  let r: Float32Array = new Float32Array(r0);
  let limit = false;

  switch (id) {
    case "tape": {
      l = drive(l, 1.8);
      r = drive(r, 1.8);
      l = runBiquad(l, biquadHighshelf(sr, 9000, -2.5));
      r = runBiquad(r, biquadHighshelf(sr, 9000, -2.5));
      l = runBiquad(l, biquadPeaking(sr, 90, 0.7, 1.2));
      r = runBiquad(r, biquadPeaking(sr, 90, 0.7, 1.2));
      break;
    }
    case "glue": {
      l = runBiquad(l, biquadPeaking(sr, 55, 0.8, 3.5));
      r = runBiquad(r, biquadPeaking(sr, 55, 0.8, 3.5));
      l = compress(l, sr, 6, 0.008, 0.12);
      r = compress(r, sr, 6, 0.008, 0.12);
      l = drive(l, 1.4);
      r = drive(r, 1.4);
      limit = true;
      break;
    }
    case "radio": {
      l = cascade(l, [biquadHighpass(sr, 420, 0.7), biquadLowpass(sr, 2800, 0.7)]);
      r = cascade(r, [biquadHighpass(sr, 420, 0.7), biquadLowpass(sr, 2800, 0.7)]);
      l = compress(l, sr, 8, 0.004, 0.08);
      r = compress(r, sr, 8, 0.004, 0.08);
      l = drive(l, 2.2);
      r = drive(r, 2.2);
      break;
    }
    case "lofi": {
      l = bitcrush(l, 11);
      r = bitcrush(r, 11);
      l = runBiquad(l, biquadLowpass(sr, 6200, 0.8));
      r = runBiquad(r, biquadLowpass(sr, 6200, 0.8));
      l = runBiquad(l, biquadPeaking(sr, 200, 0.8, 1.5));
      r = runBiquad(r, biquadPeaking(sr, 200, 0.8, 1.5));
      break;
    }
    case "phone": {
      l = cascade(l, [biquadHighpass(sr, 320, 0.8), biquadLowpass(sr, 3400, 0.8)]);
      r = cascade(r, [biquadHighpass(sr, 320, 0.8), biquadLowpass(sr, 3400, 0.8)]);
      l = drive(l, 2.6);
      r = drive(r, 2.6);
      break;
    }
    case "width": {
      const wide = msWidth(l, r, 1.55);
      l = wide[0];
      r = wide[1];
      break;
    }
    case "air": {
      l = runBiquad(l, biquadHighshelf(sr, 8000, 4.5));
      r = runBiquad(r, biquadHighshelf(sr, 8000, 4.5));
      break;
    }
    case "dark": {
      l = runBiquad(l, biquadLowpass(sr, 5200, 0.7));
      r = runBiquad(r, biquadLowpass(sr, 5200, 0.7));
      l = runBiquad(l, biquadPeaking(sr, 180, 0.7, 1.4));
      r = runBiquad(r, biquadPeaking(sr, 180, 0.7, 1.4));
      break;
    }
    case "punch": {
      const sl = onePoleLowpass(l, sr, 12);
      const srL = onePoleLowpass(r, sr, 12);
      for (let i = 0; i < l.length; i++) {
        l[i] = (l[i] ?? 0) + ((l[i] ?? 0) - (sl[i] ?? 0)) * 1.4;
        r[i] = (r[i] ?? 0) + ((r[i] ?? 0) - (srL[i] ?? 0)) * 1.4;
      }
      break;
    }
    case "clean": {
      l = runBiquad(l, biquadHighpass(sr, 30, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 30, 0.7));
      limit = true;
      break;
    }
    case "vinyl": {
      const dustL = dust(l.length, sr, 0.012);
      const dustR = dust(r.length, sr, 0.01);
      addScaled(l, dustL, 1);
      addScaled(r, dustR, 1);
      l = runBiquad(l, biquadLowpass(sr, 9000, 0.7));
      r = runBiquad(r, biquadLowpass(sr, 9000, 0.7));
      l = runBiquad(l, biquadPeaking(sr, 70, 0.8, 1.8));
      r = runBiquad(r, biquadPeaking(sr, 70, 0.8, 1.8));
      break;
    }
    case "night": {
      l = runBiquad(l, biquadHighpass(sr, 28, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 28, 0.7));
      l = runBiquad(l, biquadPeaking(sr, 60, 0.9, 3));
      r = runBiquad(r, biquadPeaking(sr, 60, 0.9, 3));
      l = compress(l, sr, 7, 0.01, 0.18);
      r = compress(r, sr, 7, 0.01, 0.18);
      const wide = msWidth(l, r, 1.2);
      l = wide[0];
      r = wide[1];
      limit = true;
      break;
    }
    case "vocal_crystal_clear": {
      l = runBiquad(l, biquadHighpass(sr, 80, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 80, 0.7));
      l = noiseGate(l, sr, -40, 4, 250);
      r = noiseGate(r, sr, -40, 4, 250);
      l = compress(l, sr, 2.5, 0.01, 0.1, -20);
      r = compress(r, sr, 2.5, 0.01, 0.1, -20);
      l = gainDb(l, 2);
      r = gainDb(r, 2);
      break;
    }
    case "vocal_studio_presence": {
      l = cascade(l, [biquadPeaking(sr, 3000, 1, 3), biquadPeaking(sr, 10000, 0.7, 4)]);
      r = cascade(r, [biquadPeaking(sr, 3000, 1, 3), biquadPeaking(sr, 10000, 0.7, 4)]);
      l = compress(l, sr, 3, 0.005, 0.1, -18);
      r = compress(r, sr, 3, 0.005, 0.1, -18);
      limit = true;
      break;
    }
    case "vocal_lush_verb": {
      l = runBiquad(l, biquadHighpass(sr, 150, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 150, 0.7));
      l = schroederReverb(l, sr, 0.8, 0.2, 0.4);
      r = schroederReverb(r, sr, 0.82, 0.22, 0.4);
      l = chorus(l, sr, 1, 0.25, 7, 0.35);
      r = chorus(r, sr, 1.05, 0.25, 7.4, 0.35);
      l = gainDb(l, -2);
      r = gainDb(r, -2);
      break;
    }
    case "vocal_dry_tight": {
      l = noiseGate(l, sr, -25, 8, 50);
      r = noiseGate(r, sr, -25, 8, 50);
      l = runBiquad(l, biquadHighpass(sr, 100, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 100, 0.7));
      l = compress(l, sr, 4, 0.004, 0.05, -15);
      r = compress(r, sr, 4, 0.004, 0.05, -15);
      break;
    }
    case "vocal_broadcast": {
      l = compress(l, sr, 4, 0.002, 0.1, -25);
      r = compress(r, sr, 4, 0.002, 0.1, -25);
      l = gainDb(l, 4);
      r = gainDb(r, 4);
      limit = true;
      break;
    }
    case "drum_punchy_kick": {
      l = cascade(l, [biquadPeaking(sr, 60, 2, 6), biquadPeaking(sr, 400, 1, -5)]);
      r = cascade(r, [biquadPeaking(sr, 60, 2, 6), biquadPeaking(sr, 400, 1, -5)]);
      l = compress(l, sr, 4, 0.03, 0.1, -15);
      r = compress(r, sr, 4, 0.03, 0.1, -15);
      limit = true;
      break;
    }
    case "drum_crisp_snare": {
      l = drive(l, dbToGain(5));
      r = drive(r, dbToGain(5));
      l = cascade(l, [biquadPeaking(sr, 200, 0.8, 3), biquadPeaking(sr, 5000, 0.9, 4)]);
      r = cascade(r, [biquadPeaking(sr, 200, 0.8, 3), biquadPeaking(sr, 5000, 0.9, 4)]);
      l = schroederReverb(l, sr, 0.3, 0.4, 0.15);
      r = schroederReverb(r, sr, 0.32, 0.42, 0.15);
      break;
    }
    case "drum_room_killer": {
      l = noiseGate(l, sr, -30, 6, 80);
      r = noiseGate(r, sr, -30, 6, 80);
      l = runBiquad(l, biquadHighpass(sr, 30, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 30, 0.7));
      break;
    }
    case "drum_bus_glue": {
      l = compress(l, sr, 2, 0.01, 0.05, -15);
      r = compress(r, sr, 2, 0.01, 0.05, -15);
      l = drive(l, dbToGain(2));
      r = drive(r, dbToGain(2));
      limit = true;
      break;
    }
    case "drum_lofi_grit": {
      l = bitcrush(l, 8);
      r = bitcrush(r, 8);
      l = runBiquad(l, biquadLowpass(sr, 4000, 0.7));
      r = runBiquad(r, biquadLowpass(sr, 4000, 0.7));
      l = compress(l, sr, 8, 0.008, 0.12, -20);
      r = compress(r, sr, 8, 0.008, 0.12, -20);
      break;
    }
    case "bass_sub_focus": {
      l = runBiquad(l, biquadLowpass(sr, 250, 0.7));
      r = runBiquad(r, biquadLowpass(sr, 250, 0.7));
      l = compress(l, sr, 4, 0.05, 0.12, -15);
      r = compress(r, sr, 4, 0.05, 0.12, -15);
      limit = true;
      break;
    }
    case "bass_fuzz_box": {
      l = drive(l, dbToGain(15));
      r = drive(r, dbToGain(15));
      l = runBiquad(l, biquadPeaking(sr, 800, 0.8, -6));
      r = runBiquad(r, biquadPeaking(sr, 800, 0.8, -6));
      l = compress(l, sr, 4, 0.01, 0.1, -20);
      r = compress(r, sr, 4, 0.01, 0.1, -20);
      break;
    }
    case "bass_even_dynamics": {
      l = compress(l, sr, 8, 0.005, 0.1, -25);
      r = compress(r, sr, 8, 0.005, 0.1, -25);
      l = gainDb(l, 4);
      r = gainDb(r, 4);
      limit = true;
      break;
    }
    case "bass_note_definition": {
      l = cascade(l, [biquadPeaking(sr, 800, 0.9, 5), biquadPeaking(sr, 200, 2, -4)]);
      r = cascade(r, [biquadPeaking(sr, 800, 0.9, 5), biquadPeaking(sr, 200, 2, -4)]);
      l = drive(l, dbToGain(3));
      r = drive(r, dbToGain(3));
      break;
    }
    case "bass_rumble_eater": {
      l = runBiquad(l, biquadHighpass(sr, 35, 0.7));
      r = runBiquad(r, biquadHighpass(sr, 35, 0.7));
      l = runBiquad(l, biquadPeaking(sr, 50, 5, -10));
      r = runBiquad(r, biquadPeaking(sr, 50, 5, -10));
      break;
    }
    case "other_stereo_widen": {
      l = chorus(l, sr, 0.5, 0.3, 7, 0.5);
      r = chorus(r, sr, 0.53, 0.3, 7.6, 0.5);
      l = runBiquad(l, biquadPeaking(sr, 8000, 0.5, 3));
      r = runBiquad(r, biquadPeaking(sr, 8000, 0.5, 3));
      break;
    }
    case "other_warm_tape": {
      l = drive(l, dbToGain(6));
      r = drive(r, dbToGain(6));
      l = runBiquad(l, biquadLowpass(sr, 14000, 0.7));
      r = runBiquad(r, biquadLowpass(sr, 14000, 0.7));
      l = compress(l, sr, 2, 0.05, 0.12, -15);
      r = compress(r, sr, 2, 0.05, 0.12, -15);
      break;
    }
    case "other_clean_rhythm": {
      l = compress(l, sr, 3, 0.008, 0.1, -18);
      r = compress(r, sr, 3, 0.008, 0.1, -18);
      l = runBiquad(l, biquadPeaking(sr, 300, 0.8, -4));
      r = runBiquad(r, biquadPeaking(sr, 300, 0.8, -4));
      break;
    }
    case "other_shimmer": {
      l = schroederReverb(l, sr, 0.9, 0.1, 0.6);
      r = schroederReverb(r, sr, 0.92, 0.12, 0.6);
      l = chorus(l, sr, 2, 0.5, 8, 0.45);
      r = chorus(r, sr, 2.1, 0.5, 8.4, 0.45);
      break;
    }
    case "other_background": {
      l = schroederReverb(l, sr, 0.5, 0.35, 0.3);
      r = schroederReverb(r, sr, 0.52, 0.36, 0.3);
      l = runBiquad(l, biquadPeaking(sr, 3000, 0.8, -3));
      r = runBiquad(r, biquadPeaking(sr, 3000, 0.8, -3));
      l = gainDb(l, -3);
      r = gainDb(r, -3);
      break;
    }
  }

  const amount = Math.max(0, Math.min(1, mix));
  if (amount < 0.999) {
    for (let i = 0; i < l.length; i++) {
      l[i] = (l0[i] ?? 0) * (1 - amount) + (l[i] ?? 0) * amount;
      r[i] = (r0[i] ?? 0) * (1 - amount) + (r[i] ?? 0) * amount;
    }
  }

  const peak = peakOf([l, r]);
  if (peak > 0.98) {
    const g = 0.97 / peak;
    for (let i = 0; i < l.length; i++) {
      l[i] *= g;
      r[i] *= g;
    }
  }

  const channels = clip.channels.length === 1 ? [l] : [l, r];
  let out = makeClip(`${clip.name} ${id}`, sr, channels);
  if (limit) out = truePeakLimit(out, -1);
  return out;
}

function drive(src: Float32Array, amount: number) {
  const amt = Math.max(1.01, amount);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = tanhSoft(src[i] ?? 0, amt);
  return out;
}

function gainDb(src: Float32Array, db: number) {
  const g = dbToGain(db);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = (src[i] ?? 0) * g;
  return out;
}

function bitcrush(src: Float32Array, bits: number) {
  const steps = Math.pow(2, bits - 1);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = Math.round((src[i] ?? 0) * steps) / steps;
  }
  return out;
}

function compress(
  src: Float32Array,
  sr: number,
  ratio: number,
  attackSec: number,
  releaseSec: number,
  threshDb = -12,
) {
  const atk = Math.exp(-1 / (attackSec * sr));
  const rel = Math.exp(-1 / (releaseSec * sr));
  const thresh = dbToGain(threshDb);
  const out = new Float32Array(src.length);
  let env = 0;
  for (let i = 0; i < src.length; i++) {
    const x = Math.abs(src[i] ?? 0);
    env = x > env ? atk * env + (1 - atk) * x : rel * env + (1 - rel) * x;
    let g = 1;
    if (env > thresh) {
      const over = env / thresh;
      g = (thresh * Math.pow(over, 1 / ratio)) / env;
    }
    out[i] = (src[i] ?? 0) * g * 1.08;
  }
  return out;
}

function noiseGate(
  src: Float32Array,
  sr: number,
  threshDb: number,
  ratio: number,
  releaseMs: number,
) {
  const thresh = dbToGain(threshDb);
  const rel = Math.exp(-1 / ((releaseMs / 1000) * sr));
  const atk = Math.exp(-1 / (0.003 * sr));
  const out = new Float32Array(src.length);
  let env = 0;
  for (let i = 0; i < src.length; i++) {
    const x = Math.abs(src[i] ?? 0);
    env = x > env ? atk * env + (1 - atk) * x : rel * env + (1 - rel) * x;
    let g = 1;
    if (env < thresh) {
      if (env <= 1e-8) g = 0;
      else g = Math.pow(env / thresh, ratio - 1);
    }
    out[i] = (src[i] ?? 0) * g;
  }
  return out;
}

function msWidth(l: Float32Array, r: Float32Array, sideGain: number): [Float32Array, Float32Array] {
  const oL = new Float32Array(l.length);
  const oR = new Float32Array(r.length);
  for (let i = 0; i < l.length; i++) {
    const mid = ((l[i] ?? 0) + (r[i] ?? 0)) * 0.5;
    const side = ((l[i] ?? 0) - (r[i] ?? 0)) * 0.5 * sideGain;
    oL[i] = mid + side;
    oR[i] = mid - side;
  }
  return [oL, oR];
}

function dust(n: number, sr: number, amount: number) {
  const out = new Float32Array(n);
  let rumble = 0;
  for (let i = 0; i < n; i++) {
    rumble = rumble * 0.999 + (Math.random() * 2 - 1) * 0.001;
    if (Math.random() < 0.0008 * (sr / 44100)) {
      const crack = (Math.random() * 2 - 1) * amount * 4;
      const len = Math.floor(sr * 0.002);
      for (let k = 0; k < len && i + k < n; k++) {
        out[i + k] += crack * Math.exp(-k / (len * 0.3));
      }
    }
    out[i] += rumble * amount * 0.6;
  }
  return out;
}

function comb(src: Float32Array, delay: number, feedback: number) {
  const n = src.length;
  const d = Math.max(2, delay);
  const buf = new Float32Array(d);
  const out = new Float32Array(n);
  let w = 0;
  for (let i = 0; i < n; i++) {
    const delayed = buf[w] ?? 0;
    const y = (src[i] ?? 0) + delayed * feedback;
    buf[w] = y;
    out[i] = y;
    w += 1;
    if (w >= d) w = 0;
  }
  return out;
}

function allpass(src: Float32Array, delay: number, feedback: number) {
  const n = src.length;
  const d = Math.max(2, delay);
  const buf = new Float32Array(d);
  const out = new Float32Array(n);
  let w = 0;
  for (let i = 0; i < n; i++) {
    const delayed = buf[w] ?? 0;
    const x = src[i] ?? 0;
    const y = -x + delayed;
    buf[w] = x + delayed * feedback;
    out[i] = y;
    w += 1;
    if (w >= d) w = 0;
  }
  return out;
}

function schroederReverb(
  src: Float32Array,
  sr: number,
  room: number,
  damping: number,
  wet: number,
) {
  const scale = sr / 44100;
  const fb = 0.72 + room * 0.22;
  const damp = 1 - damping * 0.45;
  const c1 = comb(src, Math.round(1116 * scale), fb);
  const c2 = comb(src, Math.round(1188 * scale), fb * 0.97);
  const c3 = comb(src, Math.round(1277 * scale), fb * 0.95);
  const c4 = comb(src, Math.round(1356 * scale), fb * 0.93);
  const summed = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    summed[i] =
      ((c1[i] ?? 0) + (c2[i] ?? 0) + (c3[i] ?? 0) + (c4[i] ?? 0)) * 0.25 * damp;
  }
  let y = allpass(summed, Math.round(556 * scale), 0.5);
  y = allpass(y, Math.round(441 * scale), 0.5);
  const out = new Float32Array(src.length);
  const dry = 1 - wet;
  for (let i = 0; i < src.length; i++) {
    out[i] = (src[i] ?? 0) * dry + (y[i] ?? 0) * wet;
  }
  return out;
}

function chorus(
  src: Float32Array,
  sr: number,
  rate: number,
  depth: number,
  centreMs: number,
  mix: number,
) {
  const n = src.length;
  const centre = (centreMs / 1000) * sr;
  const depthS = Math.max(1, depth * 0.006 * sr);
  const maxDelay = Math.floor(centre + depthS + 4);
  const buf = new Float32Array(maxDelay);
  const out = new Float32Array(n);
  let w = 0;
  for (let t = 0; t < n; t++) {
    buf[w] = src[t] ?? 0;
    const lfo = Math.sin((2 * Math.PI * rate * t) / sr);
    const d = centre + depthS * lfo;
    let idx = w - d;
    while (idx < 0) idx += maxDelay;
    const i0 = Math.floor(idx) % maxDelay;
    const i1 = (i0 + 1) % maxDelay;
    const frac = idx - Math.floor(idx);
    const delayed = (buf[i0] ?? 0) * (1 - frac) + (buf[i1] ?? 0) * frac;
    out[t] = (src[t] ?? 0) * (1 - mix) + delayed * mix;
    w += 1;
    if (w >= maxDelay) w = 0;
  }
  return out;
}

/**
 * Live FxIT rack. Native Web Audio, parameter glides, and one sample-accurate
 * worklet for the gate and sample-hold. Saturation, fold, and the safety
 * ceiling run at 4x. Dry is delayed to the compressor look-ahead so the mix
 * knob does not comb. Print uses the same chain on an OfflineAudioContext.
 */
import { dbToGain } from "./dsp";
import { getAudioContext } from "./io";
import { makeClip, type AudioClip } from "./types";

const LOOK = 0.006;
const ALIGN = LOOK * 4;

export type RackParams = {
  mix: number;
  inputDb: number;
  outputDb: number;
  hpfOn: boolean;
  hpfHz: number;
  hpfQ: number;
  lpOn: boolean;
  lpHz: number;
  lpQ: number;
  eqOn: boolean;
  eqLow: number;
  eqBody: number;
  eqPresence: number;
  eqAir: number;
  deessOn: boolean;
  deessHz: number;
  deessAmt: number;
  compOn: boolean;
  compThresh: number;
  compRatio: number;
  compAttack: number;
  compRelease: number;
  compMakeup: number;
  punchOn: boolean;
  punch: number;
  punchAttack: number;
  satOn: boolean;
  satDrive: number;
  satTone: number;
  satMix: number;
  crushOn: boolean;
  crushBits: number;
  crushMix: number;
  excOn: boolean;
  excAmt: number;
  excFreq: number;
  chorusOn: boolean;
  chorusRate: number;
  chorusDepth: number;
  chorusMix: number;
  phaserOn: boolean;
  phaserRate: number;
  phaserDepth: number;
  phaserMix: number;
  delayOn: boolean;
  delayMs: number;
  delayFb: number;
  delayTone: number;
  delayMix: number;
  verbOn: boolean;
  verbSize: number;
  verbDamp: number;
  verbPre: number;
  verbMix: number;
  widthOn: boolean;
  width: number;
  panOn: boolean;
  panRate: number;
  panDepth: number;
  tiltOn: boolean;
  tilt: number;
  bellOn: boolean;
  bellHz: number;
  bellDb: number;
  bellQ: number;
  gateOn: boolean;
  gateThresh: number;
  gateRange: number;
  gateAttack: number;
  gateRelease: number;
  reduxOn: boolean;
  reduxHold: number;
  foldOn: boolean;
  foldAmt: number;
  flangeOn: boolean;
  flangeRate: number;
  flangeDepth: number;
  flangeFb: number;
  flangeMix: number;
  tremOn: boolean;
  tremRate: number;
  tremDepth: number;
  wowOn: boolean;
  wowRate: number;
  wowDepth: number;
  wowMix: number;
  limitOn: boolean;
  limitDb: number;
  limitRelease: number;
};

export const RACK_INIT: RackParams = {
  mix: 1,
  inputDb: 0,
  outputDb: 0,
  hpfOn: false,
  hpfHz: 30,
  hpfQ: 0.707,
  lpOn: false,
  lpHz: 16000,
  lpQ: 0.707,
  eqOn: false,
  eqLow: 0,
  eqBody: 0,
  eqPresence: 0,
  eqAir: 0,
  deessOn: false,
  deessHz: 6800,
  deessAmt: 0.55,
  compOn: false,
  compThresh: -18,
  compRatio: 3,
  compAttack: 0.012,
  compRelease: 0.14,
  compMakeup: 1.5,
  punchOn: false,
  punch: 0.45,
  punchAttack: 0.025,
  satOn: false,
  satDrive: 0.35,
  satTone: 0.55,
  satMix: 0.65,
  crushOn: false,
  crushBits: 12,
  crushMix: 0.7,
  excOn: false,
  excAmt: 0.35,
  excFreq: 6500,
  chorusOn: false,
  chorusRate: 0.35,
  chorusDepth: 0.4,
  chorusMix: 0.28,
  phaserOn: false,
  phaserRate: 0.18,
  phaserDepth: 0.72,
  phaserMix: 0.35,
  delayOn: false,
  delayMs: 220,
  delayFb: 0.32,
  delayTone: 4200,
  delayMix: 0.22,
  verbOn: false,
  verbSize: 0.45,
  verbDamp: 0.5,
  verbPre: 0.018,
  verbMix: 0.22,
  widthOn: false,
  width: 1.35,
  panOn: false,
  panRate: 0.35,
  panDepth: 0.45,
  tiltOn: false,
  tilt: 0,
  bellOn: false,
  bellHz: 1200,
  bellDb: 0,
  bellQ: 1.2,
  gateOn: false,
  gateThresh: -36,
  gateRange: 0.82,
  gateAttack: 0.004,
  gateRelease: 0.1,
  reduxOn: false,
  reduxHold: 6,
  foldOn: false,
  foldAmt: 0.45,
  flangeOn: false,
  flangeRate: 0.22,
  flangeDepth: 0.55,
  flangeFb: 0.32,
  flangeMix: 0.35,
  tremOn: false,
  tremRate: 3.2,
  tremDepth: 0.45,
  wowOn: false,
  wowRate: 0.42,
  wowDepth: 0.4,
  wowMix: 0.55,
  limitOn: false,
  limitDb: -1,
  limitRelease: 0.08,
};

export type RackGroup = "bus" | "vocal" | "drum" | "bass" | "space";

export type RackPreset = {
  id: string;
  name: string;
  blurb: string;
  group: RackGroup;
  params: Partial<RackParams>;
};

export const RACK_GROUPS: { id: RackGroup; label: string }[] = [
  { id: "bus", label: "Bus" },
  { id: "vocal", label: "Vocal" },
  { id: "drum", label: "Drums" },
  { id: "bass", label: "Bass" },
  { id: "space", label: "Space" },
];

export const RACK_PRESETS: RackPreset[] = [
  { id: "tape", name: "Tape", blurb: "Soft 4x, lid on the air.", group: "bus", params: { satOn: true, satDrive: 0.32, satTone: 0.42, satMix: 0.75, lpOn: true, lpHz: 12000, eqOn: true, eqLow: 1.2, eqAir: -2.2 } },
  { id: "glue", name: "808 Glue", blurb: "Low bump, bus comp, ceiling.", group: "bus", params: { eqOn: true, eqLow: 3.2, eqBody: -1, compOn: true, compThresh: -20, compRatio: 4, compAttack: 0.01, compRelease: 0.16, compMakeup: 2, satOn: true, satDrive: 0.22, satMix: 0.45, limitOn: true, limitDb: -1 } },
  { id: "radio", name: "Radio", blurb: "Speaker band, fast squeeze.", group: "bus", params: { hpfOn: true, hpfHz: 380, lpOn: true, lpHz: 3200, compOn: true, compThresh: -22, compRatio: 6, compAttack: 0.004, compRelease: 0.08, compMakeup: 3, satOn: true, satDrive: 0.4, satMix: 0.6 } },
  { id: "lofi", name: "Lo-Fi", blurb: "12-bit, dark lid, slow move.", group: "bus", params: { crushOn: true, crushBits: 10, crushMix: 0.85, lpOn: true, lpHz: 6200, eqOn: true, eqLow: 1.5, satOn: true, satDrive: 0.25, satMix: 0.4, panOn: true, panRate: 0.15, panDepth: 0.2 } },
  { id: "phone", name: "Telephone", blurb: "Narrow band, light grit.", group: "bus", params: { hpfOn: true, hpfHz: 340, lpOn: true, lpHz: 3400, satOn: true, satDrive: 0.55, satMix: 0.8, compOn: true, compThresh: -16, compRatio: 4, compMakeup: 2 } },
  { id: "width", name: "Width", blurb: "Sides up. Center stays.", group: "bus", params: { widthOn: true, width: 1.65, eqOn: true, eqAir: 1.2 } },
  { id: "air", name: "Air Lift", blurb: "Shelf plus a little exciter.", group: "bus", params: { eqOn: true, eqAir: 4.5, excOn: true, excAmt: 0.28 } },
  { id: "dark", name: "Darken", blurb: "Close the lid, keep the body.", group: "bus", params: { lpOn: true, lpHz: 5200, eqOn: true, eqLow: 1.6, eqAir: -2 } },
  { id: "punch", name: "Punch", blurb: "Attack forward, sustain back.", group: "bus", params: { punchOn: true, punch: 0.62, compOn: true, compThresh: -16, compRatio: 2.5, compAttack: 0.02, compRelease: 0.12, compMakeup: 0.5 } },
  { id: "clean", name: "Clean", blurb: "Sub rumble out, gentle ceiling.", group: "bus", params: { hpfOn: true, hpfHz: 32, limitOn: true, limitDb: -1 } },
  { id: "vinyl", name: "Vinyl", blurb: "Dull top, warm low, slow chorus.", group: "bus", params: { lpOn: true, lpHz: 9000, eqOn: true, eqLow: 1.8, satOn: true, satDrive: 0.2, satMix: 0.45, chorusOn: true, chorusRate: 0.18, chorusDepth: 0.22, chorusMix: 0.12 } },
  { id: "night", name: "Night Bus", blurb: "Club low end, glued, limited.", group: "bus", params: { hpfOn: true, hpfHz: 28, eqOn: true, eqLow: 3, eqBody: -1.2, compOn: true, compThresh: -18, compRatio: 3.5, compMakeup: 2, limitOn: true, limitDb: -0.8 } },
  { id: "crystal", name: "Crystal", blurb: "HPF, de-ess, light air.", group: "vocal", params: { hpfOn: true, hpfHz: 80, deessOn: true, deessHz: 7000, deessAmt: 0.6, compOn: true, compThresh: -18, compRatio: 2.6, compAttack: 0.008, compRelease: 0.12, compMakeup: 2, eqOn: true, eqAir: 2, limitOn: true, limitDb: -1.5 } },
  { id: "presence", name: "Presence", blurb: "3 kHz and air, then a lid.", group: "vocal", params: { hpfOn: true, hpfHz: 70, eqOn: true, eqPresence: 3.5, eqAir: 2.2, eqBody: -1, deessOn: true, deessAmt: 0.4, compOn: true, compThresh: -16, compRatio: 3, compMakeup: 1.5, limitOn: true, limitDb: -1.2 } },
  { id: "lush", name: "Lush Verb", blurb: "Plate and a slow chorus.", group: "vocal", params: { hpfOn: true, hpfHz: 90, verbOn: true, verbSize: 0.62, verbDamp: 0.45, verbMix: 0.32, chorusOn: true, chorusRate: 0.25, chorusDepth: 0.35, chorusMix: 0.18, eqOn: true, eqAir: 1 } },
  { id: "tight", name: "Dry Tight", blurb: "Fast ratio, attack up.", group: "vocal", params: { hpfOn: true, hpfHz: 110, compOn: true, compThresh: -24, compRatio: 6, compAttack: 0.003, compRelease: 0.08, compMakeup: 4, punchOn: true, punch: 0.35, deessOn: true, deessAmt: 0.45 } },
  { id: "broadcast", name: "Broadcast", blurb: "Heavy level, de-ess, ceiling.", group: "vocal", params: { hpfOn: true, hpfHz: 80, compOn: true, compThresh: -24, compRatio: 8, compAttack: 0.006, compRelease: 0.1, compMakeup: 5, deessOn: true, deessAmt: 0.7, limitOn: true, limitDb: -1, eqOn: true, eqPresence: 1.5 } },
  { id: "kick", name: "Punchy Kick", blurb: "Sub up, box out.", group: "drum", params: { eqOn: true, eqLow: 4.5, eqBody: -3.5, punchOn: true, punch: 0.55, satOn: true, satDrive: 0.28, satMix: 0.4, hpfOn: true, hpfHz: 28 } },
  { id: "snare", name: "Crisp Snare", blurb: "Body, snap, a little room.", group: "drum", params: { eqOn: true, eqPresence: 3.2, eqAir: 2.4, eqBody: 1.2, punchOn: true, punch: 0.4, satOn: true, satDrive: 0.3, satMix: 0.35, verbOn: true, verbSize: 0.28, verbMix: 0.14, verbDamp: 0.6 } },
  { id: "room", name: "Room Killer", blurb: "Close the wash, keep the hit.", group: "drum", params: { hpfOn: true, hpfHz: 70, compOn: true, compThresh: -20, compRatio: 8, compAttack: 0.002, compRelease: 0.06, compMakeup: 2, punchOn: true, punch: 0.5, lpOn: true, lpHz: 10000 } },
  { id: "dglue", name: "Drum Glue", blurb: "2-style bus, tape, limit.", group: "drum", params: { compOn: true, compThresh: -16, compRatio: 3, compAttack: 0.012, compRelease: 0.18, compMakeup: 2, satOn: true, satDrive: 0.24, satMix: 0.5, limitOn: true, limitDb: -0.8 } },
  { id: "dgrit", name: "Lo-Fi Grit", blurb: "8-bit and a 4 kHz lid.", group: "drum", params: { crushOn: true, crushBits: 8, crushMix: 1, lpOn: true, lpHz: 4200, satOn: true, satDrive: 0.35, satMix: 0.4 } },
  { id: "sub", name: "Sub Focus", blurb: "Lid above the note, slow comp.", group: "bass", params: { lpOn: true, lpHz: 280, hpfOn: true, hpfHz: 25, compOn: true, compThresh: -18, compRatio: 4, compAttack: 0.03, compRelease: 0.2, compMakeup: 2, eqOn: true, eqLow: 2 } },
  { id: "fuzz", name: "Fuzz Box", blurb: "Hard 4x, scooped mids.", group: "bass", params: { satOn: true, satDrive: 0.82, satTone: 0.25, satMix: 1, eqOn: true, eqBody: -6, eqLow: 2, lpOn: true, lpHz: 2400 } },
  { id: "even", name: "Even Dynamics", blurb: "High ratio, makeup, ceiling.", group: "bass", params: { compOn: true, compThresh: -22, compRatio: 8, compAttack: 0.01, compRelease: 0.16, compMakeup: 5, limitOn: true, limitDb: -1, hpfOn: true, hpfHz: 30 } },
  { id: "notes", name: "Note Definition", blurb: "Growl up, mud down.", group: "bass", params: { eqOn: true, eqBody: 3.5, eqLow: -1.5, eqPresence: 1.5, hpfOn: true, hpfHz: 35, satOn: true, satDrive: 0.2, satMix: 0.3 } },
  { id: "rumble", name: "Rumble Eater", blurb: "High-pass the sub mud.", group: "bass", params: { hpfOn: true, hpfHz: 48, eqOn: true, eqLow: -2.5, eqBody: -1 } },
  { id: "widen", name: "Stereo Widen", blurb: "Chorus and sides.", group: "space", params: { widthOn: true, width: 1.55, chorusOn: true, chorusRate: 0.3, chorusDepth: 0.45, chorusMix: 0.3, eqOn: true, eqAir: 1.5 } },
  { id: "sheen", name: "Sheen", blurb: "Exciter, air, de-ess, ceiling.", group: "space", params: { excOn: true, excAmt: 0.45, eqOn: true, eqAir: 3, deessOn: true, deessAmt: 0.4, limitOn: true, limitDb: -1 } },
  { id: "dub", name: "Dub Throw", blurb: "Filtered echo, a little plate.", group: "space", params: { delayOn: true, delayMs: 330, delayFb: 0.48, delayMix: 0.32, verbOn: true, verbSize: 0.4, verbMix: 0.16, hpfOn: true, hpfHz: 80 } },
  { id: "plate", name: "Plate", blurb: "Long, darker tail.", group: "space", params: { verbOn: true, verbSize: 0.82, verbDamp: 0.62, verbMix: 0.38, eqOn: true, eqAir: 1, hpfOn: true, hpfHz: 70 } },
  { id: "phase", name: "Phaser Wash", blurb: "Four stages, slow rate.", group: "space", params: { phaserOn: true, phaserRate: 0.12, phaserMix: 0.55, chorusOn: true, chorusMix: 0.12, chorusRate: 0.2, chorusDepth: 0.3 } },
  { id: "shimmer", name: "Shimmer", blurb: "Chorus, plate, top end.", group: "space", params: { chorusOn: true, chorusRate: 0.4, chorusDepth: 0.55, chorusMix: 0.28, verbOn: true, verbSize: 0.7, verbDamp: 0.25, verbMix: 0.34, eqOn: true, eqAir: 3.5, excOn: true, excAmt: 0.3 } },
  { id: "autopan", name: "Auto Pan", blurb: "Even level, moving sides.", group: "space", params: { panOn: true, panRate: 0.4, panDepth: 0.7, widthOn: true, width: 1.2 } },
  { id: "back", name: "Background", blurb: "Sit the part behind the vocal.", group: "space", params: { eqOn: true, eqPresence: -3.5, eqAir: -1, outputDb: -3, verbOn: true, verbSize: 0.35, verbMix: 0.18, verbDamp: 0.7 } },
  { id: "tilt", name: "Tilt Bright", blurb: "One move. Lows down, air up.", group: "bus", params: { tiltOn: true, tilt: 4.2, hpfOn: true, hpfHz: 28 } },
  { id: "notch", name: "Box Notch", blurb: "Sweep the honk out.", group: "bus", params: { bellOn: true, bellHz: 380, bellDb: -4.5, bellQ: 1.6, hpfOn: true, hpfHz: 30 } },
  { id: "gated", name: "Gated Room", blurb: "Hysteresis gate, attack stays.", group: "drum", params: { gateOn: true, gateThresh: -34, gateRange: 0.9, gateAttack: 0.002, gateRelease: 0.08, punchOn: true, punch: 0.4, hpfOn: true, hpfHz: 40 } },
  { id: "fold", name: "Fold", blurb: "Wavefold, 4x, mixed back.", group: "bus", params: { foldOn: true, foldAmt: 0.62, eqOn: true, eqBody: -1.5, limitOn: true, limitDb: -1 } },
  { id: "hold", name: "Sample Hold", blurb: "Stepped rate, then the chain.", group: "bus", params: { reduxOn: true, reduxHold: 7, lpOn: true, lpHz: 8000, satOn: true, satDrive: 0.18, satMix: 0.35 } },
  { id: "jet", name: "Jet Flange", blurb: "Short delay, filtered feedback.", group: "space", params: { flangeOn: true, flangeRate: 0.16, flangeDepth: 0.7, flangeFb: 0.42, flangeMix: 0.45, hpfOn: true, hpfHz: 80 } },
  { id: "trem", name: "Tremolo", blurb: "Level moves. Phase does not flip.", group: "space", params: { tremOn: true, tremRate: 4.5, tremDepth: 0.62 } },
  { id: "wow", name: "Tape Wow", blurb: "Slow pitch drift, mixed in.", group: "space", params: { wowOn: true, wowRate: 0.38, wowDepth: 0.55, wowMix: 0.7, satOn: true, satDrive: 0.2, satMix: 0.4, lpOn: true, lpHz: 12000 } },
  { id: "neutron", name: "Vocal Chain", blurb: "Gate, de-ess, tilt, ceiling.", group: "vocal", params: { hpfOn: true, hpfHz: 85, gateOn: true, gateThresh: -42, gateRange: 0.7, gateAttack: 0.005, gateRelease: 0.12, deessOn: true, deessAmt: 0.55, tiltOn: true, tilt: 2.4, bellOn: true, bellHz: 3200, bellDb: 2.2, bellQ: 1.1, compOn: true, compThresh: -18, compRatio: 3, compMakeup: 2, limitOn: true, limitDb: -1.2 } },
];

type Chain = {
  input: AudioNode;
  output: AudioNode;
  inputMeter: AnalyserNode;
  outputMeter: AnalyserNode;
  apply: (p: RackParams, snap: boolean) => void;
  dispose: () => void;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function eqPower(mix: number): [number, number] {
  const m = clamp(mix, 0, 1);
  return [Math.cos(m * Math.PI * 0.5), Math.sin(m * Math.PI * 0.5)];
}

function gain(ctx: BaseAudioContext, value = 1) {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

function filter(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  freq: number,
  q = 0.707,
  g = 0,
) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = freq;
  node.Q.value = q;
  node.gain.value = g;
  return node;
}

function curveTanh() {
  const n = 2048;
  const curve = new Float32Array(n);
  const k = 2.4;
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / norm;
  }
  return curve;
}

function curveSafety() {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const ax = Math.abs(x);
    if (ax <= 0.89) curve[i] = x;
    else {
      const sign = x < 0 ? -1 : 1;
      const t = (ax - 0.89) / 0.11;
      curve[i] = sign * (0.89 + 0.085 * Math.tanh(t * 2.2));
    }
  }
  return curve;
}

function curveBits(bits: number) {
  const steps = Math.pow(2, clamp(Math.round(bits), 4, 16) - 1);
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

function shaper(ctx: BaseAudioContext, curve: Float32Array) {
  const node = ctx.createWaveShaper();
  node.curve = curve as Float32Array<ArrayBuffer>;
  node.oversample = "4x";
  return node;
}

function curveFold(amt: number) {
  const n = 2048;
  const curve = new Float32Array(n);
  const drive = 1 + clamp(amt, 0, 1) * 3.2;
  for (let i = 0; i < n; i++) {
    let y = ((i / (n - 1)) * 2 - 1) * drive;
    for (let k = 0; k < 3; k++) {
      if (y > 1) y = 2 - y;
      else if (y < -1) y = -2 - y;
      else break;
    }
    curve[i] = Math.max(-1, Math.min(1, y / (1 + amt * 0.35)));
  }
  return curve;
}

const COLOR_WORKLET = `
class NodawColor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "gate", defaultValue: 0, automationRate: "k-rate" },
      { name: "thresh", defaultValue: 0.02, automationRate: "k-rate" },
      { name: "floor", defaultValue: 1, automationRate: "k-rate" },
      { name: "attack", defaultValue: 0.004, automationRate: "k-rate" },
      { name: "release", defaultValue: 0.1, automationRate: "k-rate" },
      { name: "hold", defaultValue: 1, automationRate: "k-rate" },
    ];
  }
  constructor() {
    super();
    this.env = 0;
    this.g = 1;
    this.open = true;
    this.phase = 0;
    this.prev = [0, 0];
    this.next = [0, 0];
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output[0]) return true;
    const gateOn = parameters.gate[0] > 0.5;
    const thresh = Math.max(1e-5, parameters.thresh[0]);
    const floor = parameters.floor[0];
    const atk = Math.max(0.0004, parameters.attack[0]);
    const rel = Math.max(0.01, parameters.release[0]);
    const hold = Math.max(1, parameters.hold[0]);
    const aA = Math.exp(-1 / (atk * sampleRate));
    const aR = Math.exp(-1 / (rel * sampleRate));
    const close = thresh * 0.68;
    const n = input[0].length;
    for (let i = 0; i < n; i++) {
      let peak = 0;
      for (let c = 0; c < input.length; c++) {
        const s = input[c][i] || 0;
        const a = s < 0 ? -s : s;
        if (a > peak) peak = a;
      }
      const det = peak > this.env ? 0.35 : aR;
      this.env = det * this.env + (1 - det) * peak;
      if (this.open) {
        if (this.env < close) this.open = false;
      } else if (this.env >= thresh) this.open = true;
      const target = !gateOn || this.open ? 1 : floor;
      const gc = target > this.g ? aA : aR;
      this.g = gc * this.g + (1 - gc) * target;
      if (hold <= 1.01) {
        for (let c = 0; c < output.length; c++) {
          const src = input[c] || input[0];
          output[c][i] = (src[i] || 0) * this.g;
        }
        continue;
      }
      if (this.phase <= 0) {
        this.prev[0] = this.next[0];
        this.prev[1] = this.next[1];
        this.next[0] = input[0][i] || 0;
        this.next[1] = (input[1] ? input[1][i] : input[0][i]) || 0;
        this.phase += hold;
      }
      const t = 1 - this.phase / hold;
      this.phase -= 1;
      for (let c = 0; c < output.length; c++) {
        const a = this.prev[c] || 0;
        const b = this.next[c] || 0;
        output[c][i] = (a + (b - a) * t) * this.g;
      }
    }
    return true;
  }
}
registerProcessor("nodaw-color", NodawColor);
`;

const workletReady = new WeakMap<BaseAudioContext, Promise<boolean>>();

function ensureColorWorklet(ctx: BaseAudioContext): Promise<boolean> {
  let pending = workletReady.get(ctx);
  if (!pending) {
    pending = (async () => {
      if (!ctx.audioWorklet) return false;
      const url = URL.createObjectURL(new Blob([COLOR_WORKLET], { type: "text/javascript" }));
      try {
        await ctx.audioWorklet.addModule(url);
        return true;
      } catch {
        return false;
      } finally {
        URL.revokeObjectURL(url);
      }
    })();
    workletReady.set(ctx, pending);
  }
  return pending;
}

function biquadMag(
  type: "highpass" | "lowpass" | "peaking" | "lowshelf" | "highshelf",
  f0: number,
  q: number,
  gainDb: number,
  freq: number,
  sr: number,
) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * f0) / sr;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const alpha = sw / (2 * Math.max(0.15, q));
  let b0 = 1;
  let b1 = 0;
  let b2 = 0;
  let a0 = 1;
  let a1 = 0;
  let a2 = 0;
  if (type === "lowpass") {
    b0 = (1 - cw) / 2;
    b1 = 1 - cw;
    b2 = (1 - cw) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cw;
    a2 = 1 - alpha;
  } else if (type === "highpass") {
    b0 = (1 + cw) / 2;
    b1 = -(1 + cw);
    b2 = (1 + cw) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cw;
    a2 = 1 - alpha;
  } else if (type === "peaking") {
    b0 = 1 + alpha * A;
    b1 = -2 * cw;
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * cw;
    a2 = 1 - alpha / A;
  } else if (type === "lowshelf") {
    const s = 2 * Math.sqrt(A) * alpha;
    b0 = A * (A + 1 - (A - 1) * cw + s);
    b1 = 2 * A * (A - 1 - (A + 1) * cw);
    b2 = A * (A + 1 - (A - 1) * cw - s);
    a0 = A + 1 + (A - 1) * cw + s;
    a1 = -2 * (A - 1 + (A + 1) * cw);
    a2 = A + 1 + (A - 1) * cw - s;
  } else {
    const s = 2 * Math.sqrt(A) * alpha;
    b0 = A * (A + 1 + (A - 1) * cw + s);
    b1 = -2 * A * (A - 1 + (A + 1) * cw);
    b2 = A * (A + 1 + (A - 1) * cw - s);
    a0 = A + 1 - (A - 1) * cw + s;
    a1 = 2 * (A - 1 - (A + 1) * cw);
    a2 = A + 1 - (A - 1) * cw - s;
  }
  const w = (2 * Math.PI * freq) / sr;
  const c1 = Math.cos(w);
  const s1 = Math.sin(w);
  const c2 = Math.cos(2 * w);
  const s2 = Math.sin(2 * w);
  const nr = b0 + b1 * c1 + b2 * c2;
  const ni = -(b1 * s1 + b2 * s2);
  const dr = a0 + a1 * c1 + a2 * c2;
  const di = -(a1 * s1 + a2 * s2);
  const mag = Math.sqrt(nr * nr + ni * ni) / Math.max(1e-9, Math.sqrt(dr * dr + di * di));
  return 20 * Math.log10(Math.max(1e-6, mag));
}

/** Linear EQ response in dB, matching the rack's shape filters. */
export function rackCurveDb(p: RackParams, freq: number, sr: number) {
  let db = 0;
  if (p.hpfOn) db += biquadMag("highpass", clamp(p.hpfHz, 20, 800), clamp(p.hpfQ, 0.3, 2.5), 0, freq, sr);
  if (p.lpOn) db += biquadMag("lowpass", clamp(p.lpHz, 200, 18000), clamp(p.lpQ, 0.3, 2.5), 0, freq, sr);
  if (p.eqOn) {
    if (Math.abs(p.eqLow) > 0.05) db += biquadMag("lowshelf", 110, 0.7, p.eqLow, freq, sr);
    if (Math.abs(p.eqBody) > 0.05) db += biquadMag("peaking", 420, 0.85, p.eqBody, freq, sr);
    if (Math.abs(p.eqPresence) > 0.05) db += biquadMag("peaking", 3200, 0.9, p.eqPresence, freq, sr);
    if (Math.abs(p.eqAir) > 0.05) db += biquadMag("highshelf", 10000, 0.7, p.eqAir, freq, sr);
  }
  if (p.tiltOn && Math.abs(p.tilt) > 0.05) {
    db += biquadMag("lowshelf", 280, 0.7, -p.tilt, freq, sr);
    db += biquadMag("highshelf", 4500, 0.7, p.tilt, freq, sr);
  }
  if (p.bellOn && Math.abs(p.bellDb) > 0.05) {
    db += biquadMag("peaking", clamp(p.bellHz, 80, 12000), clamp(p.bellQ, 0.4, 8), p.bellDb, freq, sr);
  }
  return db;
}

function makePlate(ctx: BaseAudioContext, seconds: number, damp: number) {
  const sr = ctx.sampleRate;
  const len = Math.max(8, Math.floor(sr * clamp(seconds, 0.2, 3.2)));
  const buf = ctx.createBuffer(2, len, sr);
  const early = [0.009, 0.013, 0.019, 0.027, 0.037];
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    let low = 0;
    const coef = 0.12 + clamp(damp, 0, 1) * 0.82;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 2.1);
      const white = (Math.random() * 2 - 1) * env;
      low += coef * (white - low);
      data[i] = low;
    }
    for (let e = 0; e < early.length; e++) {
      const idx = Math.floor(early[e] * sr) + c * 19;
      if (idx >= 0 && idx < len) data[idx] += (0.32 - e * 0.045) * (c ? -0.8 : 1);
    }
    let peak = 1e-8;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(data[i]));
    const g = 0.55 / peak;
    for (let i = 0; i < len; i++) data[i] *= g;
  }
  return buf;
}

function stereoBuffer(ctx: BaseAudioContext, clip: AudioClip) {
  const length = Math.max(1, clip.channels[0]?.length ?? 0);
  const buffer = ctx.createBuffer(2, length, clip.sampleRate);
  const left = clip.channels[0] ?? new Float32Array(length);
  const right = clip.channels[1] ?? left;
  buffer.copyToChannel(left as Float32Array<ArrayBuffer>, 0);
  buffer.copyToChannel(right as Float32Array<ArrayBuffer>, 1);
  return buffer;
}

async function createChain(ctx: BaseAudioContext): Promise<Chain> {
  const colorOk = await ensureColorWorklet(ctx);
  const oscs: OscillatorNode[] = [];
  const startLfo = (freq: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    oscs.push(osc);
    return osc;
  };

  const input = gain(ctx, 1);
  const inputMeter = ctx.createAnalyser();
  inputMeter.fftSize = 2048;
  inputMeter.smoothingTimeConstant = 0.78;
  inputMeter.minDecibels = -100;
  inputMeter.maxDecibels = -8;
  input.connect(inputMeter);

  const dryDelay = ctx.createDelay(0.05);
  dryDelay.delayTime.value = ALIGN;
  const dryGain = gain(ctx, 0);
  const wetGain = gain(ctx, 1);
  const sum = gain(ctx, 1);
  input.connect(dryDelay);
  dryDelay.connect(dryGain);
  dryGain.connect(sum);

  const hpf = filter(ctx, "highpass", 20, 0.707);
  const lpf = filter(ctx, "lowpass", 18000, 0.707);
  const eqLow = filter(ctx, "lowshelf", 110, 0.7, 0);
  const eqBody = filter(ctx, "peaking", 420, 0.85, 0);
  const eqPresence = filter(ctx, "peaking", 3200, 0.9, 0);
  const eqAir = filter(ctx, "highshelf", 10000, 0.7, 0);
  const tiltLow = filter(ctx, "lowshelf", 280, 0.7, 0);
  const tiltHigh = filter(ctx, "highshelf", 4500, 0.7, 0);
  const bell = filter(ctx, "peaking", 1200, 1.2, 0);
  let color: AudioWorkletNode | null = null;
  if (colorOk) {
    try {
      color = new AudioWorkletNode(ctx, "nodaw-color", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
    } catch {
      color = null;
    }
  }
  const colorIn: AudioNode = color ?? gain(ctx, 1);
  const pGate = color?.parameters.get("gate") ?? gain(ctx, 0).gain;
  const pThresh = color?.parameters.get("thresh") ?? gain(ctx, 0).gain;
  const pFloor = color?.parameters.get("floor") ?? gain(ctx, 1).gain;
  const pAttack = color?.parameters.get("attack") ?? gain(ctx, 0).gain;
  const pRelease = color?.parameters.get("release") ?? gain(ctx, 0).gain;
  const pHold = color?.parameters.get("hold") ?? gain(ctx, 1).gain;
  input.connect(hpf);
  hpf.connect(lpf);
  lpf.connect(eqLow);
  eqLow.connect(eqBody);
  eqBody.connect(eqPresence);
  eqPresence.connect(eqAir);
  eqAir.connect(tiltLow);
  tiltLow.connect(tiltHigh);
  tiltHigh.connect(bell);
  bell.connect(colorIn);

  const bpSub = filter(ctx, "bandpass", 6800, 1.3);
  const bpComp = filter(ctx, "bandpass", 6800, 1.3);
  const deessDelay = ctx.createDelay(0.05);
  deessDelay.delayTime.value = LOOK;
  const bandDelay = ctx.createDelay(0.05);
  bandDelay.delayTime.value = LOOK;
  const deessComp = ctx.createDynamicsCompressor();
  deessComp.threshold.value = -30;
  deessComp.knee.value = 8;
  deessComp.ratio.value = 10;
  deessComp.attack.value = 0.002;
  deessComp.release.value = 0.07;
  const deessCut = gain(ctx, 0);
  const deessAdd = gain(ctx, 0);
  const deessSum = gain(ctx, 1);
  colorIn.connect(deessDelay);
  deessDelay.connect(deessSum);
  colorIn.connect(bpSub);
  bpSub.connect(bandDelay);
  bandDelay.connect(deessCut);
  deessCut.connect(deessSum);
  colorIn.connect(bpComp);
  bpComp.connect(deessComp);
  deessComp.connect(deessAdd);
  deessAdd.connect(deessSum);

  const comp = ctx.createDynamicsCompressor();
  comp.knee.value = 8;
  const compMakeup = gain(ctx, 1);
  deessSum.connect(comp);
  comp.connect(compMakeup);

  const punchComp = ctx.createDynamicsCompressor();
  punchComp.threshold.value = -28;
  punchComp.knee.value = 10;
  punchComp.ratio.value = 6;
  punchComp.attack.value = 0.025;
  punchComp.release.value = 0.18;
  const punchDelay = ctx.createDelay(0.05);
  punchDelay.delayTime.value = LOOK;
  const punchUp = gain(ctx, 1);
  const punchDown = gain(ctx, 0);
  const punchSum = gain(ctx, 1);
  compMakeup.connect(punchDelay);
  punchDelay.connect(punchUp);
  punchUp.connect(punchSum);
  compMakeup.connect(punchComp);
  punchComp.connect(punchDown);
  punchDown.connect(punchSum);

  const satDry = gain(ctx, 1);
  const satWet = gain(ctx, 0);
  const satPre = gain(ctx, 1);
  const satShape = shaper(ctx, curveTanh());
  const satTone = filter(ctx, "lowpass", 12000, 0.7);
  const satPost = gain(ctx, 1);
  const satSum = gain(ctx, 1);
  punchSum.connect(satDry);
  satDry.connect(satSum);
  punchSum.connect(satPre);
  satPre.connect(satShape);
  satShape.connect(satTone);
  satTone.connect(satPost);
  satPost.connect(satWet);
  satWet.connect(satSum);

  const foldDry = gain(ctx, 1);
  const foldWet = gain(ctx, 0);
  const foldPre = gain(ctx, 1);
  const foldA = shaper(ctx, curveFold(0.45));
  const foldB = shaper(ctx, curveFold(0.45));
  const foldGainA = gain(ctx, 1);
  const foldGainB = gain(ctx, 0);
  const foldSum = gain(ctx, 1);
  let foldSlot: 0 | 1 = 0;
  let foldKey = 0.45;
  satSum.connect(foldDry);
  foldDry.connect(foldSum);
  satSum.connect(foldPre);
  foldPre.connect(foldA);
  foldA.connect(foldGainA);
  foldGainA.connect(foldWet);
  foldPre.connect(foldB);
  foldB.connect(foldGainB);
  foldGainB.connect(foldWet);
  foldWet.connect(foldSum);

  const crushDry = gain(ctx, 1);
  const crushWet = gain(ctx, 0);
  const crushA = shaper(ctx, curveBits(16));
  const crushB = shaper(ctx, curveBits(16));
  const crushGainA = gain(ctx, 1);
  const crushGainB = gain(ctx, 0);
  const crushSum = gain(ctx, 1);
  let crushSlot: 0 | 1 = 0;
  let crushBits = 16;
  foldSum.connect(crushDry);
  crushDry.connect(crushSum);
  foldSum.connect(crushA);
  crushA.connect(crushGainA);
  crushGainA.connect(crushWet);
  foldSum.connect(crushB);
  crushB.connect(crushGainB);
  crushGainB.connect(crushWet);
  crushWet.connect(crushSum);

  const excDry = gain(ctx, 1);
  const excHp = filter(ctx, "highpass", 6500, 0.7);
  const excPre = gain(ctx, 1);
  const excShape = shaper(ctx, curveTanh());
  const excHp2 = filter(ctx, "highpass", 5000, 0.7);
  const excWet = gain(ctx, 0);
  const excSum = gain(ctx, 1);
  crushSum.connect(excDry);
  excDry.connect(excSum);
  crushSum.connect(excHp);
  excHp.connect(excPre);
  excPre.connect(excShape);
  excShape.connect(excHp2);
  excHp2.connect(excWet);
  excWet.connect(excSum);

  const chDry = gain(ctx, 1);
  const chWet = gain(ctx, 0);
  const chSplit = ctx.createChannelSplitter(2);
  const chMerge = ctx.createChannelMerger(2);
  const chDelayL = ctx.createDelay(0.05);
  const chDelayR = ctx.createDelay(0.05);
  chDelayL.delayTime.value = 0.014;
  chDelayR.delayTime.value = 0.017;
  const chLfo = startLfo(0.35);
  const chDepthL = gain(ctx, 0);
  const chDepthR = gain(ctx, 0);
  const chSum = gain(ctx, 1);
  excSum.connect(chDry);
  chDry.connect(chSum);
  excSum.connect(chSplit);
  chSplit.connect(chDelayL, 0);
  chSplit.connect(chDelayR, 1);
  chDelayL.connect(chMerge, 0, 0);
  chDelayR.connect(chMerge, 0, 1);
  chMerge.connect(chWet);
  chWet.connect(chSum);
  chLfo.connect(chDepthL);
  chLfo.connect(chDepthR);
  chDepthL.connect(chDelayL.delayTime);
  chDepthR.connect(chDelayR.delayTime);

  const flDry = gain(ctx, 1);
  const flWet = gain(ctx, 0);
  const flIn = gain(ctx, 1);
  const flDelay = ctx.createDelay(0.02);
  flDelay.delayTime.value = 0.0022;
  const flFb = gain(ctx, 0);
  const flFilt = filter(ctx, "lowpass", 5500, 0.7);
  const flLfo = startLfo(0.22);
  const flDepth = gain(ctx, 0);
  const flSum = gain(ctx, 1);
  chSum.connect(flDry);
  flDry.connect(flSum);
  chSum.connect(flIn);
  flIn.connect(flDelay);
  flDelay.connect(flFilt);
  flFilt.connect(flFb);
  flFb.connect(flIn);
  flDelay.connect(flWet);
  flWet.connect(flSum);
  flLfo.connect(flDepth);
  flDepth.connect(flDelay.delayTime);

  const phDry = gain(ctx, 1);
  const phWet = gain(ctx, 0);
  const ph = [0, 1, 2, 3].map(() => filter(ctx, "allpass", 1400, 2.4));
  const phLfo = startLfo(0.18);
  const phDepth = gain(ctx, 0);
  const phSum = gain(ctx, 1);
  flSum.connect(phDry);
  phDry.connect(phSum);
  flSum.connect(ph[0]);
  ph[0].connect(ph[1]);
  ph[1].connect(ph[2]);
  ph[2].connect(ph[3]);
  ph[3].connect(phWet);
  phWet.connect(phSum);
  phLfo.connect(phDepth);
  for (const stage of ph) phDepth.connect(stage.frequency);

  const panSplit = ctx.createChannelSplitter(2);
  const panMerge = ctx.createChannelMerger(2);
  const panL = gain(ctx, 1);
  const panR = gain(ctx, 1);
  const panLfo = startLfo(0.35);
  const panDepthL = gain(ctx, 0);
  const panDepthR = gain(ctx, 0);
  const panInv = gain(ctx, -1);
  phSum.connect(panSplit);
  panSplit.connect(panL, 0);
  panSplit.connect(panR, 1);
  panL.connect(panMerge, 0, 0);
  panR.connect(panMerge, 0, 1);
  panLfo.connect(panDepthL);
  panDepthL.connect(panL.gain);
  panLfo.connect(panInv);
  panInv.connect(panDepthR);
  panDepthR.connect(panR.gain);

  const trem = gain(ctx, 1);
  const tremLfo = startLfo(3.2);
  const tremDepth = gain(ctx, 0);
  panMerge.connect(trem);
  tremLfo.connect(tremDepth);
  tremDepth.connect(trem.gain);

  const dlySplit = ctx.createChannelSplitter(2);
  const dlyMerge = ctx.createChannelMerger(2);
  const dlyL = ctx.createDelay(1.2);
  const dlyR = ctx.createDelay(1.2);
  const dlyFbL = gain(ctx, 0);
  const dlyFbR = gain(ctx, 0);
  const dlyFiltL = filter(ctx, "lowpass", 4200, 0.7);
  const dlyFiltR = filter(ctx, "lowpass", 4200, 0.7);
  const dlyHp = filter(ctx, "highpass", 140, 0.7);
  const dlyDry = gain(ctx, 1);
  const dlyWet = gain(ctx, 0);
  const dlySum = gain(ctx, 1);
  trem.connect(dlyDry);
  dlyDry.connect(dlySum);
  trem.connect(dlyHp);
  dlyHp.connect(dlySplit);
  dlySplit.connect(dlyL, 0);
  dlySplit.connect(dlyR, 1);
  dlyL.connect(dlyFiltL);
  dlyFiltL.connect(dlyFbL);
  dlyFbL.connect(dlyL);
  dlyR.connect(dlyFiltR);
  dlyFiltR.connect(dlyFbR);
  dlyFbR.connect(dlyR);
  dlyL.connect(dlyMerge, 0, 0);
  dlyR.connect(dlyMerge, 0, 1);
  dlyMerge.connect(dlyWet);
  dlyWet.connect(dlySum);

  const verbDry = gain(ctx, 1);
  const verbWet = gain(ctx, 0);
  const preDelay = ctx.createDelay(0.08);
  preDelay.delayTime.value = 0.018;
  const verbA = ctx.createConvolver();
  const verbB = ctx.createConvolver();
  const verbGainA = gain(ctx, 1);
  const verbGainB = gain(ctx, 0);
  const verbSum = gain(ctx, 1);
  let verbSlot: 0 | 1 = 0;
  let verbKey = "";
  dlySum.connect(verbDry);
  verbDry.connect(verbSum);
  dlySum.connect(preDelay);
  preDelay.connect(verbA);
  preDelay.connect(verbB);
  verbA.connect(verbGainA);
  verbB.connect(verbGainB);
  verbGainA.connect(verbWet);
  verbGainB.connect(verbWet);
  verbWet.connect(verbSum);

  const wowDry = gain(ctx, 1);
  const wowWet = gain(ctx, 0);
  const wowDelay = ctx.createDelay(0.03);
  wowDelay.delayTime.value = 0.007;
  const wowLfo = startLfo(0.42);
  const wowDepth = gain(ctx, 0);
  const wowSum = gain(ctx, 1);
  verbSum.connect(wowDry);
  wowDry.connect(wowSum);
  verbSum.connect(wowDelay);
  wowDelay.connect(wowWet);
  wowWet.connect(wowSum);
  wowLfo.connect(wowDepth);
  wowDepth.connect(wowDelay.delayTime);

  const widthSplit = ctx.createChannelSplitter(2);
  const widthMerge = ctx.createChannelMerger(2);
  const midL = gain(ctx, 0.5);
  const midR = gain(ctx, 0.5);
  const sideL = gain(ctx, 0.5);
  const sideR = gain(ctx, -0.5);
  const mid = gain(ctx, 1);
  const side = gain(ctx, 1);
  const sideInv = gain(ctx, -1);
  wowSum.connect(widthSplit);
  widthSplit.connect(midL, 0);
  widthSplit.connect(midR, 1);
  widthSplit.connect(sideL, 0);
  widthSplit.connect(sideR, 1);
  midL.connect(mid);
  midR.connect(mid);
  sideL.connect(side);
  sideR.connect(side);
  mid.connect(widthMerge, 0, 0);
  side.connect(widthMerge, 0, 0);
  mid.connect(widthMerge, 0, 1);
  side.connect(sideInv);
  sideInv.connect(widthMerge, 0, 1);

  const limiter = ctx.createDynamicsCompressor();
  limiter.knee.value = 0;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.08;
  const outGain = gain(ctx, 1);
  const safety = shaper(ctx, curveSafety());
  const dc = filter(ctx, "highpass", 18, 0.707);
  const outputMeter = ctx.createAnalyser();
  outputMeter.fftSize = 2048;
  outputMeter.smoothingTimeConstant = 0.82;
  outputMeter.minDecibels = -100;
  outputMeter.maxDecibels = -8;
  widthMerge.connect(limiter);
  limiter.connect(outGain);
  outGain.connect(safety);
  safety.connect(dc);
  dc.connect(wetGain);
  wetGain.connect(sum);
  sum.connect(outputMeter);

  const glide = (param: AudioParam, value: number, snap: boolean, exp = false, tau = 0.02) => {
    const v = exp ? Math.max(8, value) : value;
    if (!Number.isFinite(v)) return;
    const now = ctx.currentTime;
    try {
      param.cancelScheduledValues(now);
      if (snap) {
        param.setValueAtTime(v, now);
        return;
      }
      const cur = param.value;
      if (!Number.isFinite(cur) || Math.abs(cur - v) < (exp ? 0.4 : 0.0006)) {
        param.setValueAtTime(v, now);
        return;
      }
      const base = exp ? Math.max(8, cur) : cur;
      param.setValueAtTime(base, now);
      param.setTargetAtTime(v, now + 0.01, tau);
    } catch {
      try {
        param.cancelScheduledValues(0);
        param.value = v;
      } catch {
        /* leave the last good value */
      }
    }
  };

  const blend = (dry: GainNode, wet: GainNode, mix: number, snap: boolean) => {
    const [d, w] = eqPower(mix);
    glide(dry.gain, d, snap);
    glide(wet.gain, w, snap);
  };

  const setVerb = (size: number, damp: number, snap: boolean) => {
    const key = `${size.toFixed(2)}|${damp.toFixed(2)}`;
    if (key === verbKey) return;
    verbKey = key;
    const ir = makePlate(ctx, 0.28 + size * 2.5, damp);
    if (snap) {
      verbA.buffer = ir;
      verbGainA.gain.value = 1;
      verbGainB.gain.value = 0;
      verbSlot = 0;
      return;
    }
    const useB = verbSlot === 0;
    const next = useB ? verbB : verbA;
    const nextG = useB ? verbGainB : verbGainA;
    const prevG = useB ? verbGainA : verbGainB;
    next.buffer = ir;
    glide(nextG.gain, 1, false, false, 0.08);
    glide(prevG.gain, 0, false, false, 0.08);
    verbSlot = useB ? 1 : 0;
  };

  const setCrush = (bits: number, snap: boolean) => {
    const b = clamp(Math.round(bits), 4, 16);
    if (b === crushBits) return;
    crushBits = b;
    const curve = curveBits(b) as Float32Array<ArrayBuffer>;
    if (snap) {
      crushA.curve = curve;
      crushB.curve = curve;
      crushGainA.gain.value = 1;
      crushGainB.gain.value = 0;
      crushSlot = 0;
      return;
    }
    const useB = crushSlot === 0;
    const next = useB ? crushB : crushA;
    const nextG = useB ? crushGainB : crushGainA;
    const prevG = useB ? crushGainA : crushGainB;
    next.curve = curve;
    glide(nextG.gain, 1, false);
    glide(prevG.gain, 0, false);
    crushSlot = useB ? 1 : 0;
  };

  const setFold = (amt: number, snap: boolean) => {
    const key = Math.round(clamp(amt, 0, 1) * 20) / 20;
    if (key === foldKey) return;
    foldKey = key;
    const curve = curveFold(key) as Float32Array<ArrayBuffer>;
    if (snap) {
      foldA.curve = curve;
      foldB.curve = curve;
      foldGainA.gain.value = 1;
      foldGainB.gain.value = 0;
      foldSlot = 0;
      return;
    }
    const useB = foldSlot === 0;
    const next = useB ? foldB : foldA;
    const nextG = useB ? foldGainB : foldGainA;
    const prevG = useB ? foldGainA : foldGainB;
    next.curve = curve;
    glide(nextG.gain, 1, false, false, 0.04);
    glide(prevG.gain, 0, false, false, 0.04);
    foldSlot = useB ? 1 : 0;
  };

  const apply = (p: RackParams, snap: boolean) => {
    const [dry, wet] = eqPower(p.mix);
    glide(dryGain.gain, dry, snap);
    glide(wetGain.gain, wet, snap);
    glide(input.gain, dbToGain(p.inputDb), snap);
    glide(outGain.gain, dbToGain(p.outputDb), snap);

    glide(hpf.frequency, p.hpfOn ? clamp(p.hpfHz, 20, 800) : 20, snap, true);
    glide(hpf.Q, p.hpfOn ? clamp(p.hpfQ, 0.3, 2.5) : 0.707, snap);
    glide(lpf.frequency, p.lpOn ? clamp(p.lpHz, 200, 18000) : 18000, snap, true);
    glide(lpf.Q, p.lpOn ? clamp(p.lpQ, 0.3, 2.5) : 0.707, snap);
    const eq = p.eqOn;
    glide(eqLow.gain, eq ? p.eqLow : 0, snap);
    glide(eqBody.gain, eq ? p.eqBody : 0, snap);
    glide(eqPresence.gain, eq ? p.eqPresence : 0, snap);
    glide(eqAir.gain, eq ? p.eqAir : 0, snap);
    const tilt = p.tiltOn ? clamp(p.tilt, -8, 8) : 0;
    glide(tiltLow.gain, -tilt, snap);
    glide(tiltHigh.gain, tilt, snap);
    glide(bell.frequency, clamp(p.bellHz, 80, 12000), snap, true);
    glide(bell.Q, clamp(p.bellQ, 0.4, 8), snap);
    glide(bell.gain, p.bellOn ? clamp(p.bellDb, -12, 12) : 0, snap);

    glide(pGate, p.gateOn ? 1 : 0, snap);
    glide(pThresh, dbToGain(clamp(p.gateThresh, -60, -8)), snap);
    const floor = Math.pow(10, (-48 * clamp(p.gateRange, 0, 1)) / 20);
    glide(pFloor, p.gateOn ? floor : 1, snap);
    glide(pAttack, clamp(p.gateAttack, 0.0005, 0.05), snap);
    glide(pRelease, clamp(p.gateRelease, 0.02, 0.45), snap);
    glide(pHold, p.reduxOn ? clamp(Math.round(p.reduxHold), 2, 24) : 1, snap);

    const deessHzV = clamp(p.deessHz, 2500, 12000);
    glide(bpSub.frequency, deessHzV, snap, true);
    glide(bpComp.frequency, deessHzV, snap, true);
    const deess = p.deessOn ? clamp(p.deessAmt, 0, 1) : 0;
    glide(deessCut.gain, -deess, snap);
    glide(deessAdd.gain, deess, snap);

    if (p.compOn) {
      glide(comp.threshold, clamp(p.compThresh, -48, 0), snap);
      glide(comp.ratio, clamp(p.compRatio, 1, 20), snap);
      glide(comp.attack, clamp(p.compAttack, 0.001, 0.4), snap);
      glide(comp.release, clamp(p.compRelease, 0.02, 0.8), snap);
      glide(compMakeup.gain, dbToGain(p.compMakeup), snap);
    } else {
      glide(comp.threshold, 0, snap);
      glide(comp.ratio, 1, snap);
      glide(comp.attack, 0.01, snap);
      glide(comp.release, 0.1, snap);
      glide(compMakeup.gain, 1, snap);
    }

    const punch = p.punchOn ? clamp(p.punch, 0, 1) : 0;
    glide(punchComp.attack, clamp(p.punchAttack, 0.001, 0.08), snap);
    glide(punchUp.gain, 1 + punch, snap);
    glide(punchDown.gain, -punch, snap);

    const drive = 1 + clamp(p.satDrive, 0, 1) * 7;
    glide(satPre.gain, drive, snap);
    glide(satPost.gain, 1 / Math.pow(drive, 0.7), snap);
    glide(satTone.frequency, 1400 + clamp(p.satTone, 0, 1) * 15000, snap, true);
    blend(satDry, satWet, p.satOn ? p.satMix : 0, snap);

    const foldAmt = p.foldOn ? clamp(p.foldAmt, 0, 1) : 0;
    setFold(foldAmt, snap);
    blend(foldDry, foldWet, foldAmt, snap);

    setCrush(p.crushOn ? p.crushBits : 16, snap);
    blend(crushDry, crushWet, p.crushOn ? p.crushMix : 0, snap);

    const exc = p.excOn ? clamp(p.excAmt, 0, 1) : 0;
    const excHz = clamp(p.excFreq, 2000, 12000);
    glide(excHp.frequency, excHz, snap, true);
    glide(excHp2.frequency, Math.max(1800, excHz * 0.77), snap, true);
    glide(excPre.gain, 1 + exc * 6, snap);
    glide(excWet.gain, exc * 0.32, snap);

    glide(chLfo.frequency, clamp(p.chorusRate, 0.05, 4), snap);
    const chDepth = (p.chorusOn ? clamp(p.chorusDepth, 0, 1) : 0) * 0.005;
    glide(chDepthL.gain, chDepth, snap);
    glide(chDepthR.gain, chDepth * 1.15, snap);
    blend(chDry, chWet, p.chorusOn ? p.chorusMix : 0, snap);

    glide(flLfo.frequency, clamp(p.flangeRate, 0.05, 4), snap);
    glide(flDepth.gain, p.flangeOn ? clamp(p.flangeDepth, 0, 1) * 0.0016 : 0, snap);
    glide(flFb.gain, p.flangeOn ? Math.min(0.55, p.flangeFb) : 0, snap);
    blend(flDry, flWet, p.flangeOn ? p.flangeMix : 0, snap);

    glide(phLfo.frequency, clamp(p.phaserRate, 0.05, 3), snap);
    glide(phDepth.gain, p.phaserOn ? clamp(p.phaserDepth, 0, 1) * 900 : 0, snap);
    for (const stage of ph) glide(stage.frequency, 900, snap, true);
    blend(phDry, phWet, p.phaserOn ? p.phaserMix : 0, snap);

    const add = (p.panOn ? clamp(p.panDepth, 0, 1) : 0) * 0.42;
    glide(panLfo.frequency, clamp(p.panRate, 0.05, 8), snap);
    glide(panL.gain, 1 - add, snap);
    glide(panR.gain, 1 - add, snap);
    glide(panDepthL.gain, add, snap);
    glide(panDepthR.gain, add, snap);

    const tremDepthAmt = p.tremOn ? clamp(p.tremDepth, 0, 0.9) : 0;
    glide(trem.gain, 1 - tremDepthAmt * 0.5, snap);
    glide(tremDepth.gain, tremDepthAmt * 0.5, snap);
    glide(tremLfo.frequency, clamp(p.tremRate, 0.2, 12), snap);

    const ms = clamp(p.delayMs, 20, 900) / 1000;
    glide(dlyL.delayTime, ms, snap);
    glide(dlyR.delayTime, Math.min(1.1, ms * 1.33), snap);
    const tone = clamp(p.delayTone, 800, 14000);
    glide(dlyFiltL.frequency, tone, snap, true);
    glide(dlyFiltR.frequency, tone, snap, true);
    const fb = p.delayOn ? Math.min(0.72, p.delayFb) : 0;
    glide(dlyFbL.gain, fb, snap);
    glide(dlyFbR.gain, fb, snap);
    blend(dlyDry, dlyWet, p.delayOn ? p.delayMix : 0, snap);

    setVerb(clamp(p.verbSize, 0, 1), clamp(p.verbDamp, 0, 1), snap);
    glide(preDelay.delayTime, clamp(p.verbPre, 0, 0.08), snap);
    blend(verbDry, verbWet, p.verbOn ? p.verbMix : 0, snap);

    glide(wowLfo.frequency, clamp(p.wowRate, 0.08, 2.5), snap);
    glide(wowDepth.gain, p.wowOn ? clamp(p.wowDepth, 0, 1) * 0.0018 : 0, snap);
    blend(wowDry, wowWet, p.wowOn ? p.wowMix : 0, snap);

    glide(side.gain, p.widthOn ? clamp(p.width, 0, 2) : 1, snap);

    if (p.limitOn) {
      glide(limiter.threshold, clamp(p.limitDb, -8, -0.2), snap);
      glide(limiter.ratio, 20, snap);
      glide(limiter.release, clamp(p.limitRelease, 0.02, 0.3), snap);
    } else {
      glide(limiter.threshold, 0, snap);
      glide(limiter.ratio, 1, snap);
      glide(limiter.release, 0.08, snap);
    }
  };

  for (const osc of oscs) osc.start();

  return {
    input,
    output: outputMeter,
    inputMeter,
    outputMeter,
    apply,
    dispose: () => {
      for (const osc of oscs) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
        osc.disconnect();
      }
    },
  };
}

function tailSeconds(p: RackParams) {
  let tail = 0.04;
  if (p.delayOn) tail += (p.delayMs / 1000) * (1 + Math.min(0.72, p.delayFb) * 5);
  if (p.verbOn) tail += 0.25 + p.verbSize * 2.5;
  return Math.min(5.5, tail);
}

export async function printRack(clip: AudioClip, params: RackParams): Promise<AudioClip> {
  const rate = clip.sampleRate || 44100;
  const dur = Math.max(0.05, clip.duration);
  const tail = tailSeconds(params);
  const length = Math.max(1, Math.ceil((dur + tail) * rate));
  const ctx = new OfflineAudioContext(2, length, rate);
  const chain = await createChain(ctx);
  chain.apply(params, true);
  const src = ctx.createBufferSource();
  src.buffer = stereoBuffer(ctx, clip);
  const edge = ctx.createGain();
  src.connect(edge);
  edge.connect(chain.input);
  chain.output.connect(ctx.destination);
  const fade = Math.min(0.008, dur / 5);
  edge.gain.setValueAtTime(0, 0);
  edge.gain.linearRampToValueAtTime(1, fade);
  edge.gain.setValueAtTime(1, Math.max(fade, dur - 0.012));
  edge.gain.linearRampToValueAtTime(0, dur);
  src.start(0);
  const rendered = await ctx.startRendering();
  chain.dispose();
  const channels: Float32Array[] = [];
  for (let c = 0; c < rendered.numberOfChannels; c++) {
    channels.push(new Float32Array(rendered.getChannelData(c)));
  }
  return makeClip(`${clip.name}_fx`, rendered.sampleRate, channels);
}

export class FxRack {
  private ctx: AudioContext | null = null;
  private chain: Chain | null = null;
  private fade: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private clip: AudioClip | null = null;
  private buffer: AudioBuffer | null = null;
  private params: RackParams = { ...RACK_INIT };
  private offset = 0;
  private startedAt = 0;
  private playing = false;
  private loop = true;
  private gen = 0;
  private spec = new Uint8Array(1024);
  private tin = new Float32Array(2048);
  private tout = new Float32Array(2048);
  private boot: Promise<void> | null = null;
  private dead = false;

  get isPlaying() {
    return this.playing;
  }

  get sampleRate() {
    return this.ctx?.sampleRate ?? 48000;
  }

  get position() {
    if (!this.playing || !this.clip || !this.ctx) return this.offset;
    const t = this.offset + (this.ctx.currentTime - this.startedAt);
    const dur = this.clip.duration;
    if (this.loop && dur > 0) return t % dur;
    return Math.min(dur, Math.max(0, t));
  }

  setLoop(loop: boolean) {
    this.loop = loop;
    if (this.playing) {
      this.offset = this.position;
      void this.play();
    }
  }

  setClip(clip: AudioClip | null) {
    this.clip = clip;
    this.offset = 0;
    this.buffer = null;
    if (!clip) {
      this.stop();
      return;
    }
    this.ensure();
    if (this.ctx) this.buffer = stereoBuffer(this.ctx, clip);
    if (this.playing) void this.play();
  }

  setParams(params: RackParams) {
    this.params = params;
    this.chain?.apply(params, false);
  }

  async play() {
    if (!this.clip) return;
    this.ensure();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    if (this.boot) await this.boot;
    const ctx = this.ctx;
    const fade = this.fade;
    if (!ctx || !fade || !this.buffer) return;
    if (ctx.state === "suspended") await ctx.resume();
    const gen = ++this.gen;
    if (this.source) {
      const now = ctx.currentTime;
      fade.gain.cancelScheduledValues(now);
      fade.gain.setValueAtTime(Math.max(0, fade.gain.value), now);
      fade.gain.linearRampToValueAtTime(0, now + 0.008);
      await new Promise((resolve) => setTimeout(resolve, 12));
      if (this.gen !== gen) return;
    }
    this.stopSource();
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = this.loop;
    src.connect(this.chain!.input);
    const dur = this.clip.duration;
    const offset = clamp(this.offset, 0, Math.max(0, dur - 0.01));
    this.offset = offset;
    src.start(0, offset);
    this.source = src;
    this.startedAt = ctx.currentTime;
    this.playing = true;
    const now = ctx.currentTime;
    fade.gain.cancelScheduledValues(now);
    fade.gain.setValueAtTime(fade.gain.value, now);
    fade.gain.linearRampToValueAtTime(1, now + 0.012);
    src.onended = () => {
      if (this.source !== src || this.loop) return;
      this.playing = false;
      this.offset = this.clip?.duration ?? 0;
    };
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.position;
    this.playing = false;
    this.fadeOutAndStop();
  }

  stop() {
    this.offset = 0;
    this.playing = false;
    this.fadeOutAndStop();
  }

  seek(time: number) {
    const dur = this.clip?.duration ?? 0;
    this.offset = clamp(time, 0, dur);
    if (this.playing) void this.play();
  }

  readSpectrum() {
    const meter = this.chain?.inputMeter;
    if (!meter) {
      this.spec.fill(0);
      return this.spec;
    }
    meter.getByteFrequencyData(this.spec);
    return this.spec;
  }

  readMeters() {
    let inn = 0;
    let out = 0;
    const inputMeter = this.chain?.inputMeter;
    const outputMeter = this.chain?.outputMeter;
    if (inputMeter) {
      inputMeter.getFloatTimeDomainData(this.tin);
      for (let i = 0; i < this.tin.length; i++) inn = Math.max(inn, Math.abs(this.tin[i] ?? 0));
    }
    if (outputMeter) {
      outputMeter.getFloatTimeDomainData(this.tout);
      for (let i = 0; i < this.tout.length; i++) out = Math.max(out, Math.abs(this.tout[i] ?? 0));
    }
    return { inn, out };
  }

  dispose() {
    this.dead = true;
    this.gen += 1;
    this.stopSource();
    try {
      this.fade?.disconnect();
    } catch {
      /* already gone */
    }
    this.chain?.dispose();
    this.chain = null;
    this.fade = null;
    this.playing = false;
  }

  private ensure() {
    if (this.chain || this.boot) return;
    const ctx = getAudioContext();
    this.ctx = ctx;
    this.boot = (async () => {
      const chain = await createChain(ctx);
      if (this.dead) {
        chain.dispose();
        return;
      }
      const fade = ctx.createGain();
      fade.gain.value = 0;
      chain.output.connect(fade);
      fade.connect(ctx.destination);
      this.chain = chain;
      this.fade = fade;
      chain.apply(this.params, true);
      if (this.clip) this.buffer = stereoBuffer(ctx, this.clip);
    })().finally(() => {
      this.boot = null;
    });
  }

  private stopSource() {
    const src = this.source;
    this.source = null;
    if (!src) return;
    try {
      src.onended = null;
      src.stop();
    } catch {
      /* not started */
    }
    try {
      src.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  private fadeOutAndStop() {
    const fade = this.fade;
    const ctx = this.ctx;
    const gen = ++this.gen;
    const src = this.source;
    if (fade && ctx) {
      const now = ctx.currentTime;
      fade.gain.cancelScheduledValues(now);
      fade.gain.setValueAtTime(Math.max(0, fade.gain.value), now);
      fade.gain.linearRampToValueAtTime(0, now + 0.02);
    }
    window.setTimeout(() => {
      if (this.gen !== gen) return;
      if (src && this.source === src) this.stopSource();
    }, 28);
  }
}

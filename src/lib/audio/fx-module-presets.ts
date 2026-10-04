import type { RackParams } from "./fx-rack";

export type ModulePreset = {
  id: string;
  name: string;
  who: string;
  params: Partial<RackParams>;
};

type PowerKey = {
  [K in keyof RackParams]: RackParams[K] extends boolean ? K : never;
}[keyof RackParams];

const WHO = ["DIY", "Podcast", "Vlog", "Rap", "Beat", "Producer"] as const;

function six(
  power: PowerKey,
  rows: [string, string, Partial<RackParams>][],
): ModulePreset[] {
  return rows.map((row, i) => ({
    id: row[0],
    name: row[1],
    who: WHO[i] ?? "DIY",
    params: { ...row[2], [power]: true },
  }));
}

/** Six starting points per module. Order is DIY, Podcast, Vlog, Rap, Beat, Producer. */
export const MODULE_PRESETS: Record<string, ModulePreset[]> = {
  hpf: six("hpfOn", [
    ["rumble", "Rumble trim", { hpfHz: 40, hpfQ: 0.7 }],
    ["voice", "Desk rumble", { hpfHz: 90, hpfQ: 0.8 }],
    ["room", "Room boom", { hpfHz: 120, hpfQ: 0.9 }],
    ["pocket", "Vocal low", { hpfHz: 80, hpfQ: 0.7 }],
    ["sub", "Keep the sub", { hpfHz: 28, hpfQ: 0.5 }],
    ["tight", "Tight HPF", { hpfHz: 70, hpfQ: 1.2 }],
  ]),
  lp: six("lpOn", [
    ["harsh", "Harsh lid", { lpHz: 12000, lpQ: 0.7 }],
    ["speech", "Speech lid", { lpHz: 8000, lpQ: 0.85 }],
    ["phone", "Camera air", { lpHz: 10000, lpQ: 0.7 }],
    ["dark", "Dark vocal", { lpHz: 9000, lpQ: 0.8 }],
    ["lofi", "Lo-fi lid", { lpHz: 6200, lpQ: 1.1 }],
    ["air", "Gentle air", { lpHz: 16000, lpQ: 0.5 }],
  ]),
  eq: six("eqOn", [
    ["polish", "Gentle polish", { eqLow: 1.5, eqBody: 0, eqPresence: 1, eqAir: 2 }],
    ["voice", "Voice body", { eqLow: 1, eqBody: 2, eqPresence: 2.5, eqAir: -1 }],
    ["clear", "On-camera", { eqLow: 0.5, eqBody: -1.5, eqPresence: 3, eqAir: 1.5 }],
    ["pocket", "Vocal pocket", { eqLow: 1, eqBody: -2, eqPresence: 2.5, eqAir: 1.5 }],
    ["snap", "Drum snap", { eqLow: 3, eqBody: -2, eqPresence: 2, eqAir: 1.2 }],
    ["glue", "Mix glue", { eqLow: 1.2, eqBody: -0.8, eqPresence: 1, eqAir: 1.5 }],
  ]),
  tilt: six("tiltOn", [
    ["bright", "A bit bright", { tilt: 2 }],
    ["words", "Word clarity", { tilt: 3.2 }],
    ["dull", "Fix a dull cam", { tilt: 2.5 }],
    ["modern", "Modern vocal", { tilt: 1.8 }],
    ["tape", "Dark tape", { tilt: -2.4 }],
    ["master", "Master tilt", { tilt: 1.2 }],
  ]),
  bell: six("bellOn", [
    ["box", "Box cut", { bellHz: 400, bellDb: -3, bellQ: 1.4 }],
    ["nasal", "Nasal cut", { bellHz: 1200, bellDb: -2.5, bellQ: 2 }],
    ["room", "Room tone", { bellHz: 250, bellDb: -3.5, bellQ: 1.1 }],
    ["honk", "Honk cut", { bellHz: 800, bellDb: -3, bellQ: 1.8 }],
    ["ring", "Snare ring", { bellHz: 3400, bellDb: 2.2, bellQ: 2.2 }],
    ["sweet", "Presence sweet", { bellHz: 3200, bellDb: 1.8, bellQ: 1.1 }],
  ]),
  width: six("widthOn", [
    ["wide", "A bit wide", { width: 1.25 }],
    ["mono", "Mono safe", { width: 0.85 }],
    ["phone", "Phone stereo", { width: 1.15 }],
    ["center", "Vocal center", { width: 0.9 }],
    ["beat", "Beat wide", { width: 1.55 }],
    ["sides", "Master sides", { width: 1.35 }],
  ]),
  deess: six("deessOn", [
    ["soft", "Soft esses", { deessHz: 7000, deessAmt: 0.4 }],
    ["speech", "Spoken S", { deessHz: 6500, deessAmt: 0.7 }],
    ["close", "Close mic", { deessHz: 7200, deessAmt: 0.55 }],
    ["adlib", "Adlib S", { deessHz: 8000, deessAmt: 0.45 }],
    ["hats", "Tame hats", { deessHz: 9000, deessAmt: 0.3 }],
    ["clear", "Transparent", { deessHz: 6800, deessAmt: 0.35 }],
  ]),
  comp: six("compOn", [
    ["light", "Light level", { compThresh: -16, compRatio: 2.5, compAttack: 0.02, compRelease: 0.14, compMakeup: 1 }],
    ["spoken", "Spoken level", { compThresh: -22, compRatio: 4, compAttack: 0.008, compRelease: 0.12, compMakeup: 4 }],
    ["talk", "Talking head", { compThresh: -18, compRatio: 3.2, compAttack: 0.012, compRelease: 0.14, compMakeup: 2.5 }],
    ["ride", "Vocal ride", { compThresh: -18, compRatio: 3.5, compAttack: 0.006, compRelease: 0.1, compMakeup: 2.5 }],
    ["drums", "Drum bus", { compThresh: -14, compRatio: 2.8, compAttack: 0.015, compRelease: 0.16, compMakeup: 1.5 }],
    ["glue", "Bus glue", { compThresh: -12, compRatio: 2, compAttack: 0.03, compRelease: 0.2, compMakeup: 1 }],
  ]),
  punch: six("punchOn", [
    ["snap", "Light snap", { punch: 0.35, punchAttack: 0.02 }],
    ["words", "Word start", { punch: 0.25, punchAttack: 0.008 }],
    ["hit", "On-camera hit", { punch: 0.4, punchAttack: 0.015 }],
    ["attack", "Vocal attack", { punch: 0.5, punchAttack: 0.01 }],
    ["trans", "Transient", { punch: 0.7, punchAttack: 0.004 }],
    ["hint", "Subtle punch", { punch: 0.22, punchAttack: 0.03 }],
  ]),
  gate: six("gateOn", [
    ["floor", "Noise floor", { gateThresh: -42, gateRange: 0.7, gateAttack: 0.008, gateRelease: 0.12 }],
    ["breath", "Breaths down", { gateThresh: -38, gateRange: 0.85, gateAttack: 0.004, gateRelease: 0.08 }],
    ["room", "Room noise", { gateThresh: -36, gateRange: 0.75, gateAttack: 0.006, gateRelease: 0.14 }],
    ["tight", "Tight vocal", { gateThresh: -40, gateRange: 0.8, gateAttack: 0.003, gateRelease: 0.06 }],
    ["drum", "Drum gate", { gateThresh: -32, gateRange: 0.92, gateAttack: 0.001, gateRelease: 0.05 }],
    ["gentle", "Gentle gate", { gateThresh: -48, gateRange: 0.45, gateAttack: 0.01, gateRelease: 0.2 }],
  ]),
  limit: six("limitOn", [
    ["safe", "Safe ceiling", { limitDb: -1, limitRelease: 0.08 }],
    ["speech", "Speech loud", { limitDb: -1.5, limitRelease: 0.06 }],
    ["platform", "Platform", { limitDb: -1, limitRelease: 0.05 }],
    ["vocal", "Vocal ceiling", { limitDb: -1.2, limitRelease: 0.04 }],
    ["smash", "Drum ceiling", { limitDb: -0.6, limitRelease: 0.03 }],
    ["master", "Master ceiling", { limitDb: -1, limitRelease: 0.12 }],
  ]),
  sat: six("satOn", [
    ["warm", "Warm tape", { satDrive: 0.28, satTone: 0.45, satMix: 0.55 }],
    ["grit", "Voice grit", { satDrive: 0.18, satTone: 0.6, satMix: 0.4 }],
    ["body", "Camera body", { satDrive: 0.32, satTone: 0.4, satMix: 0.5 }],
    ["dirt", "Vocal dirt", { satDrive: 0.45, satTone: 0.5, satMix: 0.6 }],
    ["drums", "Drum tape", { satDrive: 0.4, satTone: 0.35, satMix: 0.7 }],
    ["console", "Console", { satDrive: 0.16, satTone: 0.55, satMix: 0.35 }],
  ]),
  fold: six("foldOn", [
    ["light", "Light fold", { foldAmt: 0.28 }],
    ["hint", "Speech edge", { foldAmt: 0.12 }],
    ["edge", "Cam edge", { foldAmt: 0.22 }],
    ["adlib", "Adlib fold", { foldAmt: 0.48 }],
    ["bass", "Bass fold", { foldAmt: 0.62 }],
    ["par", "Parallel fold", { foldAmt: 0.35 }],
  ]),
  crush: six("crushOn", [
    ["soft", "Soft bits", { crushBits: 12, crushMix: 0.45 }],
    ["hint", "Barely crushed", { crushBits: 13, crushMix: 0.2 }],
    ["retro", "Retro cam", { crushBits: 11, crushMix: 0.55 }],
    ["grit", "808 grit", { crushBits: 9, crushMix: 0.4 }],
    ["lofi", "Lo-fi", { crushBits: 8, crushMix: 0.85 }],
    ["color", "Bit color", { crushBits: 14, crushMix: 0.25 }],
  ]),
  redux: six("reduxOn", [
    ["light", "Light steps", { reduxHold: 3 }],
    ["hint", "Almost clean", { reduxHold: 2 }],
    ["stutter", "Stutter hint", { reduxHold: 5 }],
    ["chop", "Vocal chop", { reduxHold: 8 }],
    ["glitch", "Beat glitch", { reduxHold: 14 }],
    ["texture", "Texture", { reduxHold: 4 }],
  ]),
  exc: six("excOn", [
    ["air", "DIY air", { excAmt: 0.3, excFreq: 8000 }],
    ["clear", "Speech clear", { excAmt: 0.22, excFreq: 5000 }],
    ["detail", "Cam detail", { excAmt: 0.35, excFreq: 7000 }],
    ["sheen", "Vocal sheen", { excAmt: 0.4, excFreq: 9000 }],
    ["hats", "Hat sparkle", { excAmt: 0.28, excFreq: 10000 }],
    ["master", "Master air", { excAmt: 0.18, excFreq: 11000 }],
  ]),
  pan: six("panOn", [
    ["drift", "Slow drift", { panRate: 0.2, panDepth: 0.25 }],
    ["still", "Stay centered", { panRate: 0.15, panDepth: 0.08 }],
    ["move", "Gentle move", { panRate: 0.35, panDepth: 0.3 }],
    ["adlib", "Adlib sweep", { panRate: 0.8, panDepth: 0.55 }],
    ["perc", "Perc motion", { panRate: 1.6, panDepth: 0.7 }],
    ["wide", "Wide motion", { panRate: 0.25, panDepth: 0.4 }],
  ]),
  trem: six("tremOn", [
    ["soft", "Soft pulse", { tremRate: 3, tremDepth: 0.25 }],
    ["still", "Almost still", { tremRate: 1.5, tremDepth: 0.08 }],
    ["emph", "Emphasis", { tremRate: 2.2, tremDepth: 0.3 }],
    ["chop", "Chop feel", { tremRate: 5.5, tremDepth: 0.45 }],
    ["pump", "Level pump", { tremRate: 4, tremDepth: 0.55 }],
    ["vintage", "Vintage", { tremRate: 2.8, tremDepth: 0.2 }],
  ]),
  chorus: six("chorusOn", [
    ["wide", "Wide vocal", { chorusRate: 0.3, chorusDepth: 0.35, chorusMix: 0.2 }],
    ["thick", "Slight thick", { chorusRate: 0.15, chorusDepth: 0.12, chorusMix: 0.08 }],
    ["guitar", "Cam guitar", { chorusRate: 0.4, chorusDepth: 0.4, chorusMix: 0.25 }],
    ["double", "Doubler", { chorusRate: 0.2, chorusDepth: 0.25, chorusMix: 0.18 }],
    ["pad", "Pad wash", { chorusRate: 0.12, chorusDepth: 0.7, chorusMix: 0.4 }],
    ["hint", "Subtle chorus", { chorusRate: 0.25, chorusDepth: 0.2, chorusMix: 0.12 }],
  ]),
  flange: six("flangeOn", [
    ["light", "Light jet", { flangeRate: 0.18, flangeDepth: 0.4, flangeFb: 0.2, flangeMix: 0.25 }],
    ["tiny", "Tiny move", { flangeRate: 0.08, flangeDepth: 0.15, flangeFb: 0.1, flangeMix: 0.08 }],
    ["whoosh", "Whoosh", { flangeRate: 0.3, flangeDepth: 0.55, flangeFb: 0.25, flangeMix: 0.35 }],
    ["throw", "Vocal throw", { flangeRate: 0.12, flangeDepth: 0.5, flangeFb: 0.35, flangeMix: 0.3 }],
    ["jet", "Drum jet", { flangeRate: 0.22, flangeDepth: 0.75, flangeFb: 0.45, flangeMix: 0.4 }],
    ["hint", "Soft flange", { flangeRate: 0.1, flangeDepth: 0.35, flangeFb: 0.22, flangeMix: 0.18 }],
  ]),
  phaser: six("phaserOn", [
    ["wash", "Slow wash", { phaserRate: 0.12, phaserDepth: 0.55, phaserMix: 0.35 }],
    ["hint", "Barely there", { phaserRate: 0.08, phaserDepth: 0.25, phaserMix: 0.1 }],
    ["move", "Cam motion", { phaserRate: 0.25, phaserDepth: 0.6, phaserMix: 0.3 }],
    ["vocal", "Vocal phase", { phaserRate: 0.15, phaserDepth: 0.7, phaserMix: 0.28 }],
    ["sweep", "Synth sweep", { phaserRate: 0.4, phaserDepth: 0.85, phaserMix: 0.45 }],
    ["sheen", "Master sheen", { phaserRate: 0.08, phaserDepth: 0.4, phaserMix: 0.15 }],
  ]),
  delay: six("delayOn", [
    ["slap", "Slap", { delayMs: 90, delayFb: 0.15, delayMix: 0.18, delayTone: 5000 }],
    ["room", "Room slap", { delayMs: 60, delayFb: 0.08, delayMix: 0.1, delayTone: 3500 }],
    ["throw", "Throw", { delayMs: 180, delayFb: 0.28, delayMix: 0.22, delayTone: 4500 }],
    ["eighth", "Vocal eighth", { delayMs: 280, delayFb: 0.35, delayMix: 0.28, delayTone: 5500 }],
    ["dub", "Dub throw", { delayMs: 360, delayFb: 0.5, delayMix: 0.32, delayTone: 3200 }],
    ["note", "Short note", { delayMs: 220, delayFb: 0.28, delayMix: 0.18, delayTone: 6000 }],
  ]),
  verb: six("verbOn", [
    ["room", "Small room", { verbSize: 0.28, verbDamp: 0.55, verbMix: 0.16, verbPre: 0.012 }],
    ["booth", "Tight booth", { verbSize: 0.18, verbDamp: 0.7, verbMix: 0.08, verbPre: 0.008 }],
    ["live", "Living room", { verbSize: 0.4, verbDamp: 0.5, verbMix: 0.2, verbPre: 0.02 }],
    ["plate", "Vocal plate", { verbSize: 0.55, verbDamp: 0.45, verbMix: 0.22, verbPre: 0.028 }],
    ["snare", "Snare room", { verbSize: 0.32, verbDamp: 0.4, verbMix: 0.18, verbPre: 0.01 }],
    ["mix", "Mix plate", { verbSize: 0.62, verbDamp: 0.55, verbMix: 0.14, verbPre: 0.024 }],
  ]),
  wow: six("wowOn", [
    ["drift", "Light drift", { wowRate: 0.35, wowDepth: 0.3, wowMix: 0.4 }],
    ["stable", "Almost stable", { wowRate: 0.2, wowDepth: 0.08, wowMix: 0.15 }],
    ["hand", "Handheld", { wowRate: 0.5, wowDepth: 0.35, wowMix: 0.3 }],
    ["tape", "Tape vocal", { wowRate: 0.4, wowDepth: 0.45, wowMix: 0.5 }],
    ["vinyl", "Vinyl", { wowRate: 0.28, wowDepth: 0.6, wowMix: 0.7 }],
    ["master", "Master tape", { wowRate: 0.22, wowDepth: 0.2, wowMix: 0.25 }],
  ]),
};

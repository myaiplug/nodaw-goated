import { o as __toESM } from "../_runtime.mjs";
import { i as makeClip } from "./types-DyJMjOBu.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
import { c as dbToGain } from "./dsp-23YL4nsk.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { c as encodeWav, h as useLabStore, i as Waveform, m as unlockAudio, n as ToolHeader, o as downloadBlob, p as getAudioContext, r as TransportBar, t as DropZone } from "./tool-header-Ud05aUy4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fx-BMBFaYw7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Live FxIT rack. Native Web Audio, parameter glides, and one sample-accurate
* worklet for the gate and sample-hold. Saturation, fold, and the safety
* ceiling run at 4x. Dry is delayed to the compressor look-ahead so the mix
* knob does not comb. Print uses the same chain on an OfflineAudioContext.
*/
var LOOK = .006;
var ALIGN = LOOK * 4;
var RACK_INIT = {
	mix: 1,
	inputDb: 0,
	outputDb: 0,
	hpfOn: false,
	hpfHz: 30,
	hpfQ: .707,
	lpOn: false,
	lpHz: 16e3,
	lpQ: .707,
	eqOn: false,
	eqLow: 0,
	eqBody: 0,
	eqPresence: 0,
	eqAir: 0,
	deessOn: false,
	deessHz: 6800,
	deessAmt: .55,
	compOn: false,
	compThresh: -18,
	compRatio: 3,
	compAttack: .012,
	compRelease: .14,
	compMakeup: 1.5,
	punchOn: false,
	punch: .45,
	punchAttack: .025,
	satOn: false,
	satDrive: .35,
	satTone: .55,
	satMix: .65,
	crushOn: false,
	crushBits: 12,
	crushMix: .7,
	excOn: false,
	excAmt: .35,
	excFreq: 6500,
	chorusOn: false,
	chorusRate: .35,
	chorusDepth: .4,
	chorusMix: .28,
	phaserOn: false,
	phaserRate: .18,
	phaserDepth: .72,
	phaserMix: .35,
	delayOn: false,
	delayMs: 220,
	delayFb: .32,
	delayTone: 4200,
	delayMix: .22,
	verbOn: false,
	verbSize: .45,
	verbDamp: .5,
	verbPre: .018,
	verbMix: .22,
	widthOn: false,
	width: 1.35,
	panOn: false,
	panRate: .35,
	panDepth: .45,
	tiltOn: false,
	tilt: 0,
	bellOn: false,
	bellHz: 1200,
	bellDb: 0,
	bellQ: 1.2,
	gateOn: false,
	gateThresh: -36,
	gateRange: .82,
	gateAttack: .004,
	gateRelease: .1,
	reduxOn: false,
	reduxHold: 6,
	foldOn: false,
	foldAmt: .45,
	flangeOn: false,
	flangeRate: .22,
	flangeDepth: .55,
	flangeFb: .32,
	flangeMix: .35,
	tremOn: false,
	tremRate: 3.2,
	tremDepth: .45,
	wowOn: false,
	wowRate: .42,
	wowDepth: .4,
	wowMix: .55,
	limitOn: false,
	limitDb: -1,
	limitRelease: .08
};
var RACK_GROUPS = [
	{
		id: "bus",
		label: "Bus"
	},
	{
		id: "vocal",
		label: "Vocal"
	},
	{
		id: "drum",
		label: "Drums"
	},
	{
		id: "bass",
		label: "Bass"
	},
	{
		id: "space",
		label: "Space"
	}
];
var RACK_PRESETS = [
	{
		id: "tape",
		name: "Tape",
		blurb: "Soft 4x, lid on the air.",
		group: "bus",
		params: {
			satOn: true,
			satDrive: .32,
			satTone: .42,
			satMix: .75,
			lpOn: true,
			lpHz: 12e3,
			eqOn: true,
			eqLow: 1.2,
			eqAir: -2.2
		}
	},
	{
		id: "glue",
		name: "808 Glue",
		blurb: "Low bump, bus comp, ceiling.",
		group: "bus",
		params: {
			eqOn: true,
			eqLow: 3.2,
			eqBody: -1,
			compOn: true,
			compThresh: -20,
			compRatio: 4,
			compAttack: .01,
			compRelease: .16,
			compMakeup: 2,
			satOn: true,
			satDrive: .22,
			satMix: .45,
			limitOn: true,
			limitDb: -1
		}
	},
	{
		id: "radio",
		name: "Radio",
		blurb: "Speaker band, fast squeeze.",
		group: "bus",
		params: {
			hpfOn: true,
			hpfHz: 380,
			lpOn: true,
			lpHz: 3200,
			compOn: true,
			compThresh: -22,
			compRatio: 6,
			compAttack: .004,
			compRelease: .08,
			compMakeup: 3,
			satOn: true,
			satDrive: .4,
			satMix: .6
		}
	},
	{
		id: "lofi",
		name: "Lo-Fi",
		blurb: "12-bit, dark lid, slow move.",
		group: "bus",
		params: {
			crushOn: true,
			crushBits: 10,
			crushMix: .85,
			lpOn: true,
			lpHz: 6200,
			eqOn: true,
			eqLow: 1.5,
			satOn: true,
			satDrive: .25,
			satMix: .4,
			panOn: true,
			panRate: .15,
			panDepth: .2
		}
	},
	{
		id: "phone",
		name: "Telephone",
		blurb: "Narrow band, light grit.",
		group: "bus",
		params: {
			hpfOn: true,
			hpfHz: 340,
			lpOn: true,
			lpHz: 3400,
			satOn: true,
			satDrive: .55,
			satMix: .8,
			compOn: true,
			compThresh: -16,
			compRatio: 4,
			compMakeup: 2
		}
	},
	{
		id: "width",
		name: "Width",
		blurb: "Sides up. Center stays.",
		group: "bus",
		params: {
			widthOn: true,
			width: 1.65,
			eqOn: true,
			eqAir: 1.2
		}
	},
	{
		id: "air",
		name: "Air Lift",
		blurb: "Shelf plus a little exciter.",
		group: "bus",
		params: {
			eqOn: true,
			eqAir: 4.5,
			excOn: true,
			excAmt: .28
		}
	},
	{
		id: "dark",
		name: "Darken",
		blurb: "Close the lid, keep the body.",
		group: "bus",
		params: {
			lpOn: true,
			lpHz: 5200,
			eqOn: true,
			eqLow: 1.6,
			eqAir: -2
		}
	},
	{
		id: "punch",
		name: "Punch",
		blurb: "Attack forward, sustain back.",
		group: "bus",
		params: {
			punchOn: true,
			punch: .62,
			compOn: true,
			compThresh: -16,
			compRatio: 2.5,
			compAttack: .02,
			compRelease: .12,
			compMakeup: .5
		}
	},
	{
		id: "clean",
		name: "Clean",
		blurb: "Sub rumble out, gentle ceiling.",
		group: "bus",
		params: {
			hpfOn: true,
			hpfHz: 32,
			limitOn: true,
			limitDb: -1
		}
	},
	{
		id: "vinyl",
		name: "Vinyl",
		blurb: "Dull top, warm low, slow chorus.",
		group: "bus",
		params: {
			lpOn: true,
			lpHz: 9e3,
			eqOn: true,
			eqLow: 1.8,
			satOn: true,
			satDrive: .2,
			satMix: .45,
			chorusOn: true,
			chorusRate: .18,
			chorusDepth: .22,
			chorusMix: .12
		}
	},
	{
		id: "night",
		name: "Night Bus",
		blurb: "Club low end, glued, limited.",
		group: "bus",
		params: {
			hpfOn: true,
			hpfHz: 28,
			eqOn: true,
			eqLow: 3,
			eqBody: -1.2,
			compOn: true,
			compThresh: -18,
			compRatio: 3.5,
			compMakeup: 2,
			limitOn: true,
			limitDb: -.8
		}
	},
	{
		id: "crystal",
		name: "Crystal",
		blurb: "HPF, de-ess, light air.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 80,
			deessOn: true,
			deessHz: 7e3,
			deessAmt: .6,
			compOn: true,
			compThresh: -18,
			compRatio: 2.6,
			compAttack: .008,
			compRelease: .12,
			compMakeup: 2,
			eqOn: true,
			eqAir: 2,
			limitOn: true,
			limitDb: -1.5
		}
	},
	{
		id: "presence",
		name: "Presence",
		blurb: "3 kHz and air, then a lid.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 70,
			eqOn: true,
			eqPresence: 3.5,
			eqAir: 2.2,
			eqBody: -1,
			deessOn: true,
			deessAmt: .4,
			compOn: true,
			compThresh: -16,
			compRatio: 3,
			compMakeup: 1.5,
			limitOn: true,
			limitDb: -1.2
		}
	},
	{
		id: "lush",
		name: "Lush Verb",
		blurb: "Plate and a slow chorus.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 90,
			verbOn: true,
			verbSize: .62,
			verbDamp: .45,
			verbMix: .32,
			chorusOn: true,
			chorusRate: .25,
			chorusDepth: .35,
			chorusMix: .18,
			eqOn: true,
			eqAir: 1
		}
	},
	{
		id: "tight",
		name: "Dry Tight",
		blurb: "Fast ratio, attack up.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 110,
			compOn: true,
			compThresh: -24,
			compRatio: 6,
			compAttack: .003,
			compRelease: .08,
			compMakeup: 4,
			punchOn: true,
			punch: .35,
			deessOn: true,
			deessAmt: .45
		}
	},
	{
		id: "broadcast",
		name: "Broadcast",
		blurb: "Heavy level, de-ess, ceiling.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 80,
			compOn: true,
			compThresh: -24,
			compRatio: 8,
			compAttack: .006,
			compRelease: .1,
			compMakeup: 5,
			deessOn: true,
			deessAmt: .7,
			limitOn: true,
			limitDb: -1,
			eqOn: true,
			eqPresence: 1.5
		}
	},
	{
		id: "kick",
		name: "Punchy Kick",
		blurb: "Sub up, box out.",
		group: "drum",
		params: {
			eqOn: true,
			eqLow: 4.5,
			eqBody: -3.5,
			punchOn: true,
			punch: .55,
			satOn: true,
			satDrive: .28,
			satMix: .4,
			hpfOn: true,
			hpfHz: 28
		}
	},
	{
		id: "snare",
		name: "Crisp Snare",
		blurb: "Body, snap, a little room.",
		group: "drum",
		params: {
			eqOn: true,
			eqPresence: 3.2,
			eqAir: 2.4,
			eqBody: 1.2,
			punchOn: true,
			punch: .4,
			satOn: true,
			satDrive: .3,
			satMix: .35,
			verbOn: true,
			verbSize: .28,
			verbMix: .14,
			verbDamp: .6
		}
	},
	{
		id: "room",
		name: "Room Killer",
		blurb: "Close the wash, keep the hit.",
		group: "drum",
		params: {
			hpfOn: true,
			hpfHz: 70,
			compOn: true,
			compThresh: -20,
			compRatio: 8,
			compAttack: .002,
			compRelease: .06,
			compMakeup: 2,
			punchOn: true,
			punch: .5,
			lpOn: true,
			lpHz: 1e4
		}
	},
	{
		id: "dglue",
		name: "Drum Glue",
		blurb: "2-style bus, tape, limit.",
		group: "drum",
		params: {
			compOn: true,
			compThresh: -16,
			compRatio: 3,
			compAttack: .012,
			compRelease: .18,
			compMakeup: 2,
			satOn: true,
			satDrive: .24,
			satMix: .5,
			limitOn: true,
			limitDb: -.8
		}
	},
	{
		id: "dgrit",
		name: "Lo-Fi Grit",
		blurb: "8-bit and a 4 kHz lid.",
		group: "drum",
		params: {
			crushOn: true,
			crushBits: 8,
			crushMix: 1,
			lpOn: true,
			lpHz: 4200,
			satOn: true,
			satDrive: .35,
			satMix: .4
		}
	},
	{
		id: "sub",
		name: "Sub Focus",
		blurb: "Lid above the note, slow comp.",
		group: "bass",
		params: {
			lpOn: true,
			lpHz: 280,
			hpfOn: true,
			hpfHz: 25,
			compOn: true,
			compThresh: -18,
			compRatio: 4,
			compAttack: .03,
			compRelease: .2,
			compMakeup: 2,
			eqOn: true,
			eqLow: 2
		}
	},
	{
		id: "fuzz",
		name: "Fuzz Box",
		blurb: "Hard 4x, scooped mids.",
		group: "bass",
		params: {
			satOn: true,
			satDrive: .82,
			satTone: .25,
			satMix: 1,
			eqOn: true,
			eqBody: -6,
			eqLow: 2,
			lpOn: true,
			lpHz: 2400
		}
	},
	{
		id: "even",
		name: "Even Dynamics",
		blurb: "High ratio, makeup, ceiling.",
		group: "bass",
		params: {
			compOn: true,
			compThresh: -22,
			compRatio: 8,
			compAttack: .01,
			compRelease: .16,
			compMakeup: 5,
			limitOn: true,
			limitDb: -1,
			hpfOn: true,
			hpfHz: 30
		}
	},
	{
		id: "notes",
		name: "Note Definition",
		blurb: "Growl up, mud down.",
		group: "bass",
		params: {
			eqOn: true,
			eqBody: 3.5,
			eqLow: -1.5,
			eqPresence: 1.5,
			hpfOn: true,
			hpfHz: 35,
			satOn: true,
			satDrive: .2,
			satMix: .3
		}
	},
	{
		id: "rumble",
		name: "Rumble Eater",
		blurb: "High-pass the sub mud.",
		group: "bass",
		params: {
			hpfOn: true,
			hpfHz: 48,
			eqOn: true,
			eqLow: -2.5,
			eqBody: -1
		}
	},
	{
		id: "widen",
		name: "Stereo Widen",
		blurb: "Chorus and sides.",
		group: "space",
		params: {
			widthOn: true,
			width: 1.55,
			chorusOn: true,
			chorusRate: .3,
			chorusDepth: .45,
			chorusMix: .3,
			eqOn: true,
			eqAir: 1.5
		}
	},
	{
		id: "sheen",
		name: "Sheen",
		blurb: "Exciter, air, de-ess, ceiling.",
		group: "space",
		params: {
			excOn: true,
			excAmt: .45,
			eqOn: true,
			eqAir: 3,
			deessOn: true,
			deessAmt: .4,
			limitOn: true,
			limitDb: -1
		}
	},
	{
		id: "dub",
		name: "Dub Throw",
		blurb: "Filtered echo, a little plate.",
		group: "space",
		params: {
			delayOn: true,
			delayMs: 330,
			delayFb: .48,
			delayMix: .32,
			verbOn: true,
			verbSize: .4,
			verbMix: .16,
			hpfOn: true,
			hpfHz: 80
		}
	},
	{
		id: "plate",
		name: "Plate",
		blurb: "Long, darker tail.",
		group: "space",
		params: {
			verbOn: true,
			verbSize: .82,
			verbDamp: .62,
			verbMix: .38,
			eqOn: true,
			eqAir: 1,
			hpfOn: true,
			hpfHz: 70
		}
	},
	{
		id: "phase",
		name: "Phaser Wash",
		blurb: "Four stages, slow rate.",
		group: "space",
		params: {
			phaserOn: true,
			phaserRate: .12,
			phaserMix: .55,
			chorusOn: true,
			chorusMix: .12,
			chorusRate: .2,
			chorusDepth: .3
		}
	},
	{
		id: "shimmer",
		name: "Shimmer",
		blurb: "Chorus, plate, top end.",
		group: "space",
		params: {
			chorusOn: true,
			chorusRate: .4,
			chorusDepth: .55,
			chorusMix: .28,
			verbOn: true,
			verbSize: .7,
			verbDamp: .25,
			verbMix: .34,
			eqOn: true,
			eqAir: 3.5,
			excOn: true,
			excAmt: .3
		}
	},
	{
		id: "autopan",
		name: "Auto Pan",
		blurb: "Even level, moving sides.",
		group: "space",
		params: {
			panOn: true,
			panRate: .4,
			panDepth: .7,
			widthOn: true,
			width: 1.2
		}
	},
	{
		id: "back",
		name: "Background",
		blurb: "Sit the part behind the vocal.",
		group: "space",
		params: {
			eqOn: true,
			eqPresence: -3.5,
			eqAir: -1,
			outputDb: -3,
			verbOn: true,
			verbSize: .35,
			verbMix: .18,
			verbDamp: .7
		}
	},
	{
		id: "tilt",
		name: "Tilt Bright",
		blurb: "One move. Lows down, air up.",
		group: "bus",
		params: {
			tiltOn: true,
			tilt: 4.2,
			hpfOn: true,
			hpfHz: 28
		}
	},
	{
		id: "notch",
		name: "Box Notch",
		blurb: "Sweep the honk out.",
		group: "bus",
		params: {
			bellOn: true,
			bellHz: 380,
			bellDb: -4.5,
			bellQ: 1.6,
			hpfOn: true,
			hpfHz: 30
		}
	},
	{
		id: "gated",
		name: "Gated Room",
		blurb: "Hysteresis gate, attack stays.",
		group: "drum",
		params: {
			gateOn: true,
			gateThresh: -34,
			gateRange: .9,
			gateAttack: .002,
			gateRelease: .08,
			punchOn: true,
			punch: .4,
			hpfOn: true,
			hpfHz: 40
		}
	},
	{
		id: "fold",
		name: "Fold",
		blurb: "Wavefold, 4x, mixed back.",
		group: "bus",
		params: {
			foldOn: true,
			foldAmt: .62,
			eqOn: true,
			eqBody: -1.5,
			limitOn: true,
			limitDb: -1
		}
	},
	{
		id: "hold",
		name: "Sample Hold",
		blurb: "Stepped rate, then the chain.",
		group: "bus",
		params: {
			reduxOn: true,
			reduxHold: 7,
			lpOn: true,
			lpHz: 8e3,
			satOn: true,
			satDrive: .18,
			satMix: .35
		}
	},
	{
		id: "jet",
		name: "Jet Flange",
		blurb: "Short delay, filtered feedback.",
		group: "space",
		params: {
			flangeOn: true,
			flangeRate: .16,
			flangeDepth: .7,
			flangeFb: .42,
			flangeMix: .45,
			hpfOn: true,
			hpfHz: 80
		}
	},
	{
		id: "trem",
		name: "Tremolo",
		blurb: "Level moves. Phase does not flip.",
		group: "space",
		params: {
			tremOn: true,
			tremRate: 4.5,
			tremDepth: .62
		}
	},
	{
		id: "wow",
		name: "Tape Wow",
		blurb: "Slow pitch drift, mixed in.",
		group: "space",
		params: {
			wowOn: true,
			wowRate: .38,
			wowDepth: .55,
			wowMix: .7,
			satOn: true,
			satDrive: .2,
			satMix: .4,
			lpOn: true,
			lpHz: 12e3
		}
	},
	{
		id: "neutron",
		name: "Vocal Chain",
		blurb: "Gate, de-ess, tilt, ceiling.",
		group: "vocal",
		params: {
			hpfOn: true,
			hpfHz: 85,
			gateOn: true,
			gateThresh: -42,
			gateRange: .7,
			gateAttack: .005,
			gateRelease: .12,
			deessOn: true,
			deessAmt: .55,
			tiltOn: true,
			tilt: 2.4,
			bellOn: true,
			bellHz: 3200,
			bellDb: 2.2,
			bellQ: 1.1,
			compOn: true,
			compThresh: -18,
			compRatio: 3,
			compMakeup: 2,
			limitOn: true,
			limitDb: -1.2
		}
	}
];
function clamp$1(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
function eqPower(mix) {
	const m = clamp$1(mix, 0, 1);
	return [Math.cos(m * Math.PI * .5), Math.sin(m * Math.PI * .5)];
}
function gain(ctx, value = 1) {
	const node = ctx.createGain();
	node.gain.value = value;
	return node;
}
function filter(ctx, type, freq, q = .707, g = 0) {
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
		const x = i / 2047 * 2 - 1;
		curve[i] = Math.tanh(k * x) / norm;
	}
	return curve;
}
function curveSafety() {
	const n = 2048;
	const curve = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const x = i / 2047 * 2 - 1;
		const ax = Math.abs(x);
		if (ax <= .89) curve[i] = x;
		else {
			const sign = x < 0 ? -1 : 1;
			const t = (ax - .89) / .11;
			curve[i] = sign * (.89 + .085 * Math.tanh(t * 2.2));
		}
	}
	return curve;
}
function curveBits(bits) {
	const steps = Math.pow(2, clamp$1(Math.round(bits), 4, 16) - 1);
	const n = 2048;
	const curve = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const x = i / 2047 * 2 - 1;
		curve[i] = Math.round(x * steps) / steps;
	}
	return curve;
}
function shaper(ctx, curve) {
	const node = ctx.createWaveShaper();
	node.curve = curve;
	node.oversample = "4x";
	return node;
}
function curveFold(amt) {
	const n = 2048;
	const curve = new Float32Array(n);
	const drive = 1 + clamp$1(amt, 0, 1) * 3.2;
	for (let i = 0; i < n; i++) {
		let y = (i / 2047 * 2 - 1) * drive;
		for (let k = 0; k < 3; k++) if (y > 1) y = 2 - y;
		else if (y < -1) y = -2 - y;
		else break;
		curve[i] = Math.max(-1, Math.min(1, y / (1 + amt * .35)));
	}
	return curve;
}
var COLOR_WORKLET = `
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
var workletReady = /* @__PURE__ */ new WeakMap();
function ensureColorWorklet(ctx) {
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
function biquadMag(type, f0, q, gainDb, freq, sr) {
	const A = Math.pow(10, gainDb / 40);
	const w0 = 2 * Math.PI * f0 / sr;
	const cw = Math.cos(w0);
	const alpha = Math.sin(w0) / (2 * Math.max(.15, q));
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
	const w = 2 * Math.PI * freq / sr;
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
function rackCurveDb(p, freq, sr) {
	let db = 0;
	if (p.hpfOn) db += biquadMag("highpass", clamp$1(p.hpfHz, 20, 800), clamp$1(p.hpfQ, .3, 2.5), 0, freq, sr);
	if (p.lpOn) db += biquadMag("lowpass", clamp$1(p.lpHz, 200, 18e3), clamp$1(p.lpQ, .3, 2.5), 0, freq, sr);
	if (p.eqOn) {
		if (Math.abs(p.eqLow) > .05) db += biquadMag("lowshelf", 110, .7, p.eqLow, freq, sr);
		if (Math.abs(p.eqBody) > .05) db += biquadMag("peaking", 420, .85, p.eqBody, freq, sr);
		if (Math.abs(p.eqPresence) > .05) db += biquadMag("peaking", 3200, .9, p.eqPresence, freq, sr);
		if (Math.abs(p.eqAir) > .05) db += biquadMag("highshelf", 1e4, .7, p.eqAir, freq, sr);
	}
	if (p.tiltOn && Math.abs(p.tilt) > .05) {
		db += biquadMag("lowshelf", 280, .7, -p.tilt, freq, sr);
		db += biquadMag("highshelf", 4500, .7, p.tilt, freq, sr);
	}
	if (p.bellOn && Math.abs(p.bellDb) > .05) db += biquadMag("peaking", clamp$1(p.bellHz, 80, 12e3), clamp$1(p.bellQ, .4, 8), p.bellDb, freq, sr);
	return db;
}
function makePlate(ctx, seconds, damp) {
	const sr = ctx.sampleRate;
	const len = Math.max(8, Math.floor(sr * clamp$1(seconds, .2, 3.2)));
	const buf = ctx.createBuffer(2, len, sr);
	const early = [
		.009,
		.013,
		.019,
		.027,
		.037
	];
	for (let c = 0; c < 2; c++) {
		const data = buf.getChannelData(c);
		let low = 0;
		const coef = .12 + clamp$1(damp, 0, 1) * .82;
		for (let i = 0; i < len; i++) {
			const t = i / len;
			const env = Math.pow(1 - t, 2.1);
			const white = (Math.random() * 2 - 1) * env;
			low += coef * (white - low);
			data[i] = low;
		}
		for (let e = 0; e < early.length; e++) {
			const idx = Math.floor(early[e] * sr) + c * 19;
			if (idx >= 0 && idx < len) data[idx] += (.32 - e * .045) * (c ? -.8 : 1);
		}
		let peak = 1e-8;
		for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(data[i]));
		const g = .55 / peak;
		for (let i = 0; i < len; i++) data[i] *= g;
	}
	return buf;
}
function stereoBuffer(ctx, clip) {
	const length = Math.max(1, clip.channels[0]?.length ?? 0);
	const buffer = ctx.createBuffer(2, length, clip.sampleRate);
	const left = clip.channels[0] ?? new Float32Array(length);
	const right = clip.channels[1] ?? left;
	buffer.copyToChannel(left, 0);
	buffer.copyToChannel(right, 1);
	return buffer;
}
async function createChain(ctx) {
	const colorOk = await ensureColorWorklet(ctx);
	const oscs = [];
	const startLfo = (freq) => {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = freq;
		oscs.push(osc);
		return osc;
	};
	const input = gain(ctx, 1);
	const inputMeter = ctx.createAnalyser();
	inputMeter.fftSize = 2048;
	inputMeter.smoothingTimeConstant = .78;
	inputMeter.minDecibels = -100;
	inputMeter.maxDecibels = -8;
	input.connect(inputMeter);
	const dryDelay = ctx.createDelay(.05);
	dryDelay.delayTime.value = ALIGN;
	const dryGain = gain(ctx, 0);
	const wetGain = gain(ctx, 1);
	const sum = gain(ctx, 1);
	input.connect(dryDelay);
	dryDelay.connect(dryGain);
	dryGain.connect(sum);
	const hpf = filter(ctx, "highpass", 20, .707);
	const lpf = filter(ctx, "lowpass", 18e3, .707);
	const eqLow = filter(ctx, "lowshelf", 110, .7, 0);
	const eqBody = filter(ctx, "peaking", 420, .85, 0);
	const eqPresence = filter(ctx, "peaking", 3200, .9, 0);
	const eqAir = filter(ctx, "highshelf", 1e4, .7, 0);
	const tiltLow = filter(ctx, "lowshelf", 280, .7, 0);
	const tiltHigh = filter(ctx, "highshelf", 4500, .7, 0);
	const bell = filter(ctx, "peaking", 1200, 1.2, 0);
	let color = null;
	if (colorOk) try {
		color = new AudioWorkletNode(ctx, "nodaw-color", {
			numberOfInputs: 1,
			numberOfOutputs: 1,
			outputChannelCount: [2]
		});
	} catch {
		color = null;
	}
	const colorIn = color ?? gain(ctx, 1);
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
	const deessDelay = ctx.createDelay(.05);
	deessDelay.delayTime.value = LOOK;
	const bandDelay = ctx.createDelay(.05);
	bandDelay.delayTime.value = LOOK;
	const deessComp = ctx.createDynamicsCompressor();
	deessComp.threshold.value = -30;
	deessComp.knee.value = 8;
	deessComp.ratio.value = 10;
	deessComp.attack.value = .002;
	deessComp.release.value = .07;
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
	punchComp.attack.value = .025;
	punchComp.release.value = .18;
	const punchDelay = ctx.createDelay(.05);
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
	const satTone = filter(ctx, "lowpass", 12e3, .7);
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
	const foldA = shaper(ctx, curveFold(.45));
	const foldB = shaper(ctx, curveFold(.45));
	const foldGainA = gain(ctx, 1);
	const foldGainB = gain(ctx, 0);
	const foldSum = gain(ctx, 1);
	let foldSlot = 0;
	let foldKey = .45;
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
	let crushSlot = 0;
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
	const excHp = filter(ctx, "highpass", 6500, .7);
	const excPre = gain(ctx, 1);
	const excShape = shaper(ctx, curveTanh());
	const excHp2 = filter(ctx, "highpass", 5e3, .7);
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
	const chDelayL = ctx.createDelay(.05);
	const chDelayR = ctx.createDelay(.05);
	chDelayL.delayTime.value = .014;
	chDelayR.delayTime.value = .017;
	const chLfo = startLfo(.35);
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
	const flDelay = ctx.createDelay(.02);
	flDelay.delayTime.value = .0022;
	const flFb = gain(ctx, 0);
	const flFilt = filter(ctx, "lowpass", 5500, .7);
	const flLfo = startLfo(.22);
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
	const ph = [
		0,
		1,
		2,
		3
	].map(() => filter(ctx, "allpass", 1400, 2.4));
	const phLfo = startLfo(.18);
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
	const panLfo = startLfo(.35);
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
	const dlyFiltL = filter(ctx, "lowpass", 4200, .7);
	const dlyFiltR = filter(ctx, "lowpass", 4200, .7);
	const dlyHp = filter(ctx, "highpass", 140, .7);
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
	const preDelay = ctx.createDelay(.08);
	preDelay.delayTime.value = .018;
	const verbA = ctx.createConvolver();
	const verbB = ctx.createConvolver();
	const verbGainA = gain(ctx, 1);
	const verbGainB = gain(ctx, 0);
	const verbSum = gain(ctx, 1);
	let verbSlot = 0;
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
	const wowDelay = ctx.createDelay(.03);
	wowDelay.delayTime.value = .007;
	const wowLfo = startLfo(.42);
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
	const midL = gain(ctx, .5);
	const midR = gain(ctx, .5);
	const sideL = gain(ctx, .5);
	const sideR = gain(ctx, -.5);
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
	limiter.attack.value = .003;
	limiter.release.value = .08;
	const outGain = gain(ctx, 1);
	const safety = shaper(ctx, curveSafety());
	const dc = filter(ctx, "highpass", 18, .707);
	const outputMeter = ctx.createAnalyser();
	outputMeter.fftSize = 2048;
	outputMeter.smoothingTimeConstant = .82;
	outputMeter.minDecibels = -100;
	outputMeter.maxDecibels = -8;
	widthMerge.connect(limiter);
	limiter.connect(outGain);
	outGain.connect(safety);
	safety.connect(dc);
	dc.connect(wetGain);
	wetGain.connect(sum);
	sum.connect(outputMeter);
	const glide = (param, value, snap, exp = false, tau = .02) => {
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
			if (!Number.isFinite(cur) || Math.abs(cur - v) < (exp ? .4 : 6e-4)) {
				param.setValueAtTime(v, now);
				return;
			}
			const base = exp ? Math.max(8, cur) : cur;
			param.setValueAtTime(base, now);
			param.setTargetAtTime(v, now + .01, tau);
		} catch {
			try {
				param.cancelScheduledValues(0);
				param.value = v;
			} catch {}
		}
	};
	const blend = (dry, wet, mix, snap) => {
		const [d, w] = eqPower(mix);
		glide(dry.gain, d, snap);
		glide(wet.gain, w, snap);
	};
	const setVerb = (size, damp, snap) => {
		const key = `${size.toFixed(2)}|${damp.toFixed(2)}`;
		if (key === verbKey) return;
		verbKey = key;
		const ir = makePlate(ctx, .28 + size * 2.5, damp);
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
		glide(nextG.gain, 1, false, false, .08);
		glide(prevG.gain, 0, false, false, .08);
		verbSlot = useB ? 1 : 0;
	};
	const setCrush = (bits, snap) => {
		const b = clamp$1(Math.round(bits), 4, 16);
		if (b === crushBits) return;
		crushBits = b;
		const curve = curveBits(b);
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
	const setFold = (amt, snap) => {
		const key = Math.round(clamp$1(amt, 0, 1) * 20) / 20;
		if (key === foldKey) return;
		foldKey = key;
		const curve = curveFold(key);
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
		glide(nextG.gain, 1, false, false, .04);
		glide(prevG.gain, 0, false, false, .04);
		foldSlot = useB ? 1 : 0;
	};
	const apply = (p, snap) => {
		const [dry, wet] = eqPower(p.mix);
		glide(dryGain.gain, dry, snap);
		glide(wetGain.gain, wet, snap);
		glide(input.gain, dbToGain(p.inputDb), snap);
		glide(outGain.gain, dbToGain(p.outputDb), snap);
		glide(hpf.frequency, p.hpfOn ? clamp$1(p.hpfHz, 20, 800) : 20, snap, true);
		glide(hpf.Q, p.hpfOn ? clamp$1(p.hpfQ, .3, 2.5) : .707, snap);
		glide(lpf.frequency, p.lpOn ? clamp$1(p.lpHz, 200, 18e3) : 18e3, snap, true);
		glide(lpf.Q, p.lpOn ? clamp$1(p.lpQ, .3, 2.5) : .707, snap);
		const eq = p.eqOn;
		glide(eqLow.gain, eq ? p.eqLow : 0, snap);
		glide(eqBody.gain, eq ? p.eqBody : 0, snap);
		glide(eqPresence.gain, eq ? p.eqPresence : 0, snap);
		glide(eqAir.gain, eq ? p.eqAir : 0, snap);
		const tilt = p.tiltOn ? clamp$1(p.tilt, -8, 8) : 0;
		glide(tiltLow.gain, -tilt, snap);
		glide(tiltHigh.gain, tilt, snap);
		glide(bell.frequency, clamp$1(p.bellHz, 80, 12e3), snap, true);
		glide(bell.Q, clamp$1(p.bellQ, .4, 8), snap);
		glide(bell.gain, p.bellOn ? clamp$1(p.bellDb, -12, 12) : 0, snap);
		glide(pGate, p.gateOn ? 1 : 0, snap);
		glide(pThresh, dbToGain(clamp$1(p.gateThresh, -60, -8)), snap);
		const floor = Math.pow(10, -48 * clamp$1(p.gateRange, 0, 1) / 20);
		glide(pFloor, p.gateOn ? floor : 1, snap);
		glide(pAttack, clamp$1(p.gateAttack, 5e-4, .05), snap);
		glide(pRelease, clamp$1(p.gateRelease, .02, .45), snap);
		glide(pHold, p.reduxOn ? clamp$1(Math.round(p.reduxHold), 2, 24) : 1, snap);
		const deessHzV = clamp$1(p.deessHz, 2500, 12e3);
		glide(bpSub.frequency, deessHzV, snap, true);
		glide(bpComp.frequency, deessHzV, snap, true);
		const deess = p.deessOn ? clamp$1(p.deessAmt, 0, 1) : 0;
		glide(deessCut.gain, -deess, snap);
		glide(deessAdd.gain, deess, snap);
		if (p.compOn) {
			glide(comp.threshold, clamp$1(p.compThresh, -48, 0), snap);
			glide(comp.ratio, clamp$1(p.compRatio, 1, 20), snap);
			glide(comp.attack, clamp$1(p.compAttack, .001, .4), snap);
			glide(comp.release, clamp$1(p.compRelease, .02, .8), snap);
			glide(compMakeup.gain, dbToGain(p.compMakeup), snap);
		} else {
			glide(comp.threshold, 0, snap);
			glide(comp.ratio, 1, snap);
			glide(comp.attack, .01, snap);
			glide(comp.release, .1, snap);
			glide(compMakeup.gain, 1, snap);
		}
		const punch = p.punchOn ? clamp$1(p.punch, 0, 1) : 0;
		glide(punchComp.attack, clamp$1(p.punchAttack, .001, .08), snap);
		glide(punchUp.gain, 1 + punch, snap);
		glide(punchDown.gain, -punch, snap);
		const drive = 1 + clamp$1(p.satDrive, 0, 1) * 7;
		glide(satPre.gain, drive, snap);
		glide(satPost.gain, 1 / Math.pow(drive, .7), snap);
		glide(satTone.frequency, 1400 + clamp$1(p.satTone, 0, 1) * 15e3, snap, true);
		blend(satDry, satWet, p.satOn ? p.satMix : 0, snap);
		const foldAmt = p.foldOn ? clamp$1(p.foldAmt, 0, 1) : 0;
		setFold(foldAmt, snap);
		blend(foldDry, foldWet, foldAmt, snap);
		setCrush(p.crushOn ? p.crushBits : 16, snap);
		blend(crushDry, crushWet, p.crushOn ? p.crushMix : 0, snap);
		const exc = p.excOn ? clamp$1(p.excAmt, 0, 1) : 0;
		const excHz = clamp$1(p.excFreq, 2e3, 12e3);
		glide(excHp.frequency, excHz, snap, true);
		glide(excHp2.frequency, Math.max(1800, excHz * .77), snap, true);
		glide(excPre.gain, 1 + exc * 6, snap);
		glide(excWet.gain, exc * .32, snap);
		glide(chLfo.frequency, clamp$1(p.chorusRate, .05, 4), snap);
		const chDepth = (p.chorusOn ? clamp$1(p.chorusDepth, 0, 1) : 0) * .005;
		glide(chDepthL.gain, chDepth, snap);
		glide(chDepthR.gain, chDepth * 1.15, snap);
		blend(chDry, chWet, p.chorusOn ? p.chorusMix : 0, snap);
		glide(flLfo.frequency, clamp$1(p.flangeRate, .05, 4), snap);
		glide(flDepth.gain, p.flangeOn ? clamp$1(p.flangeDepth, 0, 1) * .0016 : 0, snap);
		glide(flFb.gain, p.flangeOn ? Math.min(.55, p.flangeFb) : 0, snap);
		blend(flDry, flWet, p.flangeOn ? p.flangeMix : 0, snap);
		glide(phLfo.frequency, clamp$1(p.phaserRate, .05, 3), snap);
		glide(phDepth.gain, p.phaserOn ? clamp$1(p.phaserDepth, 0, 1) * 900 : 0, snap);
		for (const stage of ph) glide(stage.frequency, 900, snap, true);
		blend(phDry, phWet, p.phaserOn ? p.phaserMix : 0, snap);
		const add = (p.panOn ? clamp$1(p.panDepth, 0, 1) : 0) * .42;
		glide(panLfo.frequency, clamp$1(p.panRate, .05, 8), snap);
		glide(panL.gain, 1 - add, snap);
		glide(panR.gain, 1 - add, snap);
		glide(panDepthL.gain, add, snap);
		glide(panDepthR.gain, add, snap);
		const tremDepthAmt = p.tremOn ? clamp$1(p.tremDepth, 0, .9) : 0;
		glide(trem.gain, 1 - tremDepthAmt * .5, snap);
		glide(tremDepth.gain, tremDepthAmt * .5, snap);
		glide(tremLfo.frequency, clamp$1(p.tremRate, .2, 12), snap);
		const ms = clamp$1(p.delayMs, 20, 900) / 1e3;
		glide(dlyL.delayTime, ms, snap);
		glide(dlyR.delayTime, Math.min(1.1, ms * 1.33), snap);
		const tone = clamp$1(p.delayTone, 800, 14e3);
		glide(dlyFiltL.frequency, tone, snap, true);
		glide(dlyFiltR.frequency, tone, snap, true);
		const fb = p.delayOn ? Math.min(.72, p.delayFb) : 0;
		glide(dlyFbL.gain, fb, snap);
		glide(dlyFbR.gain, fb, snap);
		blend(dlyDry, dlyWet, p.delayOn ? p.delayMix : 0, snap);
		setVerb(clamp$1(p.verbSize, 0, 1), clamp$1(p.verbDamp, 0, 1), snap);
		glide(preDelay.delayTime, clamp$1(p.verbPre, 0, .08), snap);
		blend(verbDry, verbWet, p.verbOn ? p.verbMix : 0, snap);
		glide(wowLfo.frequency, clamp$1(p.wowRate, .08, 2.5), snap);
		glide(wowDepth.gain, p.wowOn ? clamp$1(p.wowDepth, 0, 1) * .0018 : 0, snap);
		blend(wowDry, wowWet, p.wowOn ? p.wowMix : 0, snap);
		glide(side.gain, p.widthOn ? clamp$1(p.width, 0, 2) : 1, snap);
		if (p.limitOn) {
			glide(limiter.threshold, clamp$1(p.limitDb, -8, -.2), snap);
			glide(limiter.ratio, 20, snap);
			glide(limiter.release, clamp$1(p.limitRelease, .02, .3), snap);
		} else {
			glide(limiter.threshold, 0, snap);
			glide(limiter.ratio, 1, snap);
			glide(limiter.release, .08, snap);
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
				} catch {}
				osc.disconnect();
			}
		}
	};
}
function tailSeconds(p) {
	let tail = .04;
	if (p.delayOn) tail += p.delayMs / 1e3 * (1 + Math.min(.72, p.delayFb) * 5);
	if (p.verbOn) tail += .25 + p.verbSize * 2.5;
	return Math.min(5.5, tail);
}
async function printRack(clip, params) {
	const rate = clip.sampleRate || 44100;
	const dur = Math.max(.05, clip.duration);
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
	const fade = Math.min(.008, dur / 5);
	edge.gain.setValueAtTime(0, 0);
	edge.gain.linearRampToValueAtTime(1, fade);
	edge.gain.setValueAtTime(1, Math.max(fade, dur - .012));
	edge.gain.linearRampToValueAtTime(0, dur);
	src.start(0);
	const rendered = await ctx.startRendering();
	chain.dispose();
	const channels = [];
	for (let c = 0; c < rendered.numberOfChannels; c++) channels.push(new Float32Array(rendered.getChannelData(c)));
	return makeClip(`${clip.name}_fx`, rendered.sampleRate, channels);
}
var FxRack = class {
	ctx = null;
	chain = null;
	fade = null;
	source = null;
	clip = null;
	buffer = null;
	params = { ...RACK_INIT };
	offset = 0;
	startedAt = 0;
	playing = false;
	loop = true;
	gen = 0;
	spec = /* @__PURE__ */ new Uint8Array(1024);
	tin = /* @__PURE__ */ new Float32Array(2048);
	tout = /* @__PURE__ */ new Float32Array(2048);
	boot = null;
	dead = false;
	get isPlaying() {
		return this.playing;
	}
	get sampleRate() {
		return this.ctx?.sampleRate ?? 48e3;
	}
	get position() {
		if (!this.playing || !this.clip || !this.ctx) return this.offset;
		const t = this.offset + (this.ctx.currentTime - this.startedAt);
		const dur = this.clip.duration;
		if (this.loop && dur > 0) return t % dur;
		return Math.min(dur, Math.max(0, t));
	}
	setLoop(loop) {
		this.loop = loop;
		if (this.playing) {
			this.offset = this.position;
			this.play();
		}
	}
	setClip(clip) {
		this.clip = clip;
		this.offset = 0;
		this.buffer = null;
		if (!clip) {
			this.stop();
			return;
		}
		this.ensure();
		if (this.ctx) this.buffer = stereoBuffer(this.ctx, clip);
		if (this.playing) this.play();
	}
	setParams(params) {
		this.params = params;
		this.chain?.apply(params, false);
	}
	async play() {
		if (!this.clip) return;
		this.ensure();
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
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
			fade.gain.linearRampToValueAtTime(0, now + .008);
			await new Promise((resolve) => setTimeout(resolve, 12));
			if (this.gen !== gen) return;
		}
		this.stopSource();
		const src = ctx.createBufferSource();
		src.buffer = this.buffer;
		src.loop = this.loop;
		src.connect(this.chain.input);
		const dur = this.clip.duration;
		const offset = clamp$1(this.offset, 0, Math.max(0, dur - .01));
		this.offset = offset;
		src.start(0, offset);
		this.source = src;
		this.startedAt = ctx.currentTime;
		this.playing = true;
		const now = ctx.currentTime;
		fade.gain.cancelScheduledValues(now);
		fade.gain.setValueAtTime(fade.gain.value, now);
		fade.gain.linearRampToValueAtTime(1, now + .012);
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
	seek(time) {
		const dur = this.clip?.duration ?? 0;
		this.offset = clamp$1(time, 0, dur);
		if (this.playing) this.play();
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
		return {
			inn,
			out
		};
	}
	dispose() {
		this.dead = true;
		this.gen += 1;
		this.stopSource();
		try {
			this.fade?.disconnect();
		} catch {}
		this.chain?.dispose();
		this.chain = null;
		this.fade = null;
		this.playing = false;
	}
	ensure() {
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
	stopSource() {
		const src = this.source;
		this.source = null;
		if (!src) return;
		try {
			src.onended = null;
			src.stop();
		} catch {}
		try {
			src.disconnect();
		} catch {}
	}
	fadeOutAndStop() {
		const fade = this.fade;
		const ctx = this.ctx;
		const gen = ++this.gen;
		const src = this.source;
		if (fade && ctx) {
			const now = ctx.currentTime;
			fade.gain.cancelScheduledValues(now);
			fade.gain.setValueAtTime(Math.max(0, fade.gain.value), now);
			fade.gain.linearRampToValueAtTime(0, now + .02);
		}
		window.setTimeout(() => {
			if (this.gen !== gen) return;
			if (src && this.source === src) this.stopSource();
		}, 28);
	}
};
var WHO = [
	"DIY",
	"Podcast",
	"Vlog",
	"Rap",
	"Beat",
	"Producer"
];
function six(power, rows) {
	return rows.map((row, i) => ({
		id: row[0],
		name: row[1],
		who: WHO[i] ?? "DIY",
		params: {
			...row[2],
			[power]: true
		}
	}));
}
/** Six starting points per module. Order is DIY, Podcast, Vlog, Rap, Beat, Producer. */
var MODULE_PRESETS = {
	hpf: six("hpfOn", [
		[
			"rumble",
			"Rumble trim",
			{
				hpfHz: 40,
				hpfQ: .7
			}
		],
		[
			"voice",
			"Desk rumble",
			{
				hpfHz: 90,
				hpfQ: .8
			}
		],
		[
			"room",
			"Room boom",
			{
				hpfHz: 120,
				hpfQ: .9
			}
		],
		[
			"pocket",
			"Vocal low",
			{
				hpfHz: 80,
				hpfQ: .7
			}
		],
		[
			"sub",
			"Keep the sub",
			{
				hpfHz: 28,
				hpfQ: .5
			}
		],
		[
			"tight",
			"Tight HPF",
			{
				hpfHz: 70,
				hpfQ: 1.2
			}
		]
	]),
	lp: six("lpOn", [
		[
			"harsh",
			"Harsh lid",
			{
				lpHz: 12e3,
				lpQ: .7
			}
		],
		[
			"speech",
			"Speech lid",
			{
				lpHz: 8e3,
				lpQ: .85
			}
		],
		[
			"phone",
			"Camera air",
			{
				lpHz: 1e4,
				lpQ: .7
			}
		],
		[
			"dark",
			"Dark vocal",
			{
				lpHz: 9e3,
				lpQ: .8
			}
		],
		[
			"lofi",
			"Lo-fi lid",
			{
				lpHz: 6200,
				lpQ: 1.1
			}
		],
		[
			"air",
			"Gentle air",
			{
				lpHz: 16e3,
				lpQ: .5
			}
		]
	]),
	eq: six("eqOn", [
		[
			"polish",
			"Gentle polish",
			{
				eqLow: 1.5,
				eqBody: 0,
				eqPresence: 1,
				eqAir: 2
			}
		],
		[
			"voice",
			"Voice body",
			{
				eqLow: 1,
				eqBody: 2,
				eqPresence: 2.5,
				eqAir: -1
			}
		],
		[
			"clear",
			"On-camera",
			{
				eqLow: .5,
				eqBody: -1.5,
				eqPresence: 3,
				eqAir: 1.5
			}
		],
		[
			"pocket",
			"Vocal pocket",
			{
				eqLow: 1,
				eqBody: -2,
				eqPresence: 2.5,
				eqAir: 1.5
			}
		],
		[
			"snap",
			"Drum snap",
			{
				eqLow: 3,
				eqBody: -2,
				eqPresence: 2,
				eqAir: 1.2
			}
		],
		[
			"glue",
			"Mix glue",
			{
				eqLow: 1.2,
				eqBody: -.8,
				eqPresence: 1,
				eqAir: 1.5
			}
		]
	]),
	tilt: six("tiltOn", [
		[
			"bright",
			"A bit bright",
			{ tilt: 2 }
		],
		[
			"words",
			"Word clarity",
			{ tilt: 3.2 }
		],
		[
			"dull",
			"Fix a dull cam",
			{ tilt: 2.5 }
		],
		[
			"modern",
			"Modern vocal",
			{ tilt: 1.8 }
		],
		[
			"tape",
			"Dark tape",
			{ tilt: -2.4 }
		],
		[
			"master",
			"Master tilt",
			{ tilt: 1.2 }
		]
	]),
	bell: six("bellOn", [
		[
			"box",
			"Box cut",
			{
				bellHz: 400,
				bellDb: -3,
				bellQ: 1.4
			}
		],
		[
			"nasal",
			"Nasal cut",
			{
				bellHz: 1200,
				bellDb: -2.5,
				bellQ: 2
			}
		],
		[
			"room",
			"Room tone",
			{
				bellHz: 250,
				bellDb: -3.5,
				bellQ: 1.1
			}
		],
		[
			"honk",
			"Honk cut",
			{
				bellHz: 800,
				bellDb: -3,
				bellQ: 1.8
			}
		],
		[
			"ring",
			"Snare ring",
			{
				bellHz: 3400,
				bellDb: 2.2,
				bellQ: 2.2
			}
		],
		[
			"sweet",
			"Presence sweet",
			{
				bellHz: 3200,
				bellDb: 1.8,
				bellQ: 1.1
			}
		]
	]),
	width: six("widthOn", [
		[
			"wide",
			"A bit wide",
			{ width: 1.25 }
		],
		[
			"mono",
			"Mono safe",
			{ width: .85 }
		],
		[
			"phone",
			"Phone stereo",
			{ width: 1.15 }
		],
		[
			"center",
			"Vocal center",
			{ width: .9 }
		],
		[
			"beat",
			"Beat wide",
			{ width: 1.55 }
		],
		[
			"sides",
			"Master sides",
			{ width: 1.35 }
		]
	]),
	deess: six("deessOn", [
		[
			"soft",
			"Soft esses",
			{
				deessHz: 7e3,
				deessAmt: .4
			}
		],
		[
			"speech",
			"Spoken S",
			{
				deessHz: 6500,
				deessAmt: .7
			}
		],
		[
			"close",
			"Close mic",
			{
				deessHz: 7200,
				deessAmt: .55
			}
		],
		[
			"adlib",
			"Adlib S",
			{
				deessHz: 8e3,
				deessAmt: .45
			}
		],
		[
			"hats",
			"Tame hats",
			{
				deessHz: 9e3,
				deessAmt: .3
			}
		],
		[
			"clear",
			"Transparent",
			{
				deessHz: 6800,
				deessAmt: .35
			}
		]
	]),
	comp: six("compOn", [
		[
			"light",
			"Light level",
			{
				compThresh: -16,
				compRatio: 2.5,
				compAttack: .02,
				compRelease: .14,
				compMakeup: 1
			}
		],
		[
			"spoken",
			"Spoken level",
			{
				compThresh: -22,
				compRatio: 4,
				compAttack: .008,
				compRelease: .12,
				compMakeup: 4
			}
		],
		[
			"talk",
			"Talking head",
			{
				compThresh: -18,
				compRatio: 3.2,
				compAttack: .012,
				compRelease: .14,
				compMakeup: 2.5
			}
		],
		[
			"ride",
			"Vocal ride",
			{
				compThresh: -18,
				compRatio: 3.5,
				compAttack: .006,
				compRelease: .1,
				compMakeup: 2.5
			}
		],
		[
			"drums",
			"Drum bus",
			{
				compThresh: -14,
				compRatio: 2.8,
				compAttack: .015,
				compRelease: .16,
				compMakeup: 1.5
			}
		],
		[
			"glue",
			"Bus glue",
			{
				compThresh: -12,
				compRatio: 2,
				compAttack: .03,
				compRelease: .2,
				compMakeup: 1
			}
		]
	]),
	punch: six("punchOn", [
		[
			"snap",
			"Light snap",
			{
				punch: .35,
				punchAttack: .02
			}
		],
		[
			"words",
			"Word start",
			{
				punch: .25,
				punchAttack: .008
			}
		],
		[
			"hit",
			"On-camera hit",
			{
				punch: .4,
				punchAttack: .015
			}
		],
		[
			"attack",
			"Vocal attack",
			{
				punch: .5,
				punchAttack: .01
			}
		],
		[
			"trans",
			"Transient",
			{
				punch: .7,
				punchAttack: .004
			}
		],
		[
			"hint",
			"Subtle punch",
			{
				punch: .22,
				punchAttack: .03
			}
		]
	]),
	gate: six("gateOn", [
		[
			"floor",
			"Noise floor",
			{
				gateThresh: -42,
				gateRange: .7,
				gateAttack: .008,
				gateRelease: .12
			}
		],
		[
			"breath",
			"Breaths down",
			{
				gateThresh: -38,
				gateRange: .85,
				gateAttack: .004,
				gateRelease: .08
			}
		],
		[
			"room",
			"Room noise",
			{
				gateThresh: -36,
				gateRange: .75,
				gateAttack: .006,
				gateRelease: .14
			}
		],
		[
			"tight",
			"Tight vocal",
			{
				gateThresh: -40,
				gateRange: .8,
				gateAttack: .003,
				gateRelease: .06
			}
		],
		[
			"drum",
			"Drum gate",
			{
				gateThresh: -32,
				gateRange: .92,
				gateAttack: .001,
				gateRelease: .05
			}
		],
		[
			"gentle",
			"Gentle gate",
			{
				gateThresh: -48,
				gateRange: .45,
				gateAttack: .01,
				gateRelease: .2
			}
		]
	]),
	limit: six("limitOn", [
		[
			"safe",
			"Safe ceiling",
			{
				limitDb: -1,
				limitRelease: .08
			}
		],
		[
			"speech",
			"Speech loud",
			{
				limitDb: -1.5,
				limitRelease: .06
			}
		],
		[
			"platform",
			"Platform",
			{
				limitDb: -1,
				limitRelease: .05
			}
		],
		[
			"vocal",
			"Vocal ceiling",
			{
				limitDb: -1.2,
				limitRelease: .04
			}
		],
		[
			"smash",
			"Drum ceiling",
			{
				limitDb: -.6,
				limitRelease: .03
			}
		],
		[
			"master",
			"Master ceiling",
			{
				limitDb: -1,
				limitRelease: .12
			}
		]
	]),
	sat: six("satOn", [
		[
			"warm",
			"Warm tape",
			{
				satDrive: .28,
				satTone: .45,
				satMix: .55
			}
		],
		[
			"grit",
			"Voice grit",
			{
				satDrive: .18,
				satTone: .6,
				satMix: .4
			}
		],
		[
			"body",
			"Camera body",
			{
				satDrive: .32,
				satTone: .4,
				satMix: .5
			}
		],
		[
			"dirt",
			"Vocal dirt",
			{
				satDrive: .45,
				satTone: .5,
				satMix: .6
			}
		],
		[
			"drums",
			"Drum tape",
			{
				satDrive: .4,
				satTone: .35,
				satMix: .7
			}
		],
		[
			"console",
			"Console",
			{
				satDrive: .16,
				satTone: .55,
				satMix: .35
			}
		]
	]),
	fold: six("foldOn", [
		[
			"light",
			"Light fold",
			{ foldAmt: .28 }
		],
		[
			"hint",
			"Speech edge",
			{ foldAmt: .12 }
		],
		[
			"edge",
			"Cam edge",
			{ foldAmt: .22 }
		],
		[
			"adlib",
			"Adlib fold",
			{ foldAmt: .48 }
		],
		[
			"bass",
			"Bass fold",
			{ foldAmt: .62 }
		],
		[
			"par",
			"Parallel fold",
			{ foldAmt: .35 }
		]
	]),
	crush: six("crushOn", [
		[
			"soft",
			"Soft bits",
			{
				crushBits: 12,
				crushMix: .45
			}
		],
		[
			"hint",
			"Barely crushed",
			{
				crushBits: 13,
				crushMix: .2
			}
		],
		[
			"retro",
			"Retro cam",
			{
				crushBits: 11,
				crushMix: .55
			}
		],
		[
			"grit",
			"808 grit",
			{
				crushBits: 9,
				crushMix: .4
			}
		],
		[
			"lofi",
			"Lo-fi",
			{
				crushBits: 8,
				crushMix: .85
			}
		],
		[
			"color",
			"Bit color",
			{
				crushBits: 14,
				crushMix: .25
			}
		]
	]),
	redux: six("reduxOn", [
		[
			"light",
			"Light steps",
			{ reduxHold: 3 }
		],
		[
			"hint",
			"Almost clean",
			{ reduxHold: 2 }
		],
		[
			"stutter",
			"Stutter hint",
			{ reduxHold: 5 }
		],
		[
			"chop",
			"Vocal chop",
			{ reduxHold: 8 }
		],
		[
			"glitch",
			"Beat glitch",
			{ reduxHold: 14 }
		],
		[
			"texture",
			"Texture",
			{ reduxHold: 4 }
		]
	]),
	exc: six("excOn", [
		[
			"air",
			"DIY air",
			{
				excAmt: .3,
				excFreq: 8e3
			}
		],
		[
			"clear",
			"Speech clear",
			{
				excAmt: .22,
				excFreq: 5e3
			}
		],
		[
			"detail",
			"Cam detail",
			{
				excAmt: .35,
				excFreq: 7e3
			}
		],
		[
			"sheen",
			"Vocal sheen",
			{
				excAmt: .4,
				excFreq: 9e3
			}
		],
		[
			"hats",
			"Hat sparkle",
			{
				excAmt: .28,
				excFreq: 1e4
			}
		],
		[
			"master",
			"Master air",
			{
				excAmt: .18,
				excFreq: 11e3
			}
		]
	]),
	pan: six("panOn", [
		[
			"drift",
			"Slow drift",
			{
				panRate: .2,
				panDepth: .25
			}
		],
		[
			"still",
			"Stay centered",
			{
				panRate: .15,
				panDepth: .08
			}
		],
		[
			"move",
			"Gentle move",
			{
				panRate: .35,
				panDepth: .3
			}
		],
		[
			"adlib",
			"Adlib sweep",
			{
				panRate: .8,
				panDepth: .55
			}
		],
		[
			"perc",
			"Perc motion",
			{
				panRate: 1.6,
				panDepth: .7
			}
		],
		[
			"wide",
			"Wide motion",
			{
				panRate: .25,
				panDepth: .4
			}
		]
	]),
	trem: six("tremOn", [
		[
			"soft",
			"Soft pulse",
			{
				tremRate: 3,
				tremDepth: .25
			}
		],
		[
			"still",
			"Almost still",
			{
				tremRate: 1.5,
				tremDepth: .08
			}
		],
		[
			"emph",
			"Emphasis",
			{
				tremRate: 2.2,
				tremDepth: .3
			}
		],
		[
			"chop",
			"Chop feel",
			{
				tremRate: 5.5,
				tremDepth: .45
			}
		],
		[
			"pump",
			"Level pump",
			{
				tremRate: 4,
				tremDepth: .55
			}
		],
		[
			"vintage",
			"Vintage",
			{
				tremRate: 2.8,
				tremDepth: .2
			}
		]
	]),
	chorus: six("chorusOn", [
		[
			"wide",
			"Wide vocal",
			{
				chorusRate: .3,
				chorusDepth: .35,
				chorusMix: .2
			}
		],
		[
			"thick",
			"Slight thick",
			{
				chorusRate: .15,
				chorusDepth: .12,
				chorusMix: .08
			}
		],
		[
			"guitar",
			"Cam guitar",
			{
				chorusRate: .4,
				chorusDepth: .4,
				chorusMix: .25
			}
		],
		[
			"double",
			"Doubler",
			{
				chorusRate: .2,
				chorusDepth: .25,
				chorusMix: .18
			}
		],
		[
			"pad",
			"Pad wash",
			{
				chorusRate: .12,
				chorusDepth: .7,
				chorusMix: .4
			}
		],
		[
			"hint",
			"Subtle chorus",
			{
				chorusRate: .25,
				chorusDepth: .2,
				chorusMix: .12
			}
		]
	]),
	flange: six("flangeOn", [
		[
			"light",
			"Light jet",
			{
				flangeRate: .18,
				flangeDepth: .4,
				flangeFb: .2,
				flangeMix: .25
			}
		],
		[
			"tiny",
			"Tiny move",
			{
				flangeRate: .08,
				flangeDepth: .15,
				flangeFb: .1,
				flangeMix: .08
			}
		],
		[
			"whoosh",
			"Whoosh",
			{
				flangeRate: .3,
				flangeDepth: .55,
				flangeFb: .25,
				flangeMix: .35
			}
		],
		[
			"throw",
			"Vocal throw",
			{
				flangeRate: .12,
				flangeDepth: .5,
				flangeFb: .35,
				flangeMix: .3
			}
		],
		[
			"jet",
			"Drum jet",
			{
				flangeRate: .22,
				flangeDepth: .75,
				flangeFb: .45,
				flangeMix: .4
			}
		],
		[
			"hint",
			"Soft flange",
			{
				flangeRate: .1,
				flangeDepth: .35,
				flangeFb: .22,
				flangeMix: .18
			}
		]
	]),
	phaser: six("phaserOn", [
		[
			"wash",
			"Slow wash",
			{
				phaserRate: .12,
				phaserDepth: .55,
				phaserMix: .35
			}
		],
		[
			"hint",
			"Barely there",
			{
				phaserRate: .08,
				phaserDepth: .25,
				phaserMix: .1
			}
		],
		[
			"move",
			"Cam motion",
			{
				phaserRate: .25,
				phaserDepth: .6,
				phaserMix: .3
			}
		],
		[
			"vocal",
			"Vocal phase",
			{
				phaserRate: .15,
				phaserDepth: .7,
				phaserMix: .28
			}
		],
		[
			"sweep",
			"Synth sweep",
			{
				phaserRate: .4,
				phaserDepth: .85,
				phaserMix: .45
			}
		],
		[
			"sheen",
			"Master sheen",
			{
				phaserRate: .08,
				phaserDepth: .4,
				phaserMix: .15
			}
		]
	]),
	delay: six("delayOn", [
		[
			"slap",
			"Slap",
			{
				delayMs: 90,
				delayFb: .15,
				delayMix: .18,
				delayTone: 5e3
			}
		],
		[
			"room",
			"Room slap",
			{
				delayMs: 60,
				delayFb: .08,
				delayMix: .1,
				delayTone: 3500
			}
		],
		[
			"throw",
			"Throw",
			{
				delayMs: 180,
				delayFb: .28,
				delayMix: .22,
				delayTone: 4500
			}
		],
		[
			"eighth",
			"Vocal eighth",
			{
				delayMs: 280,
				delayFb: .35,
				delayMix: .28,
				delayTone: 5500
			}
		],
		[
			"dub",
			"Dub throw",
			{
				delayMs: 360,
				delayFb: .5,
				delayMix: .32,
				delayTone: 3200
			}
		],
		[
			"note",
			"Short note",
			{
				delayMs: 220,
				delayFb: .28,
				delayMix: .18,
				delayTone: 6e3
			}
		]
	]),
	verb: six("verbOn", [
		[
			"room",
			"Small room",
			{
				verbSize: .28,
				verbDamp: .55,
				verbMix: .16,
				verbPre: .012
			}
		],
		[
			"booth",
			"Tight booth",
			{
				verbSize: .18,
				verbDamp: .7,
				verbMix: .08,
				verbPre: .008
			}
		],
		[
			"live",
			"Living room",
			{
				verbSize: .4,
				verbDamp: .5,
				verbMix: .2,
				verbPre: .02
			}
		],
		[
			"plate",
			"Vocal plate",
			{
				verbSize: .55,
				verbDamp: .45,
				verbMix: .22,
				verbPre: .028
			}
		],
		[
			"snare",
			"Snare room",
			{
				verbSize: .32,
				verbDamp: .4,
				verbMix: .18,
				verbPre: .01
			}
		],
		[
			"mix",
			"Mix plate",
			{
				verbSize: .62,
				verbDamp: .55,
				verbMix: .14,
				verbPre: .024
			}
		]
	]),
	wow: six("wowOn", [
		[
			"drift",
			"Light drift",
			{
				wowRate: .35,
				wowDepth: .3,
				wowMix: .4
			}
		],
		[
			"stable",
			"Almost stable",
			{
				wowRate: .2,
				wowDepth: .08,
				wowMix: .15
			}
		],
		[
			"hand",
			"Handheld",
			{
				wowRate: .5,
				wowDepth: .35,
				wowMix: .3
			}
		],
		[
			"tape",
			"Tape vocal",
			{
				wowRate: .4,
				wowDepth: .45,
				wowMix: .5
			}
		],
		[
			"vinyl",
			"Vinyl",
			{
				wowRate: .28,
				wowDepth: .6,
				wowMix: .7
			}
		],
		[
			"master",
			"Master tape",
			{
				wowRate: .22,
				wowDepth: .2,
				wowMix: .25
			}
		]
	])
};
function hz(v) {
	if (v >= 1e3) {
		const k = v / 1e3;
		return `${k >= 10 ? k.toFixed(0) : k.toFixed(1)} kHz`;
	}
	return `${Math.round(v)} Hz`;
}
function rackDb(v) {
	const n = Math.abs(v) < .05 ? "0.0" : v.toFixed(1);
	if (n === "0.0") return "0.0";
	return `${v > 0 ? "+" : ""}${n}`;
}
function rackPct(v) {
	return `${Math.round(v * 100)}%`;
}
var HZ = { format: hz };
var DB = { format: rackDb };
var RACK_TABS = [
	{
		id: "shape",
		label: "Shape"
	},
	{
		id: "dynamics",
		label: "Dynamics"
	},
	{
		id: "color",
		label: "Color"
	},
	{
		id: "space",
		label: "Space"
	}
];
var RACK_MODULES = [
	{
		id: "hpf",
		name: "HPF",
		hint: "Rumble",
		tab: "shape",
		power: "hpfOn",
		knobs: [{
			key: "hpfHz",
			label: "Freq",
			min: 20,
			max: 800,
			step: 1,
			...HZ
		}, {
			key: "hpfQ",
			label: "Q",
			min: .3,
			max: 2.5,
			step: .01,
			format: (v) => v.toFixed(2)
		}]
	},
	{
		id: "lp",
		name: "Lid",
		hint: "Air cut",
		tab: "shape",
		power: "lpOn",
		knobs: [{
			key: "lpHz",
			label: "Freq",
			min: 200,
			max: 18e3,
			step: 10,
			...HZ
		}, {
			key: "lpQ",
			label: "Q",
			min: .3,
			max: 2.5,
			step: .01,
			format: (v) => v.toFixed(2)
		}]
	},
	{
		id: "eq",
		name: "EQ",
		hint: "Four bands",
		tab: "shape",
		power: "eqOn",
		knobs: [
			{
				key: "eqLow",
				label: "Low",
				min: -12,
				max: 12,
				step: .1,
				...DB
			},
			{
				key: "eqBody",
				label: "Body",
				min: -12,
				max: 12,
				step: .1,
				...DB
			},
			{
				key: "eqPresence",
				label: "Presence",
				min: -12,
				max: 12,
				step: .1,
				...DB
			},
			{
				key: "eqAir",
				label: "Air",
				min: -12,
				max: 12,
				step: .1,
				...DB
			}
		]
	},
	{
		id: "tilt",
		name: "Tilt",
		hint: "Low against air",
		tab: "shape",
		power: "tiltOn",
		knobs: [{
			key: "tilt",
			label: "Tilt",
			min: -8,
			max: 8,
			step: .1,
			...DB
		}]
	},
	{
		id: "bell",
		name: "Bell",
		hint: "Sweepable",
		tab: "shape",
		power: "bellOn",
		knobs: [
			{
				key: "bellHz",
				label: "Freq",
				min: 80,
				max: 12e3,
				step: 1,
				...HZ
			},
			{
				key: "bellDb",
				label: "Gain",
				min: -12,
				max: 12,
				step: .1,
				...DB
			},
			{
				key: "bellQ",
				label: "Q",
				min: .4,
				max: 8,
				step: .1,
				format: (v) => v.toFixed(1)
			}
		]
	},
	{
		id: "width",
		name: "Imager",
		hint: "Mid / side",
		tab: "shape",
		power: "widthOn",
		knobs: [{
			key: "width",
			label: "Width",
			min: 0,
			max: 2,
			step: .01,
			format: (v) => `${Math.round(v * 100)}%`
		}]
	},
	{
		id: "deess",
		name: "De-ess",
		hint: "Sibilance",
		tab: "dynamics",
		power: "deessOn",
		knobs: [{
			key: "deessHz",
			label: "Freq",
			min: 3e3,
			max: 12e3,
			step: 10,
			...HZ
		}, {
			key: "deessAmt",
			label: "Amount",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}]
	},
	{
		id: "comp",
		name: "Comp",
		hint: "Level",
		tab: "dynamics",
		power: "compOn",
		knobs: [
			{
				key: "compThresh",
				label: "Thresh",
				min: -40,
				max: 0,
				step: .1,
				...DB
			},
			{
				key: "compRatio",
				label: "Ratio",
				min: 1,
				max: 12,
				step: .1,
				format: (v) => `${v.toFixed(1)}:1`
			},
			{
				key: "compAttack",
				label: "Attack",
				min: .001,
				max: .08,
				step: .001,
				format: (v) => `${Math.round(v * 1e3)} ms`
			},
			{
				key: "compRelease",
				label: "Release",
				min: .03,
				max: .4,
				step: .01,
				format: (v) => `${Math.round(v * 1e3)} ms`
			},
			{
				key: "compMakeup",
				label: "Makeup",
				min: 0,
				max: 8,
				step: .1,
				...DB
			}
		]
	},
	{
		id: "punch",
		name: "Punch",
		hint: "Attack",
		tab: "dynamics",
		power: "punchOn",
		knobs: [{
			key: "punch",
			label: "Amount",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}, {
			key: "punchAttack",
			label: "Attack",
			min: .001,
			max: .08,
			step: .001,
			format: (v) => `${Math.round(v * 1e3)} ms`
		}]
	},
	{
		id: "gate",
		name: "Gate",
		hint: "Hysteresis",
		tab: "dynamics",
		power: "gateOn",
		knobs: [
			{
				key: "gateThresh",
				label: "Thresh",
				min: -60,
				max: -12,
				step: .1,
				...DB
			},
			{
				key: "gateRange",
				label: "Range",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "gateAttack",
				label: "Attack",
				min: .001,
				max: .04,
				step: .001,
				format: (v) => `${Math.round(v * 1e3)} ms`
			},
			{
				key: "gateRelease",
				label: "Release",
				min: .02,
				max: .4,
				step: .01,
				format: (v) => `${Math.round(v * 1e3)} ms`
			}
		]
	},
	{
		id: "limit",
		name: "Limit",
		hint: "Ceiling",
		tab: "dynamics",
		power: "limitOn",
		knobs: [{
			key: "limitDb",
			label: "Ceil",
			min: -6,
			max: -.3,
			step: .1,
			...DB
		}, {
			key: "limitRelease",
			label: "Release",
			min: .02,
			max: .3,
			step: .01,
			format: (v) => `${Math.round(v * 1e3)} ms`
		}]
	},
	{
		id: "sat",
		name: "Sat",
		hint: "4x oversample",
		tab: "color",
		power: "satOn",
		knobs: [
			{
				key: "satDrive",
				label: "Drive",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "satTone",
				label: "Tone",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "satMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "fold",
		name: "Fold",
		hint: "4x wavefold",
		tab: "color",
		power: "foldOn",
		knobs: [{
			key: "foldAmt",
			label: "Amount",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}]
	},
	{
		id: "crush",
		name: "Crush",
		hint: "Bit depth",
		tab: "color",
		power: "crushOn",
		knobs: [{
			key: "crushBits",
			label: "Bits",
			min: 5,
			max: 14,
			step: 1,
			format: (v) => `${Math.round(v)} bit`
		}, {
			key: "crushMix",
			label: "Mix",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}]
	},
	{
		id: "redux",
		name: "Hold",
		hint: "Sample steps",
		tab: "color",
		power: "reduxOn",
		knobs: [{
			key: "reduxHold",
			label: "Hold",
			min: 2,
			max: 24,
			step: 1,
			format: (v) => `${Math.round(v)} smp`
		}]
	},
	{
		id: "exc",
		name: "Exciter",
		hint: "High harmonics",
		tab: "color",
		power: "excOn",
		knobs: [{
			key: "excAmt",
			label: "Amount",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}, {
			key: "excFreq",
			label: "Band",
			min: 2e3,
			max: 12e3,
			step: 10,
			...HZ
		}]
	},
	{
		id: "pan",
		name: "Auto Pan",
		hint: "Even level",
		tab: "color",
		power: "panOn",
		knobs: [{
			key: "panRate",
			label: "Rate",
			min: .05,
			max: 6,
			step: .01,
			format: (v) => `${v.toFixed(2)} Hz`
		}, {
			key: "panDepth",
			label: "Depth",
			min: 0,
			max: 1,
			step: .01,
			format: rackPct
		}]
	},
	{
		id: "trem",
		name: "Tremolo",
		hint: "No phase flip",
		tab: "color",
		power: "tremOn",
		knobs: [{
			key: "tremRate",
			label: "Rate",
			min: .2,
			max: 12,
			step: .01,
			format: (v) => `${v.toFixed(2)} Hz`
		}, {
			key: "tremDepth",
			label: "Depth",
			min: 0,
			max: .9,
			step: .01,
			format: rackPct
		}]
	},
	{
		id: "chorus",
		name: "Chorus",
		hint: "Stereo",
		tab: "space",
		power: "chorusOn",
		knobs: [
			{
				key: "chorusRate",
				label: "Rate",
				min: .05,
				max: 3,
				step: .01,
				format: (v) => `${v.toFixed(2)} Hz`
			},
			{
				key: "chorusDepth",
				label: "Depth",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "chorusMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "flange",
		name: "Flanger",
		hint: "Filtered feedback",
		tab: "space",
		power: "flangeOn",
		knobs: [
			{
				key: "flangeRate",
				label: "Rate",
				min: .05,
				max: 3,
				step: .01,
				format: (v) => `${v.toFixed(2)} Hz`
			},
			{
				key: "flangeDepth",
				label: "Depth",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "flangeFb",
				label: "Feedback",
				min: 0,
				max: .55,
				step: .01,
				format: rackPct
			},
			{
				key: "flangeMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "phaser",
		name: "Phaser",
		hint: "Four stage",
		tab: "space",
		power: "phaserOn",
		knobs: [
			{
				key: "phaserRate",
				label: "Rate",
				min: .05,
				max: 2,
				step: .01,
				format: (v) => `${v.toFixed(2)} Hz`
			},
			{
				key: "phaserDepth",
				label: "Depth",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "phaserMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "delay",
		name: "Delay",
		hint: "Filtered echo",
		tab: "space",
		power: "delayOn",
		knobs: [
			{
				key: "delayMs",
				label: "Time",
				min: 40,
				max: 800,
				step: 1,
				format: (v) => `${Math.round(v)} ms`
			},
			{
				key: "delayFb",
				label: "Feedback",
				min: 0,
				max: .7,
				step: .01,
				format: rackPct
			},
			{
				key: "delayTone",
				label: "Tone",
				min: 800,
				max: 14e3,
				step: 10,
				...HZ
			},
			{
				key: "delayMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "verb",
		name: "Plate",
		hint: "Damped tail",
		tab: "space",
		power: "verbOn",
		knobs: [
			{
				key: "verbSize",
				label: "Size",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "verbDamp",
				label: "Damp",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "verbPre",
				label: "Pre",
				min: 0,
				max: .08,
				step: .001,
				format: (v) => `${Math.round(v * 1e3)} ms`
			},
			{
				key: "verbMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	},
	{
		id: "wow",
		name: "Wow",
		hint: "Tape drift",
		tab: "space",
		power: "wowOn",
		knobs: [
			{
				key: "wowRate",
				label: "Rate",
				min: .1,
				max: 2,
				step: .01,
				format: (v) => `${v.toFixed(2)} Hz`
			},
			{
				key: "wowDepth",
				label: "Depth",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			},
			{
				key: "wowMix",
				label: "Mix",
				min: 0,
				max: 1,
				step: .01,
				format: rackPct
			}
		]
	}
];
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
function RackKnob({ label, value, min, max, step, format, reset, onChange }) {
	const t = (clamp(value, min, max) - min) / (max - min || 1);
	const deg = -140 + t * 280;
	const drag = (0, import_react.useRef)(null);
	const set = (next) => {
		const snapped = Math.round((next - min) / step) * step + min;
		onChange(clamp(Number(snapped.toFixed(4)), min, max));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "rack-knob flex min-h-11 min-w-14 flex-col items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
		"aria-label": label,
		role: "slider",
		"aria-valuemin": min,
		"aria-valuemax": max,
		"aria-valuenow": Number(value.toFixed(3)),
		"aria-valuetext": format(value),
		onDoubleClick: () => onChange(reset),
		onKeyDown: (e) => {
			const dir = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
			if (!dir) return;
			e.preventDefault();
			const span = (max - min) / 48 * (e.shiftKey ? .25 : 1) * dir;
			set(value + span);
		},
		onPointerDown: (e) => {
			drag.current = {
				y: e.clientY,
				v: value
			};
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerMove: (e) => {
			const start = drag.current;
			if (!start) return;
			const dy = start.y - e.clientY;
			const span = max - min;
			const fine = e.shiftKey ? .25 : 1;
			set(start.v + dy / 140 * span * fine);
		},
		onPointerUp: () => {
			drag.current = null;
		},
		onPointerCancel: () => {
			drag.current = null;
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rack-knob-bezel",
				style: { ["--knob-turn"]: t.toFixed(4) },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rack-knob-cap relative",
					style: { transform: `rotate(${deg}deg)` },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-knob-mark" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs tabular text-fg",
				children: format(value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-subtle",
				children: label
			})
		]
	});
}
function RackPlates({ tab, params, active, onParams, onPreset }) {
	const modules = RACK_MODULES.filter((m) => m.tab === tab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3 xl:grid-cols-2",
		children: modules.map((mod) => {
			const on = Boolean(params[mod.power]);
			const presets = MODULE_PRESETS[mod.id] ?? [];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: cn("rack-plate p-3 pt-4", `rack-face-${tab}`, on ? "rack-plate-on" : "rack-plate-off"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs uppercase tracking-label text-subtle",
								children: tab
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mb-3 flex min-h-11 w-full items-center gap-2 text-left",
						onClick: () => onParams({
							...params,
							[mod.power]: !on
						}, mod.id),
						"aria-pressed": on,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rack-led", on && "rack-led-on") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-fg",
								children: mod.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto text-xs text-subtle",
								children: mod.hint
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap justify-start gap-3",
						children: mod.knobs.map((knob) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackKnob, {
							label: knob.label,
							value: params[knob.key],
							min: knob.min,
							max: knob.max,
							step: knob.step,
							format: knob.format,
							reset: RACK_INIT[knob.key],
							onChange: (v) => onParams({
								...params,
								[knob.key]: v
							}, mod.id)
						}, knob.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3",
						children: presets.map((preset) => {
							const lit = active[mod.id] === preset.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cn("rack-key", lit && "rack-key-on"),
								"aria-pressed": lit,
								onClick: () => onPreset(mod.id, preset.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs uppercase tracking-label text-subtle",
									children: preset.who
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm text-fg",
									children: preset.name
								})]
							}, preset.id);
						})
					})
				]
			}, mod.id);
		})
	});
}
function paintMeter(nodes, level, readout) {
	const db = level <= 1e-5 ? -60 : 20 * Math.log10(level);
	const norm = clamp((db + 48) / 48, 0, 1);
	const lit = Math.round(norm * nodes.length);
	nodes.forEach((node, i) => {
		const hot = i >= nodes.length - 2;
		const on = i < lit;
		node.className = cn("rack-meter-seg", on && !hot && "rack-meter-seg-on", on && hot && "rack-meter-seg-hot");
	});
	if (readout) readout.textContent = db <= -59 ? "-60" : db.toFixed(1);
}
function RackMeters({ rackRef }) {
	const inn = (0, import_react.useRef)([]);
	const out = (0, import_react.useRef)([]);
	const inRead = (0, import_react.useRef)(null);
	const outRead = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		let inHold = 0;
		let outHold = 0;
		const tick = () => {
			const m = rackRef.current?.readMeters() ?? {
				inn: 0,
				out: 0
			};
			inHold = Math.max(m.inn, inHold * .86);
			outHold = Math.max(m.out, outHold * .86);
			paintMeter(inn.current.filter((n) => Boolean(n)), inHold, inRead.current);
			paintMeter(out.current.filter((n) => Boolean(n)), outHold, outRead.current);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [rackRef]);
	const column = (label, bucket, readout) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rack-meter",
				children: Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
					ref: (el) => {
						bucket.current[i] = el;
					},
					className: "rack-meter-seg"
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				ref: readout,
				className: "text-xs tabular text-fg",
				children: "-60"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-subtle",
				children: label
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-end gap-3",
		children: [column("In", inn, inRead), column("Out", out, outRead)]
	});
}
function RackScope({ rackRef, params }) {
	const ref = (0, import_react.useRef)(null);
	const paramsRef = (0, import_react.useRef)(params);
	paramsRef.current = params;
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		let raf = 0;
		const draw = () => {
			const parent = canvas.parentElement;
			if (!parent) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = parent.clientWidth;
			const h = parent.clientHeight;
			if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
				canvas.width = Math.floor(w * dpr);
				canvas.height = Math.floor(h * dpr);
			}
			const g = canvas.getContext("2d");
			if (!g) return;
			g.setTransform(dpr, 0, 0, dpr, 0, 0);
			g.clearRect(0, 0, w, h);
			const style = getComputedStyle(document.documentElement);
			const accent = style.getPropertyValue("--color-accent").trim() || "#7ecbff";
			const fg = style.getPropertyValue("--color-fg").trim() || "#eef4ff";
			const grid = style.getPropertyValue("--color-border").trim() || "#1c2736";
			const subtle = style.getPropertyValue("--color-subtle").trim() || "#5c6780";
			const sr = rackRef.current?.sampleRate ?? 48e3;
			const minF = 24;
			const maxF = 2e4;
			const dbLo = -18;
			const dbHi = 12;
			const yOf = (db) => {
				return 14 + (dbHi - db) / 30 * (h - 28);
			};
			const xOf = (freq) => {
				return Math.log(freq / minF) / Math.log(maxF / minF) * w;
			};
			g.strokeStyle = grid;
			g.lineWidth = 1;
			g.beginPath();
			for (const db of [
				12,
				6,
				0,
				-6,
				-12
			]) {
				const y = yOf(db);
				g.moveTo(0, y);
				g.lineTo(w, y);
			}
			for (const freq of [
				100,
				1e3,
				1e4
			]) {
				const x = xOf(freq);
				g.moveTo(x, 0);
				g.lineTo(x, h);
			}
			g.stroke();
			g.fillStyle = subtle;
			g.font = "10px IBM Plex Mono, ui-monospace, monospace";
			g.fillText("+12", 6, yOf(12) - 2);
			g.fillText("0", 6, yOf(0) - 2);
			g.fillText("100", xOf(100) + 4, h - 6);
			g.fillText("1k", xOf(1e3) + 4, h - 6);
			g.fillText("10k", xOf(1e4) + 4, h - 6);
			const bins = rackRef.current?.readSpectrum();
			if (bins && bins.length) {
				const nyquist = sr / 2;
				g.beginPath();
				const steps = Math.max(48, Math.floor(w / 3));
				for (let i = 0; i < steps; i++) {
					const freq = minF * Math.pow(maxF / minF, i / (steps - 1));
					const mag = (bins[Math.min(bins.length - 1, Math.round(freq / nyquist * (bins.length - 1)))] ?? 0) / 255;
					const x = i / (steps - 1) * w;
					const y = h - mag * (h - 22) - 8;
					if (i === 0) g.moveTo(x, y);
					else g.lineTo(x, y);
				}
				g.strokeStyle = accent;
				g.lineWidth = 1.25;
				g.stroke();
				g.lineTo(w, h);
				g.lineTo(0, h);
				g.closePath();
				g.fillStyle = accent;
				g.globalAlpha = .14;
				g.fill();
				g.globalAlpha = 1;
			}
			const curve = paramsRef.current;
			g.beginPath();
			const steps = Math.max(64, Math.floor(w / 2));
			for (let i = 0; i < steps; i++) {
				const freq = minF * Math.pow(maxF / minF, i / (steps - 1));
				const db = Math.max(dbLo, Math.min(dbHi, rackCurveDb(curve, freq, sr)));
				const x = i / (steps - 1) * w;
				const y = yOf(db);
				if (i === 0) g.moveTo(x, y);
				else g.lineTo(x, y);
			}
			g.strokeStyle = fg;
			g.lineWidth = 1.75;
			g.stroke();
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [rackRef]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rack-scope relative overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref,
			className: "h-full w-full"
		})
	});
}
var DEFAULT_COMMENT = "Processed with NoDAW Labs FxIT.";
var RELEASE_FORMATS = [
	{
		id: "wav24",
		label: "WAV 24"
	},
	{
		id: "wav16",
		label: "WAV 16"
	},
	{
		id: "mp3-320",
		label: "MP3 320"
	},
	{
		id: "mp3-192",
		label: "MP3 192"
	}
];
function commentWithLink(comment, site) {
	const text = comment.trim();
	const url = site.trim();
	if (!url) return text || "Processed with NoDAW Labs FxIT.";
	if (text.includes(url)) return text;
	if (!text) return url;
	return `${text} ${url}`;
}
function safeBase(name) {
	return name.replace(/[^\w.-]+/g, " ").trim().replace(/\s+/g, " ").slice(0, 80).trim() || "nodaw-fx";
}
async function coverFileToJpeg(file) {
	if (!file.type.startsWith("image/")) throw new Error("Cover needs an image file.");
	if (file.size > 20971520) throw new Error("Cover image is over 20 MB.");
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Could not read the cover image.");
	}
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((next) => next ? resolve(next) : reject(/* @__PURE__ */ new Error("Cover encode failed.")), "image/jpeg", .82);
	});
	return {
		bytes: new Uint8Array(await blob.arrayBuffer()),
		url: URL.createObjectURL(blob)
	};
}
async function encodeRelease(clip, format, meta) {
	const base = safeBase(meta.title || clip.name || "nodaw-fx");
	const comment = commentWithLink(meta.comment || "Processed with NoDAW Labs FxIT.", meta.website);
	const tags = {
		...meta,
		comment
	};
	if (format === "wav24" || format === "wav16") {
		const pcm = encodeWav(clip, format === "wav24" ? 24 : 16, true);
		const bytes = new Uint8Array(await pcm.arrayBuffer());
		return {
			blob: new Blob([tagWav(bytes, tags)], { type: "audio/wav" }),
			filename: `${base}.wav`
		};
	}
	const mp3 = await encodeMp3(clip, format === "mp3-320" ? 320 : 192, tags);
	return {
		blob: new Blob([mp3], { type: "audio/mpeg" }),
		filename: `${base}.mp3`
	};
}
function latin1(value) {
	let out = "";
	for (const ch of value) {
		const code = ch.codePointAt(0) ?? 63;
		if (code === 10 || code === 13) out += " ";
		else if (code >= 32 && code <= 255) out += ch;
		else out += "?";
	}
	return out;
}
function utf16(value) {
	const bytes = new Uint8Array(2 + value.length * 2);
	bytes[0] = 255;
	bytes[1] = 254;
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		bytes[2 + i * 2] = code & 255;
		bytes[3 + i * 2] = code >> 8 & 255;
	}
	return bytes;
}
function keep(parts) {
	const out = [];
	for (const part of parts) if (part) out.push(part);
	return out;
}
function concat(parts) {
	const size = parts.reduce((n, part) => n + part.length, 0);
	const out = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
function frame(id, body) {
	const out = new Uint8Array(10 + body.length);
	out[0] = id.charCodeAt(0);
	out[1] = id.charCodeAt(1);
	out[2] = id.charCodeAt(2);
	out[3] = id.charCodeAt(3);
	new DataView(out.buffer).setUint32(4, body.length, false);
	out.set(body, 10);
	return out;
}
function textFrame(id, value) {
	const text = value.trim();
	if (!text) return null;
	const encoded = utf16(text);
	const body = new Uint8Array(1 + encoded.length);
	body[0] = 1;
	body.set(encoded, 1);
	return frame(id, body);
}
function commFrame(value) {
	const encoded = utf16(value);
	const desc = new Uint8Array([
		255,
		254,
		0,
		0
	]);
	const body = new Uint8Array(4 + desc.length + encoded.length);
	body[0] = 1;
	body[1] = 101;
	body[2] = 110;
	body[3] = 103;
	body.set(desc, 4);
	body.set(encoded, 8);
	return frame("COMM", body);
}
function wxxxFrame(url) {
	const desc = latin1("NoDAW Labs");
	const link = latin1(url);
	const body = new Uint8Array(1 + desc.length + 1 + link.length);
	body[0] = 0;
	for (let i = 0; i < desc.length; i++) body[1 + i] = desc.charCodeAt(i);
	body[1 + desc.length] = 0;
	for (let i = 0; i < link.length; i++) body[2 + desc.length + i] = link.charCodeAt(i);
	return frame("WXXX", body);
}
function apicFrame(jpeg) {
	const mime = "image/jpeg";
	const desc = "Cover";
	const body = new Uint8Array(19 + jpeg.length);
	let offset = 0;
	body[offset++] = 0;
	for (const ch of mime) body[offset++] = ch.charCodeAt(0);
	body[offset++] = 0;
	body[offset++] = 3;
	for (const ch of desc) body[offset++] = ch.charCodeAt(0);
	body[offset++] = 0;
	body.set(jpeg, offset);
	return frame("APIC", body);
}
function buildId3(meta) {
	const year = (meta.year.match(/\d{4}/) ?? [])[0] ?? "";
	const bpm = meta.bpm.trim().replace(/[^\d.]/g, "");
	const body = concat(keep([
		textFrame("TIT2", meta.title),
		textFrame("TPE1", meta.artist),
		textFrame("TALB", meta.album),
		textFrame("TPE2", meta.albumArtist),
		textFrame("TYER", year),
		textFrame("TCON", meta.genre),
		textFrame("TRCK", meta.track),
		textFrame("TBPM", bpm),
		commFrame(meta.comment || "Processed with NoDAW Labs FxIT."),
		meta.website.trim() ? wxxxFrame(meta.website.trim()) : null,
		meta.coverJpeg && meta.coverJpeg.length ? apicFrame(meta.coverJpeg) : null
	]));
	const header = /* @__PURE__ */ new Uint8Array(10);
	header[0] = 73;
	header[1] = 68;
	header[2] = 51;
	header[3] = 3;
	const size = body.length;
	header[6] = size >> 21 & 127;
	header[7] = size >> 14 & 127;
	header[8] = size >> 7 & 127;
	header[9] = size & 127;
	return concat([header, body]);
}
var LAME_RATES = /* @__PURE__ */ new Set([
	8e3,
	11025,
	12e3,
	16e3,
	22050,
	24e3,
	32e3,
	44100,
	48e3
]);
function resampleLinear(input, from, to) {
	if (from === to) return input;
	const n = Math.max(1, Math.round(input.length * to / from));
	const out = new Float32Array(n);
	const ratio = from / to;
	const last = Math.max(0, input.length - 1);
	for (let i = 0; i < n; i++) {
		const x = i * ratio;
		const i0 = Math.min(last, Math.floor(x));
		const i1 = Math.min(last, i0 + 1);
		const frac = x - i0;
		out[i] = (input[i0] ?? 0) + ((input[i1] ?? 0) - (input[i0] ?? 0)) * frac;
	}
	return out;
}
function toInt16(samples) {
	const out = new Int16Array(samples.length);
	for (let i = 0; i < samples.length; i++) {
		let s = samples[i] ?? 0;
		s += (Math.random() + Math.random() - 1) * (1 / 32768);
		s = Math.max(-1, Math.min(1, s));
		out[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
	}
	return out;
}
async function encodeMp3(clip, kbps, meta) {
	const { Mp3Encoder } = await import("../_libs/breezystack__lamejs.mjs").then((n) => n.t);
	const srcRate = clip.sampleRate || 44100;
	const rate = LAME_RATES.has(srcRate) ? srcRate : 44100;
	const left = resampleLinear(clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0), srcRate, rate);
	const rightSrc = clip.channels[1];
	const stereo = Boolean(rightSrc && rightSrc !== clip.channels[0]);
	const right = stereo ? resampleLinear(rightSrc, srcRate, rate) : left;
	const encoder = new Mp3Encoder(stereo ? 2 : 1, rate, kbps);
	const block = 1152;
	const parts = [buildId3(meta)];
	const length = Math.max(left.length, right.length);
	for (let i = 0; i < length; i += block) {
		const l = toInt16(left.subarray(i, Math.min(length, i + block)));
		const chunk = stereo ? encoder.encodeBuffer(l, toInt16(right.subarray(i, Math.min(length, i + block)))) : encoder.encodeBuffer(l);
		if (chunk.length) parts.push(new Uint8Array(chunk));
		if (i / block % 40 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
	}
	const end = encoder.flush();
	if (end.length) parts.push(new Uint8Array(end));
	return concat(parts);
}
function infoChunk(id, value) {
	const text = latin1(value.trim());
	if (!text) return null;
	const dataLen = text.length + 1;
	const pad = dataLen % 2;
	const chunk = new Uint8Array(8 + dataLen + pad);
	chunk[0] = id.charCodeAt(0);
	chunk[1] = id.charCodeAt(1);
	chunk[2] = id.charCodeAt(2);
	chunk[3] = id.charCodeAt(3);
	new DataView(chunk.buffer).setUint32(4, dataLen, true);
	for (let i = 0; i < text.length; i++) chunk[8 + i] = text.charCodeAt(i);
	return chunk;
}
function tagWav(wav, meta) {
	const extras = [
		meta.albumArtist.trim() ? `album artist: ${meta.albumArtist.trim()}` : "",
		meta.track.trim() ? `track: ${meta.track.trim()}` : "",
		meta.bpm.trim() ? `bpm: ${meta.bpm.trim()}` : "",
		meta.website.trim() ? `tool: ${meta.website.trim()}` : ""
	].filter(Boolean).join("; ");
	const year = (meta.year.match(/\d{4}/) ?? [])[0] ?? "";
	const listBody = concat(keep([
		infoChunk("INAM", meta.title),
		infoChunk("IART", meta.artist),
		infoChunk("IPRD", meta.album),
		infoChunk("IGNR", meta.genre),
		infoChunk("ICRD", year),
		infoChunk("ICMT", meta.comment || "Processed with NoDAW Labs FxIT."),
		infoChunk("IKEY", extras),
		infoChunk("ISFT", "NoDAW Labs FxIT")
	]));
	const list = new Uint8Array(12 + listBody.length);
	list[0] = 76;
	list[1] = 73;
	list[2] = 83;
	list[3] = 84;
	new DataView(list.buffer).setUint32(4, 4 + listBody.length, true);
	list[8] = 73;
	list[9] = 78;
	list[10] = 70;
	list[11] = 79;
	list.set(listBody, 12);
	const out = concat([wav, list]);
	new DataView(out.buffer).setUint32(4, out.length - 8, true);
	return out;
}
var GENRES = [
	"Hip-Hop",
	"R&B",
	"Pop",
	"Electronic",
	"Rock",
	"Podcast",
	"Speech"
];
var META_INIT = {
	title: "",
	artist: "",
	album: "",
	albumArtist: "",
	year: "",
	genre: "",
	track: "",
	bpm: "",
	comment: DEFAULT_COMMENT,
	website: ""
};
function FxPage() {
	const clip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const rackRef = (0, import_react.useRef)(null);
	const bypassRef = (0, import_react.useRef)(false);
	const titleTouched = (0, import_react.useRef)(false);
	const siteTouched = (0, import_react.useRef)(false);
	const [params, setParams] = (0, import_react.useState)(RACK_INIT);
	const [tab, setTab] = (0, import_react.useState)("shape");
	const [group, setGroup] = (0, import_react.useState)("bus");
	const [presetId, setPresetId] = (0, import_react.useState)(null);
	const [modKey, setModKey] = (0, import_react.useState)({});
	const [bypass, setBypass] = (0, import_react.useState)(false);
	const [loop, setLoop] = (0, import_react.useState)(true);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [current, setCurrent] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [encoding, setEncoding] = (0, import_react.useState)(false);
	const [printed, setPrinted] = (0, import_react.useState)(null);
	const [format, setFormat] = (0, import_react.useState)("mp3-320");
	const [meta, setMeta] = (0, import_react.useState)(META_INIT);
	const [coverUrl, setCoverUrl] = (0, import_react.useState)(null);
	const [saveFile, setSaveFile] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		import("../_libs/breezystack__lamejs.mjs").then((n) => n.t);
		const rack = new FxRack();
		rackRef.current = rack;
		rack.setLoop(true);
		rack.setParams(RACK_INIT);
		const id = window.setInterval(() => {
			setPlaying(rack.isPlaying);
			setCurrent(rack.position);
		}, 50);
		return () => {
			window.clearInterval(id);
			rack.dispose();
			rackRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		rackRef.current?.setClip(clip);
		setPrinted(null);
	}, [clip]);
	(0, import_react.useEffect)(() => {
		if (titleTouched.current || !clip) return;
		setMeta((m) => ({
			...m,
			title: clip.name
		}));
	}, [clip]);
	(0, import_react.useEffect)(() => {
		if (siteTouched.current) return;
		setMeta((m) => m.website ? m : {
			...m,
			website: window.location.origin
		});
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			if (coverUrl) URL.revokeObjectURL(coverUrl);
		};
	}, [coverUrl]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (saveFile) URL.revokeObjectURL(saveFile.url);
		};
	}, [saveFile]);
	const push = (next, touched) => {
		setParams(next);
		setPrinted(null);
		if (touched) setModKey((k) => k[touched] ? {
			...k,
			[touched]: ""
		} : k);
		rackRef.current?.setParams(bypassRef.current ? {
			...next,
			mix: 0
		} : next);
	};
	const loadPreset = (id) => {
		unlockAudio();
		const preset = RACK_PRESETS.find((p) => p.id === id);
		if (!preset) return;
		const next = {
			...RACK_INIT,
			...preset.params
		};
		bypassRef.current = false;
		setBypass(false);
		setPresetId(id);
		setModKey({});
		push(next);
		if (clip) rackRef.current?.play();
	};
	const applyModule = (modId, presetIdNext) => {
		unlockAudio();
		const preset = MODULE_PRESETS[modId]?.find((p) => p.id === presetIdNext);
		if (!preset) return;
		bypassRef.current = false;
		setBypass(false);
		setPresetId(null);
		setModKey((k) => ({
			...k,
			[modId]: presetIdNext
		}));
		push({
			...params,
			...preset.params
		});
		if (clip) rackRef.current?.play();
	};
	const toggleBypass = () => {
		const next = !bypassRef.current;
		bypassRef.current = next;
		setBypass(next);
		setPrinted(null);
		rackRef.current?.setParams(next ? {
			...params,
			mix: 0
		} : params);
	};
	const patchMeta = (key, value) => {
		if (key === "title") titleTouched.current = true;
		if (key === "website") siteTouched.current = true;
		setMeta((m) => ({
			...m,
			[key]: value
		}));
	};
	const renderRack = async () => {
		if (!clip) {
			toast.error("Drop a file or load the demo first.");
			return;
		}
		setBusy(true);
		try {
			const out = await printRack(clip, bypassRef.current ? {
				...params,
				mix: 0
			} : params);
			setPrinted(out);
			toast.success("Rendered. Download writes the file.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Render failed.");
		} finally {
			setBusy(false);
		}
	};
	const download = async () => {
		if (!printed) {
			toast.error("Render first, then download.");
			return;
		}
		setEncoding(true);
		try {
			const website = siteTouched.current ? meta.website : meta.website || window.location.origin;
			const file = await encodeRelease(printed, format, {
				...meta,
				website
			});
			const activation = navigator.userActivation;
			const gesture = activation ? activation.isActive : true;
			if (gesture) downloadBlob(file.blob, file.filename);
			setSaveFile((prev) => {
				if (prev) URL.revokeObjectURL(prev.url);
				return {
					url: URL.createObjectURL(file.blob),
					filename: file.filename
				};
			});
			toast.success(gesture ? `Saved ${file.filename}` : `Tap Save to keep ${file.filename}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Download failed.");
		} finally {
			setEncoding(false);
		}
	};
	const onCover = async (file) => {
		if (!file) return;
		try {
			const next = await coverFileToJpeg(file);
			setCoverUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return next.url;
			});
			setMeta((m) => ({
				...m,
				coverJpeg: next.bytes
			}));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Cover failed.");
		}
	};
	const clearCover = () => {
		setCoverUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setMeta((m) => ({
			...m,
			coverJpeg: null
		}));
	};
	const presets = RACK_PRESETS.filter((p) => p.group === group);
	const mp3 = format.startsWith("mp3");
	const written = commentWithLink(meta.comment, meta.website);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "fx" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
				compact: true,
				label: "Drop audio into the rack"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rack-shell relative min-w-0 p-3 sm:p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute left-3 top-3 flex gap-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute right-3 top-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap items-end justify-between gap-3 pl-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "kicker text-nag",
							children: "Newton AntiGravity · Live rack"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 max-w-md text-xs leading-relaxed text-muted",
							children: "Slap a preset if the knobs are new. The curve is the EQ. The fill is the input. Render bakes this chain. Download writes the file. Audio stays on this device."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackMeters, { rackRef }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: toggleBypass,
								className: cn("rack-bank mb-4", bypass && "rack-bank-on"),
								"aria-pressed": bypass,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rack-led mr-2", bypass && "rack-led-on") }), "Bypass"]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex max-w-full gap-2 overflow-x-auto pb-1",
						children: RACK_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setGroup(g.id),
							className: cn("rack-bank", group === g.id && "rack-bank-on"),
							children: g.label
						}, g.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex max-w-full gap-2 overflow-x-auto pb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								bypassRef.current = false;
								setBypass(false);
								setPresetId(null);
								setModKey({});
								push(RACK_INIT);
							},
							className: "rack-key shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs uppercase tracking-label text-subtle",
								children: "Rack"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm text-fg",
								children: "Init"
							})]
						}), presets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => loadPreset(p.id),
							className: cn("rack-key shrink-0", presetId === p.id && "rack-key-on"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm text-fg",
								children: p.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs text-subtle",
								children: p.blurb
							})]
						}, p.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackScope, {
						rackRef,
						params
					}),
					clip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
							clip,
							playhead: current,
							onSeek: (t) => rackRef.current?.seek(t)
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Load audio. The rack stays on this device."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex max-w-full gap-2 overflow-x-auto",
						children: RACK_TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: cn("rack-bank", `rack-bank-${item.id}`, tab === item.id && "rack-bank-on"),
							children: item.label
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackPlates, {
							tab,
							params,
							active: modKey,
							onParams: push,
							onPreset: applyModule
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
								playing,
								current,
								duration: clip?.duration ?? 0,
								disabled: !clip,
								onPlay: () => {
									unlockAudio();
									if (!clip) {
										toast.error("Drop a file or load the demo first.");
										return;
									}
									rackRef.current?.play();
								},
								onPause: () => rackRef.current?.pause(),
								onStop: () => rackRef.current?.stop()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const next = !loop;
									setLoop(next);
									rackRef.current?.setLoop(next);
								},
								className: cn("rack-bank", loop && "rack-bank-on"),
								"aria-pressed": loop,
								children: "Loop"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackKnob, {
								label: "In",
								value: params.inputDb,
								min: -12,
								max: 12,
								step: .1,
								format: rackDb,
								reset: 0,
								onChange: (v) => push({
									...params,
									inputDb: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackKnob, {
								label: "Mix",
								value: params.mix,
								min: 0,
								max: 1,
								step: .01,
								format: rackPct,
								reset: 1,
								onChange: (v) => {
									if (bypassRef.current) {
										bypassRef.current = false;
										setBypass(false);
									}
									push({
										...params,
										mix: v
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RackKnob, {
								label: "Out",
								value: params.outputDb,
								min: -12,
								max: 6,
								step: .1,
								format: rackDb,
								reset: 0,
								onChange: (v) => push({
									...params,
									outputDb: v
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rack-bay",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-end justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "kicker text-accent",
									children: "Release"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 max-w-lg text-xs leading-relaxed text-muted",
									children: "Render bakes the sound you hear. Download encodes it with these tags. Cover art is written into MP3. WAV keeps the text tags. The comment carries a link to this tool."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex max-w-full gap-2 overflow-x-auto",
									children: RELEASE_FORMATS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setFormat(item.id),
										className: cn("rack-bank", format === item.id && "rack-bank-on"),
										"aria-pressed": format === item.id,
										children: item.label
									}, item.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Title",
										value: meta.title,
										onChange: (v) => patchMeta("title", v)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Artist",
										value: meta.artist,
										onChange: (v) => patchMeta("artist", v)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Album",
										value: meta.album,
										onChange: (v) => patchMeta("album", v)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Album artist",
										value: meta.albumArtist,
										onChange: (v) => patchMeta("albumArtist", v)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Year",
										value: meta.year,
										onChange: (v) => patchMeta("year", v),
										inputMode: "numeric"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Genre",
										value: meta.genre,
										onChange: (v) => patchMeta("genre", v)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "Track",
										value: meta.track,
										onChange: (v) => patchMeta("track", v),
										placeholder: "1 or 1/12"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaField, {
										label: "BPM",
										value: meta.bpm,
										onChange: (v) => patchMeta("bpm", v),
										inputMode: "decimal"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: GENRES.map((genre) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("rack-key", meta.genre === genre && "rack-key-on"),
									onClick: () => patchMeta("genre", genre),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-fg",
										children: genre
									})
								}, genre))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 flex min-w-0 flex-col gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-subtle",
									children: "Comments"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									className: "rack-field",
									value: meta.comment,
									rows: 3,
									onChange: (e) => patchMeta("comment", e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 flex min-w-0 flex-col gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-subtle",
									children: "Tool link"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "rack-field",
									value: meta.website,
									onChange: (e) => patchMeta("website", e.target.value),
									inputMode: "url",
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs leading-relaxed text-subtle",
								children: ["Written comment: ", written]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-3",
								children: [coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: coverUrl,
									alt: "Cover preview",
									className: "rack-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rack-cover-well",
									children: "No cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 flex-1 flex-col gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs leading-relaxed text-muted",
										children: mp3 ? "This image is embedded in the MP3 as cover art." : "Switch to MP3 to embed the cover. WAV keeps the text tags only."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "rack-key cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm text-fg",
												children: coverUrl ? "Replace cover" : "Attach cover"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												accept: "image/*",
												className: "sr-only",
												onChange: (e) => {
													const file = e.target.files?.[0];
													e.target.value = "";
													onCover(file);
												}
											})]
										}), coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "rack-key",
											onClick: clearCover,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm text-fg",
												children: "Clear cover"
											})
										}) : null]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "lg",
										variant: printed ? "secondary" : "default",
										disabled: !clip || busy || encoding,
										onClick: () => void renderRack(),
										children: busy ? "Rendering" : "Render"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "lg",
										variant: printed ? "default" : "secondary",
										disabled: !printed || busy || encoding,
										onClick: () => void download(),
										children: encoding ? "Encoding" : "Download"
									}),
									saveFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "rack-key inline-flex items-center",
										href: saveFile.url,
										download: saveFile.filename,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm text-fg",
											children: ["Save ", saveFile.filename]
										})
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "lg",
										variant: "outline",
										disabled: !printed || busy,
										onClick: () => {
											if (!printed) return;
											rackRef.current?.stop();
											setClip(printed);
											toast.success("Render is on the bench.");
										},
										children: "To bench"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-subtle",
								children: printed ? "Download uses this render. Move a knob and Render again." : "Download stays dark until this rack is rendered."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none mt-3 flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rack-screw" })]
					})
				]
			})
		]
	});
}
function MetaField({ label, value, onChange, placeholder, inputMode }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex min-w-0 flex-col gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "rack-field",
			value,
			placeholder,
			inputMode,
			onChange: (e) => onChange(e.target.value)
		})]
	});
}
//#endregion
export { FxPage as component };

import { i as makeClip } from "./types-DyJMjOBu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dsp-23YL4nsk.js
function dbToGain(db) {
	return Math.pow(10, db / 20);
}
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
function mixToMono(clip) {
	const n = clip.channels[0]?.length ?? 0;
	const out = new Float32Array(n);
	const ch = clip.channels.length || 1;
	for (let c = 0; c < clip.channels.length; c++) {
		const src = clip.channels[c];
		for (let i = 0; i < n; i++) out[i] += src[i] / ch;
	}
	return out;
}
function peakOf(channels) {
	let p = 0;
	for (const ch of channels) for (let i = 0; i < ch.length; i++) {
		const a = Math.abs(ch[i]);
		if (a > p) p = a;
	}
	return p;
}
function applyGain(clip, gain, name = clip.name) {
	return makeClip(name, clip.sampleRate, clip.channels.map((ch) => {
		const o = new Float32Array(ch.length);
		for (let i = 0; i < ch.length; i++) o[i] = ch[i] * gain;
		return o;
	}));
}
function sliceClip(clip, startSec, endSec, name = clip.name) {
	const a = clamp(Math.floor(startSec * clip.sampleRate), 0, frameCountSafe(clip));
	const b = clamp(Math.floor(endSec * clip.sampleRate), a + 1, frameCountSafe(clip));
	return makeClip(name, clip.sampleRate, clip.channels.map((ch) => ch.subarray(a, b).slice()));
}
function frameCountSafe(clip) {
	return clip.channels[0]?.length ?? 0;
}
function nearestZeroCrossing(ch, index) {
	const n = ch.length;
	const i0 = clamp(index, 1, n - 2);
	let best = i0;
	let bestAbs = Math.abs(ch[i0]);
	const window = Math.min(2048, n - 2);
	for (let d = 1; d < window; d++) for (const i of [i0 - d, i0 + d]) {
		if (i <= 0 || i >= n - 1) continue;
		if (!(ch[i] === 0 || ch[i] * ch[i - 1] <= 0)) continue;
		const a = Math.abs(ch[i]);
		if (a < bestAbs) {
			bestAbs = a;
			best = i;
			if (a < 1e-5) return i;
		}
	}
	return best;
}
function applyFades(clip, fadeInSec, fadeOutSec) {
	const n = frameCountSafe(clip);
	const fi = Math.min(n, Math.floor(fadeInSec * clip.sampleRate));
	const fo = Math.min(n, Math.floor(fadeOutSec * clip.sampleRate));
	return makeClip(clip.name, clip.sampleRate, clip.channels.map((ch) => {
		const o = new Float32Array(ch);
		for (let i = 0; i < fi; i++) o[i] *= i / fi;
		for (let i = 0; i < fo; i++) o[n - 1 - i] *= i / fo;
		return o;
	}));
}
function resampleClip(clip, targetRate) {
	if (clip.sampleRate === targetRate) return clip;
	const ratio = targetRate / clip.sampleRate;
	const nOut = Math.max(1, Math.round(frameCountSafe(clip) * ratio));
	return makeClip(clip.name, targetRate, clip.channels.map((ch) => resampleChannel(ch, nOut)));
}
function resampleChannel(src, nOut) {
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
function cubic(y_1, y0, y1, y2, t) {
	const a = -.5 * y_1 + 1.5 * y0 - 1.5 * y1 + .5 * y2;
	const b = y_1 - 2.5 * y0 + 2 * y1 - .5 * y2;
	const c = -.5 * y_1 + .5 * y1;
	return ((a * t + b) * t + c) * t + y0;
}
function toChannelCount(clip, count) {
	if (count === 1) return makeClip(clip.name, clip.sampleRate, [mixToMono(clip)]);
	const l = clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
	const r = clip.channels[1] ?? new Float32Array(l);
	return makeClip(clip.name, clip.sampleRate, [new Float32Array(l), new Float32Array(r)]);
}
function computePeaks(clip, buckets) {
	const n = frameCountSafe(clip);
	const bucketsN = Math.max(1, buckets);
	const min = new Float32Array(bucketsN);
	const max = new Float32Array(bucketsN);
	min.fill(0);
	max.fill(0);
	if (n === 0) return {
		min,
		max
	};
	const chs = clip.channels;
	for (let b = 0; b < bucketsN; b++) {
		const start = Math.floor(b / bucketsN * n);
		const end = Math.floor((b + 1) / bucketsN * n);
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
	return {
		min,
		max
	};
}
function biquadLowpass(sr, freq, q = .7071) {
	const w0 = 2 * Math.PI * freq / sr;
	const cos = Math.cos(w0);
	const alpha = Math.sin(w0) / (2 * q);
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
		z2: 0
	};
}
function biquadHighpass(sr, freq, q = .7071) {
	const w0 = 2 * Math.PI * freq / sr;
	const cos = Math.cos(w0);
	const alpha = Math.sin(w0) / (2 * q);
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
		z2: 0
	};
}
function biquadPeaking(sr, freq, q, gainDb) {
	const A = Math.pow(10, gainDb / 40);
	const w0 = 2 * Math.PI * freq / sr;
	const cos = Math.cos(w0);
	const alpha = Math.sin(w0) / (2 * q);
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
		z2: 0
	};
}
function biquadProcess(f, x) {
	const y = f.b0 * x + f.z1;
	f.z1 = f.b1 * x - f.a1 * y + f.z2;
	f.z2 = f.b2 * x - f.a2 * y;
	return y;
}
function runBiquad(src, proto) {
	const f = {
		...proto,
		z1: 0,
		z2: 0
	};
	const out = new Float32Array(src.length);
	for (let i = 0; i < src.length; i++) out[i] = biquadProcess(f, src[i] ?? 0);
	return out;
}
function cascade(src, filters) {
	let cur = src;
	for (const f of filters) cur = runBiquad(cur, f);
	return cur;
}
function onePoleLowpass(src, sr, ms) {
	const out = new Float32Array(src.length);
	const coeff = Math.exp(-1 / (ms / 1e3 * sr));
	let y = 0;
	for (let i = 0; i < src.length; i++) {
		y = src[i] + coeff * (y - src[i]);
		out[i] = y;
	}
	return out;
}
function addScaled(dest, src, gain) {
	const n = Math.min(dest.length, src.length);
	for (let i = 0; i < n; i++) dest[i] += src[i] * gain;
}
function peakNormalize(clip, targetDb = -.3) {
	const peak = peakOf(clip.channels);
	if (peak <= 1e-12) return clip;
	const g = dbToGain(targetDb) / peak;
	if (Math.abs(g - 1) < 1e-6) return clip;
	return applyGain(clip, g, clip.name);
}
//#endregion
export { biquadPeaking as a, dbToGain as c, peakNormalize as d, peakOf as f, toChannelCount as g, sliceClip as h, biquadLowpass as i, nearestZeroCrossing as l, runBiquad as m, applyFades as n, cascade as o, resampleClip as p, biquadHighpass as r, computePeaks as s, addScaled as t, onePoleLowpass as u };

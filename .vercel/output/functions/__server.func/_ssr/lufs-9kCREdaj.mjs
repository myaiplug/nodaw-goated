import { i as makeClip, o as stereoOf } from "./types-DyJMjOBu.mjs";
import { c as dbToGain, f as peakOf, p as resampleClip } from "./dsp-23YL4nsk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lufs-9kCREdaj.js
var PRE = {
	b0: 1.53512485958697,
	b1: -2.69169618940638,
	b2: 1.19839281085285,
	a1: -1.69065929318241,
	a2: .73248077421585
};
var RLB = {
	b0: 1,
	b1: -2,
	b2: 1,
	a1: -1.99004745483398,
	a2: .99007225036621
};
function kWeight(src) {
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
function blockMeanSquares(ch, sr, blockSec, hopSec) {
	const block = Math.round(blockSec * sr);
	const hop = Math.round(hopSec * sr);
	const n = ch[0]?.length ?? 0;
	const out = [];
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
function msToLufs(ms) {
	if (ms <= 1e-12) return -70;
	return -.691 + 10 * Math.log10(ms);
}
function measureLoudness(clip) {
	const weighted = (clip.sampleRate === 48e3 ? clip : resampleClip(clip, 48e3)).channels.map(kWeight);
	const absKept = blockMeanSquares(weighted, 48e3, .4, .1).filter((ms) => msToLufs(ms) > -70);
	const absMean = absKept.length === 0 ? 0 : absKept.reduce((a, b) => a + b, 0) / absKept.length;
	const relThresh = msToLufs(absMean) - 10;
	const relKept = absKept.filter((ms) => msToLufs(ms) > relThresh);
	const lufs = msToLufs(relKept.length === 0 ? absMean : relKept.reduce((a, b) => a + b, 0) / relKept.length);
	const longAbs = blockMeanSquares(weighted, 48e3, 3, .1).filter((ms) => msToLufs(ms) > -70);
	const longMean = longAbs.length === 0 ? 0 : longAbs.reduce((a, b) => a + b, 0) / longAbs.length;
	const lufsVals = longAbs.filter((ms) => msToLufs(ms) > msToLufs(longMean) - 20).map(msToLufs).sort((a, b) => a - b);
	const p = (q) => {
		if (lufsVals.length === 0) return lufs;
		const i = clampIndex((lufsVals.length - 1) * q, lufsVals.length);
		return lufsVals[i] ?? lufs;
	};
	const lra = Math.max(0, p(.95) - p(.1));
	const samplePeak = peakOf(clip.channels);
	const truePeak = truePeakOf(clip);
	return {
		lufs,
		truePeakDb: samplePeak <= 0 ? -120 : 20 * Math.log10(truePeak),
		samplePeakDb: samplePeak <= 0 ? -120 : 20 * Math.log10(samplePeak),
		lra,
		duration: clip.duration
	};
}
function clampIndex(v, n) {
	return Math.max(0, Math.min(n - 1, Math.round(v)));
}
function truePeakOf(clip) {
	let peak = peakOf(clip.channels);
	for (const ch of clip.channels) {
		const n = ch.length;
		for (let i = 0; i < n - 1; i++) {
			const a = ch[i] ?? 0;
			const b = ch[i + 1] ?? 0;
			const c0 = ch[Math.max(0, i - 1)] ?? a;
			const c3 = ch[Math.min(n - 1, i + 2)] ?? b;
			for (let k = 1; k < 4; k++) {
				const s = cubicInterp(c0, a, b, c3, k / 4);
				const abs = Math.abs(s);
				if (abs > peak) peak = abs;
			}
		}
	}
	return peak;
}
function cubicInterp(y_1, y0, y1, y2, t) {
	const a = -.5 * y_1 + 1.5 * y0 - 1.5 * y1 + .5 * y2;
	const b = y_1 - 2.5 * y0 + 2 * y1 - .5 * y2;
	const c = -.5 * y_1 + .5 * y1;
	return ((a * t + b) * t + c) * t + y0;
}
function applyGainDb(clip, db, name = clip.name) {
	const g = dbToGain(db);
	return makeClip(name, clip.sampleRate, clip.channels.map((ch) => {
		const o = new Float32Array(ch.length);
		for (let i = 0; i < ch.length; i++) o[i] = ch[i] * g;
		return o;
	}));
}
function truePeakLimit(clip, ceilingDb = -1) {
	const ceiling = dbToGain(ceilingDb);
	const attack = Math.max(1, Math.round(.004 * clip.sampleRate));
	const release = Math.exp(-1 / (.08 * clip.sampleRate));
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
function repairToTarget(clip, targetLufs, ceilingDb = -1) {
	let out = applyGainDb(clip, targetLufs - measureLoudness(clip).lufs, clip.name);
	if (measureLoudness(out).truePeakDb > ceilingDb) {
		out = truePeakLimit(out, ceilingDb);
		const again = measureLoudness(out);
		if (again.lufs < targetLufs - .4) {
			out = applyGainDb(out, targetLufs - again.lufs);
			out = truePeakLimit(out, ceilingDb);
		}
	}
	return out;
}
var LUFS_TARGETS = [
	{
		id: "spotify",
		label: "Spotify / DSPs",
		lufs: -14,
		tp: -1
	},
	{
		id: "apple",
		label: "Apple Music",
		lufs: -16,
		tp: -1
	},
	{
		id: "youtube",
		label: "YouTube",
		lufs: -14,
		tp: -1
	},
	{
		id: "tiktok",
		label: "TikTok / Reels",
		lufs: -14,
		tp: -1
	},
	{
		id: "club",
		label: "Club / loud",
		lufs: -9,
		tp: -.5
	},
	{
		id: "ebu",
		label: "EBU R128",
		lufs: -23,
		tp: -1
	},
	{
		id: "podcast",
		label: "Podcast",
		lufs: -16,
		tp: -1.5
	}
];
function describeLoudness(report, target, ceiling) {
	const notes = [];
	const delta = report.lufs - target;
	if (delta > 1.5) notes.push(`Integrated is ${delta.toFixed(1)} LU over target. Repair will pull it down so DSP playback does not turn you down.`);
	else if (delta < -1.5) notes.push(`Integrated is ${Math.abs(delta).toFixed(1)} LU under target. Repair will add make-up gain.`);
	else notes.push(`Integrated is already within a LU and a half of ${target} LUFS.`);
	if (report.truePeakDb > ceiling) notes.push(`True peak ${report.truePeakDb.toFixed(1)} dBTP sits over the ${ceiling} dBTP ceiling. Inter-sample peaks will clip on some converters.`);
	else notes.push(`True peak ${report.truePeakDb.toFixed(1)} dBTP is under the ${ceiling} dBTP ceiling.`);
	if (report.lra > 12) notes.push(`Loudness range ${report.lra.toFixed(1)} LU is wide. Punchy, but a platform limiter may ride the chorus.`);
	else if (report.lra < 4) notes.push(`Loudness range ${report.lra.toFixed(1)} LU is tight. Glue is in. Watch for squashed transients.`);
	else notes.push(`Loudness range ${report.lra.toFixed(1)} LU is a usable mix window.`);
	if (report.samplePeakDb > -.1) notes.push(`Sample peak is against the rail. The limiter pass will catch it.`);
	return notes.slice(0, 4);
}
//#endregion
export { repairToTarget as a, measureLoudness as i, applyGainDb as n, describeLoudness as r, LUFS_TARGETS as t };

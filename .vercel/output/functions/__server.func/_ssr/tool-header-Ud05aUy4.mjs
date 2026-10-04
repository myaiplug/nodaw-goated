import { o as __toESM } from "../_runtime.mjs";
import { i as makeClip } from "./types-DyJMjOBu.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as LoaderCircle, o as Play, r as Square, s as Pause, u as FileAudio } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as GravitySpine, l as cn, n as BRAND_LABEL, r as TOOLS, s as DiamondMark } from "./router-4C49-Z9Y.mjs";
import { s as computePeaks } from "./dsp-23YL4nsk.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tool-header-Ud05aUy4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var sharedCtx = null;
function unlockAudio() {
	try {
		const ctx = getAudioContext();
		if (ctx.state === "suspended") ctx.resume();
		return ctx;
	} catch {
		return null;
	}
}
function getAudioContext() {
	if (typeof window === "undefined") throw new Error("Audio runs in the browser");
	if (!sharedCtx) {
		const Ctor = window.AudioContext || window.webkitAudioContext;
		if (!Ctor) throw new Error("Web Audio is not available on this device");
		sharedCtx = new Ctor();
	}
	if (sharedCtx.state === "suspended") sharedCtx.resume();
	return sharedCtx;
}
async function decodeAudioFile(file) {
	const buf = await file.arrayBuffer();
	const wav = parseWav(buf, file.name.replace(/\.[^.]+$/, ""));
	if (wav) return wav;
	const audio = await getAudioContext().decodeAudioData(buf.slice(0));
	const channels = [];
	for (let c = 0; c < audio.numberOfChannels; c++) channels.push(new Float32Array(audio.getChannelData(c)));
	return makeClip(file.name.replace(/\.[^.]+$/, ""), audio.sampleRate, channels);
}
function readStr(view, offset, n) {
	let s = "";
	for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(offset + i));
	return s;
}
function parseWav(buf, name) {
	if (buf.byteLength < 44) return null;
	const view = new DataView(buf);
	if (readStr(view, 0, 4) !== "RIFF" || readStr(view, 8, 4) !== "WAVE") return null;
	let offset = 12;
	let numCh = 0;
	let sampleRate = 0;
	let bits = 0;
	let format = 0;
	let dataOff = 0;
	let dataLen = 0;
	while (offset + 8 <= view.byteLength) {
		const id = readStr(view, offset, 4);
		const size = view.getUint32(offset + 4, true);
		const start = offset + 8;
		if (start + size > view.byteLength) break;
		if (id === "fmt ") {
			format = view.getUint16(start, true);
			numCh = view.getUint16(start + 2, true);
			sampleRate = view.getUint32(start + 4, true);
			bits = view.getUint16(start + 14, true);
			if (format === 65534 && size >= 40) format = view.getUint16(start + 24, true);
		} else if (id === "data") {
			dataOff = start;
			dataLen = size;
			break;
		}
		offset = start + size + size % 2;
	}
	if (!dataOff || !sampleRate || !numCh || !bits) return null;
	const bytesPer = bits / 8;
	if (bytesPer !== 1 && bytesPer !== 2 && bytesPer !== 3 && bytesPer !== 4) return null;
	const n = Math.floor(dataLen / (bytesPer * numCh));
	if (n < 1) return null;
	const channels = Array.from({ length: numCh }, () => new Float32Array(n));
	let p = dataOff;
	const isFloat = format === 3;
	for (let i = 0; i < n; i++) for (let c = 0; c < numCh; c++) {
		let s = 0;
		if (bits === 8) {
			s = (view.getUint8(p) - 128) / 128;
			p += 1;
		} else if (bits === 16) {
			s = view.getInt16(p, true) / 32768;
			p += 2;
		} else if (bits === 24) {
			const b0 = view.getUint8(p);
			const b1 = view.getUint8(p + 1);
			const b2 = view.getUint8(p + 2);
			let v = b0 | b1 << 8 | b2 << 16;
			if (v & 8388608) v |= -16777216;
			s = v / 8388608;
			p += 3;
		} else if (isFloat) {
			s = view.getFloat32(p, true);
			p += 4;
		} else {
			s = view.getInt32(p, true) / 2147483648;
			p += 4;
		}
		channels[c][i] = s;
	}
	return makeClip(name, sampleRate, channels);
}
function clipToAudioBuffer(clip) {
	const buffer = getAudioContext().createBuffer(clip.channels.length, clip.channels[0]?.length ?? 0, clip.sampleRate);
	for (let c = 0; c < clip.channels.length; c++) buffer.copyToChannel(clip.channels[c], c);
	return buffer;
}
function encodeWav(clip, bitDepth = 16, dither = bitDepth < 32) {
	const numCh = Math.max(1, clip.channels.length);
	const n = clip.channels[0]?.length ?? 0;
	const blockAlign = numCh * (bitDepth === 16 ? 2 : bitDepth === 24 ? 3 : 4);
	const dataSize = n * blockAlign;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	const isFloat = bitDepth === 32;
	writeStr(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeStr(view, 8, "WAVE");
	writeStr(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, isFloat ? 3 : 1, true);
	view.setUint16(22, numCh, true);
	view.setUint32(24, clip.sampleRate, true);
	view.setUint32(28, clip.sampleRate * blockAlign, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitDepth, true);
	writeStr(view, 36, "data");
	view.setUint32(40, dataSize, true);
	let offset = 44;
	for (let i = 0; i < n; i++) for (let c = 0; c < numCh; c++) {
		const s = clip.channels[c]?.[i] ?? 0;
		if (bitDepth === 16) {
			let v = s;
			if (dither) v += (Math.random() + Math.random() - 1) * (1 / 32768);
			v = Math.max(-1, Math.min(1, v));
			view.setInt16(offset, v < 0 ? v * 32768 : v * 32767, true);
			offset += 2;
		} else if (bitDepth === 24) {
			let v = s;
			if (dither) v += (Math.random() + Math.random() - 1) * (1 / 8388608);
			v = Math.max(-1, Math.min(1, v));
			const int = Math.round(v * 8388607);
			view.setUint8(offset, int & 255);
			view.setUint8(offset + 1, int >> 8 & 255);
			view.setUint8(offset + 2, int >> 16 & 255);
			offset += 3;
		} else {
			view.setFloat32(offset, s, true);
			offset += 4;
		}
	}
	return new Blob([buffer], { type: "audio/wav" });
}
function writeStr(view, offset, str) {
	for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
function downloadBlob(blob, filename) {
	const safe = filename.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "nodaw";
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = safe;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 18e4);
	return url;
}
function downloadWav(clip, filename, bitDepth = 16, dither = bitDepth < 32) {
	downloadBlob(encodeWav(clip, bitDepth, dither), filename.endsWith(".wav") ? filename : `${filename}.wav`);
}
var CRC_TABLE = (() => {
	const t = /* @__PURE__ */ new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		t[n] = c;
	}
	return t;
})();
function crc32(data) {
	let c = 4294967295;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
function zipStore(files) {
	const encoder = new TextEncoder();
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const file of files) {
		const nameBytes = encoder.encode(file.name);
		const crc = crc32(file.data);
		const local = new Uint8Array(30 + nameBytes.length + file.data.length);
		const lv = new DataView(local.buffer);
		lv.setUint32(0, 67324752, true);
		lv.setUint16(4, 20, true);
		lv.setUint16(8, 0, true);
		lv.setUint16(10, 0, true);
		lv.setUint32(14, crc, true);
		lv.setUint32(18, file.data.length, true);
		lv.setUint32(22, file.data.length, true);
		lv.setUint16(26, nameBytes.length, true);
		local.set(nameBytes, 30);
		local.set(file.data, 30 + nameBytes.length);
		locals.push(local);
		const central = new Uint8Array(46 + nameBytes.length);
		const cv = new DataView(central.buffer);
		cv.setUint32(0, 33639248, true);
		cv.setUint16(4, 20, true);
		cv.setUint16(6, 20, true);
		cv.setUint32(16, crc, true);
		cv.setUint32(20, file.data.length, true);
		cv.setUint32(24, file.data.length, true);
		cv.setUint16(28, nameBytes.length, true);
		cv.setUint32(42, offset, true);
		central.set(nameBytes, 46);
		centrals.push(central);
		offset += local.length;
	}
	const centralSize = centrals.reduce((s, x) => s + x.length, 0);
	const end = /* @__PURE__ */ new Uint8Array(22);
	const ev = new DataView(end.buffer);
	ev.setUint32(0, 101010256, true);
	ev.setUint16(8, files.length, true);
	ev.setUint16(10, files.length, true);
	ev.setUint32(12, centralSize, true);
	ev.setUint32(16, offset, true);
	return new Blob([
		...locals,
		...centrals,
		end
	], { type: "application/zip" });
}
function makeDemoLoop() {
	const sr = 44100;
	const bpm = 90;
	const n = Math.floor(960 / bpm * sr);
	const L = new Float32Array(n);
	const R = new Float32Array(n);
	const spb = 60 / bpm;
	for (const b of [
		0,
		4,
		8,
		12,
		2.5,
		10.5
	]) {
		addKick(L, R, sr, b * spb, b % 1 === 0 ? 1 : .55);
		add808(L, R, sr, b * spb, 55 * (b % 8 === 0 ? 1 : 4 / 3), b % 1 === 0 ? 1.6 : .9);
	}
	for (const b of [
		2,
		6,
		10,
		14
	]) addSnare(L, R, sr, b * spb, .85);
	for (let i = 0; i < 32; i++) addHat(L, R, sr, i * spb / 2, i % 2 === 1 ? .55 : .32, i % 4 === 0 ? -.2 : .35);
	for (const [a, b, c, bar] of [
		[
			220,
			261.63,
			329.63,
			0
		],
		[
			174.61,
			220,
			261.63,
			1
		],
		[
			196,
			246.94,
			293.66,
			2
		],
		[
			164.81,
			196,
			246.94,
			3
		]
	]) addPad(L, R, sr, bar * 4 * spb, 4 * spb, [
		a,
		b,
		c
	]);
	for (const [beat, f] of [
		[0, 440],
		[1, 523.25],
		[2.5, 493.88],
		[4, 440],
		[5.5, 349.23],
		[8, 392],
		[9, 440],
		[11, 523.25],
		[12.5, 493.88],
		[14, 440]
	]) addVocal(L, R, sr, beat * spb, .45, f);
	addPluck(L, R, sr, 1.5 * spb, 659.25, .6);
	addPluck(L, R, sr, 5.5 * spb, 587.33, -.55);
	addPluck(L, R, sr, 9.5 * spb, 523.25, .4);
	addPluck(L, R, sr, 13.5 * spb, 659.25, -.35);
	let peak = 1e-6;
	for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i] ?? 0), Math.abs(R[i] ?? 0));
	const g = .55 / peak;
	for (let i = 0; i < n; i++) {
		L[i] *= g;
		R[i] *= g;
	}
	return makeClip("NoDAW 90 BPM demo", sr, [L, R]);
}
function addKick(L, R, sr, t, amp) {
	const n = Math.floor(sr * .42);
	const i0 = Math.floor(t * sr);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const env = Math.exp(-tt * 14);
		const f = 150 * Math.exp(-tt * 18) + 38;
		const s = Math.sin(2 * Math.PI * f * tt) * env * amp;
		const click = Math.exp(-tt * 90) * (Math.random() * 2 - 1) * .08 * amp;
		L[i0 + i] += s + click;
		R[i0 + i] += s + click * .7;
	}
}
function add808(L, R, sr, t, f0, hold) {
	const n = Math.floor(sr * hold);
	const i0 = Math.floor(t * sr);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const f = f0 * (1 + Math.exp(-tt * 30) * .5);
		const env = Math.exp(-tt * 1.6);
		const s = Math.sin(2 * Math.PI * f * tt) * env * .7;
		L[i0 + i] += s;
		R[i0 + i] += s;
	}
}
function addSnare(L, R, sr, t, amp) {
	const n = Math.floor(sr * .28);
	const i0 = Math.floor(t * sr);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const env = Math.exp(-tt * 18);
		const tone = Math.sin(2 * Math.PI * 190 * tt) * env * .25;
		const noise = (Math.random() * 2 - 1) * env * .7;
		L[i0 + i] += (tone + noise) * amp;
		R[i0 + i] += (tone + noise * .85) * amp;
	}
}
function addHat(L, R, sr, t, amp, pan) {
	const n = Math.floor(sr * .05);
	const i0 = Math.floor(t * sr);
	let hp = 0;
	const gL = (1 - pan) * .5 + .5;
	const gR = (1 + pan) * .5 + .5;
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const env = Math.exp(-tt * 70);
		hp = Math.random() * 2 - 1 - hp * .4;
		const s = hp * env * amp * .35;
		L[i0 + i] += s * gL;
		R[i0 + i] += s * gR;
	}
}
function addPad(L, R, sr, t, dur, freqs) {
	const n = Math.floor(sr * dur);
	const i0 = Math.floor(t * sr);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const fade = Math.min(1, tt / .08) * Math.min(1, (dur - tt) / .12);
		let sL = 0;
		let sR = 0;
		for (let k = 0; k < freqs.length; k++) {
			const f = freqs[k] ?? 0;
			sL += Math.sin(2 * Math.PI * f * .5 * tt + .04) * .12;
			sR += Math.sin(2 * Math.PI * f * .5 * tt - .04) * .12;
			sL += Math.sin(2 * Math.PI * f * tt + .2) * .05;
			sR += Math.sin(2 * Math.PI * f * tt - .15) * .05;
		}
		L[i0 + i] += sL * fade;
		R[i0 + i] += sR * fade;
	}
}
function addVocal(L, R, sr, t, dur, f0) {
	const n = Math.floor(sr * dur);
	const i0 = Math.floor(t * sr);
	let y1 = 0;
	let y2 = 0;
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const env = Math.min(1, tt / .03) * Math.min(1, (dur - tt) / .06) * .22;
		const bp = Math.sin(2 * Math.PI * f0 * tt) + .3 * Math.sin(2 * Math.PI * f0 * 2 * tt) - y1 * .2;
		y2 = y2 * .7 + bp * .3;
		y1 = bp;
		const s = y2 * env;
		L[i0 + i] += s;
		R[i0 + i] += s * .92;
	}
}
function addPluck(L, R, sr, t, f, pan) {
	const n = Math.floor(sr * .55);
	const i0 = Math.floor(t * sr);
	const gL = .5 + pan * .4;
	const gR = .5 - pan * .4;
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const tt = i / sr;
		const env = Math.exp(-tt * 7);
		const s = (Math.sin(2 * Math.PI * f * tt) + .4 * Math.sin(2 * Math.PI * f * 2 * tt)) * env * .16;
		L[i0 + i] += s * gL;
		R[i0 + i] += s * gR;
	}
}
function formatTime(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00.0";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	const t = Math.floor(sec % 1 * 10);
	return `${m}:${s.toString().padStart(2, "0")}.${t}`;
}
function formatClock(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
}
function formatHz(sr) {
	const k = sr / 1e3;
	return `${Number.isInteger(k) ? String(k) : k.toFixed(1)} kHz`;
}
function formatDb(v, digits = 1) {
	if (!Number.isFinite(v)) return "-";
	const n = v.toFixed(digits);
	return v > 0 ? `+${n}` : n;
}
var useLabStore = create((set) => ({
	clip: null,
	clipB: null,
	setClip: (clip) => set({ clip }),
	setClipB: (clipB) => set({ clipB })
}));
function DropZone({ label = "Drop a file", clip, onClip, compact }) {
	const storeClip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const current = clip === void 0 ? storeClip : clip;
	const [over, setOver] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const take = (0, import_react.useCallback)(async (file) => {
		unlockAudio();
		setBusy(true);
		try {
			const decoded = await decodeAudioFile(file);
			onClip?.(decoded);
			if (clip === void 0) setClip(decoded);
			toast.success(`${decoded.name} · ${formatClock(decoded.duration)}`);
		} catch {
			toast.error("Could not decode that file. Try WAV, MP3, or M4A.");
		} finally {
			setBusy(false);
		}
	}, [
		clip,
		onClip,
		setClip
	]);
	const onDrop = (e) => {
		e.preventDefault();
		setOver(false);
		const file = e.dataTransfer.files[0];
		if (file) take(file);
	};
	const loadDemo = () => {
		unlockAudio();
		const demo = makeDemoLoop();
		onClip?.(demo);
		if (clip === void 0) setClip(demo);
		toast.success("Loaded 90 BPM demo");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onDragOver: (e) => {
			e.preventDefault();
			setOver(true);
		},
		onDragLeave: () => setOver(false),
		onDrop,
		className: cn("rounded-xl border border-dashed p-4 transition-colors duration-150 glass", over ? "border-accent bg-elevated" : "border-border", compact ? "p-3" : "p-5"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "file",
			accept: "audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.aif,.aiff,.caf",
			className: "hidden",
			suppressHydrationWarning: true,
			onChange: (e) => {
				const file = e.target.files?.[0];
				if (file) take(file);
				e.target.value = "";
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex size-10 items-center justify-center rounded-md bg-elevated text-muted",
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileAudio, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-fg",
					children: current ? current.name : label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: current ? `${formatClock(current.duration)} · ${formatHz(current.sampleRate)} · ${current.channels.length} ch` : "WAV, MP3, M4A. Stays on this device."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					size: "sm",
					onClick: loadDemo,
					children: "Demo loop"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					onClick: () => inputRef.current?.click(),
					disabled: busy,
					children: busy ? "Reading" : "Open"
				})]
			})]
		})]
	});
}
function TransportBar({ playing, current, duration, onPlay, onPause, onStop, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "icon",
				variant: "secondary",
				disabled,
				onClick: () => playing ? onPause() : onPlay(),
				"aria-label": playing ? "Pause" : "Play",
				children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "icon",
				variant: "ghost",
				disabled,
				onClick: onStop,
				"aria-label": "Stop",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: cn("ml-1 font-mono text-sm tabular-nums text-muted"),
				children: [formatTime(current), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-subtle",
					children: [" / ", formatTime(duration)]
				})]
			})
		]
	});
}
function token(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function Waveform({ clip, playhead = 0, start = 0, end, onSeek, onRegion, className }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const peaksRef = (0, import_react.useRef)(null);
	const regionEnd = end ?? clip.duration;
	const drag = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		peaksRef.current = null;
	}, [clip]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const w = wrap.clientWidth;
			const h = wrap.clientHeight;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.max(1, Math.floor(w * dpr));
			canvas.height = Math.max(1, Math.floor(h * dpr));
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			const surface = token("--color-surface", "#141417");
			const accent = token("--color-accent", "#c5c9d1");
			const fg = token("--color-fg", "#f0f0f2");
			ctx.fillStyle = surface;
			ctx.fillRect(0, 0, w, h);
			const buckets = Math.max(64, Math.floor(w));
			if (!peaksRef.current || peaksRef.current.w !== buckets) peaksRef.current = {
				w: buckets,
				peaks: computePeaks(clip, buckets)
			};
			const peaks = peaksRef.current.peaks;
			const mid = h / 2;
			ctx.fillStyle = accent;
			const bar = Math.max(1, w / peaks.max.length - .4);
			for (let i = 0; i < peaks.max.length; i++) {
				const x = i / peaks.max.length * w;
				const hi = (peaks.max[i] ?? 0) * (h * .42);
				const lo = (peaks.min[i] ?? 0) * (h * .42);
				ctx.fillRect(x, mid - hi, bar, hi - lo || 1);
			}
			const x0 = start / clip.duration * w;
			const x1 = regionEnd / clip.duration * w;
			ctx.fillStyle = "rgba(197, 201, 209, 0.08)";
			ctx.fillRect(x0, 0, Math.max(1, x1 - x0), h);
			ctx.fillStyle = accent;
			ctx.fillRect(x0, 0, 2, h);
			ctx.fillRect(x1 - 2, 0, 2, h);
			const px = playhead / clip.duration * w;
			ctx.fillStyle = fg;
			ctx.fillRect(px, 0, 1.5, h);
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		clip,
		playhead,
		start,
		regionEnd
	]);
	const timeAt = (clientX) => {
		const rect = wrapRef.current?.getBoundingClientRect();
		if (!rect || clip.duration <= 0) return 0;
		const r = (clientX - rect.left) / rect.width;
		return Math.max(0, Math.min(clip.duration, r * clip.duration));
	};
	const pointerDown = (e) => {
		e.target.setPointerCapture?.(e.pointerId);
		const t = timeAt(e.clientX);
		if (!onRegion) {
			drag.current = "seek";
			onSeek?.(t);
			return;
		}
		const hit = clip.duration * .06;
		const nearStart = Math.abs(t - start) < hit;
		const nearEnd = Math.abs(t - regionEnd) < hit;
		if (nearStart) drag.current = "start";
		else if (nearEnd) drag.current = "end";
		else {
			drag.current = "seek";
			onSeek?.(t);
		}
	};
	const pointerMove = (e) => {
		if (!drag.current) return;
		const t = timeAt(e.clientX);
		if (drag.current === "seek") onSeek?.(t);
		else if (drag.current === "start") onRegion?.(Math.min(t, regionEnd - .05), regionEnd);
		else if (drag.current === "end") onRegion?.(start, Math.max(t, start + .05));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: className ?? "relative h-28 w-full overflow-hidden rounded-lg",
		onPointerDown: pointerDown,
		onPointerMove: pointerMove,
		onPointerUp: () => {
			drag.current = null;
		},
		onPointerCancel: () => {
			drag.current = null;
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full touch-none"
		})
	});
}
function ToolHeader({ id }) {
	const tool = TOOLS.find((t) => t.id === id);
	if (!tool) return null;
	const nag = tool.system === "nag";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex items-start justify-between gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: cn("kicker", nag ? "text-nag" : "text-accent"),
				children: [
					BRAND_LABEL[tool.system],
					" · ",
					tool.product
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl font-semibold uppercase tracking-tight text-fg",
				children: tool.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
				children: tool.detail
			})
		] }), nag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GravitySpine, {
			className: "hidden pt-1 md:flex",
			word: "GRAVITY"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiamondMark, { className: "mt-1 hidden size-5 text-accent md:block" })]
	});
}
//#endregion
export { clipToAudioBuffer as a, encodeWav as c, formatHz as d, formatTime as f, zipStore as g, useLabStore as h, Waveform as i, formatClock as l, unlockAudio as m, ToolHeader as n, downloadBlob as o, getAudioContext as p, TransportBar as r, downloadWav as s, DropZone as t, formatDb as u };

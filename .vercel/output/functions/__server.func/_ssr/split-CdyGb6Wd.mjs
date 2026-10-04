import { o as __toESM, r as __exportAll } from "../_runtime.mjs";
import { a as normalizeStemModel, i as makeClip, n as STEM_MODELS, o as stereoOf, r as STEM_ORDER, t as STEM_LABEL } from "./types-DyJMjOBu.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as LoaderCircle, d as Download, o as Play, s as Pause } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
import { a as biquadPeaking, h as sliceClip, i as biquadLowpass, m as runBiquad, o as cascade, r as biquadHighpass, t as addScaled, u as onePoleLowpass } from "./dsp-23YL4nsk.mjs";
import { n as useLabPrefs } from "./use-lab-prefs-Bb60At--.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { c as encodeWav, g as zipStore, h as useLabStore, i as Waveform, n as ToolHeader, o as downloadBlob, r as TransportBar, t as DropZone } from "./tool-header-Ud05aUy4.mjs";
import { t as Choice } from "./choice-tFwZMcKu.mjs";
import { t as Panel } from "./panel-AOhpGiXC.mjs";
import { t as useTransport } from "./use-transport-GMPhlbKb.mjs";
import { t as Slider } from "./slider-8-ZJwEYD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/split-CdyGb6Wd.js
var split_CdyGb6Wd_exports = /* @__PURE__ */ __exportAll({
	a: () => loadDemucsSession,
	component: () => SplitPage,
	i: () => encodeWavStereo,
	n: () => DEMUCS_SOURCES,
	o: () => separateDemucs,
	r: () => decodeForDemucs,
	s: () => splitDemucsClip,
	t: () => DEMUCS_CATALOG
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Real HTDemucs separation in the browser.
* Weights (fp16 storage, fp32 math), cached after the first download:
*   HTDemucs 6s   StemSplitio/htdemucs-6s-onnx        136 MB  6 stems
*   HTDemucs      StemSplitio/htdemucs-onnx           166 MB  4 stems
*   FT Vocals     StemSplitio/htdemucs-ft-vocals-onnx 166 MB  vocal specialist
* Runtime: onnxruntime-web. WebGPU when the device has it, else WASM.
* Chunking: 343980 samples (7.8 s at 44.1 kHz), 25% overlap-add.
*
* Loaded only when Split runs. Not on app boot.
*/
var DEMUCS_SOURCES = [
	"drums",
	"bass",
	"other",
	"vocals",
	"guitar",
	"piano"
];
var SAMPLE_RATE = 44100;
/** Baked into the ONNX graph. Do not derive from 7.8 * 44100 (float drift). */
var N_SAMPLES = 343980;
var N_CHANNELS = 2;
var OVERLAP = Math.floor(N_SAMPLES / 4);
var STRIDE = 257985;
var MIN_MODEL_BYTES = 12e7;
var DEMUCS_CATALOG = {
	htdemucs_6s: {
		id: "htdemucs_6s",
		url: "https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s_fp16weights.onnx",
		label: "HTDemucs 6s",
		megabytes: 136,
		rows: [
			"drums",
			"bass",
			"other",
			"vocals",
			"guitar",
			"piano"
		],
		vocalsOnly: false
	},
	htdemucs: {
		id: "htdemucs",
		url: "https://huggingface.co/StemSplitio/htdemucs-onnx/resolve/main/htdemucs_fp16weights.onnx",
		label: "HTDemucs",
		megabytes: 166,
		rows: [
			"drums",
			"bass",
			"other",
			"vocals"
		],
		vocalsOnly: false
	},
	htdemucs_ft: {
		id: "htdemucs_ft",
		url: "https://huggingface.co/StemSplitio/htdemucs-ft-vocals-onnx/resolve/main/htdemucs_ft_vocals_fp16weights.onnx",
		label: "FT Vocals",
		megabytes: 166,
		rows: [
			"drums",
			"bass",
			"other",
			"vocals"
		],
		vocalsOnly: true
	}
};
DEMUCS_CATALOG.htdemucs_6s.url;
var CACHE_NAME = "nodaw-demucs-v2";
var ortModule = null;
var ortConfigured = false;
var readySessions = /* @__PURE__ */ new Map();
var sessionPromises = /* @__PURE__ */ new Map();
function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
async function getOrt() {
	if (ortModule) return ortModule;
	if (typeof window === "undefined") throw new Error("HTDemucs runs in the browser");
	try {
		ortModule = await import("../_libs/onnxruntime-web.mjs").then((n) => n.n);
	} catch {
		ortModule = await import("../_libs/onnxruntime-web.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	}
	configureOrt(ortModule);
	return ortModule;
}
function configureOrt(ort) {
	if (ortConfigured) return;
	ortConfigured = true;
	const origin = typeof location !== "undefined" ? location.origin : "";
	ort.env.wasm.wasmPaths = `${origin}/ort/`;
	ort.env.wasm.numThreads = 1;
	ort.env.wasm.simd = true;
	ort.env.wasm.proxy = false;
}
async function putCache(url, buf) {
	if (typeof caches === "undefined") return;
	try {
		await (await caches.open(CACHE_NAME)).put(url, new Response(buf.slice(0)));
	} catch {}
}
async function dropCachedUrl(url) {
	if (typeof caches === "undefined") return;
	try {
		await (await caches.open(CACHE_NAME)).delete(url);
	} catch {}
}
function headerBytes(res, expected) {
	const len = Number(res.headers.get("content-length") || 0);
	const linked = Number(res.headers.get("x-linked-size") || 0);
	if (len >= MIN_MODEL_BYTES) return len;
	if (linked >= MIN_MODEL_BYTES) return linked;
	return expected;
}
function formatDownload(received, total, startedAt) {
	const speed = received / Math.max(.001, (performance.now() - startedAt) / 1e3);
	const remain = Math.max(0, total - received);
	const eta = speed > 0 ? remain / speed : 0;
	const mb = (n) => (n / 1e6).toFixed(1);
	const rate = speed >= 1e6 ? `${(speed / 1e6).toFixed(1)} MB/s` : `${Math.max(1, Math.round(speed / 1e3))} KB/s`;
	let etaLabel = "";
	if (received > 256e3 && eta > 1 && eta < 3600) etaLabel = eta < 90 ? `${Math.round(eta)}s left` : `${Math.floor(eta / 60)}m ${Math.round(eta % 60)}s left`;
	return etaLabel ? `${mb(received)} / ${mb(total)} MB · ${rate} · ${etaLabel}` : `${mb(received)} / ${mb(total)} MB · ${rate}`;
}
async function fetchModelOnce(url, expectedBytes, onProgress) {
	if (typeof caches !== "undefined") try {
		const cache = await caches.open(CACHE_NAME);
		const hit = await cache.match(url);
		if (hit) {
			const buf = await hit.arrayBuffer();
			if (buf.byteLength >= MIN_MODEL_BYTES) {
				onProgress?.({
					phase: "download",
					ratio: 1,
					received: buf.byteLength,
					total: buf.byteLength,
					detail: `From cache · ${(buf.byteLength / 1e6).toFixed(0)} MB`
				});
				return buf;
			}
			await cache.delete(url);
			onProgress?.({
				phase: "download",
				ratio: 0,
				detail: "Corrupt cache cleared. Downloading again."
			});
		}
	} catch {}
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Model download failed (${res.status})`);
	const total = headerBytes(res, expectedBytes);
	const reader = res.body?.getReader();
	if (!reader) {
		const buf = await res.arrayBuffer();
		if (buf.byteLength < MIN_MODEL_BYTES) throw new Error(`Model too small (${buf.byteLength} bytes). Download was cut off.`);
		await putCache(url, buf);
		onProgress?.({
			phase: "download",
			ratio: 1,
			received: buf.byteLength,
			total: buf.byteLength,
			detail: `Download complete · ${(buf.byteLength / 1e6).toFixed(0)} MB`
		});
		return buf;
	}
	const chunks = [];
	let received = 0;
	let lastEmit = 0;
	let lastYield = 0;
	const startedAt = performance.now();
	const emit = (force) => {
		const now = performance.now();
		if (!force && !(lastEmit === 0) && now - lastEmit < 150) return;
		lastEmit = now;
		const ratio = total > 0 ? Math.min(force ? 1 : .995, received / total) : 0;
		onProgress?.({
			phase: "download",
			ratio,
			received,
			total,
			detail: formatDownload(received, total, startedAt)
		});
	};
	onProgress?.({
		phase: "download",
		ratio: 0,
		received: 0,
		total,
		detail: `0.0 / ${(total / 1e6).toFixed(1)} MB`
	});
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		received += value.length;
		emit(false);
		if (received - lastYield >= 4e6) {
			lastYield = received;
			await sleep(0);
		}
	}
	const merged = new Uint8Array(received);
	let off = 0;
	for (const c of chunks) {
		merged.set(c, off);
		off += c.length;
	}
	const buf = merged.buffer;
	if (buf.byteLength < MIN_MODEL_BYTES) throw new Error(`Model too small (${buf.byteLength} bytes). Download was cut off.`);
	await putCache(url, buf);
	onProgress?.({
		phase: "download",
		ratio: 1,
		received: buf.byteLength,
		total: buf.byteLength,
		detail: `Download complete · ${(buf.byteLength / 1e6).toFixed(0)} MB`
	});
	return buf;
}
async function fetchModelCached(url, expectedBytes, onProgress) {
	let lastErr;
	for (let attempt = 0; attempt < 3; attempt++) try {
		if (attempt > 0) {
			onProgress?.({
				phase: "download",
				ratio: 0,
				detail: `Retry ${attempt + 1} / 3`
			});
			await sleep(800 * 2 ** (attempt - 1));
		}
		return await fetchModelOnce(url, expectedBytes, onProgress);
	} catch (err) {
		lastErr = err;
		await dropCachedUrl(url);
	}
	throw lastErr instanceof Error ? lastErr : /* @__PURE__ */ new Error("Model download failed");
}
function hasWebGpu() {
	return typeof navigator !== "undefined" && "gpu" in navigator;
}
async function readStems(result, outputName, stemCount) {
	const tensor = result.stems ?? (outputName ? result[outputName] : void 0) ?? Object.values(result)[0];
	if (!tensor) throw new Error("HTDemucs returned no stems tensor");
	let data;
	if (typeof tensor.getData === "function") data = await tensor.getData(true);
	else data = tensor.data;
	const need = stemCount * N_CHANNELS * N_SAMPLES;
	if (!(data instanceof Float32Array) || data.length < need) throw new Error("HTDemucs returned no stems tensor");
	return data;
}
async function runSegment(session, input, stemCount) {
	return readStems(await session.run({ mix: input }), session.outputNames[0], stemCount);
}
async function createSession(ort, modelBuf, stemCount, onProgress) {
	const attempts = [];
	if (hasWebGpu()) attempts.push({
		providers: ["webgpu"],
		label: "WebGPU"
	});
	attempts.push({
		providers: ["wasm"],
		label: "WASM"
	});
	let lastErr;
	for (let i = 0; i < attempts.length; i++) {
		const { providers, label } = attempts[i];
		onProgress?.({
			phase: "load",
			ratio: i / Math.max(1, attempts.length),
			detail: `Building ${label} session`
		});
		try {
			const session = await ort.InferenceSession.create(modelBuf, {
				executionProviders: providers,
				graphOptimizationLevel: "basic",
				enableCpuMemArena: false,
				enableMemPattern: false,
				executionMode: "sequential",
				preferredOutputLocation: "cpu"
			});
			await warmUp(ort, session, stemCount, onProgress);
			onProgress?.({
				phase: "load",
				ratio: 1,
				detail: `${label} ready`
			});
			return session;
		} catch (err) {
			lastErr = err;
			onProgress?.({
				phase: "load",
				ratio: (i + .5) / attempts.length,
				detail: i < attempts.length - 1 ? `${label} unavailable. Trying WASM.` : `${label} failed.`
			});
		}
	}
	throw lastErr instanceof Error ? lastErr : /* @__PURE__ */ new Error("Could not start HTDemucs");
}
async function warmUp(ort, session, stemCount, onProgress) {
	onProgress?.({
		phase: "warmup",
		ratio: 0,
		detail: "Warm-up inference"
	});
	await sleep(0);
	const zeros = new Float32Array(N_CHANNELS * N_SAMPLES);
	if ((await runSegment(session, new ort.Tensor("float32", zeros, [
		1,
		N_CHANNELS,
		N_SAMPLES
	]), stemCount)).length < stemCount * N_CHANNELS * N_SAMPLES) throw new Error(`Warm-up did not return ${stemCount} stems`);
	onProgress?.({
		phase: "warmup",
		ratio: 1,
		detail: "Model ready"
	});
}
async function releaseOthers(keep) {
	const drop = [];
	for (const id of readySessions.keys()) if (id !== keep) drop.push(id);
	for (const id of drop) {
		const session = readySessions.get(id);
		readySessions.delete(id);
		sessionPromises.delete(id);
		try {
			await session?.release();
		} catch {}
	}
}
async function loadDemucsSession(onProgress, modelId = "htdemucs_6s") {
	const spec = DEMUCS_CATALOG[modelId];
	const ready = readySessions.get(modelId);
	if (ready) {
		onProgress?.({
			phase: "done",
			ratio: 1,
			detail: `${spec.label} already loaded`
		});
		return ready;
	}
	const pending = sessionPromises.get(modelId);
	if (pending) return pending;
	const job = (async () => {
		await releaseOthers(modelId);
		const ort = await getOrt();
		onProgress?.({
			phase: "download",
			ratio: 0,
			detail: `${spec.label} · ${spec.megabytes} MB`
		});
		const session = await createSession(ort, await fetchModelCached(spec.url, spec.megabytes * 1e6, onProgress), spec.rows.length, onProgress);
		readySessions.set(modelId, session);
		onProgress?.({
			phase: "load",
			ratio: 1,
			detail: `${spec.label} ready`
		});
		return session;
	})().catch((err) => {
		sessionPromises.delete(modelId);
		readySessions.delete(modelId);
		onProgress?.({
			phase: "error",
			ratio: 0,
			detail: err instanceof Error ? err.message : "HTDemucs failed"
		});
		throw err;
	});
	sessionPromises.set(modelId, job);
	return job;
}
function makeTransitionWindow(segment, overlap) {
	const w = new Float32Array(segment);
	w.fill(1);
	const denom = Math.max(1, overlap - 1);
	for (let i = 0; i < overlap; i++) {
		const v = i / denom;
		w[i] = v;
		w[segment - overlap + i] = (overlap - 1 - i) / denom;
	}
	return w;
}
async function separateDemucs(left, right, modelId = "htdemucs_6s", onProgress) {
	if (left.length !== right.length) throw new Error("Channel length mismatch");
	if (left.length < 1) throw new Error("Audio is empty");
	const spec = DEMUCS_CATALOG[modelId];
	const ort = await getOrt();
	const session = await loadDemucsSession(onProgress, modelId);
	const totalLen = left.length;
	const nChunks = Math.max(1, Math.ceil(totalLen / STRIDE));
	const window = makeTransitionWindow(N_SAMPLES, OVERLAP);
	const rowIndex = /* @__PURE__ */ new Map();
	spec.rows.forEach((name, i) => rowIndex.set(name, i));
	const out = DEMUCS_SOURCES.map(() => [new Float32Array(totalLen), new Float32Array(totalLen)]);
	const weight = new Float32Array(totalLen);
	const chunkBuf = new Float32Array(N_CHANNELS * N_SAMPLES);
	const activeRows = spec.vocalsOnly ? ["vocals"] : spec.rows;
	for (let i = 0; i < nChunks; i++) {
		const start = i * STRIDE;
		const end = Math.min(start + N_SAMPLES, totalLen);
		const chunkLen = end - start;
		onProgress?.({
			phase: "separate",
			ratio: i / nChunks,
			detail: `${spec.label} · chunk ${i + 1} / ${nChunks}`
		});
		await sleep(0);
		chunkBuf.fill(0);
		chunkBuf.set(left.subarray(start, end), 0);
		chunkBuf.set(right.subarray(start, end), N_SAMPLES);
		const stems = await runSegment(session, new ort.Tensor("float32", chunkBuf.slice(), [
			1,
			N_CHANNELS,
			N_SAMPLES
		]), spec.rows.length);
		for (const name of activeRows) {
			const stem = rowIndex.get(name);
			if (stem === void 0) continue;
			const destPair = out[DEMUCS_SOURCES.indexOf(name)];
			if (!destPair) continue;
			for (let ch = 0; ch < N_CHANNELS; ch++) {
				const rowStart = (stem * N_CHANNELS + ch) * N_SAMPLES;
				const dest = destPair[ch];
				for (let s = 0; s < chunkLen; s++) dest[start + s] += (stems[rowStart + s] ?? 0) * (window[s] ?? 1);
			}
		}
		for (let s = 0; s < chunkLen; s++) weight[start + s] += window[s] ?? 1;
	}
	for (const pair of out) for (let ch = 0; ch < N_CHANNELS; ch++) {
		const dest = pair[ch];
		for (let s = 0; s < totalLen; s++) dest[s] /= Math.max(weight[s] ?? 0, 1e-8);
	}
	const pack = {};
	DEMUCS_SOURCES.forEach((name, i) => {
		pack[name] = out[i];
	});
	if (spec.vocalsOnly) {
		const [vL, vR] = pack.vocals;
		const instL = new Float32Array(totalLen);
		const instR = new Float32Array(totalLen);
		for (let s = 0; s < totalLen; s++) {
			instL[s] = (left[s] ?? 0) - (vL[s] ?? 0);
			instR[s] = (right[s] ?? 0) - (vR[s] ?? 0);
		}
		pack.other = [instL, instR];
		pack.drums = [new Float32Array(totalLen), new Float32Array(totalLen)];
		pack.bass = [new Float32Array(totalLen), new Float32Array(totalLen)];
		pack.guitar = [new Float32Array(totalLen), new Float32Array(totalLen)];
		pack.piano = [new Float32Array(totalLen), new Float32Array(totalLen)];
	}
	const ready = spec.vocalsOnly ? "Vocals and instrumental ready" : spec.rows.length === 6 ? "Six stems ready" : "Four stems ready";
	onProgress?.({
		phase: "done",
		ratio: 1,
		detail: ready
	});
	return pack;
}
async function decodeForDemucs(file) {
	const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
	try {
		const ab = await file.arrayBuffer();
		const audio = await ctx.decodeAudioData(ab.slice(0));
		if (audio.sampleRate !== SAMPLE_RATE) {
			const frames = Math.max(1, Math.ceil(audio.duration * SAMPLE_RATE));
			const offline = new OfflineAudioContext(2, frames, SAMPLE_RATE);
			const src = offline.createBufferSource();
			src.buffer = audio;
			src.connect(offline.destination);
			src.start(0);
			const rendered = await offline.startRendering();
			return {
				left: new Float32Array(rendered.getChannelData(0)),
				right: new Float32Array(rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : rendered.getChannelData(0)),
				duration: rendered.duration
			};
		}
		const left = new Float32Array(audio.getChannelData(0));
		const right = new Float32Array(audio.length);
		if (audio.numberOfChannels > 1) right.set(audio.getChannelData(1));
		else right.set(left);
		return {
			left,
			right,
			duration: audio.duration
		};
	} finally {
		await ctx.close();
	}
}
function encodeWavStereo(left, right, sampleRate = SAMPLE_RATE) {
	const n = Math.min(left.length, right.length);
	const buf = /* @__PURE__ */ new ArrayBuffer(44 + n * 4);
	const view = new DataView(buf);
	const ws = (o, s) => {
		for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
	};
	ws(0, "RIFF");
	view.setUint32(4, 36 + n * 4, true);
	ws(8, "WAVE");
	ws(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 2, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 4, true);
	view.setUint16(32, 4, true);
	view.setUint16(34, 16, true);
	ws(36, "data");
	view.setUint32(40, n * 4, true);
	let off = 44;
	for (let i = 0; i < n; i++) for (const ch of [left, right]) {
		const v = Math.max(-1, Math.min(1, ch[i] ?? 0));
		view.setInt16(off, v < 0 ? v * 32768 : v * 32767, true);
		off += 2;
	}
	return new Blob([buf], { type: "audio/wav" });
}
async function audioForDemucs(clip) {
	try {
		const decoded = await decodeForDemucs(encodeWav(clip, 16, false));
		if (decoded.left.length > 0 && decoded.right.length === decoded.left.length) return decoded;
	} catch {}
	const srcL = clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
	const srcR = clip.channels[1]?.length === srcL.length ? clip.channels[1] : srcL;
	if (clip.sampleRate === SAMPLE_RATE) return {
		left: new Float32Array(srcL),
		right: new Float32Array(srcR),
		duration: srcL.length / SAMPLE_RATE
	};
	const frames = Math.max(1, Math.ceil((clip.duration || srcL.length / clip.sampleRate) * SAMPLE_RATE));
	const offline = new OfflineAudioContext(2, frames, SAMPLE_RATE);
	const buffer = offline.createBuffer(2, Math.max(1, srcL.length), clip.sampleRate || SAMPLE_RATE);
	buffer.copyToChannel(new Float32Array(srcL), 0);
	buffer.copyToChannel(new Float32Array(srcR ?? srcL), 1);
	const src = offline.createBufferSource();
	src.buffer = buffer;
	src.connect(offline.destination);
	src.start(0);
	const rendered = await offline.startRendering();
	return {
		left: new Float32Array(rendered.getChannelData(0)),
		right: new Float32Array(rendered.getChannelData(1)),
		duration: rendered.duration
	};
}
/** decodeForDemucs → separateDemucs. Playback uses the float stems. */
async function splitDemucsClip(clip, modelId = "htdemucs_6s", onProgress) {
	const spec = DEMUCS_CATALOG[modelId];
	onProgress?.({
		phase: "download",
		ratio: 0,
		detail: `Decoding at 44.1 kHz · ${spec.label}`
	});
	const decoded = await audioForDemucs(clip);
	const raw = await separateDemucs(decoded.left, decoded.right, modelId, onProgress);
	const pack = {};
	for (const name of DEMUCS_SOURCES) {
		const [l, r] = raw[name];
		const label = modelId === "htdemucs_ft" && name === "other" ? "instrumental" : name;
		pack[name] = makeClip(`${clip.name} ${label}`, SAMPLE_RATE, [l, r]);
	}
	return pack;
}
var STEM_TONE = {
	vocals: "bg-stem-vocals",
	drums: "bg-stem-drums",
	bass: "bg-stem-bass",
	guitar: "bg-stem-guitar",
	piano: "bg-stem-piano",
	other: "bg-stem-other"
};
function StemBoard({ pack, gains, mutes, solos, selected, playing, visible, labels, onGain, onMute, onSolo, onSelect, onPlayStem, onToBench }) {
	const anySolo = STEM_ORDER.some((n) => solos[n]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
		children: (visible ?? STEM_ORDER).map((name) => {
			const active = anySolo ? solos[name] : !mutes[name];
			const isSel = selected === name;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("rounded-lg border bg-elevated p-3", isSel ? "border-accent" : "border-border", active ? "opacity-100" : "opacity-50"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", STEM_TONE[name]) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex-1 text-left text-sm font-medium text-fg",
								onClick: () => onSelect(name),
								children: labels?.[name] ?? STEM_LABEL[name]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onMute(name),
								className: cn("min-h-11 min-w-11 rounded-sm text-xs font-medium", mutes[name] ? "bg-fg text-bg" : "text-muted hover:bg-surface"),
								"aria-pressed": mutes[name],
								children: "M"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onSolo(name),
								className: cn("min-h-11 min-w-11 rounded-sm text-xs font-medium", solos[name] ? "bg-fg text-bg" : "text-muted hover:bg-surface"),
								"aria-pressed": solos[name],
								children: "S"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						className: "mt-1",
						min: 0,
						max: 1.5,
						step: .01,
						value: [gains[name] ?? 1],
						onValueChange: ([v]) => onGain(name, v ?? 1),
						"aria-label": `${STEM_LABEL[name]} level`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => onPlayStem(name),
								children: [playing && isSel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {}), "Preview"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "ghost",
								onClick: () => {
									const left = pack[name].channels[0] ?? /* @__PURE__ */ new Float32Array(0);
									const right = pack[name].channels[1] ?? left;
									downloadBlob(encodeWavStereo(left, right, pack[name].sampleRate), `${pack[name].name}.wav`);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "WAV"]
							}),
							onToBench ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "ghost",
								onClick: () => onToBench(name),
								children: "To bench"
							}) : null
						]
					})
				]
			}, name);
		})
	});
}
function Progress({ value, className, label }) {
	const v = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-elevated", className),
		role: "progressbar",
		"aria-label": label,
		"aria-valuenow": Math.round(v),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-accent transition-[width] duration-200 ease-out",
			style: { width: `${v}%` }
		})
	});
}
var MODEL_TUNE = {
	htdemucs_6s: {
		vocal: 1,
		drums: 1,
		bass: 1,
		guitar: 1,
		piano: 1,
		sharpness: 1.2
	},
	htdemucs: {
		vocal: 1.05,
		drums: 1.08,
		bass: 1.05,
		guitar: .72,
		piano: .7,
		sharpness: 1.35
	},
	htdemucs_ft: {
		vocal: 1.5,
		drums: .85,
		bass: .9,
		guitar: .8,
		piano: .75,
		sharpness: 1.45
	}
};
var HQ_MODELS = /* @__PURE__ */ new Set([
	"htdemucs_6s",
	"htdemucs",
	"htdemucs_ft"
]);
async function splitStems(clip, opts) {
	const { onProgress } = opts;
	onProgress?.(.02, "Preparing", opts.quality === "hq" ? "download" : "map");
	if (opts.quality === "hq" && HQ_MODELS.has(opts.model)) {
		const { splitDemucsClip } = await import("./demucs-CzcNfEb_.mjs");
		return foldMode(await splitDemucsClip(clip, opts.model, (p) => {
			onProgress?.(p.ratio, p.detail, p.phase);
		}), opts.mode ?? 6);
	}
	if (opts.quality === "preview") {
		const pack = splitFilterbank(clip, opts.model);
		onProgress?.(1, "Done", "map");
		return foldMode(pack, opts.mode ?? 6);
	}
	return foldMode(await splitStft(clip, opts), opts.mode ?? 6);
}
function foldMode(pack, mode) {
	if (mode === 6) return pack;
	if (mode === 4) {
		const other = mixPair(pack.other, pack.guitar, pack.piano, "other");
		return {
			vocals: pack.vocals,
			drums: pack.drums,
			bass: pack.bass,
			guitar: silentLike(pack.guitar),
			piano: silentLike(pack.piano),
			other
		};
	}
	const other = mixPair(pack.drums, pack.bass, mixPair(pack.guitar, pack.piano, pack.other, "body"), "instrumental");
	return {
		vocals: pack.vocals,
		drums: silentLike(pack.drums),
		bass: silentLike(pack.bass),
		guitar: silentLike(pack.guitar),
		piano: silentLike(pack.piano),
		other
	};
}
function mixPair(a, b, c, name) {
	const n = a.channels[0]?.length ?? 0;
	const sr = a.sampleRate;
	const l = new Float32Array(n);
	const r = new Float32Array(n);
	for (const clip of [
		a,
		b,
		c
	]) {
		addScaled(l, clip.channels[0] ?? l, 1);
		addScaled(r, clip.channels[1] ?? clip.channels[0] ?? r, 1);
	}
	return makeClip(name, sr, [l, r]);
}
function silentLike(clip) {
	return makeClip(clip.name, clip.sampleRate, clip.channels.map((ch) => new Float32Array(ch.length)));
}
function splitFilterbank(clip, model) {
	const sr = clip.sampleRate;
	const [L, R] = stereoOf(clip);
	const n = L.length;
	const t = MODEL_TUNE[model];
	const mid = new Float32Array(n);
	const side = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		mid[i] = ((L[i] ?? 0) + (R[i] ?? 0)) * .5;
		side[i] = ((L[i] ?? 0) - (R[i] ?? 0)) * .5;
	}
	const bassMono = cascade(mid, [
		biquadLowpass(sr, 180, .7),
		biquadLowpass(sr, 180, .7),
		biquadPeaking(sr, 70, .8, 1.5)
	]);
	const vocalBand = cascade(mid, [
		biquadHighpass(sr, 220, .75),
		biquadLowpass(sr, 3800, .75),
		biquadPeaking(sr, 1200, .8, 1.2)
	]);
	const vocalAbs = new Float32Array(n);
	for (let i = 0; i < n; i++) vocalAbs[i] = Math.abs(vocalBand[i] ?? 0);
	const vocalEnv = onePoleLowpass(vocalAbs, sr, 40);
	const instrEnv = onePoleLowpass(vocalAbs, sr, 180);
	const vocals = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const motion = (vocalEnv[i] ?? 0) / ((instrEnv[i] ?? 0) + 1e-5);
		const gate = Math.min(1, Math.max(0, (motion - .85) * 2.2));
		vocals[i] = (vocalBand[i] ?? 0) * (.35 + .65 * gate) * t.vocal;
	}
	const hpL = cascade(L, [biquadHighpass(sr, 60, .7)]);
	const hpR = cascade(R, [biquadHighpass(sr, 60, .7)]);
	const slowL = onePoleLowpass(hpL, sr, 14);
	const slowR = onePoleLowpass(hpR, sr, 14);
	const drumsL = new Float32Array(n);
	const drumsR = new Float32Array(n);
	const hatsL = runBiquad(hpL, biquadHighpass(sr, 6500, .7));
	const hatsR = runBiquad(hpR, biquadHighpass(sr, 6500, .7));
	for (let i = 0; i < n; i++) {
		drumsL[i] = ((hpL[i] ?? 0) - (slowL[i] ?? 0)) * 1.25 * t.drums + (hatsL[i] ?? 0) * .7;
		drumsR[i] = ((hpR[i] ?? 0) - (slowR[i] ?? 0)) * 1.25 * t.drums + (hatsR[i] ?? 0) * .7;
	}
	const guitarSide = cascade(side, [biquadHighpass(sr, 180, .7), biquadLowpass(sr, 5200, .7)]);
	const guitar = new Float32Array(n);
	for (let i = 0; i < n; i++) guitar[i] = (guitarSide[i] ?? 0) * 1.35 * t.guitar;
	const pianoBand = cascade(mid, [biquadHighpass(sr, 140, .7), biquadLowpass(sr, 4200, .7)]);
	const piano = new Float32Array(n);
	for (let i = 0; i < n; i++) piano[i] = ((pianoBand[i] ?? 0) - (vocals[i] ?? 0) * .45) * .9 * t.piano;
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
		guitar: [add(midScale(guitar, .25), guitar), add(midScale(guitar, -.25), guitarInvert(guitar))],
		piano: [piano, piano],
		other: [otherL, otherR]
	});
}
function midScale(src, pan) {
	const o = new Float32Array(src.length);
	for (let i = 0; i < src.length; i++) o[i] = (src[i] ?? 0) * (1 + pan);
	return o;
}
function guitarInvert(src) {
	const o = new Float32Array(src.length);
	for (let i = 0; i < src.length; i++) o[i] = -(src[i] ?? 0);
	return o;
}
function add(a, b) {
	const o = new Float32Array(a.length);
	for (let i = 0; i < a.length; i++) o[i] = (a[i] ?? 0) + (b[i] ?? 0);
	return o;
}
function packFromChannels(name, sr, chans) {
	const pack = {};
	Object.keys(chans).forEach((k) => {
		pack[k] = makeClip(`${name} ${k}`, sr, [chans[k][0], chans[k][1]]);
	});
	return pack;
}
async function splitStft(clip, opts) {
	const fftSize = 4096;
	const hop = fftSize / 4;
	const sr = clip.sampleRate;
	const [L, R] = stereoOf(clip);
	const n = L.length;
	const t = MODEL_TUNE[opts.model];
	const window = hann(fftSize);
	const nFrames = Math.max(1, Math.floor((n - fftSize) / hop) + 1);
	const nBins = 2049;
	const acc = {
		vocals: [new Float32Array(n), new Float32Array(n)],
		drums: [new Float32Array(n), new Float32Array(n)],
		bass: [new Float32Array(n), new Float32Array(n)],
		guitar: [new Float32Array(n), new Float32Array(n)],
		piano: [new Float32Array(n), new Float32Array(n)],
		other: [new Float32Array(n), new Float32Array(n)]
	};
	const winSum = new Float32Array(n);
	const prevMag = new Float32Array(nBins);
	const names = [
		"vocals",
		"drums",
		"bass",
		"guitar",
		"piano",
		"other"
	];
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
		const reStem = emptyStemSpec(fftSize, names);
		const imStem = emptyStemSpec(fftSize, names);
		for (let k = 0; k < nBins; k++) {
			const freq = k * sr / fftSize;
			const lr = reL[k] ?? 0;
			const li = imL[k] ?? 0;
			const rr = reR[k] ?? 0;
			const ri = imR[k] ?? 0;
			const midRe = (lr + rr) * .5;
			const midIm = (li + ri) * .5;
			const sideRe = (lr - rr) * .5;
			const sideIm = (li - ri) * .5;
			const magM = Math.hypot(midRe, midIm);
			const magS = Math.hypot(sideRe, sideIm);
			const mag = magM + magS + 1e-12;
			const magPrev = prevMag[k] ?? mag;
			const flux = Math.abs(mag - magPrev);
			prevMag[k] = mag;
			const perc = flux / (mag + 1e-8);
			const harm = 1 / (1 + perc * 6);
			let drums = perc * (freq > 40 ? 1 : .2) * (freq < 12e3 ? 1 : .4) * t.drums;
			let bass = harm * magM * freqGate(freq, 30, 220) * t.bass;
			let vocals = magM * freqGate(freq, 180, 4200) * (1 - perc * .6) * (magM / (magS + magM)) * t.vocal;
			let guitar = (magS * 1.4 + magM * .25) * freqGate(freq, 120, 5500) * harm * t.guitar;
			let piano = magM * harm * freqGate(freq, 90, 4300) * (1 - freqGate(freq, 300, 2800) * .25) * t.piano;
			if (opts.model === "htdemucs_ft") {
				guitar *= melWeight(freq, 400, 2500);
				piano *= melWeight(freq, 200, 1800);
			}
			let other = mag * .22;
			drums = Math.max(1e-8, drums);
			bass = Math.max(1e-8, bass);
			vocals = Math.max(1e-8, vocals);
			guitar = Math.max(1e-8, guitar);
			piano = Math.max(1e-8, piano);
			other = Math.max(1e-8, other);
			const sum = Math.pow(drums, pExp) + Math.pow(bass, pExp) + Math.pow(vocals, pExp) + Math.pow(guitar, pExp) + Math.pow(piano, pExp) + Math.pow(other, pExp);
			const masks = {
				drums: Math.pow(drums, pExp) / sum,
				bass: Math.pow(bass, pExp) / sum,
				vocals: Math.pow(vocals, pExp) / sum,
				guitar: Math.pow(guitar, pExp) / sum,
				piano: Math.pow(piano, pExp) / sum,
				other: Math.pow(other, pExp) / sum
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
		for (const name of names) for (const ch of [0, 1]) {
			fftRadix2(reStem[name][ch], imStem[name][ch], true);
			const dest = acc[name][ch];
			for (let i = 0; i < fftSize; i++) {
				const idx = start + i;
				if (idx >= n) break;
				dest[idx] += (reStem[name][ch][i] ?? 0) * (window[i] ?? 0);
			}
		}
		for (let i = 0; i < fftSize; i++) {
			const idx = start + i;
			if (idx >= n) break;
			const w = window[i] ?? 0;
			winSum[idx] += w * w;
		}
		if (f % 24 === 0) {
			opts.onProgress?.(.05 + f / nFrames * .9, "Studio STFT", "map");
			await yieldFrame();
		}
	}
	for (const name of names) for (const ch of [0, 1]) {
		const dest = acc[name][ch];
		for (let i = 0; i < n; i++) {
			const w = winSum[i] || 1;
			dest[i] /= w;
		}
	}
	opts.onProgress?.(1, "Done", "map");
	return packFromChannels(clip.name, sr, acc);
}
function emptyStemSpec(fftSize, names) {
	const o = {};
	for (const n of names) o[n] = [new Float32Array(fftSize), new Float32Array(fftSize)];
	return o;
}
function freqGate(f, lo, hi) {
	if (f <= lo * .5 || f >= hi * 1.6) return .02;
	if (f >= lo && f <= hi) return 1;
	if (f < lo) return (f - lo * .5) / (lo * .5);
	return 1 - (f - hi) / (hi * .6);
}
function melWeight(freq, c1, c2) {
	const m = 2595 * Math.log10(1 + freq / 700);
	const a = 2595 * Math.log10(1 + c1 / 700);
	const b = 2595 * Math.log10(1 + c2 / 700);
	const mid = (a + b) / 2;
	return .65 + .7 * Math.exp(-Math.pow((m - mid) / ((b - a) * .6 + 1), 2));
}
function hann(n) {
	const w = new Float32Array(n);
	for (let i = 0; i < n; i++) w[i] = .5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
	return w;
}
function fftRadix2(re, im, inverse) {
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
		const ang = (inverse ? 2 : -2) * Math.PI / len;
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
	if (inverse) for (let i = 0; i < n; i++) {
		re[i] = (re[i] ?? 0) / n;
		im[i] = (im[i] ?? 0) / n;
	}
}
function yieldFrame() {
	return new Promise((r) => setTimeout(r, 0));
}
function mixStems(pack, gains, mutes, solos) {
	const anySolo = STEM_NAMES.some((n) => solos[n]);
	const ref = pack.vocals;
	const n = ref.channels[0]?.length ?? 0;
	const sr = ref.sampleRate;
	const l = new Float32Array(n);
	const r = new Float32Array(n);
	for (const name of STEM_NAMES) {
		if (!(anySolo ? solos[name] : !mutes[name])) continue;
		const g = gains[name] ?? 1;
		const clip = pack[name];
		addScaled(l, clip.channels[0] ?? l, g);
		addScaled(r, clip.channels[1] ?? clip.channels[0] ?? r, g);
	}
	return makeClip(`${ref.name} mix`, sr, [l, r]);
}
function openDrums(pack) {
	const drums = pack.drums;
	const sr = drums.sampleRate;
	const [L, R] = stereoOf(drums);
	const kickL = cascade(L, [biquadLowpass(sr, 120, .7), biquadLowpass(sr, 90, .8)]);
	const kickR = cascade(R, [biquadLowpass(sr, 120, .7), biquadLowpass(sr, 90, .8)]);
	const snareL = cascade(L, [biquadHighpass(sr, 180, .7), biquadLowpass(sr, 4800, .7)]);
	const snareR = cascade(R, [biquadHighpass(sr, 180, .7), biquadLowpass(sr, 4800, .7)]);
	const hatsL = runBiquad(L, biquadHighpass(sr, 6500, .7));
	const hatsR = runBiquad(R, biquadHighpass(sr, 6500, .7));
	return {
		kick: makeClip(`${drums.name} kick`, sr, [kickL, kickR]),
		snare: makeClip(`${drums.name} snare`, sr, [snareL, snareR]),
		hats: makeClip(`${drums.name} hats`, sr, [hatsL, hatsR])
	};
}
var STEM_NAMES = [
	"vocals",
	"drums",
	"bass",
	"guitar",
	"piano",
	"other"
];
var EMPTY_GAIN = () => ({
	vocals: 1,
	drums: 1,
	bass: 1,
	guitar: 1,
	piano: 1,
	other: 1
});
var EMPTY_FLAG = () => ({
	vocals: false,
	drums: false,
	bass: false,
	guitar: false,
	piano: false,
	other: false
});
var MODE_VISIBLE = {
	6: [
		"vocals",
		"drums",
		"bass",
		"guitar",
		"piano",
		"other"
	],
	4: [
		"vocals",
		"drums",
		"bass",
		"other"
	],
	2: ["vocals", "other"]
};
function phaseTitle(phase) {
	if (phase === "download") return "Downloading weights";
	if (phase === "load") return "Loading engine";
	if (phase === "warmup") return "Warm-up";
	if (phase === "separate") return "Separating";
	if (phase === "map") return "Mapping stems";
	if (phase === "done") return "Ready";
	return "Working";
}
function busyLabel(phase, hq) {
	if (phase === "download") return "Downloading";
	if (phase === "load") return "Loading";
	if (phase === "warmup") return "Warming up";
	if (phase === "separate") return "Separating";
	if (!hq) return "Mapping stems";
	return "Working";
}
function JobMeter({ title, value, detail }) {
	const raw = Math.max(0, Math.min(100, value * 100));
	const pct = raw > 0 && raw < 10 ? raw.toFixed(1) : String(Math.round(raw));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg border border-border bg-surface/60 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "kicker text-muted",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-sm tabular text-fg",
					children: [pct, "%"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: raw,
				className: "mt-3 h-2",
				label: title
			}),
			detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 break-words font-mono text-xs tabular text-muted",
				children: detail
			}) : null
		]
	});
}
function saveStereo(clip, filename) {
	const left = clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
	const right = clip.channels[1] ?? left;
	const name = filename.endsWith(".wav") ? filename : `${filename}.wav`;
	downloadBlob(encodeWavStereo(left, right, clip.sampleRate), name);
}
function SplitPage() {
	const clip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const [model, setModel] = (0, import_react.useState)("htdemucs_6s");
	const [quality, setQuality] = (0, import_react.useState)("hq");
	const [mode, setMode] = (0, import_react.useState)(6);
	const [windowSec, setWindowSec] = (0, import_react.useState)("30");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("");
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [detail, setDetail] = (0, import_react.useState)("");
	const [pack, setPack] = (0, import_react.useState)(null);
	const [gains, setGains] = (0, import_react.useState)(EMPTY_GAIN);
	const [mutes, setMutes] = (0, import_react.useState)(EMPTY_FLAG);
	const [solos, setSolos] = (0, import_react.useState)(EMPTY_FLAG);
	const [selected, setSelected] = (0, import_react.useState)("mix");
	const [zipping, setZipping] = (0, import_react.useState)(false);
	const [zipRatio, setZipRatio] = (0, import_react.useState)(0);
	const [zipNote, setZipNote] = (0, import_react.useState)("");
	const [drumsOpen, setDrumsOpen] = (0, import_react.useState)(null);
	const t = useTransport();
	const bench = useLabPrefs();
	const appliedPrefs = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!bench.ready || !bench.prefs || appliedPrefs.current) return;
		appliedPrefs.current = true;
		const nextModel = normalizeStemModel(bench.prefs?.stemModel);
		setModel(nextModel);
		const native = STEM_MODELS.find((m) => m.id === nextModel)?.stems ?? 6;
		if (bench.prefs.quality === "preview" || bench.prefs.quality === "studio" || bench.prefs.quality === "hq") setQuality(bench.prefs.quality);
		if (bench.prefs.stemMode === 2 || bench.prefs.stemMode === 4 || bench.prefs.stemMode === 6) {
			const saved = bench.prefs.stemMode;
			setMode(saved > native ? native : saved);
		} else setMode(native);
	}, [bench.ready, bench.prefs]);
	const modelMeta = STEM_MODELS.find((m) => m.id === model);
	const hqOn = quality === "hq";
	const mix = (0, import_react.useMemo)(() => {
		if (!pack) return null;
		return mixStems(pack, gains, mutes, solos);
	}, [
		pack,
		gains,
		mutes,
		solos
	]);
	const preview = selected === "mix" ? mix : pack?.[selected] ?? null;
	const pickModel = (id) => {
		setModel(id);
		const meta = STEM_MODELS.find((m) => m.id === id);
		if (!meta) return;
		if (meta.stems === 2) setMode(2);
		else if (mode > meta.stems) setMode(meta.stems);
	};
	const pickQuality = (q) => {
		setQuality(q);
	};
	const pickMode = (next) => {
		if (next === 6 && model !== "htdemucs_6s") {
			setModel("htdemucs_6s");
			setMode(6);
			return;
		}
		if (next === 4 && model === "htdemucs_ft") {
			setModel("htdemucs");
			setMode(4);
			return;
		}
		setMode(next);
	};
	const run = async () => {
		if (!clip) {
			toast.error("Drop a file or load the demo loop first.");
			return;
		}
		t.stop();
		setBusy(true);
		setPhase(quality === "hq" ? "download" : "map");
		setProgress(0);
		setDetail(quality === "hq" ? "Starting download" : "Preparing");
		setPack(null);
		setDrumsOpen(null);
		try {
			const next = await splitStems(windowSec === "30" && clip.duration > 30 ? sliceClip(clip, 0, 30, `${clip.name} 30s`) : clip, {
				model,
				quality,
				mode,
				onProgress: (p, d, ph) => {
					setProgress(p);
					if (d) setDetail(d);
					if (ph) setPhase(ph);
				}
			});
			setPack(next);
			setGains(EMPTY_GAIN());
			setMutes(EMPTY_FLAG());
			setSolos(EMPTY_FLAG());
			setSelected("mix");
			const label = mode === 2 ? "Vocals and instrumental ready." : mode === 4 ? "Four stems ready." : "Six stems ready.";
			toast.success(`${label} Files stayed on this device.`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Split failed.");
		} finally {
			setBusy(false);
		}
	};
	const preload = async () => {
		setBusy(true);
		setPhase("download");
		setProgress(0);
		setDetail(modelMeta?.name ?? "HTDemucs");
		try {
			const { loadDemucsSession } = await import("./demucs-CzcNfEb_.mjs");
			await loadDemucsSession((p) => {
				setPhase(p.phase);
				setProgress(p.ratio);
				setDetail(p.detail ?? p.phase);
			}, model);
			toast.success(`${modelMeta?.name ?? "Model"} cached on this device.`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Model load failed.");
		} finally {
			setBusy(false);
		}
	};
	const playPreview = async (name) => {
		const clipToPlay = name === "mix" ? mix : pack?.[name];
		if (!clipToPlay) return;
		setSelected(name);
		if (t.playing && selected === name) {
			t.pause();
			return;
		}
		await t.play(clipToPlay);
	};
	const zipAll = async () => {
		if (!pack || !clip) return;
		setZipping(true);
		setZipRatio(0);
		setZipNote("Preparing WAV files");
		try {
			const { encodeWavStereo } = await import("./demucs-CzcNfEb_.mjs");
			const base = clip.name.replace(/\s+/g, "_");
			const names = MODE_VISIBLE[mode];
			const files = [];
			for (let i = 0; i < names.length; i++) {
				const name = names[i];
				if (!name) continue;
				const stem = pack[name];
				setZipNote(`${name} · ${i + 1} / ${names.length}`);
				setZipRatio(i / names.length);
				const left = stem.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
				const wav = encodeWavStereo(left, stem.channels[1] ?? left, stem.sampleRate);
				files.push({
					name: `${base}_${name}.wav`,
					data: new Uint8Array(await wav.arrayBuffer())
				});
				setZipRatio((i + 1) / names.length);
				await new Promise((r) => setTimeout(r, 0));
			}
			setZipNote("Saving ZIP");
			setZipRatio(1);
			downloadBlob(zipStore(files), `${clip.name}_stems.zip`);
		} finally {
			setZipping(false);
		}
	};
	const toBench = (next, label) => {
		t.stop();
		setClip(next);
		toast.success(`${label} is on the bench for Trim, FX, Convert, Test, CoProducer.`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "split" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, { label: "Drop a mix" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "kicker text-muted",
					children: "Engine"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Stem model",
						value: model,
						onChange: pickModel,
						options: STEM_MODELS.map((m) => ({
							id: m.id,
							label: m.name,
							note: m.family
						}))
					})
				}),
				modelMeta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: modelMeta.note
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid gap-5 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Quality"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Quality",
						value: quality,
						onChange: pickQuality,
						options: [
							{
								id: "preview",
								label: "Preview",
								note: "Filterbank. Instant."
							},
							{
								id: "studio",
								label: "Studio",
								note: "STFT 4096. Instant."
							},
							{
								id: "hq",
								label: "HQ",
								note: modelMeta ? modelMeta.family : "ONNX"
							}
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Stems"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Stem count",
						value: String(mode),
						onChange: (v) => pickMode(Number(v)),
						options: [
							{
								id: "2",
								label: "2",
								note: "Vocal / inst."
							},
							{
								id: "4",
								label: "4",
								note: "V / D / B / O"
							},
							{
								id: "6",
								label: "6",
								note: "Full HTDemucs"
							}
						]
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Window"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Window",
						value: windowSec,
						onChange: setWindowSec,
						options: [{
							id: "30",
							label: "First 30s",
							note: "Best first HQ pass."
						}, {
							id: "full",
							label: "Full file"
						}]
					})]
				}),
				hqOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-xs leading-relaxed text-subtle",
					children: ["WebGPU if the device has it, otherwise WASM. The meter shows megabytes, speed, and time left. Nothing is uploaded.", clip && clip.duration > 90 && windowSec === "full" ? " Long files on HQ take a while. First 30s is a clean check." : ""]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs leading-relaxed text-subtle",
					children: "Preview and Studio are local spectral checks. They are instant and they are not the neural net. HQ downloads the selected ONNX weights and separates for real."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => void run(),
							disabled: busy || !clip,
							children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), busyLabel(phase, hqOn)] }) : hqOn ? "Split HQ" : "Split stems"
						}),
						quality === "hq" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => void preload(),
							disabled: busy,
							children: "Preload model"
						}) : null,
						bench.signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: busy,
							onClick: () => {
								bench.save({
									targetId: bench.prefs?.targetId ?? "spotify",
									stemModel: model,
									quality,
									stemMode: mode
								}).then(() => toast.success("Setup saved to this account.")).catch(() => toast.error("Sign in to save the setup."));
							},
							children: "Save setup"
						}) : null
					]
				}),
				busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobMeter, {
					title: phaseTitle(phase),
					value: progress,
					detail
				}) : null
			] }),
			pack && mix && preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
						clip: preview,
						playhead: t.current,
						onSeek: (v) => t.seek(v),
						className: "relative h-32 w-full overflow-hidden rounded-lg"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
						playing: t.playing,
						current: t.current,
						duration: preview.duration,
						onPlay: () => void playPreview(selected),
						onPause: t.pause,
						onStop: t.stop
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: selected === "mix" ? "default" : "secondary",
								onClick: () => void playPreview("mix"),
								children: "Mix"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => mix && saveStereo(mix, `${clip?.name ?? "mix"}_mixdown.wav`),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Mixdown"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => void zipAll(),
								disabled: zipping,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), zipping ? zipNote || "Writing stems" : "All stems ZIP"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => toBench(mix, "Mix"),
								children: "Mix to bench"
							}),
							mode !== 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => setDrumsOpen(openDrums(pack)),
								children: "Open drums"
							}) : null
						]
					}),
					zipping ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobMeter, {
						title: "Writing stems",
						value: zipRatio,
						detail: zipNote
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StemBoard, {
						pack,
						gains,
						mutes,
						solos,
						selected,
						playing: t.playing,
						visible: MODE_VISIBLE[mode],
						labels: mode === 2 ? { other: "Instrumental" } : void 0,
						onGain: (name, v) => setGains((g) => ({
							...g,
							[name]: v
						})),
						onMute: (name) => setMutes((m) => ({
							...m,
							[name]: !m[name]
						})),
						onSolo: (name) => setSolos((s) => ({
							...s,
							[name]: !s[name]
						})),
						onSelect: (name) => setSelected(name),
						onPlayStem: (name) => void playPreview(name),
						onToBench: (name) => toBench(pack[name], name)
					}),
					drumsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "kicker text-muted",
							children: "Drum open"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-subtle",
							children: "Kick / snare / hats from the drums stem. Filterbank split of the Demucs drum bus, not a second neural net."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								"kick",
								"snare",
								"hats"
							].map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								onClick: () => saveStereo(drumsOpen[name], drumsOpen[name].name),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), name]
							}, name))
						})
					] }) : null
				]
			}) : null
		]
	});
}
//#endregion
export { loadDemucsSession as a, split_CdyGb6Wd_exports as c, SplitPage as component, encodeWavStereo as i, DEMUCS_SOURCES as n, separateDemucs as o, decodeForDemucs as r, splitDemucsClip as s, DEMUCS_CATALOG as t };

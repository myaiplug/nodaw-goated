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
import { encodeWav } from "./io";
import { makeClip, type AudioClip, type StemModelId, type StemName, type StemPack } from "./types";

export const DEMUCS_SOURCES = [
  "drums",
  "bass",
  "other",
  "vocals",
  "guitar",
  "piano",
] as const;

export type DemucsStem = (typeof DEMUCS_SOURCES)[number];
export type DemucsPack = Record<DemucsStem, [Float32Array, Float32Array]>;

const SAMPLE_RATE = 44100;
/** Baked into the ONNX graph. Do not derive from 7.8 * 44100 (float drift). */
const N_SAMPLES = 343980;
const N_CHANNELS = 2;
const OVERLAP = Math.floor(N_SAMPLES / 4);
const STRIDE = N_SAMPLES - OVERLAP;
const MIN_MODEL_BYTES = 120_000_000;

type ModelSpec = {
  id: StemModelId;
  url: string;
  label: string;
  megabytes: number;
  /** Output rows, Demucs order. Missing names are written as silence. */
  rows: readonly DemucsStem[];
  /** Specialist: keep vocals, instrumental = mix - vocals. Other rows are by-products. */
  vocalsOnly: boolean;
};

export const DEMUCS_CATALOG: Record<StemModelId, ModelSpec> = {
  htdemucs_6s: {
    id: "htdemucs_6s",
    url: "https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s_fp16weights.onnx",
    label: "HTDemucs 6s",
    megabytes: 136,
    rows: ["drums", "bass", "other", "vocals", "guitar", "piano"],
    vocalsOnly: false,
  },
  htdemucs: {
    id: "htdemucs",
    url: "https://huggingface.co/StemSplitio/htdemucs-onnx/resolve/main/htdemucs_fp16weights.onnx",
    label: "HTDemucs",
    megabytes: 166,
    rows: ["drums", "bass", "other", "vocals"],
    vocalsOnly: false,
  },
  htdemucs_ft: {
    id: "htdemucs_ft",
    url: "https://huggingface.co/StemSplitio/htdemucs-ft-vocals-onnx/resolve/main/htdemucs_ft_vocals_fp16weights.onnx",
    label: "FT Vocals",
    megabytes: 166,
    rows: ["drums", "bass", "other", "vocals"],
    vocalsOnly: true,
  },
};

/** @deprecated Use DEMUCS_CATALOG.htdemucs_6s.url */
export const DEMUCS_MODEL_URL = DEMUCS_CATALOG.htdemucs_6s.url;

const CACHE_NAME = "nodaw-demucs-v2";

export type DemucsProgress = {
  phase: "download" | "load" | "warmup" | "separate" | "done" | "error";
  /** 0–1 for this phase, not a blend of the whole job. */
  ratio: number;
  detail?: string;
  received?: number;
  total?: number;
};

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = import("onnxruntime-web").InferenceSession;

let ortModule: OrtModule | null = null;
let ortConfigured = false;
const readySessions = new Map<StemModelId, OrtSession>();
const sessionPromises = new Map<StemModelId, Promise<OrtSession>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getOrt(): Promise<OrtModule> {
  if (ortModule) return ortModule;
  if (typeof window === "undefined") {
    throw new Error("HTDemucs runs in the browser");
  }
  try {
    ortModule = await import("onnxruntime-web/webgpu");
  } catch {
    ortModule = await import("onnxruntime-web");
  }
  configureOrt(ortModule);
  return ortModule;
}

function configureOrt(ort: OrtModule) {
  if (ortConfigured) return;
  ortConfigured = true;
  // 1.18 single-thread SIMD. Newer ORT builds need SharedArrayBuffer, which this
  // page cannot turn on (it would break the embedded preview).
  const origin = typeof location !== "undefined" ? location.origin : "";
  ort.env.wasm.wasmPaths = `${origin}/ort/`;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;
}

async function putCache(url: string, buf: ArrayBuffer) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(buf.slice(0)));
  } catch {
    /* quota */
  }
}

async function dropCachedUrl(url: string) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
  } catch {
    /* private mode */
  }
}

function headerBytes(res: Response, expected: number) {
  const len = Number(res.headers.get("content-length") || 0);
  const linked = Number(res.headers.get("x-linked-size") || 0);
  if (len >= MIN_MODEL_BYTES) return len;
  if (linked >= MIN_MODEL_BYTES) return linked;
  return expected;
}

function formatDownload(received: number, total: number, startedAt: number) {
  const elapsed = Math.max(0.001, (performance.now() - startedAt) / 1000);
  const speed = received / elapsed;
  const remain = Math.max(0, total - received);
  const eta = speed > 0 ? remain / speed : 0;
  const mb = (n: number) => (n / 1e6).toFixed(1);
  const rate =
    speed >= 1e6 ? `${(speed / 1e6).toFixed(1)} MB/s` : `${Math.max(1, Math.round(speed / 1e3))} KB/s`;
  let etaLabel = "";
  if (received > 256_000 && eta > 1 && eta < 3600) {
    etaLabel =
      eta < 90 ? `${Math.round(eta)}s left` : `${Math.floor(eta / 60)}m ${Math.round(eta % 60)}s left`;
  }
  return etaLabel
    ? `${mb(received)} / ${mb(total)} MB · ${rate} · ${etaLabel}`
    : `${mb(received)} / ${mb(total)} MB · ${rate}`;
}

async function fetchModelOnce(
  url: string,
  expectedBytes: number,
  onProgress?: (p: DemucsProgress) => void,
): Promise<ArrayBuffer> {
  if (typeof caches !== "undefined") {
    try {
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
            detail: `From cache · ${(buf.byteLength / 1e6).toFixed(0)} MB`,
          });
          return buf;
        }
        await cache.delete(url);
        onProgress?.({
          phase: "download",
          ratio: 0,
          detail: "Corrupt cache cleared. Downloading again.",
        });
      }
    } catch {
      /* cache unavailable */
    }
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model download failed (${res.status})`);

  const total = headerBytes(res, expectedBytes);
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength < MIN_MODEL_BYTES) {
      throw new Error(`Model too small (${buf.byteLength} bytes). Download was cut off.`);
    }
    await putCache(url, buf);
    onProgress?.({
      phase: "download",
      ratio: 1,
      received: buf.byteLength,
      total: buf.byteLength,
      detail: `Download complete · ${(buf.byteLength / 1e6).toFixed(0)} MB`,
    });
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  let lastEmit = 0;
  let lastYield = 0;
  const startedAt = performance.now();
  const emit = (force: boolean) => {
    const now = performance.now();
    const first = lastEmit === 0;
    if (!force && !first && now - lastEmit < 150) return;
    lastEmit = now;
    const ratio = total > 0 ? Math.min(force ? 1 : 0.995, received / total) : 0;
    onProgress?.({
      phase: "download",
      ratio,
      received,
      total,
      detail: formatDownload(received, total, startedAt),
    });
  };

  onProgress?.({
    phase: "download",
    ratio: 0,
    received: 0,
    total,
    detail: `0.0 / ${(total / 1e6).toFixed(1)} MB`,
  });

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    emit(false);
    if (received - lastYield >= 4_000_000) {
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
  if (buf.byteLength < MIN_MODEL_BYTES) {
    throw new Error(`Model too small (${buf.byteLength} bytes). Download was cut off.`);
  }
  await putCache(url, buf);
  onProgress?.({
    phase: "download",
    ratio: 1,
    received: buf.byteLength,
    total: buf.byteLength,
    detail: `Download complete · ${(buf.byteLength / 1e6).toFixed(0)} MB`,
  });
  return buf;
}

async function fetchModelCached(
  url: string,
  expectedBytes: number,
  onProgress?: (p: DemucsProgress) => void,
): Promise<ArrayBuffer> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        onProgress?.({
          phase: "download",
          ratio: 0,
          detail: `Retry ${attempt + 1} / 3`,
        });
        await sleep(800 * 2 ** (attempt - 1));
      }
      return await fetchModelOnce(url, expectedBytes, onProgress);
    } catch (err) {
      lastErr = err;
      await dropCachedUrl(url);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Model download failed");
}

function hasWebGpu() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

type StemTensor = {
  getData?: (releaseData?: boolean) => Promise<unknown>;
  data?: unknown;
};

async function readStems(
  result: Record<string, StemTensor | undefined>,
  outputName: string | undefined,
  stemCount: number,
) {
  const tensor =
    result.stems ?? (outputName ? result[outputName] : undefined) ?? Object.values(result)[0];
  if (!tensor) throw new Error("HTDemucs returned no stems tensor");
  let data: unknown;
  if (typeof tensor.getData === "function") data = await tensor.getData(true);
  else data = tensor.data;
  const need = stemCount * N_CHANNELS * N_SAMPLES;
  if (!(data instanceof Float32Array) || data.length < need) {
    throw new Error("HTDemucs returned no stems tensor");
  }
  return data;
}

async function runSegment(
  session: OrtSession,
  input: InstanceType<OrtModule["Tensor"]>,
  stemCount: number,
) {
  const result = await session.run({ mix: input });
  return readStems(result as Record<string, StemTensor | undefined>, session.outputNames[0], stemCount);
}

async function createSession(
  ort: OrtModule,
  modelBuf: ArrayBuffer,
  stemCount: number,
  onProgress?: (p: DemucsProgress) => void,
): Promise<OrtSession> {
  const attempts: { providers: Array<"webgpu" | "wasm">; label: string }[] = [];
  if (hasWebGpu()) attempts.push({ providers: ["webgpu"], label: "WebGPU" });
  attempts.push({ providers: ["wasm"], label: "WASM" });

  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { providers, label } = attempts[i];
    onProgress?.({
      phase: "load",
      ratio: i / Math.max(1, attempts.length),
      detail: `Building ${label} session`,
    });
    try {
      const session = await ort.InferenceSession.create(modelBuf, {
        executionProviders: providers,
        graphOptimizationLevel: "basic",
        enableCpuMemArena: false,
        enableMemPattern: false,
        executionMode: "sequential",
        preferredOutputLocation: "cpu",
      });
      await warmUp(ort, session, stemCount, onProgress);
      onProgress?.({ phase: "load", ratio: 1, detail: `${label} ready` });
      return session;
    } catch (err) {
      lastErr = err;
      onProgress?.({
        phase: "load",
        ratio: (i + 0.5) / attempts.length,
        detail: i < attempts.length - 1 ? `${label} unavailable. Trying WASM.` : `${label} failed.`,
      });
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Could not start HTDemucs");
}

async function warmUp(
  ort: OrtModule,
  session: OrtSession,
  stemCount: number,
  onProgress?: (p: DemucsProgress) => void,
) {
  onProgress?.({ phase: "warmup", ratio: 0, detail: "Warm-up inference" });
  await sleep(0);
  const zeros = new Float32Array(N_CHANNELS * N_SAMPLES);
  const input = new ort.Tensor("float32", zeros, [1, N_CHANNELS, N_SAMPLES]);
  const data = await runSegment(session, input, stemCount);
  if (data.length < stemCount * N_CHANNELS * N_SAMPLES) {
    throw new Error(`Warm-up did not return ${stemCount} stems`);
  }
  onProgress?.({ phase: "warmup", ratio: 1, detail: "Model ready" });
}

async function releaseOthers(keep: StemModelId) {
  const drop: StemModelId[] = [];
  for (const id of readySessions.keys()) {
    if (id !== keep) drop.push(id);
  }
  for (const id of drop) {
    const session = readySessions.get(id);
    readySessions.delete(id);
    sessionPromises.delete(id);
    try {
      await session?.release();
    } catch {
      /* already gone */
    }
  }
}

export async function loadDemucsSession(
  onProgress?: (p: DemucsProgress) => void,
  modelId: StemModelId = "htdemucs_6s",
): Promise<OrtSession> {
  const spec = DEMUCS_CATALOG[modelId];
  const ready = readySessions.get(modelId);
  if (ready) {
    onProgress?.({ phase: "done", ratio: 1, detail: `${spec.label} already loaded` });
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
      detail: `${spec.label} · ${spec.megabytes} MB`,
    });
    const modelBuf = await fetchModelCached(spec.url, spec.megabytes * 1e6, onProgress);
    const session = await createSession(ort, modelBuf, spec.rows.length, onProgress);
    readySessions.set(modelId, session);
    onProgress?.({ phase: "load", ratio: 1, detail: `${spec.label} ready` });
    return session;
  })().catch((err) => {
    sessionPromises.delete(modelId);
    readySessions.delete(modelId);
    onProgress?.({
      phase: "error",
      ratio: 0,
      detail: err instanceof Error ? err.message : "HTDemucs failed",
    });
    throw err;
  });

  sessionPromises.set(modelId, job);
  return job;
}

export function isDemucsReady(modelId: StemModelId = "htdemucs_6s") {
  return readySessions.has(modelId);
}

export function resetDemucsSession(modelId?: StemModelId) {
  if (!modelId) {
    readySessions.clear();
    sessionPromises.clear();
    return;
  }
  readySessions.delete(modelId);
  sessionPromises.delete(modelId);
}

function makeTransitionWindow(segment: number, overlap: number) {
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

export async function separateDemucs(
  left: Float32Array,
  right: Float32Array,
  modelId: StemModelId = "htdemucs_6s",
  onProgress?: (p: DemucsProgress) => void,
): Promise<DemucsPack> {
  if (left.length !== right.length) throw new Error("Channel length mismatch");
  if (left.length < 1) throw new Error("Audio is empty");

  const spec = DEMUCS_CATALOG[modelId];
  const ort = await getOrt();
  const session = await loadDemucsSession(onProgress, modelId);
  const totalLen = left.length;
  const nChunks = Math.max(1, Math.ceil(totalLen / STRIDE));
  const window = makeTransitionWindow(N_SAMPLES, OVERLAP);
  const rowIndex = new Map<DemucsStem, number>();
  spec.rows.forEach((name, i) => rowIndex.set(name, i));
  const out: [Float32Array, Float32Array][] = DEMUCS_SOURCES.map(() => [
    new Float32Array(totalLen),
    new Float32Array(totalLen),
  ]);
  const weight = new Float32Array(totalLen);
  const chunkBuf = new Float32Array(N_CHANNELS * N_SAMPLES);
  const activeRows = spec.vocalsOnly ? (["vocals"] as const) : spec.rows;

  for (let i = 0; i < nChunks; i++) {
    const start = i * STRIDE;
    const end = Math.min(start + N_SAMPLES, totalLen);
    const chunkLen = end - start;

    onProgress?.({
      phase: "separate",
      ratio: i / nChunks,
      detail: `${spec.label} · chunk ${i + 1} / ${nChunks}`,
    });
    await sleep(0);

    chunkBuf.fill(0);
    chunkBuf.set(left.subarray(start, end), 0);
    chunkBuf.set(right.subarray(start, end), N_SAMPLES);

    const input = new ort.Tensor("float32", chunkBuf.slice(), [1, N_CHANNELS, N_SAMPLES]);
    const stems = await runSegment(session, input, spec.rows.length);

    for (const name of activeRows) {
      const stem = rowIndex.get(name);
      if (stem === undefined) continue;
      const destPair = out[DEMUCS_SOURCES.indexOf(name)];
      if (!destPair) continue;
      for (let ch = 0; ch < N_CHANNELS; ch++) {
        const rowStart = (stem * N_CHANNELS + ch) * N_SAMPLES;
        const dest = destPair[ch];
        for (let s = 0; s < chunkLen; s++) {
          dest[start + s] += (stems[rowStart + s] ?? 0) * (window[s] ?? 1);
        }
      }
    }
    for (let s = 0; s < chunkLen; s++) weight[start + s] += window[s] ?? 1;
  }

  for (const pair of out) {
    for (let ch = 0; ch < N_CHANNELS; ch++) {
      const dest = pair[ch];
      for (let s = 0; s < totalLen; s++) dest[s] /= Math.max(weight[s] ?? 0, 1e-8);
    }
  }

  const pack = {} as DemucsPack;
  DEMUCS_SOURCES.forEach((name, i) => {
    pack[name] = out[i] as [Float32Array, Float32Array];
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

  const ready =
    spec.vocalsOnly ? "Vocals and instrumental ready" : spec.rows.length === 6 ? "Six stems ready" : "Four stems ready";
  onProgress?.({ phase: "done", ratio: 1, detail: ready });
  return pack;
}

export async function decodeForDemucs(
  file: Blob,
): Promise<{ left: Float32Array; right: Float32Array; duration: number }> {
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
      const L = new Float32Array(rendered.getChannelData(0));
      const R = new Float32Array(
        rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : rendered.getChannelData(0),
      );
      return { left: L, right: R, duration: rendered.duration };
    }
    const left = new Float32Array(audio.getChannelData(0));
    const right = new Float32Array(audio.length);
    if (audio.numberOfChannels > 1) right.set(audio.getChannelData(1));
    else right.set(left);
    return { left, right, duration: audio.duration };
  } finally {
    await ctx.close();
  }
}

export function encodeWavStereo(
  left: Float32Array,
  right: Float32Array,
  sampleRate = SAMPLE_RATE,
): Blob {
  const n = Math.min(left.length, right.length);
  const buf = new ArrayBuffer(44 + n * 4);
  const view = new DataView(buf);
  const ws = (o: number, s: string) => {
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
  for (let i = 0; i < n; i++) {
    for (const ch of [left, right]) {
      const v = Math.max(-1, Math.min(1, ch[i] ?? 0));
      view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: "audio/wav" });
}

async function audioForDemucs(clip: AudioClip) {
  try {
    const wav = encodeWav(clip, 16, false);
    const decoded = await decodeForDemucs(wav);
    if (decoded.left.length > 0 && decoded.right.length === decoded.left.length) return decoded;
  } catch {
    /* float-less 16-bit path failed; resample the clip directly */
  }
  const srcL = clip.channels[0] ?? new Float32Array(0);
  const srcR = clip.channels[1]?.length === srcL.length ? clip.channels[1] : srcL;
  if (clip.sampleRate === SAMPLE_RATE) {
    return {
      left: new Float32Array(srcL),
      right: new Float32Array(srcR),
      duration: srcL.length / SAMPLE_RATE,
    };
  }
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
    duration: rendered.duration,
  };
}

/** decodeForDemucs → separateDemucs. Playback uses the float stems. */
export async function splitDemucsClip(
  clip: AudioClip,
  modelId: StemModelId = "htdemucs_6s",
  onProgress?: (p: DemucsProgress) => void,
): Promise<StemPack> {
  const spec = DEMUCS_CATALOG[modelId];
  onProgress?.({ phase: "download", ratio: 0, detail: `Decoding at 44.1 kHz · ${spec.label}` });
  const decoded = await audioForDemucs(clip);
  const raw = await separateDemucs(decoded.left, decoded.right, modelId, onProgress);
  const pack = {} as StemPack;
  for (const name of DEMUCS_SOURCES) {
    const [l, r] = raw[name];
    const label = modelId === "htdemucs_ft" && name === "other" ? "instrumental" : name;
    pack[name as StemName] = makeClip(`${clip.name} ${label}`, SAMPLE_RATE, [l, r]);
  }
  return pack;
}

export function demucsProgressToRatio(p: DemucsProgress): number {
  if (p.phase === "download") return p.ratio * 0.28;
  if (p.phase === "load") return 0.28 + p.ratio * 0.08;
  if (p.phase === "warmup") return 0.36 + p.ratio * 0.12;
  if (p.phase === "separate") return 0.48 + p.ratio * 0.5;
  if (p.phase === "error") return 0;
  return 1;
}

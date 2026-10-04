import { makeClip, STEM_ORDER, type AudioClip, type StemPack } from "./types";

let sharedCtx: AudioContext | null = null;

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("Audio runs in the browser");
  }
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio is not available on this device");
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === "suspended") void sharedCtx.resume();
  return sharedCtx;
}

export async function decodeAudioFile(file: File): Promise<AudioClip> {
  const buf = await file.arrayBuffer();
  const wav = parseWav(buf, file.name.replace(/\.[^.]+$/, ""));
  if (wav) return wav;
  const ctx = getAudioContext();
  const audio = await ctx.decodeAudioData(buf.slice(0));
  const channels: Float32Array[] = [];
  for (let c = 0; c < audio.numberOfChannels; c++) {
    channels.push(new Float32Array(audio.getChannelData(c)));
  }
  return makeClip(file.name.replace(/\.[^.]+$/, ""), audio.sampleRate, channels);
}

function readStr(view: DataView, offset: number, n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

function parseWav(buf: ArrayBuffer, name: string): AudioClip | null {
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
      if (format === 0xfffe && size >= 40) {
        format = view.getUint16(start + 24, true);
      }
    } else if (id === "data") {
      dataOff = start;
      dataLen = size;
      break;
    }
    offset = start + size + (size % 2);
  }
  if (!dataOff || !sampleRate || !numCh || !bits) return null;
  const bytesPer = bits / 8;
  if (bytesPer !== 1 && bytesPer !== 2 && bytesPer !== 3 && bytesPer !== 4) return null;
  const n = Math.floor(dataLen / (bytesPer * numCh));
  if (n < 1) return null;
  const channels = Array.from({ length: numCh }, () => new Float32Array(n));
  let p = dataOff;
  const isFloat = format === 3;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numCh; c++) {
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
        let v = b0 | (b1 << 8) | (b2 << 16);
        if (v & 0x800000) v |= ~0xffffff;
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
  }
  return makeClip(name, sampleRate, channels);
}

export function clipToAudioBuffer(clip: AudioClip): AudioBuffer {
  const ctx = getAudioContext();
  const buffer = ctx.createBuffer(
    clip.channels.length,
    clip.channels[0]?.length ?? 0,
    clip.sampleRate,
  );
  for (let c = 0; c < clip.channels.length; c++) {
    buffer.copyToChannel(clip.channels[c] as Float32Array<ArrayBuffer>, c);
  }
  return buffer;
}

export function encodeWav(
  clip: AudioClip,
  bitDepth: 16 | 24 | 32 = 16,
  dither = bitDepth < 32,
): Blob {
  const numCh = Math.max(1, clip.channels.length);
  const n = clip.channels[0]?.length ?? 0;
  const bytesPerSample = bitDepth === 16 ? 2 : bitDepth === 24 ? 3 : 4;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = n * blockAlign;
  const header = 44;
  const buffer = new ArrayBuffer(header + dataSize);
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
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = clip.channels[c]?.[i] ?? 0;
      if (bitDepth === 16) {
        let v = s;
        if (dither) v += (Math.random() + Math.random() - 1) * (1 / 32768);
        v = Math.max(-1, Math.min(1, v));
        view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        offset += 2;
      } else if (bitDepth === 24) {
        let v = s;
        if (dither) v += (Math.random() + Math.random() - 1) * (1 / 8388608);
        v = Math.max(-1, Math.min(1, v));
        const int = Math.round(v * 0x7fffff);
        view.setUint8(offset, int & 0xff);
        view.setUint8(offset + 1, (int >> 8) & 0xff);
        view.setUint8(offset + 2, (int >> 16) & 0xff);
        offset += 3;
      } else {
        view.setFloat32(offset, s, true);
        offset += 4;
      }
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export function downloadBlob(blob: Blob, filename: string) {
  const safe = filename.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "nodaw";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safe;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 180_000);
  return url;
}

export function downloadWav(
  clip: AudioClip,
  filename: string,
  bitDepth: 16 | 24 | 32 = 16,
  dither = bitDepth < 32,
) {
  downloadBlob(
    encodeWav(clip, bitDepth, dither),
    filename.endsWith(".wav") ? filename : `${filename}.wav`,
  );
}

export async function zipStemPack(pack: StemPack, basename: string): Promise<Blob> {
  const files: { name: string; data: Uint8Array }[] = [];
  for (const name of STEM_ORDER) {
    const blob = encodeWav(pack[name], 16);
    files.push({
      name: `${basename}_${name}.wav`,
      data: new Uint8Array(await blob.arrayBuffer()),
    });
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return zipStore(files);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + nameBytes.length + file.data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
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
    cv.setUint32(0, 0x02014b50, true);
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
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...locals, ...centrals, end] as BlobPart[], {
    type: "application/zip",
  });
}

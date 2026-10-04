import type { AudioClip } from "./types";
import { encodeWav } from "./io";

export const DEFAULT_COMMENT = "Processed with NoDAW Labs FxIT.";

export type ReleaseFormat = "wav24" | "wav16" | "mp3-320" | "mp3-192";

export const RELEASE_FORMATS: { id: ReleaseFormat; label: string }[] = [
  { id: "wav24", label: "WAV 24" },
  { id: "wav16", label: "WAV 16" },
  { id: "mp3-320", label: "MP3 320" },
  { id: "mp3-192", label: "MP3 192" },
];

export type TrackMeta = {
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year: string;
  genre: string;
  track: string;
  bpm: string;
  comment: string;
  website: string;
  coverJpeg?: Uint8Array | null;
};

export function commentWithLink(comment: string, site: string) {
  const text = comment.trim();
  const url = site.trim();
  if (!url) return text || DEFAULT_COMMENT;
  if (text.includes(url)) return text;
  if (!text) return url;
  return `${text} ${url}`;
}

export function safeBase(name: string) {
  const cleaned = name.replace(/[^\w.-]+/g, " ").trim().replace(/\s+/g, " ");
  return cleaned.slice(0, 80).trim() || "nodaw-fx";
}

export async function coverFileToJpeg(file: File): Promise<{ bytes: Uint8Array; url: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Cover needs an image file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Cover image is over 20 MB.");
  const bitmap = await createImageBitmap(file);
  const max = 600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
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
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Cover encode failed."))),
      "image/jpeg",
      0.82,
    );
  });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob) };
}

export async function encodeRelease(
  clip: AudioClip,
  format: ReleaseFormat,
  meta: TrackMeta,
): Promise<{ blob: Blob; filename: string }> {
  const base = safeBase(meta.title || clip.name || "nodaw-fx");
  const comment = commentWithLink(meta.comment || DEFAULT_COMMENT, meta.website);
  const tags: TrackMeta = { ...meta, comment };
  if (format === "wav24" || format === "wav16") {
    const depth = format === "wav24" ? 24 : 16;
    const pcm = encodeWav(clip, depth, true);
    const bytes = new Uint8Array(await pcm.arrayBuffer());
    return {
      blob: new Blob([tagWav(bytes, tags)], { type: "audio/wav" }),
      filename: `${base}.wav`,
    };
  }
  const kbps = format === "mp3-320" ? 320 : 192;
  const mp3 = await encodeMp3(clip, kbps, tags);
  return { blob: new Blob([mp3], { type: "audio/mpeg" }), filename: `${base}.mp3` };
}

function latin1(value: string) {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 63;
    if (code === 10 || code === 13) out += " ";
    else if (code >= 32 && code <= 255) out += ch;
    else out += "?";
  }
  return out;
}

function utf16(value: string) {
  const bytes = new Uint8Array(2 + value.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bytes[2 + i * 2] = code & 0xff;
    bytes[3 + i * 2] = (code >> 8) & 0xff;
  }
  return bytes;
}

function keep(parts: (Uint8Array | null)[]) {
  const out: Uint8Array[] = [];
  for (const part of parts) if (part) out.push(part);
  return out;
}

function concat(parts: Uint8Array[]) {
  const size = parts.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function frame(id: string, body: Uint8Array) {
  const out = new Uint8Array(10 + body.length);
  out[0] = id.charCodeAt(0);
  out[1] = id.charCodeAt(1);
  out[2] = id.charCodeAt(2);
  out[3] = id.charCodeAt(3);
  new DataView(out.buffer).setUint32(4, body.length, false);
  out.set(body, 10);
  return out;
}

function textFrame(id: string, value: string) {
  const text = value.trim();
  if (!text) return null;
  const encoded = utf16(text);
  const body = new Uint8Array(1 + encoded.length);
  body[0] = 1;
  body.set(encoded, 1);
  return frame(id, body);
}

function commFrame(value: string) {
  const encoded = utf16(value);
  const desc = new Uint8Array([0xff, 0xfe, 0x00, 0x00]);
  const body = new Uint8Array(1 + 3 + desc.length + encoded.length);
  body[0] = 1;
  body[1] = 0x65;
  body[2] = 0x6e;
  body[3] = 0x67;
  body.set(desc, 4);
  body.set(encoded, 8);
  return frame("COMM", body);
}

function wxxxFrame(url: string) {
  const desc = latin1("NoDAW Labs");
  const link = latin1(url);
  const body = new Uint8Array(1 + desc.length + 1 + link.length);
  body[0] = 0;
  for (let i = 0; i < desc.length; i++) body[1 + i] = desc.charCodeAt(i);
  body[1 + desc.length] = 0;
  for (let i = 0; i < link.length; i++) body[2 + desc.length + i] = link.charCodeAt(i);
  return frame("WXXX", body);
}

function apicFrame(jpeg: Uint8Array) {
  const mime = "image/jpeg";
  const desc = "Cover";
  const body = new Uint8Array(1 + mime.length + 1 + 1 + desc.length + 1 + jpeg.length);
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

function buildId3(meta: TrackMeta) {
  const year = (meta.year.match(/\d{4}/) ?? [])[0] ?? "";
  const bpm = meta.bpm.trim().replace(/[^\d.]/g, "");
  const frames = [
    textFrame("TIT2", meta.title),
    textFrame("TPE1", meta.artist),
    textFrame("TALB", meta.album),
    textFrame("TPE2", meta.albumArtist),
    textFrame("TYER", year),
    textFrame("TCON", meta.genre),
    textFrame("TRCK", meta.track),
    textFrame("TBPM", bpm),
    commFrame(meta.comment || DEFAULT_COMMENT),
    meta.website.trim() ? wxxxFrame(meta.website.trim()) : null,
    meta.coverJpeg && meta.coverJpeg.length ? apicFrame(meta.coverJpeg) : null,
  ];
  const body = concat(keep(frames));
  const header = new Uint8Array(10);
  header[0] = 0x49;
  header[1] = 0x44;
  header[2] = 0x33;
  header[3] = 3;
  const size = body.length;
  header[6] = (size >> 21) & 0x7f;
  header[7] = (size >> 14) & 0x7f;
  header[8] = (size >> 7) & 0x7f;
  header[9] = size & 0x7f;
  return concat([header, body]);
}

const LAME_RATES = new Set([8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]);

function resampleLinear(input: Float32Array, from: number, to: number) {
  if (from === to) return input;
  const n = Math.max(1, Math.round((input.length * to) / from));
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

function toInt16(samples: Float32Array) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i] ?? 0;
    s += (Math.random() + Math.random() - 1) * (1 / 32768);
    s = Math.max(-1, Math.min(1, s));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

async function encodeMp3(clip: AudioClip, kbps: number, meta: TrackMeta) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const srcRate = clip.sampleRate || 44100;
  const rate = LAME_RATES.has(srcRate) ? srcRate : 44100;
  const left = resampleLinear(clip.channels[0] ?? new Float32Array(0), srcRate, rate);
  const rightSrc = clip.channels[1];
  const stereo = Boolean(rightSrc && rightSrc !== clip.channels[0]);
  const right = stereo ? resampleLinear(rightSrc, srcRate, rate) : left;
  const encoder = new Mp3Encoder(stereo ? 2 : 1, rate, kbps);
  const block = 1152;
  const parts: Uint8Array[] = [buildId3(meta)];
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += block) {
    const l = toInt16(left.subarray(i, Math.min(length, i + block)));
    const chunk = stereo
      ? encoder.encodeBuffer(l, toInt16(right.subarray(i, Math.min(length, i + block))))
      : encoder.encodeBuffer(l);
    if (chunk.length) parts.push(new Uint8Array(chunk));
    if ((i / block) % 40 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const end = encoder.flush();
  if (end.length) parts.push(new Uint8Array(end));
  return concat(parts);
}

function infoChunk(id: string, value: string) {
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

function tagWav(wav: Uint8Array, meta: TrackMeta) {
  const extras = [
    meta.albumArtist.trim() ? `album artist: ${meta.albumArtist.trim()}` : "",
    meta.track.trim() ? `track: ${meta.track.trim()}` : "",
    meta.bpm.trim() ? `bpm: ${meta.bpm.trim()}` : "",
    meta.website.trim() ? `tool: ${meta.website.trim()}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  const year = (meta.year.match(/\d{4}/) ?? [])[0] ?? "";
  const chunks = [
    infoChunk("INAM", meta.title),
    infoChunk("IART", meta.artist),
    infoChunk("IPRD", meta.album),
    infoChunk("IGNR", meta.genre),
    infoChunk("ICRD", year),
    infoChunk("ICMT", meta.comment || DEFAULT_COMMENT),
    infoChunk("IKEY", extras),
    infoChunk("ISFT", "NoDAW Labs FxIT"),
  ];
  const listBody = concat(keep(chunks));
  const list = new Uint8Array(8 + 4 + listBody.length);
  list[0] = 0x4c;
  list[1] = 0x49;
  list[2] = 0x53;
  list[3] = 0x54;
  new DataView(list.buffer).setUint32(4, 4 + listBody.length, true);
  list[8] = 0x49;
  list[9] = 0x4e;
  list[10] = 0x46;
  list[11] = 0x4f;
  list.set(listBody, 12);
  const out = concat([wav, list]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}

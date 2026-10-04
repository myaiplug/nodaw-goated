export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00.0";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const t = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${t}`;
}

export function formatClock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatHz(sr: number) {
  const k = sr / 1000;
  const s = Number.isInteger(k) ? String(k) : k.toFixed(1);
  return `${s} kHz`;
}

export function formatDb(v: number, digits = 1) {
  if (!Number.isFinite(v)) return "-";
  const n = v.toFixed(digits);
  return v > 0 ? `+${n}` : n;
}

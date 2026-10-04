import { useEffect, useRef } from "react";
import { computePeaks, type Peaks } from "@/lib/audio/dsp";
import type { AudioClip } from "@/lib/audio/types";

type Props = {
  clip: AudioClip;
  playhead?: number;
  start?: number;
  end?: number;
  onSeek?: (t: number) => void;
  onRegion?: (start: number, end: number) => void;
  className?: string;
};

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function Waveform({
  clip,
  playhead = 0,
  start = 0,
  end,
  onSeek,
  onRegion,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const peaksRef = useRef<{ w: number; peaks: Peaks } | null>(null);
  const regionEnd = end ?? clip.duration;
  const drag = useRef<null | "start" | "end" | "seek">(null);

  useEffect(() => {
    peaksRef.current = null;
  }, [clip]);

  useEffect(() => {
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
      if (!peaksRef.current || peaksRef.current.w !== buckets) {
        peaksRef.current = { w: buckets, peaks: computePeaks(clip, buckets) };
      }
      const peaks = peaksRef.current.peaks;
      const mid = h / 2;
      ctx.fillStyle = accent;
      const bar = Math.max(1, w / peaks.max.length - 0.4);
      for (let i = 0; i < peaks.max.length; i++) {
        const x = (i / peaks.max.length) * w;
        const hi = (peaks.max[i] ?? 0) * (h * 0.42);
        const lo = (peaks.min[i] ?? 0) * (h * 0.42);
        ctx.fillRect(x, mid - hi, bar, hi - lo || 1);
      }

      const x0 = (start / clip.duration) * w;
      const x1 = (regionEnd / clip.duration) * w;
      ctx.fillStyle = "rgba(197, 201, 209, 0.08)";
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), h);
      ctx.fillStyle = accent;
      ctx.fillRect(x0, 0, 2, h);
      ctx.fillRect(x1 - 2, 0, 2, h);

      const px = (playhead / clip.duration) * w;
      ctx.fillStyle = fg;
      ctx.fillRect(px, 0, 1.5, h);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [clip, playhead, start, regionEnd]);

  const timeAt = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || clip.duration <= 0) return 0;
    const r = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(clip.duration, r * clip.duration));
  };

  const pointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const t = timeAt(e.clientX);
    if (!onRegion) {
      drag.current = "seek";
      onSeek?.(t);
      return;
    }
    const hit = clip.duration * 0.06;
    const nearStart = Math.abs(t - start) < hit;
    const nearEnd = Math.abs(t - regionEnd) < hit;
    if (nearStart) drag.current = "start";
    else if (nearEnd) drag.current = "end";
    else {
      drag.current = "seek";
      onSeek?.(t);
    }
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const t = timeAt(e.clientX);
    if (drag.current === "seek") onSeek?.(t);
    else if (drag.current === "start") onRegion?.(Math.min(t, regionEnd - 0.05), regionEnd);
    else if (drag.current === "end") onRegion?.(start, Math.max(t, start + 0.05));
  };

  return (
    <div
      ref={wrapRef}
      className={className ?? "relative h-28 w-full overflow-hidden rounded-lg"}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}

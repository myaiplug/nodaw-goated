import { clipToAudioBuffer, getAudioContext } from "./io";
import type { AudioClip } from "./types";

export type PlayOpts = {
  loop?: boolean;
  start?: number;
  end?: number;
  onEnd?: () => void;
};

export class Transport {
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private startedAt = 0;
  private offset = 0;
  private playing = false;
  private clip: AudioClip | null = null;
  private loop = false;
  private region: { start: number; end: number } | null = null;
  private raf = 0;
  private listeners = new Set<(t: number) => void>;

  get isPlaying() {
    return this.playing;
  }

  get current() {
    if (!this.playing || !this.clip) return this.offset;
    const ctx = getAudioContext();
    const t = this.offset + (ctx.currentTime - this.startedAt);
    const end = this.region?.end ?? this.clip.duration;
    const start = this.region?.start ?? 0;
    if (this.loop) {
      const span = Math.max(0.05, end - start);
      return start + ((t - start) % span);
    }
    return Math.min(end, t);
  }

  subscribe(fn: (t: number) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private tick = () => {
    this.listeners.forEach((fn) => fn(this.current));
    if (this.playing) this.raf = requestAnimationFrame(this.tick);
  };

  async play(clip: AudioClip, opts: PlayOpts = {}) {
    this.stopGraph();
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    this.clip = clip;
    this.loop = Boolean(opts.loop);
    const start = opts.start ?? 0;
    const end = opts.end ?? clip.duration;
    this.region = { start, end };
    this.offset = start;
    const buffer = clipToAudioBuffer(clip);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = this.loop;
    if (this.loop) {
      src.loopStart = start;
      src.loopEnd = end;
    }
    const gain = ctx.createGain();
    src.connect(gain);
    gain.connect(ctx.destination);
    const dur = Math.max(0.01, end - start);
    src.start(0, start, this.loop ? undefined : dur);
    src.onended = () => {
      if (this.source === src) {
        this.playing = false;
        this.offset = this.loop ? start : end;
        opts.onEnd?.();
        this.listeners.forEach((fn) => fn(this.current));
      }
    };
    this.source = src;
    this.gain = gain;
    this.startedAt = ctx.currentTime;
    this.playing = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.stopGraph();
    this.offset = this.region?.start ?? 0;
    this.playing = false;
    this.listeners.forEach((fn) => fn(this.current));
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.current;
    this.stopGraph();
    this.playing = false;
    this.listeners.forEach((fn) => fn(this.current));
  }

  seek(t: number) {
    const clip = this.clip;
    if (!clip) {
      this.offset = t;
      return;
    }
    const start = this.region?.start ?? 0;
    const end = this.region?.end ?? clip.duration;
    this.offset = Math.max(start, Math.min(end, t));
    if (this.playing) void this.play(clip, { loop: this.loop, start, end });
    else this.listeners.forEach((fn) => fn(this.offset));
  }

  setGain(v: number) {
    if (this.gain) this.gain.gain.value = v;
  }

  private stopGraph() {
    cancelAnimationFrame(this.raf);
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source?.disconnect();
    this.gain?.disconnect();
    this.source = null;
    this.gain = null;
  }

  dispose() {
    this.stopGraph();
    this.listeners.clear();
    this.playing = false;
  }
}

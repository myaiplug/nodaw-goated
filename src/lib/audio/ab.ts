import { clipToAudioBuffer, getAudioContext } from "./io";
import type { AudioClip } from "./types";

export class AbDeck {
  private srcA: AudioBufferSourceNode | null = null;
  private srcB: AudioBufferSourceNode | null = null;
  private gA: GainNode | null = null;
  private gB: GainNode | null = null;
  private startedAt = 0;
  private offset = 0;
  private playing = false;
  private which: "A" | "B" = "A";
  private clipA: AudioClip | null = null;
  private clipB: AudioClip | null = null;
  private raf = 0;
  private listeners = new Set<(t: number) => void>();

  get isPlaying() {
    return this.playing;
  }

  get side() {
    return this.which;
  }

  get current() {
    const clip = this.clipA ?? this.clipB;
    if (!this.playing || !clip) return this.offset;
    const ctx = getAudioContext();
    const t = this.offset + (ctx.currentTime - this.startedAt);
    return Math.min(clip.duration, t);
  }

  subscribe(fn: (t: number) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private tick = () => {
    this.listeners.forEach((fn) => fn(this.current));
    if (this.playing) this.raf = requestAnimationFrame(this.tick);
  };

  async play(clipA: AudioClip | null, clipB: AudioClip | null, which: "A" | "B" = this.which) {
    this.stopGraph();
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    this.clipA = clipA;
    this.clipB = clipB;
    this.which = which;
    const master = clipA ?? clipB;
    if (!master) return;
    const start = Math.min(this.offset, master.duration - 0.01);
    this.offset = Math.max(0, start);

    const gA = ctx.createGain();
    const gB = ctx.createGain();
    gA.gain.value = which === "A" ? 1 : 0;
    gB.gain.value = which === "B" ? 1 : 0;
    gA.connect(ctx.destination);
    gB.connect(ctx.destination);

    if (clipA) {
      const src = ctx.createBufferSource();
      src.buffer = clipToAudioBuffer(clipA);
      src.connect(gA);
      src.start(0, this.offset);
      src.onended = () => {
        if (this.srcA === src) this.ended();
      };
      this.srcA = src;
    }
    if (clipB) {
      const src = ctx.createBufferSource();
      src.buffer = clipToAudioBuffer(clipB);
      src.connect(gB);
      const bOff = Math.min(this.offset, clipB.duration);
      if (this.offset < clipB.duration) src.start(0, bOff);
      this.srcB = src;
    }

    this.gA = gA;
    this.gB = gB;
    this.startedAt = ctx.currentTime;
    this.playing = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  flip(next: "A" | "B") {
    this.which = next;
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    if (this.gA && this.gB) {
      this.gA.gain.cancelScheduledValues(t);
      this.gB.gain.cancelScheduledValues(t);
      this.gA.gain.setValueAtTime(this.gA.gain.value, t);
      this.gB.gain.setValueAtTime(this.gB.gain.value, t);
      this.gA.gain.linearRampToValueAtTime(next === "A" ? 1 : 0, t + 0.012);
      this.gB.gain.linearRampToValueAtTime(next === "B" ? 1 : 0, t + 0.012);
    }
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.current;
    this.stopGraph();
    this.playing = false;
    this.listeners.forEach((fn) => fn(this.current));
  }

  stop() {
    this.stopGraph();
    this.offset = 0;
    this.playing = false;
    this.listeners.forEach((fn) => fn(0));
  }

  seek(t: number) {
    const master = this.clipA ?? this.clipB;
    this.offset = Math.max(0, Math.min(master?.duration ?? t, t));
    if (this.playing) void this.play(this.clipA, this.clipB, this.which);
    else this.listeners.forEach((fn) => fn(this.offset));
  }

  private ended() {
    this.playing = false;
    this.offset = (this.clipA ?? this.clipB)?.duration ?? 0;
    this.stopGraph();
    this.listeners.forEach((fn) => fn(this.current));
  }

  private stopGraph() {
    cancelAnimationFrame(this.raf);
    for (const s of [this.srcA, this.srcB]) {
      try {
        s?.stop();
      } catch {
        /* already stopped */
      }
      s?.disconnect();
    }
    this.gA?.disconnect();
    this.gB?.disconnect();
    this.srcA = null;
    this.srcB = null;
    this.gA = null;
    this.gB = null;
  }

  dispose() {
    this.stopGraph();
    this.listeners.clear();
    this.playing = false;
  }
}

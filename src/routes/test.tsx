import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DropZone } from "@/components/audio/drop-zone";
import { Panel } from "@/components/audio/panel";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AbDeck } from "@/lib/audio/ab";
import { analyzeMix, invertSum, type MixReport } from "@/lib/audio/analyze";
import { formatDb } from "@/lib/audio/format";
import { applyGainDb, measureLoudness, type LoudnessReport } from "@/lib/audio/lufs";
import { downloadWav } from "@/lib/audio/io";
import { useLabStore } from "@/lib/audio/store";
import type { AudioClip } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/test")({ component: TestPage });

function TestPage() {
  const clipA = useLabStore((s) => s.clip);
  const clipB = useLabStore((s) => s.clipB);
  const setClip = useLabStore((s) => s.setClip);
  const setClipB = useLabStore((s) => s.setClipB);
  const [side, setSide] = useState<"A" | "B" | "N">("A");
  const [match, setMatch] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [lufsA, setLufsA] = useState<LoudnessReport | null>(null);
  const [lufsB, setLufsB] = useState<LoudnessReport | null>(null);
  const [mixA, setMixA] = useState<MixReport | null>(null);
  const [mixB, setMixB] = useState<MixReport | null>(null);
  const [nullClip, setNullClip] = useState<AudioClip | null>(null);
  const deck = useRef<AbDeck | null>(null);

  useEffect(() => {
    const d = new AbDeck();
    deck.current = d;
    const unsub = d.subscribe((v) => {
      setCurrent(v);
      setPlaying(d.isPlaying);
    });
    return () => {
      unsub();
      d.dispose();
      deck.current = null;
    };
  }, []);

  useEffect(() => {
    if (!clipA) {
      setLufsA(null);
      setMixA(null);
      return;
    }
    const id = window.setTimeout(() => {
      setLufsA(measureLoudness(clipA));
      setMixA(analyzeMix(clipA));
    }, 20);
    return () => window.clearTimeout(id);
  }, [clipA]);

  useEffect(() => {
    if (!clipB) {
      setLufsB(null);
      setMixB(null);
      return;
    }
    const id = window.setTimeout(() => {
      setLufsB(measureLoudness(clipB));
      setMixB(analyzeMix(clipB));
    }, 20);
    return () => window.clearTimeout(id);
  }, [clipB]);

  useEffect(() => {
    if (!clipA || !clipB) {
      setNullClip(null);
      return;
    }
    const id = window.setTimeout(() => setNullClip(invertSum(clipA, clipB)), 20);
    return () => window.clearTimeout(id);
  }, [clipA, clipB]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "a" || e.key === "A") flip("A");
      if (e.key === "b" || e.key === "B") flip("B");
      if (e.key === "n" || e.key === "N") setSide("N");
      if (e.key === " ") {
        e.preventDefault();
        if (playing) deck.current?.pause();
        else void play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, clipA, clipB, match, side]);

  const prepared = (): [AudioClip | null, AudioClip | null] => {
    if (!clipA || !clipB || !match) return [clipA, clipB];
    const a = measureLoudness(clipA);
    const b = measureLoudness(clipB);
    const matchedB = applyGainDb(clipB, a.lufs - b.lufs, clipB.name);
    return [clipA, matchedB];
  };

  const play = async () => {
    if (side === "N") {
      if (!nullClip) return;
      await deck.current?.play(nullClip, null, "A");
      return;
    }
    const [a, b] = prepared();
    await deck.current?.play(a, b, side);
  };

  const flip = (next: "A" | "B") => {
    setSide(next);
    deck.current?.flip(next);
  };

  const active = side === "A" ? clipA : side === "B" ? clipB : nullClip;

  const nullRms = useMemo(() => {
    if (!nullClip) return null;
    return analyzeMix(nullClip).rmsDb;
  }, [nullClip]);

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="test" />
      <div className="grid gap-3 sm:grid-cols-2">
        <DropZone label="File A" clip={clipA} onClip={setClip} compact />
        <DropZone label="File B" clip={clipB} onClip={setClipB} compact />
      </div>
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-fg">Loudness match</p>
            <p className="text-xs text-muted">Gain-match B to A so level does not pick the winner.</p>
          </div>
          <Switch checked={match} onCheckedChange={setMatch} aria-label="Loudness match" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => flip("A")}
            className={cn(
              "min-h-24 rounded-lg border px-4 py-5 text-left transition-colors duration-150",
              side === "A" ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg",
            )}
          >
            <p className="font-display text-3xl font-semibold">A</p>
            <p className={cn("mt-1 text-xs", side === "A" ? "text-accent-fg/70" : "text-muted")}>
              {clipA ? (lufsA ? `${formatDb(lufsA.lufs)} LUFS` : clipA.name) : "Empty"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => flip("B")}
            className={cn(
              "min-h-24 rounded-lg border px-4 py-5 text-left transition-colors duration-150",
              side === "B" ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg",
            )}
          >
            <p className="font-display text-3xl font-semibold">B</p>
            <p className={cn("mt-1 text-xs", side === "B" ? "text-accent-fg/70" : "text-muted")}>
              {clipB ? (lufsB ? `${formatDb(lufsB.lufs)} LUFS` : clipB.name) : "Empty"}
            </p>
          </button>
        </div>
        <p className="mt-3 text-xs text-subtle">Tap A / B, or use the A and B keys. N plays the null. Space plays.</p>
      </Panel>

      {clipA && clipB && lufsA && lufsB && mixA && mixB ? (
        <Panel>
          <p className="kicker text-muted">Compare</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-72 text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 font-medium">A</th>
                  <th className="pb-2 font-medium">B</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular text-fg">
                <Row label="LUFS" a={lufsA.lufs.toFixed(1)} b={lufsB.lufs.toFixed(1)} />
                <Row label="True peak" a={`${lufsA.truePeakDb.toFixed(1)}`} b={`${lufsB.truePeakDb.toFixed(1)}`} />
                <Row label="LRA" a={lufsA.lra.toFixed(1)} b={lufsB.lra.toFixed(1)} />
                <Row label="Crest dB" a={mixA.crestDb.toFixed(1)} b={mixB.crestDb.toFixed(1)} />
                <Row label="Width" a={mixA.width.toFixed(2)} b={mixB.width.toFixed(2)} />
                <Row label="Stereo r" a={mixA.stereoCorr.toFixed(2)} b={mixB.stereoCorr.toFixed(2)} />
                <Row label="Clips" a={String(mixA.clipCount)} b={String(mixB.clipCount)} />
              </tbody>
            </table>
          </div>
          {nullClip ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={side === "N" ? "default" : "secondary"}
                onClick={() => {
                  setSide("N");
                  deck.current?.stop();
                }}
              >
                Null test
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  downloadWav(nullClip, `${clipA.name}_null.wav`);
                  toast.success("Null WAV.");
                }}
              >
                Download null
              </Button>
              {nullRms !== null ? (
                <p className="text-xs text-muted">Difference RMS {nullRms.toFixed(1)} dB</p>
              ) : null}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {active ? (
        <>
          <Waveform clip={active} playhead={current} onSeek={(v) => deck.current?.seek(v)} />
          <TransportBar
            playing={playing}
            current={current}
            duration={active.duration}
            disabled={!clipA && !clipB}
            onPlay={() => void play()}
            onPause={() => deck.current?.pause()}
            onStop={() => deck.current?.stop()}
          />
        </>
      ) : null}
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2 text-muted">{label}</td>
      <td className="py-2">{a}</td>
      <td className="py-2">{b}</td>
    </tr>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DropZone } from "@/components/audio/drop-zone";
import { Panel } from "@/components/audio/panel";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTransport } from "@/hooks/use-transport";
import { detectActiveRegion } from "@/lib/audio/analyze";
import { applyFades, nearestZeroCrossing, sliceClip } from "@/lib/audio/dsp";
import { formatTime } from "@/lib/audio/format";
import { downloadWav } from "@/lib/audio/io";
import { useLabStore } from "@/lib/audio/store";

export const Route = createFileRoute("/trim")({ component: TrimPage });

function TrimPage() {
  const clip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [snap, setSnap] = useState(true);
  const t = useTransport();

  useEffect(() => {
    if (!clip) {
      setStart(0);
      setEnd(0);
      return;
    }
    setStart(0);
    setEnd(clip.duration);
    t.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip]);

  const region = (a: number, b: number) => {
    setStart(a);
    setEnd(b);
  };

  const build = () => {
    if (!clip) return null;
    let a = start;
    let b = end;
    if (snap) {
      const ch = clip.channels[0] ?? new Float32Array(0);
      const ia = nearestZeroCrossing(ch, Math.floor(a * clip.sampleRate));
      const ib = nearestZeroCrossing(ch, Math.floor(b * clip.sampleRate));
      a = ia / clip.sampleRate;
      b = Math.max(a + 0.02, ib / clip.sampleRate);
    }
    let out = sliceClip(clip, a, b, `${clip.name}_trim`);
    out = applyFades(out, fadeIn, fadeOut);
    return out;
  };

  const exportClip = () => {
    const out = build();
    if (!out || !clip) return;
    downloadWav(out, `${clip.name}_trim.wav`);
    toast.success("Trim exported.");
  };

  const detect = () => {
    if (!clip) return;
    const r = detectActiveRegion(clip);
    setStart(r.start);
    setEnd(r.end);
    toast.success("Silence stripped from the edges.");
  };

  const toBench = () => {
    const out = build();
    if (!out) return;
    t.stop();
    setClip(out);
    toast.success("Region is on the bench.");
  };

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="trim" />
      <DropZone label="Drop a file to trim" />
      {clip ? (
        <>
          <Waveform
            clip={clip}
            playhead={t.current}
            start={start}
            end={end}
            onSeek={(v) => t.seek(v)}
            onRegion={region}
            className="relative h-36 w-full overflow-hidden rounded-lg"
          />
          <TransportBar
            playing={t.playing}
            current={t.current}
            duration={clip.duration}
            onPlay={() => void t.play(clip, { start, end })}
            onPause={t.pause}
            onStop={t.stop}
          />
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-fg">Snap to zero-crossing</p>
                <p className="text-xs text-muted">Avoids clicks at the cut.</p>
              </div>
              <Switch checked={snap} onCheckedChange={setSnap} aria-label="Snap to zero-crossing" />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Fade in {fadeIn.toFixed(2)}s</Label>
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={[fadeIn]}
                  onValueChange={([v]) => setFadeIn(v ?? 0)}
                />
              </div>
              <div>
                <Label>Fade out {fadeOut.toFixed(2)}s</Label>
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={[fadeOut]}
                  onValueChange={([v]) => setFadeOut(v ?? 0)}
                />
              </div>
            </div>
            <p className="mt-4 font-mono text-sm tabular text-muted">
              {formatTime(start)} to {formatTime(end)} · {(end - start).toFixed(2)}s
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={exportClip}>Export region</Button>
              <Button variant="secondary" onClick={detect}>
                Detect silence
              </Button>
              <Button variant="secondary" onClick={toBench}>
                Region to bench
              </Button>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

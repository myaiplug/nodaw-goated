import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Choice } from "@/components/audio/choice";
import { DropZone } from "@/components/audio/drop-zone";
import { Panel } from "@/components/audio/panel";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTransport } from "@/hooks/use-transport";
import { peakNormalize, resampleClip, toChannelCount } from "@/lib/audio/dsp";
import { formatClock, formatHz } from "@/lib/audio/format";
import { downloadWav } from "@/lib/audio/io";
import { useLabStore } from "@/lib/audio/store";
import type { AudioClip } from "@/lib/audio/types";

export const Route = createFileRoute("/convert")({ component: ConvertPage });

type Sr = "44100" | "48000" | "88200" | "96000" | "192000";
type Depth = "16" | "24" | "32";
type Ch = "1" | "2";

function ConvertPage() {
  const clip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const [sr, setSr] = useState<Sr>("44100");
  const [depth, setDepth] = useState<Depth>("16");
  const [ch, setCh] = useState<Ch>("2");
  const [normalize, setNormalize] = useState(true);
  const [dither, setDither] = useState(true);
  const [out, setOut] = useState<AudioClip | null>(null);
  const t = useTransport();

  const build = () => {
    if (!clip) return null;
    const stereo = toChannelCount(clip, Number(ch) as 1 | 2);
    let resampled = resampleClip(stereo, Number(sr));
    if (normalize) resampled = peakNormalize(resampled, -0.3);
    return {
      ...resampled,
      name: `${clip.name}_${Number(sr) / 1000}k_${depth}bit`,
    };
  };

  const run = () => {
    const named = build();
    if (!named) return;
    setOut(named);
    const bits = Number(depth) as 16 | 24 | 32;
    downloadWav(named, named.name, bits, bits < 32 && dither);
    toast.success(bits < 32 && dither ? "WAV ready. TPDF dither applied." : "WAV ready.");
  };

  const toBench = () => {
    const named = build() ?? out;
    if (!named) return;
    t.stop();
    setClip(named);
    toast.success("Converted clip is on the bench.");
  };

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="convert" />
      <DropZone label="Drop a file to convert" />
      {clip ? (
        <Panel>
          <p className="text-sm text-fg">{clip.name}</p>
          <p className="mt-1 text-xs text-muted">
            {formatClock(clip.duration)} · {formatHz(clip.sampleRate)} · {clip.channels.length} ch
          </p>
          <p className="mt-3 text-xs leading-relaxed text-subtle">
            WAV keeps the source sample rate on decode. Compressed files (MP3, M4A) decode at
            the device rate, then we resample with cubic interpolation. 16 and 24-bit get TPDF
            dither. 32-bit float is undithered.
          </p>
          <div className="mt-5">
            <p className="mb-2 kicker text-muted">Sample rate</p>
            <Choice
              ariaLabel="Sample rate"
              value={sr}
              onChange={setSr}
              options={[
                { id: "44100", label: "44.1 kHz" },
                { id: "48000", label: "48 kHz" },
                { id: "88200", label: "88.2 kHz" },
                { id: "96000", label: "96 kHz" },
                { id: "192000", label: "192 kHz" },
              ]}
            />
          </div>
          <div className="mt-5">
            <p className="mb-2 kicker text-muted">Bit depth</p>
            <Choice
              ariaLabel="Bit depth"
              value={depth}
              onChange={(v) => {
                setDepth(v);
                if (v === "32") setDither(false);
              }}
              options={[
                { id: "16", label: "16-bit", note: "TPDF" },
                { id: "24", label: "24-bit", note: "TPDF" },
                { id: "32", label: "32-bit float" },
              ]}
            />
          </div>
          <div className="mt-5">
            <p className="mb-2 kicker text-muted">Channels</p>
            <Choice
              ariaLabel="Channels"
              value={ch}
              onChange={setCh}
              options={[
                { id: "1", label: "Mono" },
                { id: "2", label: "Stereo" },
              ]}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-fg">Peak normalize</p>
              <p className="text-xs text-muted">Hit -0.3 dBFS before bounce.</p>
            </div>
            <Switch
              checked={normalize}
              onCheckedChange={setNormalize}
              aria-label="Peak normalize"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-fg">TPDF dither</p>
              <p className="text-xs text-muted">Triangular dither on integer depths.</p>
            </div>
            <Switch
              checked={dither && depth !== "32"}
              onCheckedChange={setDither}
              disabled={depth === "32"}
              aria-label="TPDF dither"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={run}>Convert and download</Button>
            <Button variant="secondary" onClick={toBench}>
              To bench
            </Button>
          </div>
        </Panel>
      ) : null}
      {out ? (
        <>
          <Waveform clip={out} playhead={t.current} onSeek={(v) => t.seek(v)} />
          <TransportBar
            playing={t.playing}
            current={t.current}
            duration={out.duration}
            onPlay={() => void t.play(out)}
            onPause={t.pause}
            onStop={t.stop}
          />
        </>
      ) : null}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Choice } from "@/components/audio/choice";
import { DropZone } from "@/components/audio/drop-zone";
import { Panel } from "@/components/audio/panel";
import { StemBoard } from "@/components/audio/stem-board";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTransport } from "@/hooks/use-transport";
import { sliceClip } from "@/lib/audio/dsp";
import { downloadBlob, zipStore } from "@/lib/audio/io";
import { encodeWavStereo } from "@/lib/audio/demucs";
import { mixStems, openDrums, splitStems, type SplitQuality } from "@/lib/audio/stems";
import { useLabStore } from "@/lib/audio/store";
import { useLabPrefs } from "@/lib/use-lab-prefs";
import {
  STEM_MODELS,
  normalizeStemModel,
  type AudioClip,
  type StemMode,
  type StemModelId,
  type StemName,
  type StemPack,
} from "@/lib/audio/types";

export const Route = createFileRoute("/split")({ component: SplitPage });

const EMPTY_GAIN = (): Record<StemName, number> => ({
  vocals: 1,
  drums: 1,
  bass: 1,
  guitar: 1,
  piano: 1,
  other: 1,
});
const EMPTY_FLAG = (): Record<StemName, boolean> => ({
  vocals: false,
  drums: false,
  bass: false,
  guitar: false,
  piano: false,
  other: false,
});

const MODE_VISIBLE: Record<StemMode, StemName[]> = {
  6: ["vocals", "drums", "bass", "guitar", "piano", "other"],
  4: ["vocals", "drums", "bass", "other"],
  2: ["vocals", "other"],
};

function phaseTitle(phase: string) {
  if (phase === "download") return "Downloading weights";
  if (phase === "load") return "Loading engine";
  if (phase === "warmup") return "Warm-up";
  if (phase === "separate") return "Separating";
  if (phase === "map") return "Mapping stems";
  if (phase === "done") return "Ready";
  return "Working";
}

function busyLabel(phase: string, hq: boolean) {
  if (phase === "download") return "Downloading";
  if (phase === "load") return "Loading";
  if (phase === "warmup") return "Warming up";
  if (phase === "separate") return "Separating";
  if (!hq) return "Mapping stems";
  return "Working";
}

function JobMeter({ title, value, detail }: { title: string; value: number; detail: string }) {
  const raw = Math.max(0, Math.min(100, value * 100));
  const pct = raw > 0 && raw < 10 ? raw.toFixed(1) : String(Math.round(raw));
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="kicker text-muted">{title}</p>
        <p className="font-mono text-sm tabular text-fg">{pct}%</p>
      </div>
      <Progress value={raw} className="mt-3 h-2" label={title} />
      {detail ? <p className="mt-2 break-words font-mono text-xs tabular text-muted">{detail}</p> : null}
    </div>
  );
}

function saveStereo(clip: AudioClip, filename: string) {
  const left = clip.channels[0] ?? new Float32Array(0);
  const right = clip.channels[1] ?? left;
  const name = filename.endsWith(".wav") ? filename : `${filename}.wav`;
  downloadBlob(encodeWavStereo(left, right, clip.sampleRate), name);
}

function SplitPage() {
  const clip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const [model, setModel] = useState<StemModelId>("htdemucs_6s");
  const [quality, setQuality] = useState<SplitQuality>("hq");
  const [mode, setMode] = useState<StemMode>(6);
  const [windowSec, setWindowSec] = useState<"full" | "30">("30");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState("");
  const [pack, setPack] = useState<StemPack | null>(null);
  const [gains, setGains] = useState(EMPTY_GAIN);
  const [mutes, setMutes] = useState(EMPTY_FLAG);
  const [solos, setSolos] = useState(EMPTY_FLAG);
  const [selected, setSelected] = useState<StemName | "mix">("mix");
  const [zipping, setZipping] = useState(false);
  const [zipRatio, setZipRatio] = useState(0);
  const [zipNote, setZipNote] = useState("");
  const [drumsOpen, setDrumsOpen] = useState<ReturnType<typeof openDrums> | null>(null);
  const t = useTransport();
  const bench = useLabPrefs();
  const appliedPrefs = useRef(false);

  useEffect(() => {
    if (!bench.ready || !bench.prefs || appliedPrefs.current) return;
    appliedPrefs.current = true;
    const nextModel = normalizeStemModel(bench.prefs?.stemModel);
    setModel(nextModel);
    const native = STEM_MODELS.find((m) => m.id === nextModel)?.stems ?? 6;
    if (
      bench.prefs.quality === "preview" ||
      bench.prefs.quality === "studio" ||
      bench.prefs.quality === "hq"
    ) {
      setQuality(bench.prefs.quality);
    }
    if (bench.prefs.stemMode === 2 || bench.prefs.stemMode === 4 || bench.prefs.stemMode === 6) {
      const saved = bench.prefs.stemMode;
      setMode(saved > native ? native : saved);
    } else {
      setMode(native);
    }
  }, [bench.ready, bench.prefs]);

  const modelMeta = STEM_MODELS.find((m) => m.id === model);
  const hqOn = quality === "hq";

  const mix = useMemo(() => {
    if (!pack) return null;
    return mixStems(pack, gains, mutes, solos);
  }, [pack, gains, mutes, solos]);

  const preview = selected === "mix" ? mix : (pack?.[selected] ?? null);

  const pickModel = (id: StemModelId) => {
    setModel(id);
    const meta = STEM_MODELS.find((m) => m.id === id);
    if (!meta) return;
    if (meta.stems === 2) setMode(2);
    else if (mode > meta.stems) setMode(meta.stems);
  };

  const pickQuality = (q: SplitQuality) => {
    setQuality(q);
  };

  const pickMode = (next: StemMode) => {
    if (next === 6 && model !== "htdemucs_6s") {
      setModel("htdemucs_6s");
      setMode(6);
      return;
    }
    if (next === 4 && model === "htdemucs_ft") {
      setModel("htdemucs");
      setMode(4);
      return;
    }
    setMode(next);
  };

  const run = async () => {
    if (!clip) {
      toast.error("Drop a file or load the demo loop first.");
      return;
    }
    t.stop();
    setBusy(true);
    setPhase(quality === "hq" ? "download" : "map");
    setProgress(0);
    setDetail(quality === "hq" ? "Starting download" : "Preparing");
    setPack(null);
    setDrumsOpen(null);
    try {
      const src =
        windowSec === "30" && clip.duration > 30
          ? sliceClip(clip, 0, 30, `${clip.name} 30s`)
          : clip;
      const next = await splitStems(src, {
        model,
        quality,
        mode,
        onProgress: (p, d, ph) => {
          setProgress(p);
          if (d) setDetail(d);
          if (ph) setPhase(ph);
        },
      });
      setPack(next);
      setGains(EMPTY_GAIN());
      setMutes(EMPTY_FLAG());
      setSolos(EMPTY_FLAG());
      setSelected("mix");
      const label =
        mode === 2 ? "Vocals and instrumental ready." : mode === 4 ? "Four stems ready." : "Six stems ready.";
      toast.success(`${label} Files stayed on this device.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Split failed.");
    } finally {
      setBusy(false);
    }
  };

  const preload = async () => {
    setBusy(true);
    setPhase("download");
    setProgress(0);
    setDetail(modelMeta?.name ?? "HTDemucs");
    try {
      const { loadDemucsSession } = await import("@/lib/audio/demucs");
      await loadDemucsSession((p) => {
        setPhase(p.phase);
        setProgress(p.ratio);
        setDetail(p.detail ?? p.phase);
      }, model);
      toast.success(`${modelMeta?.name ?? "Model"} cached on this device.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Model load failed.");
    } finally {
      setBusy(false);
    }
  };

  const playPreview = async (name: StemName | "mix") => {
    const clipToPlay = name === "mix" ? mix : pack?.[name];
    if (!clipToPlay) return;
    setSelected(name);
    if (t.playing && selected === name) {
      t.pause();
      return;
    }
    await t.play(clipToPlay);
  };

  const zipAll = async () => {
    if (!pack || !clip) return;
    setZipping(true);
    setZipRatio(0);
    setZipNote("Preparing WAV files");
    try {
      const { encodeWavStereo } = await import("@/lib/audio/demucs");
      const base = clip.name.replace(/\s+/g, "_");
      const names = MODE_VISIBLE[mode];
      const files: { name: string; data: Uint8Array }[] = [];
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (!name) continue;
        const stem = pack[name];
        setZipNote(`${name} · ${i + 1} / ${names.length}`);
        setZipRatio(i / names.length);
        const left = stem.channels[0] ?? new Float32Array(0);
        const right = stem.channels[1] ?? left;
        const wav = encodeWavStereo(left, right, stem.sampleRate);
        files.push({ name: `${base}_${name}.wav`, data: new Uint8Array(await wav.arrayBuffer()) });
        setZipRatio((i + 1) / names.length);
        await new Promise((r) => setTimeout(r, 0));
      }
      setZipNote("Saving ZIP");
      setZipRatio(1);
      downloadBlob(zipStore(files), `${clip.name}_stems.zip`);
    } finally {
      setZipping(false);
    }
  };

  const toBench = (next: NonNullable<typeof preview>, label: string) => {
    t.stop();
    setClip(next);
    toast.success(`${label} is on the bench for Trim, FX, Convert, Test, CoProducer.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="split" />

      <DropZone label="Drop a mix" />

      <Panel>
        <p className="kicker text-muted">Engine</p>
        <div className="mt-3">
          <Choice
            ariaLabel="Stem model"
            value={model}
            onChange={pickModel}
            options={STEM_MODELS.map((m) => ({
              id: m.id,
              label: m.name,
              note: m.family,
            }))}
          />
        </div>
        {modelMeta ? <p className="mt-3 text-sm text-muted">{modelMeta.note}</p> : null}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 kicker text-muted">Quality</p>
            <Choice
              ariaLabel="Quality"
              value={quality}
              onChange={pickQuality}
              options={[
                { id: "preview", label: "Preview", note: "Filterbank. Instant." },
                { id: "studio", label: "Studio", note: "STFT 4096. Instant." },
                { id: "hq", label: "HQ", note: modelMeta ? modelMeta.family : "ONNX" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 kicker text-muted">Stems</p>
            <Choice
              ariaLabel="Stem count"
              value={String(mode) as "2" | "4" | "6"}
              onChange={(v) => pickMode(Number(v) as StemMode)}
              options={[
                { id: "2", label: "2", note: "Vocal / inst." },
                { id: "4", label: "4", note: "V / D / B / O" },
                { id: "6", label: "6", note: "Full HTDemucs" },
              ]}
            />
          </div>
        </div>
        <div className="mt-5">
          <p className="mb-2 kicker text-muted">Window</p>
          <Choice
            ariaLabel="Window"
            value={windowSec}
            onChange={setWindowSec}
            options={[
              { id: "30", label: "First 30s", note: "Best first HQ pass." },
              { id: "full", label: "Full file" },
            ]}
          />
        </div>
        {hqOn ? (
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            WebGPU if the device has it, otherwise WASM. The meter shows megabytes, speed, and time
            left. Nothing is uploaded.
            {clip && clip.duration > 90 && windowSec === "full"
              ? " Long files on HQ take a while. First 30s is a clean check."
              : ""}
          </p>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Preview and Studio are local spectral checks. They are instant and they are not the
            neural net. HQ downloads the selected ONNX weights and separates for real.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void run()} disabled={busy || !clip}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                {busyLabel(phase, hqOn)}
              </>
            ) : hqOn ? (
              "Split HQ"
            ) : (
              "Split stems"
            )}
          </Button>
          {quality === "hq" ? (
            <Button variant="secondary" onClick={() => void preload()} disabled={busy}>
              Preload model
            </Button>
          ) : null}
          {bench.signedIn ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                void bench
                  .save({
                    targetId: bench.prefs?.targetId ?? "spotify",
                    stemModel: model,
                    quality,
                    stemMode: mode,
                  })
                  .then(() => toast.success("Setup saved to this account."))
                  .catch(() => toast.error("Sign in to save the setup."));
              }}
            >
              Save setup
            </Button>
          ) : null}
        </div>
        {busy ? <JobMeter title={phaseTitle(phase)} value={progress} detail={detail} /> : null}
      </Panel>

      {pack && mix && preview ? (
        <div className="flex flex-col gap-4">
          <Waveform
            clip={preview}
            playhead={t.current}
            onSeek={(v) => t.seek(v)}
            className="relative h-32 w-full overflow-hidden rounded-lg"
          />
          <TransportBar
            playing={t.playing}
            current={t.current}
            duration={preview.duration}
            onPlay={() => void playPreview(selected)}
            onPause={t.pause}
            onStop={t.stop}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={selected === "mix" ? "default" : "secondary"}
              onClick={() => void playPreview("mix")}
            >
              Mix
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => mix && saveStereo(mix, `${clip?.name ?? "mix"}_mixdown.wav`)}
            >
              <Download />
              Mixdown
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => void zipAll()} disabled={zipping}>
              <Download />
              {zipping ? zipNote || "Writing stems" : "All stems ZIP"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => toBench(mix, "Mix")}>
              Mix to bench
            </Button>
            {mode !== 2 ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setDrumsOpen(openDrums(pack))}
              >
                Open drums
              </Button>
            ) : null}
          </div>
          {zipping ? <JobMeter title="Writing stems" value={zipRatio} detail={zipNote} /> : null}
          <StemBoard
            pack={pack}
            gains={gains}
            mutes={mutes}
            solos={solos}
            selected={selected}
            playing={t.playing}
            visible={MODE_VISIBLE[mode]}
            labels={mode === 2 ? { other: "Instrumental" } : undefined}
            onGain={(name, v) => setGains((g) => ({ ...g, [name]: v }))}
            onMute={(name) => setMutes((m) => ({ ...m, [name]: !m[name] }))}
            onSolo={(name) => setSolos((s) => ({ ...s, [name]: !s[name] }))}
            onSelect={(name) => setSelected(name)}
            onPlayStem={(name) => void playPreview(name)}
            onToBench={(name) => toBench(pack[name], name)}
          />
          {drumsOpen ? (
            <Panel>
              <p className="kicker text-muted">Drum open</p>
              <p className="mt-2 text-xs text-subtle">
                Kick / snare / hats from the drums stem. Filterbank split of the Demucs drum bus,
                not a second neural net.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["kick", "snare", "hats"] as const).map((name) => (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => saveStereo(drumsOpen[name], drumsOpen[name].name)}
                  >
                    <Download />
                    {name}
                  </Button>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

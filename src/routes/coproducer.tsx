import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Choice } from "@/components/audio/choice";
import { DropZone } from "@/components/audio/drop-zone";
import { LufsMeter } from "@/components/audio/lufs-meter";
import { Panel } from "@/components/audio/panel";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import { useTransport } from "@/hooks/use-transport";
import { analyzeMix, type MixReport } from "@/lib/audio/analyze";
import { askCoproducer } from "@/lib/audio/coproducer-ai";
import { downloadWav } from "@/lib/audio/io";
import {
  describeLoudness,
  LUFS_TARGETS,
  measureLoudness,
  repairToTarget,
  type LoudnessReport,
} from "@/lib/audio/lufs";
import { useLabStore } from "@/lib/audio/store";
import type { AudioClip } from "@/lib/audio/types";
import { Link } from "@tanstack/react-router";
import { useLabPrefs } from "@/lib/use-lab-prefs";

export const Route = createFileRoute("/coproducer")({ component: CoproducerPage });

function CoproducerPage() {
  const clip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const [targetId, setTargetId] = useState<(typeof LUFS_TARGETS)[number]["id"]>("spotify");
  const [report, setReport] = useState<LoudnessReport | null>(null);
  const [mix, setMix] = useState<MixReport | null>(null);
  const [reading, setReading] = useState(false);
  const [repaired, setRepaired] = useState<AudioClip | null>(null);
  const [after, setAfter] = useState<LoudnessReport | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const t = useTransport();
  const bench = useLabPrefs();
  const appliedPrefs = useRef(false);

  const target = LUFS_TARGETS.find((x) => x.id === targetId) ?? LUFS_TARGETS[0];

  useEffect(() => {
    if (!bench.ready || !bench.prefs || appliedPrefs.current) return;
    appliedPrefs.current = true;
    const known = LUFS_TARGETS.find((x) => x.id === bench.prefs?.targetId);
    if (known) setTargetId(known.id);
  }, [bench.ready, bench.prefs]);

  useEffect(() => {
    setRepaired(null);
    setAfter(null);
    setAi(null);
    if (!clip) {
      setReport(null);
      setMix(null);
      return;
    }
    setReading(true);
    const id = window.setTimeout(() => {
      setReport(measureLoudness(clip));
      setMix(analyzeMix(clip));
      setReading(false);
    }, 20);
    return () => window.clearTimeout(id);
  }, [clip]);

  const repair = () => {
    if (!clip || !target) return;
    setReading(true);
    window.setTimeout(() => {
      const out = repairToTarget(clip, target.lufs, target.tp);
      const named = { ...out, name: `${clip.name}_${target.id}` };
      setRepaired(named);
      setAfter(measureLoudness(named));
      setReading(false);
      toast.success(`Repaired to ${target.lufs} LUFS / ${target.tp} dBTP.`);
    }, 20);
  };

  const ask = async () => {
    if (!report || !clip || !target) return;
    if (!bench.signedIn) {
      toast.error("Sign in to ask CoProducer.");
      return;
    }
    setAiBusy(true);
    setAi(null);
    try {
      const res = await askCoproducer({
        data: { report, target: target.lufs, name: clip.name, mix: mix ?? undefined },
      });
      if (res.ok) setAi(res.text);
      else toast.error(res.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message === "Unauthorized" ? "Sign in to ask CoProducer." : "CoProducer AI did not respond.");
    } finally {
      setAiBusy(false);
    }
  };

  const saveTarget = () => {
    void bench
      .save({
        targetId,
        stemModel: bench.prefs?.stemModel ?? "htdemucs_6s",
        quality: bench.prefs?.quality ?? "hq",
        stemMode: bench.prefs?.stemMode ?? 6,
      })
      .then(() => toast.success("Target saved to this account."))
      .catch(() => toast.error("Sign in to save the target."));
  };

  const audible = repaired ?? clip;
  const notes = report && target ? describeLoudness(report, target.lufs, target.tp) : [];

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="coproducer" />
      <DropZone label="Drop a mix to check" />
      <Panel>
        <p className="mb-2 kicker text-muted">Target</p>
        <Choice
          ariaLabel="Loudness target"
          value={targetId}
          onChange={setTargetId}
          options={LUFS_TARGETS.map((x) => ({
            id: x.id,
            label: x.label,
            note: `${x.lufs} LUFS / ${x.tp} dBTP`,
          }))}
        />
      </Panel>
      {reading ? (
        <Panel>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Reading loudness
          </p>
        </Panel>
      ) : null}
      {report && !reading ? (
        <Panel>
          <LufsMeter report={after ?? report} target={target.lufs} />
          {after ? (
            <p className="mt-4 text-sm text-muted">
              Before {report.lufs.toFixed(1)} LUFS / {report.truePeakDb.toFixed(1)} dBTP. After{" "}
              {after.lufs.toFixed(1)} LUFS / {after.truePeakDb.toFixed(1)} dBTP.
            </p>
          ) : null}
          {mix ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <Stat label="Crest" value={`${mix.crestDb.toFixed(1)} dB`} />
              <Stat label="Width" value={mix.width.toFixed(2)} />
              <Stat label="Stereo r" value={mix.stereoCorr.toFixed(2)} />
              <Stat label="RMS" value={`${mix.rmsDb.toFixed(1)} dB`} />
              <Stat label="Clips" value={String(mix.clipCount)} />
              <Stat label="DC" value={mix.dcOffset.toExponential(1)} />
            </dl>
          ) : null}
          <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={repair} disabled={!clip}>
              Repair to {target.label}
            </Button>
            {repaired ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    downloadWav(repaired, `${repaired.name}.wav`);
                    toast.success("Repaired WAV.");
                  }}
                >
                  Download repair
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    t.stop();
                    setClip(repaired);
                    toast.success("Repair is on the bench.");
                  }}
                >
                  Repair to bench
                </Button>
              </>
            ) : null}
            <Button variant="secondary" onClick={() => void ask()} disabled={aiBusy || !report}>
              {aiBusy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Asking
                </>
              ) : (
                "Ask CoProducer"
              )}
            </Button>
            {bench.signedIn ? (
              <Button variant="secondary" onClick={saveTarget}>
                Save target
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/login">Sign in for CoProducer</Link>
              </Button>
            )}
          </div>
          {ai ? (
            <div className="mt-5 whitespace-pre-wrap rounded-md border border-border bg-elevated p-4 text-sm leading-relaxed text-fg">
              {ai}
            </div>
          ) : null}
        </Panel>
      ) : null}
      {audible ? (
        <>
          <Waveform clip={audible} playhead={t.current} onSeek={(v) => t.seek(v)} />
          <TransportBar
            playing={t.playing}
            current={t.current}
            duration={audible.duration}
            onPlay={() => void t.play(audible)}
            onPause={t.pause}
            onStop={t.stop}
          />
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono tabular text-fg">{value}</dd>
    </div>
  );
}

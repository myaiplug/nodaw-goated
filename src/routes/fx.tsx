import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DropZone } from "@/components/audio/drop-zone";
import { RackKnob, RackMeters, RackPlates, RackScope, RACK_TABS, rackDb, rackPct, type RackTab } from "@/components/audio/rack-ui";
import { TransportBar } from "@/components/audio/transport";
import { Waveform } from "@/components/audio/waveform";
import { ToolHeader } from "@/components/layout/tool-header";
import { Button } from "@/components/ui/button";
import {
  FxRack,
  printRack,
  RACK_GROUPS,
  RACK_INIT,
  RACK_PRESETS,
  type RackGroup,
  type RackParams,
} from "@/lib/audio/fx-rack";
import { MODULE_PRESETS } from "@/lib/audio/fx-module-presets";
import { downloadBlob, unlockAudio } from "@/lib/audio/io";
import { useLabStore } from "@/lib/audio/store";
import {
  commentWithLink,
  coverFileToJpeg,
  DEFAULT_COMMENT,
  encodeRelease,
  RELEASE_FORMATS,
  type ReleaseFormat,
  type TrackMeta,
} from "@/lib/audio/tag";
import type { AudioClip } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fx")({ component: FxPage });

const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Podcast", "Speech"];

const META_INIT: TrackMeta = {
  title: "",
  artist: "",
  album: "",
  albumArtist: "",
  year: "",
  genre: "",
  track: "",
  bpm: "",
  comment: DEFAULT_COMMENT,
  website: "",
};

function FxPage() {
  const clip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const rackRef = useRef<FxRack | null>(null);
  const bypassRef = useRef(false);
  const titleTouched = useRef(false);
  const siteTouched = useRef(false);
  const [params, setParams] = useState<RackParams>(RACK_INIT);
  const [tab, setTab] = useState<RackTab>("shape");
  const [group, setGroup] = useState<RackGroup>("bus");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [modKey, setModKey] = useState<Record<string, string>>({});
  const [bypass, setBypass] = useState(false);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [printed, setPrinted] = useState<AudioClip | null>(null);
  const [format, setFormat] = useState<ReleaseFormat>("mp3-320");
  const [meta, setMeta] = useState<TrackMeta>(META_INIT);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saveFile, setSaveFile] = useState<{ url: string; filename: string } | null>(null);

  useEffect(() => {
    void import("@breezystack/lamejs");
    const rack = new FxRack();
    rackRef.current = rack;
    rack.setLoop(true);
    rack.setParams(RACK_INIT);
    const id = window.setInterval(() => {
      setPlaying(rack.isPlaying);
      setCurrent(rack.position);
    }, 50);
    return () => {
      window.clearInterval(id);
      rack.dispose();
      rackRef.current = null;
    };
  }, []);

  useEffect(() => {
    rackRef.current?.setClip(clip);
    setPrinted(null);
  }, [clip]);

  useEffect(() => {
    if (titleTouched.current || !clip) return;
    setMeta((m) => ({ ...m, title: clip.name }));
  }, [clip]);

  useEffect(() => {
    if (siteTouched.current) return;
    setMeta((m) => (m.website ? m : { ...m, website: window.location.origin }));
  }, []);

  useEffect(() => {
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [coverUrl]);

  useEffect(() => {
    return () => {
      if (saveFile) URL.revokeObjectURL(saveFile.url);
    };
  }, [saveFile]);

  const push = (next: RackParams, touched?: string) => {
    setParams(next);
    setPrinted(null);
    if (touched) setModKey((k) => (k[touched] ? { ...k, [touched]: "" } : k));
    rackRef.current?.setParams(bypassRef.current ? { ...next, mix: 0 } : next);
  };

  const loadPreset = (id: string) => {
    unlockAudio();
    const preset = RACK_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const next = { ...RACK_INIT, ...preset.params };
    bypassRef.current = false;
    setBypass(false);
    setPresetId(id);
    setModKey({});
    push(next);
    if (clip) void rackRef.current?.play();
  };

  const applyModule = (modId: string, presetIdNext: string) => {
    unlockAudio();
    const preset = MODULE_PRESETS[modId]?.find((p) => p.id === presetIdNext);
    if (!preset) return;
    bypassRef.current = false;
    setBypass(false);
    setPresetId(null);
    setModKey((k) => ({ ...k, [modId]: presetIdNext }));
    push({ ...params, ...preset.params });
    if (clip) void rackRef.current?.play();
  };

  const toggleBypass = () => {
    const next = !bypassRef.current;
    bypassRef.current = next;
    setBypass(next);
    setPrinted(null);
    rackRef.current?.setParams(next ? { ...params, mix: 0 } : params);
  };

  const patchMeta = (key: keyof TrackMeta, value: string) => {
    if (key === "title") titleTouched.current = true;
    if (key === "website") siteTouched.current = true;
    setMeta((m) => ({ ...m, [key]: value }));
  };

  const renderRack = async () => {
    if (!clip) {
      toast.error("Drop a file or load the demo first.");
      return;
    }
    setBusy(true);
    try {
      const out = await printRack(clip, bypassRef.current ? { ...params, mix: 0 } : params);
      setPrinted(out);
      toast.success("Rendered. Download writes the file.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Render failed.");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!printed) {
      toast.error("Render first, then download.");
      return;
    }
    setEncoding(true);
    try {
      const website = siteTouched.current ? meta.website : meta.website || window.location.origin;
      const file = await encodeRelease(printed, format, { ...meta, website });
      const activation = navigator.userActivation;
      const gesture = activation ? activation.isActive : true;
      if (gesture) downloadBlob(file.blob, file.filename);
      setSaveFile((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(file.blob), filename: file.filename };
      });
      toast.success(gesture ? `Saved ${file.filename}` : `Tap Save to keep ${file.filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setEncoding(false);
    }
  };

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = await coverFileToJpeg(file);
      setCoverUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return next.url;
      });
      setMeta((m) => ({ ...m, coverJpeg: next.bytes }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cover failed.");
    }
  };

  const clearCover = () => {
    setCoverUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMeta((m) => ({ ...m, coverJpeg: null }));
  };

  const presets = RACK_PRESETS.filter((p) => p.group === group);
  const mp3 = format.startsWith("mp3");
  const written = commentWithLink(meta.comment, meta.website);

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader id="fx" />
      <DropZone compact label="Drop audio into the rack" />
      <div className="rack-shell relative min-w-0 p-3 sm:p-4">
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1">
          <span className="rack-screw" />
        </div>
        <div className="pointer-events-none absolute right-3 top-3">
          <span className="rack-screw" />
        </div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 pl-4">
          <div>
            <p className="kicker text-nag">Newton AntiGravity · Live rack</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
              Slap a preset if the knobs are new. The curve is the EQ. The fill is the input.
              Render bakes this chain. Download writes the file. Audio stays on this device.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <RackMeters rackRef={rackRef} />
            <button
              type="button"
              onClick={toggleBypass}
              className={cn("rack-bank mb-4", bypass && "rack-bank-on")}
              aria-pressed={bypass}
            >
              <span className={cn("rack-led mr-2", bypass && "rack-led-on")} />
              Bypass
            </button>
          </div>
        </div>

        <div className="mb-3 flex max-w-full gap-2 overflow-x-auto pb-1">
          {RACK_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={cn("rack-bank", group === g.id && "rack-bank-on")}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex max-w-full gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              bypassRef.current = false;
              setBypass(false);
              setPresetId(null);
              setModKey({});
              push(RACK_INIT);
            }}
            className="rack-key shrink-0"
          >
            <span className="block text-xs uppercase tracking-label text-subtle">Rack</span>
            <span className="block text-sm text-fg">Init</span>
          </button>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p.id)}
              className={cn("rack-key shrink-0", presetId === p.id && "rack-key-on")}
            >
              <span className="block text-sm text-fg">{p.name}</span>
              <span className="block text-xs text-subtle">{p.blurb}</span>
            </button>
          ))}
        </div>

        <RackScope rackRef={rackRef} params={params} />

        {clip ? (
          <div className="mt-3">
            <Waveform clip={clip} playhead={current} onSeek={(t) => rackRef.current?.seek(t)} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Load audio. The rack stays on this device.</p>
        )}

        <div className="mt-4 flex max-w-full gap-2 overflow-x-auto">
          {RACK_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn("rack-bank", `rack-bank-${item.id}`, tab === item.id && "rack-bank-on")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <RackPlates tab={tab} params={params} active={modKey} onParams={push} onPreset={applyModule} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <TransportBar
            playing={playing}
            current={current}
            duration={clip?.duration ?? 0}
            disabled={!clip}
            onPlay={() => {
              unlockAudio();
              if (!clip) {
                toast.error("Drop a file or load the demo first.");
                return;
              }
              void rackRef.current?.play();
            }}
            onPause={() => rackRef.current?.pause()}
            onStop={() => rackRef.current?.stop()}
          />
          <button
            type="button"
            onClick={() => {
              const next = !loop;
              setLoop(next);
              rackRef.current?.setLoop(next);
            }}
            className={cn("rack-bank", loop && "rack-bank-on")}
            aria-pressed={loop}
          >
            Loop
          </button>
          <RackKnob
            label="In"
            value={params.inputDb}
            min={-12}
            max={12}
            step={0.1}
            format={rackDb}
            reset={0}
            onChange={(v) => push({ ...params, inputDb: v })}
          />
          <RackKnob
            label="Mix"
            value={params.mix}
            min={0}
            max={1}
            step={0.01}
            format={rackPct}
            reset={1}
            onChange={(v) => {
              if (bypassRef.current) {
                bypassRef.current = false;
                setBypass(false);
              }
              push({ ...params, mix: v });
            }}
          />
          <RackKnob
            label="Out"
            value={params.outputDb}
            min={-12}
            max={6}
            step={0.1}
            format={rackDb}
            reset={0}
            onChange={(v) => push({ ...params, outputDb: v })}
          />
        </div>

        <section className="rack-bay">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker text-accent">Release</p>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
                Render bakes the sound you hear. Download encodes it with these tags.
                Cover art is written into MP3. WAV keeps the text tags. The comment carries a link to this tool.
              </p>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto">
              {RELEASE_FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id)}
                  className={cn("rack-bank", format === item.id && "rack-bank-on")}
                  aria-pressed={format === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetaField label="Title" value={meta.title} onChange={(v) => patchMeta("title", v)} />
            <MetaField label="Artist" value={meta.artist} onChange={(v) => patchMeta("artist", v)} />
            <MetaField label="Album" value={meta.album} onChange={(v) => patchMeta("album", v)} />
            <MetaField label="Album artist" value={meta.albumArtist} onChange={(v) => patchMeta("albumArtist", v)} />
            <MetaField label="Year" value={meta.year} onChange={(v) => patchMeta("year", v)} inputMode="numeric" />
            <MetaField label="Genre" value={meta.genre} onChange={(v) => patchMeta("genre", v)} />
            <MetaField label="Track" value={meta.track} onChange={(v) => patchMeta("track", v)} placeholder="1 or 1/12" />
            <MetaField label="BPM" value={meta.bpm} onChange={(v) => patchMeta("bpm", v)} inputMode="decimal" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className={cn("rack-key", meta.genre === genre && "rack-key-on")}
                onClick={() => patchMeta("genre", genre)}
              >
                <span className="text-sm text-fg">{genre}</span>
              </button>
            ))}
          </div>

          <label className="mt-3 flex min-w-0 flex-col gap-1">
            <span className="text-xs text-subtle">Comments</span>
            <textarea
              className="rack-field"
              value={meta.comment}
              rows={3}
              onChange={(e) => patchMeta("comment", e.target.value)}
            />
          </label>
          <label className="mt-3 flex min-w-0 flex-col gap-1">
            <span className="text-xs text-subtle">Tool link</span>
            <input
              className="rack-field"
              value={meta.website}
              onChange={(e) => patchMeta("website", e.target.value)}
              inputMode="url"
              autoComplete="off"
            />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-subtle">Written comment: {written}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover preview" className="rack-cover" />
            ) : (
              <div className="rack-cover-well">No cover</div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-xs leading-relaxed text-muted">
                {mp3
                  ? "This image is embedded in the MP3 as cover art."
                  : "Switch to MP3 to embed the cover. WAV keeps the text tags only."}
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="rack-key cursor-pointer">
                  <span className="text-sm text-fg">{coverUrl ? "Replace cover" : "Attach cover"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void onCover(file);
                    }}
                  />
                </label>
                {coverUrl ? (
                  <button type="button" className="rack-key" onClick={clearCover}>
                    <span className="text-sm text-fg">Clear cover</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="lg" variant={printed ? "secondary" : "default"} disabled={!clip || busy || encoding} onClick={() => void renderRack()}>
              {busy ? "Rendering" : "Render"}
            </Button>
            <Button type="button" size="lg" variant={printed ? "default" : "secondary"} disabled={!printed || busy || encoding} onClick={() => void download()}>
              {encoding ? "Encoding" : "Download"}
            </Button>
            {saveFile ? (
              <a className="rack-key inline-flex items-center" href={saveFile.url} download={saveFile.filename}>
                <span className="text-sm text-fg">Save {saveFile.filename}</span>
              </a>
            ) : null}
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={!printed || busy}
              onClick={() => {
                if (!printed) return;
                rackRef.current?.stop();
                setClip(printed);
                toast.success("Render is on the bench.");
              }}
            >
              To bench
            </Button>
          </div>
          <p className="mt-2 text-xs text-subtle">
            {printed
              ? "Download uses this render. Move a knob and Render again."
              : "Download stays dark until this rack is rendered."}
          </p>
        </section>

        <div className="pointer-events-none mt-3 flex justify-between">
          <span className="rack-screw" />
          <span className="rack-screw" />
        </div>
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal" | "url";
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-subtle">{label}</span>
      <input
        className="rack-field"
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

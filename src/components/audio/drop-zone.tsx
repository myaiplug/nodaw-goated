import { useCallback, useRef, useState, type DragEvent } from "react";
import { FileAudio, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { makeDemoLoop } from "@/lib/audio/demo";
import { formatClock, formatHz } from "@/lib/audio/format";
import { decodeAudioFile, unlockAudio } from "@/lib/audio/io";
import { useLabStore } from "@/lib/audio/store";
import type { AudioClip } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  clip?: AudioClip | null;
  onClip?: (clip: AudioClip) => void;
  compact?: boolean;
};

export function DropZone({ label = "Drop a file", clip, onClip, compact }: Props) {
  const storeClip = useLabStore((s) => s.clip);
  const setClip = useLabStore((s) => s.setClip);
  const current = clip === undefined ? storeClip : clip;
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = useCallback(
    async (file: File) => {
      unlockAudio();
      setBusy(true);
      try {
        const decoded = await decodeAudioFile(file);
        onClip?.(decoded);
        if (clip === undefined) setClip(decoded);
        toast.success(`${decoded.name} · ${formatClock(decoded.duration)}`);
      } catch {
        toast.error("Could not decode that file. Try WAV, MP3, or M4A.");
      } finally {
        setBusy(false);
      }
    },
    [clip, onClip, setClip],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void take(file);
  };

  const loadDemo = () => {
    unlockAudio();
    const demo = makeDemoLoop();
    onClip?.(demo);
    if (clip === undefined) setClip(demo);
    toast.success("Loaded 90 BPM demo");
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-xl border border-dashed p-4 transition-colors duration-150 glass",
        over ? "border-accent bg-elevated" : "border-border",
        compact ? "p-3" : "p-5",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.aif,.aiff,.caf"
        className="hidden"
        suppressHydrationWarning
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void take(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-elevated text-muted">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileAudio className="size-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-fg">
              {current ? current.name : label}
            </p>
            <p className="text-xs text-muted">
              {current
                ? `${formatClock(current.duration)} · ${formatHz(current.sampleRate)} · ${current.channels.length} ch`
                : "WAV, MP3, M4A. Stays on this device."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={loadDemo}>
            Demo loop
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Reading" : "Open"}
          </Button>
        </div>
      </div>
    </div>
  );
}

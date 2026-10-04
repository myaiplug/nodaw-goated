import { Download, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/audio/io";
import { encodeWavStereo } from "@/lib/audio/demucs";
import { STEM_LABEL, STEM_ORDER, type StemName, type StemPack } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

const STEM_TONE: Record<StemName, string> = {
  vocals: "bg-stem-vocals",
  drums: "bg-stem-drums",
  bass: "bg-stem-bass",
  guitar: "bg-stem-guitar",
  piano: "bg-stem-piano",
  other: "bg-stem-other",
};

type Props = {
  pack: StemPack;
  gains: Record<StemName, number>;
  mutes: Record<StemName, boolean>;
  solos: Record<StemName, boolean>;
  selected: StemName | "mix";
  playing: boolean;
  visible?: StemName[];
  labels?: Partial<Record<StemName, string>>;
  onGain: (name: StemName, v: number) => void;
  onMute: (name: StemName) => void;
  onSolo: (name: StemName) => void;
  onSelect: (name: StemName | "mix") => void;
  onPlayStem: (name: StemName) => void;
  onToBench?: (name: StemName) => void;
};

export function StemBoard({
  pack,
  gains,
  mutes,
  solos,
  selected,
  playing,
  visible,
  labels,
  onGain,
  onMute,
  onSolo,
  onSelect,
  onPlayStem,
  onToBench,
}: Props) {
  const anySolo = STEM_ORDER.some((n) => solos[n]);
  const names = visible ?? STEM_ORDER;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {names.map((name) => {
        const active = anySolo ? solos[name] : !mutes[name];
        const isSel = selected === name;
        return (
          <div
            key={name}
            className={cn(
              "rounded-lg border bg-elevated p-3",
              isSel ? "border-accent" : "border-border",
              active ? "opacity-100" : "opacity-50",
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", STEM_TONE[name])} />
              <button
                type="button"
                className="flex-1 text-left text-sm font-medium text-fg"
                onClick={() => onSelect(name)}
              >
                {labels?.[name] ?? STEM_LABEL[name]}
              </button>
              <button
                type="button"
                onClick={() => onMute(name)}
                className={cn(
                  "min-h-11 min-w-11 rounded-sm text-xs font-medium",
                  mutes[name] ? "bg-fg text-bg" : "text-muted hover:bg-surface",
                )}
                aria-pressed={mutes[name]}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => onSolo(name)}
                className={cn(
                  "min-h-11 min-w-11 rounded-sm text-xs font-medium",
                  solos[name] ? "bg-fg text-bg" : "text-muted hover:bg-surface",
                )}
                aria-pressed={solos[name]}
              >
                S
              </button>
            </div>
            <Slider
              className="mt-1"
              min={0}
              max={1.5}
              step={0.01}
              value={[gains[name] ?? 1]}
              onValueChange={([v]) => onGain(name, v ?? 1)}
              aria-label={`${STEM_LABEL[name]} level`}
            />
            <div className="mt-1 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => onPlayStem(name)}>
                {playing && isSel ? <Pause /> : <Play />}
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const left = pack[name].channels[0] ?? new Float32Array(0);
                  const right = pack[name].channels[1] ?? left;
                  downloadBlob(
                    encodeWavStereo(left, right, pack[name].sampleRate),
                    `${pack[name].name}.wav`,
                  );
                }}
              >
                <Download />
                WAV
              </Button>
              {onToBench ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => onToBench(name)}>
                  To bench
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

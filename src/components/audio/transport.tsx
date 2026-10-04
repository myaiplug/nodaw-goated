import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/audio/format";
import { cn } from "@/lib/utils";

type Props = {
  playing: boolean;
  current: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  disabled?: boolean;
};

export function TransportBar({
  playing,
  current,
  duration,
  onPlay,
  onPause,
  onStop,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        disabled={disabled}
        onClick={() => (playing ? onPause() : onPlay())}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        onClick={onStop}
        aria-label="Stop"
      >
        <Square className="size-3.5" />
      </Button>
      <span
        className={cn(
          "ml-1 font-mono text-sm tabular-nums text-muted",
        )}
      >
        {formatTime(current)}
        <span className="text-subtle"> / {formatTime(duration)}</span>
      </span>
    </div>
  );
}

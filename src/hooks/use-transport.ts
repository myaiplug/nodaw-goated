import { useEffect, useRef, useState } from "react";
import { Transport, type PlayOpts } from "@/lib/audio/playback";
import type { AudioClip } from "@/lib/audio/types";

export function useTransport() {
  const ref = useRef<Transport | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const t = new Transport();
    ref.current = t;
    const unsub = t.subscribe((v) => {
      setCurrent(v);
      setPlaying(t.isPlaying);
    });
    return () => {
      unsub();
      t.dispose();
      ref.current = null;
    };
  }, []);

  return {
    current,
    playing,
    play: async (clip: AudioClip, opts?: PlayOpts) => {
      await ref.current?.play(clip, opts);
      setPlaying(true);
    },
    pause: () => {
      ref.current?.pause();
      setPlaying(false);
    },
    stop: () => {
      ref.current?.stop();
      setPlaying(false);
    },
    seek: (t: number) => ref.current?.seek(t),
  };
}

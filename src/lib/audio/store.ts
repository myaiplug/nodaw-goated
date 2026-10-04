import { create } from "zustand";
import type { AudioClip } from "./types";

type LabState = {
  clip: AudioClip | null;
  clipB: AudioClip | null;
  setClip: (clip: AudioClip | null) => void;
  setClipB: (clip: AudioClip | null) => void;
};

export const useLabStore = create<LabState>((set) => ({
  clip: null,
  clipB: null,
  setClip: (clip) => set({ clip }),
  setClipB: (clipB) => set({ clipB }),
}));

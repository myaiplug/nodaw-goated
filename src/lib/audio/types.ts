export type AudioClip = {
  name: string;
  sampleRate: number;
  channels: Float32Array[];
  duration: number;
};

export type StemName =
  | "vocals"
  | "drums"
  | "bass"
  | "guitar"
  | "piano"
  | "other";

export const STEM_ORDER: StemName[] = [
  "vocals",
  "drums",
  "bass",
  "guitar",
  "piano",
  "other",
];

export const STEM_LABEL: Record<StemName, string> = {
  vocals: "Vocals",
  drums: "Drums",
  bass: "Bass",
  guitar: "Guitar",
  piano: "Piano",
  other: "Other",
};

export type StemPack = Record<StemName, AudioClip>;

export type StemModelId = "htdemucs_6s" | "htdemucs" | "htdemucs_ft";

export type StemMode = 2 | 4 | 6;

export const STEM_MODELS: {
  id: StemModelId;
  name: string;
  family: string;
  note: string;
  hq: boolean;
  stems: StemMode;
}[] = [
  {
    id: "htdemucs_6s",
    name: "HTDemucs 6s",
    family: "136 MB · 6 stems",
    note: "Real 6-stem ONNX. Drums, bass, other, vocals, guitar, piano. First run downloads the weights. This device keeps them.",
    hq: true,
    stems: 6,
  },
  {
    id: "htdemucs",
    name: "HTDemucs",
    family: "166 MB · 4 stems",
    note: "Standard 4-stem ONNX. Drums, bass, other, vocals. Guitar and piano stay inside other, the way this model was trained.",
    hq: true,
    stems: 4,
  },
  {
    id: "htdemucs_ft",
    name: "FT Vocals",
    family: "166 MB · vocal",
    note: "Fine-tuned vocal specialist. Highest vocal isolation of the three. Instrumental is the mix with the vocal removed.",
    hq: true,
    stems: 2,
  },
];

/** Old bench ids from the spectral-map era, mapped onto a real engine. */
export function normalizeStemModel(id: string | undefined | null): StemModelId {
  if (id === "htdemucs" || id === "htdemucs_ft" || id === "htdemucs_6s") return id;
  if (id === "mdx23c") return "htdemucs";
  if (id === "mel_roformer") return "htdemucs_ft";
  return "htdemucs_6s";
}

export function frameCount(clip: AudioClip) {
  return clip.channels[0]?.length ?? 0;
}

export function makeClip(
  name: string,
  sampleRate: number,
  channels: Float32Array[],
): AudioClip {
  const length = channels[0]?.length ?? 0;
  return {
    name,
    sampleRate,
    channels,
    duration: length / sampleRate,
  };
}

export function stereoOf(clip: AudioClip): [Float32Array, Float32Array] {
  const l = clip.channels[0] ?? new Float32Array(0);
  const r = clip.channels[1] ?? l;
  return [l, r];
}

export function cloneClip(clip: AudioClip, name = clip.name): AudioClip {
  return makeClip(
    name,
    clip.sampleRate,
    clip.channels.map((c) => new Float32Array(c)),
  );
}

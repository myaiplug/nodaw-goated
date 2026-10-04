import {
  AudioLines,
  Blend,
  Gauge,
  Scissors,
  SplitSquareVertical,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolId = "split" | "trim" | "convert" | "test" | "fx" | "coproducer";

export type ToolHref = "/split" | "/trim" | "/convert" | "/test" | "/fx" | "/coproducer";

export type BrandSystem = "cn" | "nag";

export type ToolDef = {
  id: ToolId;
  href: ToolHref;
  name: string;
  product: string;
  short: string;
  blurb: string;
  detail: string;
  icon: LucideIcon;
  system: BrandSystem;
  step: string;
};

export const TOOLS: ToolDef[] = [
  {
    id: "split",
    href: "/split",
    name: "Liminal",
    product: "StemSplit",
    short: "Split",
    blurb: "Finished mix in. Real HTDemucs stems out.",
    detail:
      "Three ONNX engines in the browser. HTDemucs 6-stem, the standard 4-stem HTDemucs, and the fine-tuned vocal model. Cached after first load. Nothing uploaded.",
    icon: SplitSquareVertical,
    system: "cn",
    step: "01",
  },
  {
    id: "trim",
    href: "/trim",
    name: "TrimIT",
    product: "Wave trim",
    short: "Trim",
    blurb: "Cut the region. Fade. Snap the click out.",
    detail: "Tap the waveform, detect silence, snap the click out, send the region to the bench.",
    icon: Scissors,
    system: "nag",
    step: "02",
  },
  {
    id: "convert",
    href: "/convert",
    name: "ConvertIT",
    product: "Format",
    short: "Convert",
    blurb: "Studio WAV. Rate, bit depth, channels.",
    detail: "Phone m4a to 44.1k 16-bit stereo. Peak normalize. TPDF dither on 16 and 24-bit.",
    icon: AudioLines,
    system: "nag",
    step: "03",
  },
  {
    id: "test",
    href: "/test",
    name: "TestIT",
    product: "A/B",
    short: "A/B",
    blurb: "Synced compare. Loudness match so level does not lie.",
    detail: "Compare two mixes without the louder one winning. Null test the difference.",
    icon: Blend,
    system: "cn",
    step: "04",
  },
  {
    id: "fx",
    href: "/fx",
    name: "FxIT",
    product: "One-click FX",
    short: "FX",
    blurb: "Live rack. Presets if you skip the knobs.",
    detail:
      "Twenty-four modules, six creator presets each. Extra Q, punch attack, ceiling release, exciter band, phaser depth. Render, then download WAV or MP3 with cover art and a tool link in the comments. Audio stays here.",
    icon: Wand2,
    system: "nag",
    step: "05",
  },
  {
    id: "coproducer",
    href: "/coproducer",
    name: "CoProducer",
    product: "LUFS",
    short: "LUFS",
    blurb: "Check, repair, bounce to the platform target.",
    detail:
      "ITU-R BS.1770. Crest, stereo, DC, clip count. Spotify, Apple, YouTube, club, EBU, podcast.",
    icon: Gauge,
    system: "cn",
    step: "06",
  },
];

export const BRAND_LABEL: Record<BrandSystem, string> = {
  cn: "Chromatic Nihilism",
  nag: "Newton AntiGravity",
};

export function toolByHref(href: string) {
  return TOOLS.find((t) => t.href === href);
}

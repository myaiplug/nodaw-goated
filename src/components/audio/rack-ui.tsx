import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { FxRack, RackParams } from "@/lib/audio/fx-rack";
import { RACK_INIT, rackCurveDb } from "@/lib/audio/fx-rack";
import { MODULE_PRESETS } from "@/lib/audio/fx-module-presets";
import { cn } from "@/lib/utils";

export type RackTab = "shape" | "dynamics" | "color" | "space";

type KnobKey = {
  [K in keyof RackParams]: RackParams[K] extends number ? K : never;
}[keyof RackParams];

type PowerKey = {
  [K in keyof RackParams]: RackParams[K] extends boolean ? K : never;
}[keyof RackParams];

type KnobDef = {
  key: KnobKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

type ModuleDef = {
  id: string;
  name: string;
  hint: string;
  tab: RackTab;
  power: PowerKey;
  knobs: KnobDef[];
};

function hz(v: number) {
  if (v >= 1000) {
    const k = v / 1000;
    return `${k >= 10 ? k.toFixed(0) : k.toFixed(1)} kHz`;
  }
  return `${Math.round(v)} Hz`;
}

export function rackDb(v: number) {
  const n = Math.abs(v) < 0.05 ? "0.0" : v.toFixed(1);
  if (n === "0.0") return "0.0";
  return `${v > 0 ? "+" : ""}${n}`;
}

export function rackPct(v: number) {
  return `${Math.round(v * 100)}%`;
}

const HZ: Pick<KnobDef, "format"> = { format: hz };
const DB: Pick<KnobDef, "format"> = { format: rackDb };

export const RACK_TABS: { id: RackTab; label: string }[] = [
  { id: "shape", label: "Shape" },
  { id: "dynamics", label: "Dynamics" },
  { id: "color", label: "Color" },
  { id: "space", label: "Space" },
];

export const RACK_MODULES: ModuleDef[] = [
  {
    id: "hpf",
    name: "HPF",
    hint: "Rumble",
    tab: "shape",
    power: "hpfOn",
    knobs: [
      { key: "hpfHz", label: "Freq", min: 20, max: 800, step: 1, ...HZ },
      { key: "hpfQ", label: "Q", min: 0.3, max: 2.5, step: 0.01, format: (v) => v.toFixed(2) },
    ],
  },
  {
    id: "lp",
    name: "Lid",
    hint: "Air cut",
    tab: "shape",
    power: "lpOn",
    knobs: [
      { key: "lpHz", label: "Freq", min: 200, max: 18000, step: 10, ...HZ },
      { key: "lpQ", label: "Q", min: 0.3, max: 2.5, step: 0.01, format: (v) => v.toFixed(2) },
    ],
  },
  {
    id: "eq",
    name: "EQ",
    hint: "Four bands",
    tab: "shape",
    power: "eqOn",
    knobs: [
      { key: "eqLow", label: "Low", min: -12, max: 12, step: 0.1, ...DB },
      { key: "eqBody", label: "Body", min: -12, max: 12, step: 0.1, ...DB },
      { key: "eqPresence", label: "Presence", min: -12, max: 12, step: 0.1, ...DB },
      { key: "eqAir", label: "Air", min: -12, max: 12, step: 0.1, ...DB },
    ],
  },
  {
    id: "tilt",
    name: "Tilt",
    hint: "Low against air",
    tab: "shape",
    power: "tiltOn",
    knobs: [{ key: "tilt", label: "Tilt", min: -8, max: 8, step: 0.1, ...DB }],
  },
  {
    id: "bell",
    name: "Bell",
    hint: "Sweepable",
    tab: "shape",
    power: "bellOn",
    knobs: [
      { key: "bellHz", label: "Freq", min: 80, max: 12000, step: 1, ...HZ },
      { key: "bellDb", label: "Gain", min: -12, max: 12, step: 0.1, ...DB },
      { key: "bellQ", label: "Q", min: 0.4, max: 8, step: 0.1, format: (v) => v.toFixed(1) },
    ],
  },
  {
    id: "width",
    name: "Imager",
    hint: "Mid / side",
    tab: "shape",
    power: "widthOn",
    knobs: [{ key: "width", label: "Width", min: 0, max: 2, step: 0.01, format: (v) => `${Math.round(v * 100)}%` }],
  },
  {
    id: "deess",
    name: "De-ess",
    hint: "Sibilance",
    tab: "dynamics",
    power: "deessOn",
    knobs: [
      { key: "deessHz", label: "Freq", min: 3000, max: 12000, step: 10, ...HZ },
      { key: "deessAmt", label: "Amount", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "comp",
    name: "Comp",
    hint: "Level",
    tab: "dynamics",
    power: "compOn",
    knobs: [
      { key: "compThresh", label: "Thresh", min: -40, max: 0, step: 0.1, ...DB },
      { key: "compRatio", label: "Ratio", min: 1, max: 12, step: 0.1, format: (v) => `${v.toFixed(1)}:1` },
      { key: "compAttack", label: "Attack", min: 0.001, max: 0.08, step: 0.001, format: (v) => `${Math.round(v * 1000)} ms` },
      { key: "compRelease", label: "Release", min: 0.03, max: 0.4, step: 0.01, format: (v) => `${Math.round(v * 1000)} ms` },
      { key: "compMakeup", label: "Makeup", min: 0, max: 8, step: 0.1, ...DB },
    ],
  },
  {
    id: "punch",
    name: "Punch",
    hint: "Attack",
    tab: "dynamics",
    power: "punchOn",
    knobs: [
      { key: "punch", label: "Amount", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "punchAttack", label: "Attack", min: 0.001, max: 0.08, step: 0.001, format: (v) => `${Math.round(v * 1000)} ms` },
    ],
  },
  {
    id: "gate",
    name: "Gate",
    hint: "Hysteresis",
    tab: "dynamics",
    power: "gateOn",
    knobs: [
      { key: "gateThresh", label: "Thresh", min: -60, max: -12, step: 0.1, ...DB },
      { key: "gateRange", label: "Range", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "gateAttack", label: "Attack", min: 0.001, max: 0.04, step: 0.001, format: (v) => `${Math.round(v * 1000)} ms` },
      { key: "gateRelease", label: "Release", min: 0.02, max: 0.4, step: 0.01, format: (v) => `${Math.round(v * 1000)} ms` },
    ],
  },
  {
    id: "limit",
    name: "Limit",
    hint: "Ceiling",
    tab: "dynamics",
    power: "limitOn",
    knobs: [
      { key: "limitDb", label: "Ceil", min: -6, max: -0.3, step: 0.1, ...DB },
      { key: "limitRelease", label: "Release", min: 0.02, max: 0.3, step: 0.01, format: (v) => `${Math.round(v * 1000)} ms` },
    ],
  },
  {
    id: "sat",
    name: "Sat",
    hint: "4x oversample",
    tab: "color",
    power: "satOn",
    knobs: [
      { key: "satDrive", label: "Drive", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "satTone", label: "Tone", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "satMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "fold",
    name: "Fold",
    hint: "4x wavefold",
    tab: "color",
    power: "foldOn",
    knobs: [{ key: "foldAmt", label: "Amount", min: 0, max: 1, step: 0.01, format: rackPct }],
  },
  {
    id: "crush",
    name: "Crush",
    hint: "Bit depth",
    tab: "color",
    power: "crushOn",
    knobs: [
      { key: "crushBits", label: "Bits", min: 5, max: 14, step: 1, format: (v) => `${Math.round(v)} bit` },
      { key: "crushMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "redux",
    name: "Hold",
    hint: "Sample steps",
    tab: "color",
    power: "reduxOn",
    knobs: [{ key: "reduxHold", label: "Hold", min: 2, max: 24, step: 1, format: (v) => `${Math.round(v)} smp` }],
  },
  {
    id: "exc",
    name: "Exciter",
    hint: "High harmonics",
    tab: "color",
    power: "excOn",
    knobs: [
      { key: "excAmt", label: "Amount", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "excFreq", label: "Band", min: 2000, max: 12000, step: 10, ...HZ },
    ],
  },
  {
    id: "pan",
    name: "Auto Pan",
    hint: "Even level",
    tab: "color",
    power: "panOn",
    knobs: [
      { key: "panRate", label: "Rate", min: 0.05, max: 6, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "panDepth", label: "Depth", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "trem",
    name: "Tremolo",
    hint: "No phase flip",
    tab: "color",
    power: "tremOn",
    knobs: [
      { key: "tremRate", label: "Rate", min: 0.2, max: 12, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "tremDepth", label: "Depth", min: 0, max: 0.9, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "chorus",
    name: "Chorus",
    hint: "Stereo",
    tab: "space",
    power: "chorusOn",
    knobs: [
      { key: "chorusRate", label: "Rate", min: 0.05, max: 3, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "chorusDepth", label: "Depth", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "chorusMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "flange",
    name: "Flanger",
    hint: "Filtered feedback",
    tab: "space",
    power: "flangeOn",
    knobs: [
      { key: "flangeRate", label: "Rate", min: 0.05, max: 3, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "flangeDepth", label: "Depth", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "flangeFb", label: "Feedback", min: 0, max: 0.55, step: 0.01, format: rackPct },
      { key: "flangeMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "phaser",
    name: "Phaser",
    hint: "Four stage",
    tab: "space",
    power: "phaserOn",
    knobs: [
      { key: "phaserRate", label: "Rate", min: 0.05, max: 2, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "phaserDepth", label: "Depth", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "phaserMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "delay",
    name: "Delay",
    hint: "Filtered echo",
    tab: "space",
    power: "delayOn",
    knobs: [
      { key: "delayMs", label: "Time", min: 40, max: 800, step: 1, format: (v) => `${Math.round(v)} ms` },
      { key: "delayFb", label: "Feedback", min: 0, max: 0.7, step: 0.01, format: rackPct },
      { key: "delayTone", label: "Tone", min: 800, max: 14000, step: 10, ...HZ },
      { key: "delayMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "verb",
    name: "Plate",
    hint: "Damped tail",
    tab: "space",
    power: "verbOn",
    knobs: [
      { key: "verbSize", label: "Size", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "verbDamp", label: "Damp", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "verbPre", label: "Pre", min: 0, max: 0.08, step: 0.001, format: (v) => `${Math.round(v * 1000)} ms` },
      { key: "verbMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
  {
    id: "wow",
    name: "Wow",
    hint: "Tape drift",
    tab: "space",
    power: "wowOn",
    knobs: [
      { key: "wowRate", label: "Rate", min: 0.1, max: 2, step: 0.01, format: (v) => `${v.toFixed(2)} Hz` },
      { key: "wowDepth", label: "Depth", min: 0, max: 1, step: 0.01, format: rackPct },
      { key: "wowMix", label: "Mix", min: 0, max: 1, step: 0.01, format: rackPct },
    ],
  },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function RackKnob({
  label,
  value,
  min,
  max,
  step,
  format,
  reset,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  reset: number;
  onChange: (v: number) => void;
}) {
  const t = (clamp(value, min, max) - min) / (max - min || 1);
  const deg = -140 + t * 280;
  const drag = useRef<{ y: number; v: number } | null>(null);

  const set = (next: number) => {
    const snapped = Math.round((next - min) / step) * step + min;
    onChange(clamp(Number(snapped.toFixed(4)), min, max));
  };

  return (
    <button
      type="button"
      className="rack-knob flex min-h-11 min-w-14 flex-col items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      aria-label={label}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(3))}
      aria-valuetext={format(value)}
      onDoubleClick={() => onChange(reset)}
      onKeyDown={(e) => {
        const dir =
          e.key === "ArrowUp" || e.key === "ArrowRight"
            ? 1
            : e.key === "ArrowDown" || e.key === "ArrowLeft"
              ? -1
              : 0;
        if (!dir) return;
        e.preventDefault();
        const span = ((max - min) / 48) * (e.shiftKey ? 0.25 : 1) * dir;
        set(value + span);
      }}
      onPointerDown={(e) => {
        drag.current = { y: e.clientY, v: value };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const start = drag.current;
        if (!start) return;
        const dy = start.y - e.clientY;
        const span = max - min;
        const fine = e.shiftKey ? 0.25 : 1;
        set(start.v + (dy / 140) * span * fine);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <span className="rack-knob-bezel" style={{ ["--knob-turn" as string]: t.toFixed(4) }}>
        <span className="rack-knob-cap relative" style={{ transform: `rotate(${deg}deg)` }}>
          <span className="rack-knob-mark" />
        </span>
      </span>
      <span className="text-xs tabular text-fg">{format(value)}</span>
      <span className="text-xs text-subtle">{label}</span>
    </button>
  );
}

export function RackPlates({
  tab,
  params,
  active,
  onParams,
  onPreset,
}: {
  tab: RackTab;
  params: RackParams;
  active: Record<string, string>;
  onParams: (next: RackParams, touchedMod?: string) => void;
  onPreset: (modId: string, presetId: string) => void;
}) {
  const modules = RACK_MODULES.filter((m) => m.tab === tab);
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {modules.map((mod) => {
        const on = Boolean(params[mod.power]);
        const presets = MODULE_PRESETS[mod.id] ?? [];
        return (
          <section
            key={mod.id}
            className={cn("rack-plate p-3 pt-4", `rack-face-${tab}`, on ? "rack-plate-on" : "rack-plate-off")}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rack-screw" />
              <span className="text-xs uppercase tracking-label text-subtle">{tab}</span>
              <span className="rack-screw" />
            </div>
            <button
              type="button"
              className="mb-3 flex min-h-11 w-full items-center gap-2 text-left"
              onClick={() => onParams({ ...params, [mod.power]: !on }, mod.id)}
              aria-pressed={on}
            >
              <span className={cn("rack-led", on && "rack-led-on")} />
              <span className="text-sm font-medium text-fg">{mod.name}</span>
              <span className="ml-auto text-xs text-subtle">{mod.hint}</span>
            </button>
            <div className="flex flex-wrap justify-start gap-3">
              {mod.knobs.map((knob) => (
                <RackKnob
                  key={knob.key}
                  label={knob.label}
                  value={params[knob.key]}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  format={knob.format}
                  reset={RACK_INIT[knob.key]}
                  onChange={(v) => onParams({ ...params, [knob.key]: v }, mod.id)}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {presets.map((preset) => {
                const lit = active[mod.id] === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn("rack-key", lit && "rack-key-on")}
                    aria-pressed={lit}
                    onClick={() => onPreset(mod.id, preset.id)}
                  >
                    <span className="block text-xs uppercase tracking-label text-subtle">{preset.who}</span>
                    <span className="block text-sm text-fg">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function paintMeter(nodes: HTMLElement[], level: number, readout: HTMLElement | null) {
  const db = level <= 1e-5 ? -60 : 20 * Math.log10(level);
  const norm = clamp((db + 48) / 48, 0, 1);
  const lit = Math.round(norm * nodes.length);
  nodes.forEach((node, i) => {
    const hot = i >= nodes.length - 2;
    const on = i < lit;
    node.className = cn(
      "rack-meter-seg",
      on && !hot && "rack-meter-seg-on",
      on && hot && "rack-meter-seg-hot",
    );
  });
  if (readout) readout.textContent = db <= -59 ? "-60" : db.toFixed(1);
}

export function RackMeters({ rackRef }: { rackRef: RefObject<FxRack | null> }) {
  const inn = useRef<Array<HTMLElement | null>>([]);
  const out = useRef<Array<HTMLElement | null>>([]);
  const inRead = useRef<HTMLElement | null>(null);
  const outRead = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let inHold = 0;
    let outHold = 0;
    const tick = () => {
      const m = rackRef.current?.readMeters() ?? { inn: 0, out: 0 };
      inHold = Math.max(m.inn, inHold * 0.86);
      outHold = Math.max(m.out, outHold * 0.86);
      paintMeter(
        inn.current.filter((n): n is HTMLElement => Boolean(n)),
        inHold,
        inRead.current,
      );
      paintMeter(
        out.current.filter((n): n is HTMLElement => Boolean(n)),
        outHold,
        outRead.current,
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rackRef]);

  const column = (
    label: string,
    bucket: MutableRefObject<Array<HTMLElement | null>>,
    readout: MutableRefObject<HTMLElement | null>,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <div className="rack-meter">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            ref={(el) => {
              bucket.current[i] = el;
            }}
            className="rack-meter-seg"
          />
        ))}
      </div>
      <span
        ref={readout}
        className="text-xs tabular text-fg"
      >
        -60
      </span>
      <span className="text-xs text-subtle">{label}</span>
    </div>
  );

  return (
    <div className="flex items-end gap-3">
      {column("In", inn, inRead)}
      {column("Out", out, outRead)}
    </div>
  );
}

export function RackScope({
  rackRef,
  params,
}: {
  rackRef: RefObject<FxRack | null>;
  params: RackParams;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      const g = canvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue("--color-accent").trim() || "#7ecbff";
      const fg = style.getPropertyValue("--color-fg").trim() || "#eef4ff";
      const grid = style.getPropertyValue("--color-border").trim() || "#1c2736";
      const subtle = style.getPropertyValue("--color-subtle").trim() || "#5c6780";
      const sr = rackRef.current?.sampleRate ?? 48000;
      const minF = 24;
      const maxF = 20000;
      const dbLo = -18;
      const dbHi = 12;
      const yOf = (db: number) => {
        const t = (dbHi - db) / (dbHi - dbLo);
        return 14 + t * (h - 28);
      };
      const xOf = (freq: number) => {
        const t = Math.log(freq / minF) / Math.log(maxF / minF);
        return t * w;
      };

      g.strokeStyle = grid;
      g.lineWidth = 1;
      g.beginPath();
      for (const db of [12, 6, 0, -6, -12]) {
        const y = yOf(db);
        g.moveTo(0, y);
        g.lineTo(w, y);
      }
      for (const freq of [100, 1000, 10000]) {
        const x = xOf(freq);
        g.moveTo(x, 0);
        g.lineTo(x, h);
      }
      g.stroke();

      g.fillStyle = subtle;
      g.font = "10px IBM Plex Mono, ui-monospace, monospace";
      g.fillText("+12", 6, yOf(12) - 2);
      g.fillText("0", 6, yOf(0) - 2);
      g.fillText("100", xOf(100) + 4, h - 6);
      g.fillText("1k", xOf(1000) + 4, h - 6);
      g.fillText("10k", xOf(10000) + 4, h - 6);

      const bins = rackRef.current?.readSpectrum();
      if (bins && bins.length) {
        const nyquist = sr / 2;
        g.beginPath();
        const steps = Math.max(48, Math.floor(w / 3));
        for (let i = 0; i < steps; i++) {
          const freq = minF * Math.pow(maxF / minF, i / (steps - 1));
          const bin = Math.min(bins.length - 1, Math.round((freq / nyquist) * (bins.length - 1)));
          const mag = (bins[bin] ?? 0) / 255;
          const x = (i / (steps - 1)) * w;
          const y = h - mag * (h - 22) - 8;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokeStyle = accent;
        g.lineWidth = 1.25;
        g.stroke();
        g.lineTo(w, h);
        g.lineTo(0, h);
        g.closePath();
        g.fillStyle = accent;
        g.globalAlpha = 0.14;
        g.fill();
        g.globalAlpha = 1;
      }

      const curve = paramsRef.current;
      g.beginPath();
      const steps = Math.max(64, Math.floor(w / 2));
      for (let i = 0; i < steps; i++) {
        const freq = minF * Math.pow(maxF / minF, i / (steps - 1));
        const db = Math.max(dbLo, Math.min(dbHi, rackCurveDb(curve, freq, sr)));
        const x = (i / (steps - 1)) * w;
        const y = yOf(db);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokeStyle = fg;
      g.lineWidth = 1.75;
      g.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rackRef]);

  return (
    <div className="rack-scope relative overflow-hidden">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}

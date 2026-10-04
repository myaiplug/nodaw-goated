import { o as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as peakNormalize, g as toChannelCount, p as resampleClip } from "./dsp-23YL4nsk.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { d as formatHz, h as useLabStore, i as Waveform, l as formatClock, n as ToolHeader, r as TransportBar, s as downloadWav, t as DropZone } from "./tool-header-Ud05aUy4.mjs";
import { t as Choice } from "./choice-tFwZMcKu.mjs";
import { t as Panel } from "./panel-AOhpGiXC.mjs";
import { t as Switch } from "./switch-D9Vn9Op9.mjs";
import { t as useTransport } from "./use-transport-GMPhlbKb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/convert-D8yWKZg4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ConvertPage() {
	const clip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const [sr, setSr] = (0, import_react.useState)("44100");
	const [depth, setDepth] = (0, import_react.useState)("16");
	const [ch, setCh] = (0, import_react.useState)("2");
	const [normalize, setNormalize] = (0, import_react.useState)(true);
	const [dither, setDither] = (0, import_react.useState)(true);
	const [out, setOut] = (0, import_react.useState)(null);
	const t = useTransport();
	const build = () => {
		if (!clip) return null;
		const stereo = toChannelCount(clip, Number(ch));
		let resampled = resampleClip(stereo, Number(sr));
		if (normalize) resampled = peakNormalize(resampled, -.3);
		return {
			...resampled,
			name: `${clip.name}_${Number(sr) / 1e3}k_${depth}bit`
		};
	};
	const run = () => {
		const named = build();
		if (!named) return;
		setOut(named);
		const bits = Number(depth);
		downloadWav(named, named.name, bits, bits < 32 && dither);
		toast.success(bits < 32 && dither ? "WAV ready. TPDF dither applied." : "WAV ready.");
	};
	const toBench = () => {
		const named = build() ?? out;
		if (!named) return;
		t.stop();
		setClip(named);
		toast.success("Converted clip is on the bench.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "convert" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, { label: "Drop a file to convert" }),
			clip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-fg",
					children: clip.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: [
						formatClock(clip.duration),
						" · ",
						formatHz(clip.sampleRate),
						" · ",
						clip.channels.length,
						" ch"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs leading-relaxed text-subtle",
					children: "WAV keeps the source sample rate on decode. Compressed files (MP3, M4A) decode at the device rate, then we resample with cubic interpolation. 16 and 24-bit get TPDF dither. 32-bit float is undithered."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Sample rate"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Sample rate",
						value: sr,
						onChange: setSr,
						options: [
							{
								id: "44100",
								label: "44.1 kHz"
							},
							{
								id: "48000",
								label: "48 kHz"
							},
							{
								id: "88200",
								label: "88.2 kHz"
							},
							{
								id: "96000",
								label: "96 kHz"
							},
							{
								id: "192000",
								label: "192 kHz"
							}
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Bit depth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Bit depth",
						value: depth,
						onChange: (v) => {
							setDepth(v);
							if (v === "32") setDither(false);
						},
						options: [
							{
								id: "16",
								label: "16-bit",
								note: "TPDF"
							},
							{
								id: "24",
								label: "24-bit",
								note: "TPDF"
							},
							{
								id: "32",
								label: "32-bit float"
							}
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 kicker text-muted",
						children: "Channels"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						ariaLabel: "Channels",
						value: ch,
						onChange: setCh,
						options: [{
							id: "1",
							label: "Mono"
						}, {
							id: "2",
							label: "Stereo"
						}]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: "Peak normalize"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Hit -0.3 dBFS before bounce."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: normalize,
						onCheckedChange: setNormalize,
						"aria-label": "Peak normalize"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: "TPDF dither"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Triangular dither on integer depths."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: dither && depth !== "32",
						onCheckedChange: setDither,
						disabled: depth === "32",
						"aria-label": "TPDF dither"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: run,
						children: "Convert and download"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: toBench,
						children: "To bench"
					})]
				})
			] }) : null,
			out ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
				clip: out,
				playhead: t.current,
				onSeek: (v) => t.seek(v)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
				playing: t.playing,
				current: t.current,
				duration: out.duration,
				onPlay: () => void t.play(out),
				onPause: t.pause,
				onStop: t.stop
			})] }) : null
		]
	});
}
//#endregion
export { ConvertPage as component };

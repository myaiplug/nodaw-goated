import { o as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
import { h as sliceClip, l as nearestZeroCrossing, n as applyFades } from "./dsp-23YL4nsk.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { f as formatTime, h as useLabStore, i as Waveform, n as ToolHeader, r as TransportBar, s as downloadWav, t as DropZone } from "./tool-header-Ud05aUy4.mjs";
import { t as Panel } from "./panel-AOhpGiXC.mjs";
import { t as Switch } from "./switch-D9Vn9Op9.mjs";
import { t as useTransport } from "./use-transport-GMPhlbKb.mjs";
import { n as detectActiveRegion } from "./analyze-Djy0ekwm.mjs";
import { t as Slider } from "./slider-8-ZJwEYD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trim-By2v2yHK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium tracking-wide text-muted", className),
		...props
	});
}
function TrimPage() {
	const clip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const [start, setStart] = (0, import_react.useState)(0);
	const [end, setEnd] = (0, import_react.useState)(0);
	const [fadeIn, setFadeIn] = (0, import_react.useState)(0);
	const [fadeOut, setFadeOut] = (0, import_react.useState)(0);
	const [snap, setSnap] = (0, import_react.useState)(true);
	const t = useTransport();
	(0, import_react.useEffect)(() => {
		if (!clip) {
			setStart(0);
			setEnd(0);
			return;
		}
		setStart(0);
		setEnd(clip.duration);
		t.stop();
	}, [clip]);
	const region = (a, b) => {
		setStart(a);
		setEnd(b);
	};
	const build = () => {
		if (!clip) return null;
		let a = start;
		let b = end;
		if (snap) {
			const ch = clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
			const ia = nearestZeroCrossing(ch, Math.floor(a * clip.sampleRate));
			const ib = nearestZeroCrossing(ch, Math.floor(b * clip.sampleRate));
			a = ia / clip.sampleRate;
			b = Math.max(a + .02, ib / clip.sampleRate);
		}
		let out = sliceClip(clip, a, b, `${clip.name}_trim`);
		out = applyFades(out, fadeIn, fadeOut);
		return out;
	};
	const exportClip = () => {
		const out = build();
		if (!out || !clip) return;
		downloadWav(out, `${clip.name}_trim.wav`);
		toast.success("Trim exported.");
	};
	const detect = () => {
		if (!clip) return;
		const r = detectActiveRegion(clip);
		setStart(r.start);
		setEnd(r.end);
		toast.success("Silence stripped from the edges.");
	};
	const toBench = () => {
		const out = build();
		if (!out) return;
		t.stop();
		setClip(out);
		toast.success("Region is on the bench.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "trim" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, { label: "Drop a file to trim" }),
			clip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
					clip,
					playhead: t.current,
					start,
					end,
					onSeek: (v) => t.seek(v),
					onRegion: region,
					className: "relative h-36 w-full overflow-hidden rounded-lg"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
					playing: t.playing,
					current: t.current,
					duration: clip.duration,
					onPlay: () => void t.play(clip, {
						start,
						end
					}),
					onPause: t.pause,
					onStop: t.stop
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: "Snap to zero-crossing"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Avoids clicks at the cut."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: snap,
							onCheckedChange: setSnap,
							"aria-label": "Snap to zero-crossing"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid gap-5 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [
							"Fade in ",
							fadeIn.toFixed(2),
							"s"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							min: 0,
							max: 2,
							step: .01,
							value: [fadeIn],
							onValueChange: ([v]) => setFadeIn(v ?? 0)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [
							"Fade out ",
							fadeOut.toFixed(2),
							"s"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							min: 0,
							max: 2,
							step: .01,
							value: [fadeOut],
							onValueChange: ([v]) => setFadeOut(v ?? 0)
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 font-mono text-sm tabular text-muted",
						children: [
							formatTime(start),
							" to ",
							formatTime(end),
							" · ",
							(end - start).toFixed(2),
							"s"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: exportClip,
								children: "Export region"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: detect,
								children: "Detect silence"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: toBench,
								children: "Region to bench"
							})
						]
					})
				] })
			] }) : null
		]
	});
}
//#endregion
export { TrimPage as component };

import { o as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
import { i as measureLoudness, n as applyGainDb } from "./lufs-9kCREdaj.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { a as clipToAudioBuffer, h as useLabStore, i as Waveform, n as ToolHeader, p as getAudioContext, r as TransportBar, s as downloadWav, t as DropZone, u as formatDb } from "./tool-header-Ud05aUy4.mjs";
import { t as Panel } from "./panel-AOhpGiXC.mjs";
import { t as Switch } from "./switch-D9Vn9Op9.mjs";
import { r as invertSum, t as analyzeMix } from "./analyze-Djy0ekwm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/test-hirkT6bC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AbDeck = class {
	srcA = null;
	srcB = null;
	gA = null;
	gB = null;
	startedAt = 0;
	offset = 0;
	playing = false;
	which = "A";
	clipA = null;
	clipB = null;
	raf = 0;
	listeners = /* @__PURE__ */ new Set();
	get isPlaying() {
		return this.playing;
	}
	get side() {
		return this.which;
	}
	get current() {
		const clip = this.clipA ?? this.clipB;
		if (!this.playing || !clip) return this.offset;
		const ctx = getAudioContext();
		const t = this.offset + (ctx.currentTime - this.startedAt);
		return Math.min(clip.duration, t);
	}
	subscribe(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}
	tick = () => {
		this.listeners.forEach((fn) => fn(this.current));
		if (this.playing) this.raf = requestAnimationFrame(this.tick);
	};
	async play(clipA, clipB, which = this.which) {
		this.stopGraph();
		const ctx = getAudioContext();
		if (ctx.state === "suspended") await ctx.resume();
		this.clipA = clipA;
		this.clipB = clipB;
		this.which = which;
		const master = clipA ?? clipB;
		if (!master) return;
		const start = Math.min(this.offset, master.duration - .01);
		this.offset = Math.max(0, start);
		const gA = ctx.createGain();
		const gB = ctx.createGain();
		gA.gain.value = which === "A" ? 1 : 0;
		gB.gain.value = which === "B" ? 1 : 0;
		gA.connect(ctx.destination);
		gB.connect(ctx.destination);
		if (clipA) {
			const src = ctx.createBufferSource();
			src.buffer = clipToAudioBuffer(clipA);
			src.connect(gA);
			src.start(0, this.offset);
			src.onended = () => {
				if (this.srcA === src) this.ended();
			};
			this.srcA = src;
		}
		if (clipB) {
			const src = ctx.createBufferSource();
			src.buffer = clipToAudioBuffer(clipB);
			src.connect(gB);
			const bOff = Math.min(this.offset, clipB.duration);
			if (this.offset < clipB.duration) src.start(0, bOff);
			this.srcB = src;
		}
		this.gA = gA;
		this.gB = gB;
		this.startedAt = ctx.currentTime;
		this.playing = true;
		cancelAnimationFrame(this.raf);
		this.raf = requestAnimationFrame(this.tick);
	}
	flip(next) {
		this.which = next;
		const t = getAudioContext().currentTime;
		if (this.gA && this.gB) {
			this.gA.gain.cancelScheduledValues(t);
			this.gB.gain.cancelScheduledValues(t);
			this.gA.gain.setValueAtTime(this.gA.gain.value, t);
			this.gB.gain.setValueAtTime(this.gB.gain.value, t);
			this.gA.gain.linearRampToValueAtTime(next === "A" ? 1 : 0, t + .012);
			this.gB.gain.linearRampToValueAtTime(next === "B" ? 1 : 0, t + .012);
		}
	}
	pause() {
		if (!this.playing) return;
		this.offset = this.current;
		this.stopGraph();
		this.playing = false;
		this.listeners.forEach((fn) => fn(this.current));
	}
	stop() {
		this.stopGraph();
		this.offset = 0;
		this.playing = false;
		this.listeners.forEach((fn) => fn(0));
	}
	seek(t) {
		const master = this.clipA ?? this.clipB;
		this.offset = Math.max(0, Math.min(master?.duration ?? t, t));
		if (this.playing) this.play(this.clipA, this.clipB, this.which);
		else this.listeners.forEach((fn) => fn(this.offset));
	}
	ended() {
		this.playing = false;
		this.offset = (this.clipA ?? this.clipB)?.duration ?? 0;
		this.stopGraph();
		this.listeners.forEach((fn) => fn(this.current));
	}
	stopGraph() {
		cancelAnimationFrame(this.raf);
		for (const s of [this.srcA, this.srcB]) {
			try {
				s?.stop();
			} catch {}
			s?.disconnect();
		}
		this.gA?.disconnect();
		this.gB?.disconnect();
		this.srcA = null;
		this.srcB = null;
		this.gA = null;
		this.gB = null;
	}
	dispose() {
		this.stopGraph();
		this.listeners.clear();
		this.playing = false;
	}
};
function TestPage() {
	const clipA = useLabStore((s) => s.clip);
	const clipB = useLabStore((s) => s.clipB);
	const setClip = useLabStore((s) => s.setClip);
	const setClipB = useLabStore((s) => s.setClipB);
	const [side, setSide] = (0, import_react.useState)("A");
	const [match, setMatch] = (0, import_react.useState)(true);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [current, setCurrent] = (0, import_react.useState)(0);
	const [lufsA, setLufsA] = (0, import_react.useState)(null);
	const [lufsB, setLufsB] = (0, import_react.useState)(null);
	const [mixA, setMixA] = (0, import_react.useState)(null);
	const [mixB, setMixB] = (0, import_react.useState)(null);
	const [nullClip, setNullClip] = (0, import_react.useState)(null);
	const deck = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const d = new AbDeck();
		deck.current = d;
		const unsub = d.subscribe((v) => {
			setCurrent(v);
			setPlaying(d.isPlaying);
		});
		return () => {
			unsub();
			d.dispose();
			deck.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!clipA) {
			setLufsA(null);
			setMixA(null);
			return;
		}
		const id = window.setTimeout(() => {
			setLufsA(measureLoudness(clipA));
			setMixA(analyzeMix(clipA));
		}, 20);
		return () => window.clearTimeout(id);
	}, [clipA]);
	(0, import_react.useEffect)(() => {
		if (!clipB) {
			setLufsB(null);
			setMixB(null);
			return;
		}
		const id = window.setTimeout(() => {
			setLufsB(measureLoudness(clipB));
			setMixB(analyzeMix(clipB));
		}, 20);
		return () => window.clearTimeout(id);
	}, [clipB]);
	(0, import_react.useEffect)(() => {
		if (!clipA || !clipB) {
			setNullClip(null);
			return;
		}
		const id = window.setTimeout(() => setNullClip(invertSum(clipA, clipB)), 20);
		return () => window.clearTimeout(id);
	}, [clipA, clipB]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.key === "a" || e.key === "A") flip("A");
			if (e.key === "b" || e.key === "B") flip("B");
			if (e.key === "n" || e.key === "N") setSide("N");
			if (e.key === " ") {
				e.preventDefault();
				if (playing) deck.current?.pause();
				else play();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		playing,
		clipA,
		clipB,
		match,
		side
	]);
	const prepared = () => {
		if (!clipA || !clipB || !match) return [clipA, clipB];
		const a = measureLoudness(clipA);
		const b = measureLoudness(clipB);
		const matchedB = applyGainDb(clipB, a.lufs - b.lufs, clipB.name);
		return [clipA, matchedB];
	};
	const play = async () => {
		if (side === "N") {
			if (!nullClip) return;
			await deck.current?.play(nullClip, null, "A");
			return;
		}
		const [a, b] = prepared();
		await deck.current?.play(a, b, side);
	};
	const flip = (next) => {
		setSide(next);
		deck.current?.flip(next);
	};
	const active = side === "A" ? clipA : side === "B" ? clipB : nullClip;
	const nullRms = (0, import_react.useMemo)(() => {
		if (!nullClip) return null;
		return analyzeMix(nullClip).rmsDb;
	}, [nullClip]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "test" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
					label: "File A",
					clip: clipA,
					onClip: setClip,
					compact: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {
					label: "File B",
					clip: clipB,
					onClip: setClipB,
					compact: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: "Loudness match"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Gain-match B to A so level does not pick the winner."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: match,
						onCheckedChange: setMatch,
						"aria-label": "Loudness match"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => flip("A"),
						className: cn("min-h-24 rounded-lg border px-4 py-5 text-left transition-colors duration-150", side === "A" ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl font-semibold",
							children: "A"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-1 text-xs", side === "A" ? "text-accent-fg/70" : "text-muted"),
							children: clipA ? lufsA ? `${formatDb(lufsA.lufs)} LUFS` : clipA.name : "Empty"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => flip("B"),
						className: cn("min-h-24 rounded-lg border px-4 py-5 text-left transition-colors duration-150", side === "B" ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl font-semibold",
							children: "B"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-1 text-xs", side === "B" ? "text-accent-fg/70" : "text-muted"),
							children: clipB ? lufsB ? `${formatDb(lufsB.lufs)} LUFS` : clipB.name : "Empty"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-subtle",
					children: "Tap A / B, or use the A and B keys. N plays the null. Space plays."
				})
			] }),
			clipA && clipB && lufsA && lufsB && mixA && mixB ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "kicker text-muted",
					children: "Compare"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-72 text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-xs text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Metric"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "A"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "B"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "font-mono tabular text-fg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "LUFS",
									a: lufsA.lufs.toFixed(1),
									b: lufsB.lufs.toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "True peak",
									a: `${lufsA.truePeakDb.toFixed(1)}`,
									b: `${lufsB.truePeakDb.toFixed(1)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "LRA",
									a: lufsA.lra.toFixed(1),
									b: lufsB.lra.toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Crest dB",
									a: mixA.crestDb.toFixed(1),
									b: mixB.crestDb.toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Width",
									a: mixA.width.toFixed(2),
									b: mixB.width.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Stereo r",
									a: mixA.stereoCorr.toFixed(2),
									b: mixB.stereoCorr.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Clips",
									a: String(mixA.clipCount),
									b: String(mixB.clipCount)
								})
							]
						})]
					})
				}),
				nullClip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: side === "N" ? "default" : "secondary",
							onClick: () => {
								setSide("N");
								deck.current?.stop();
							},
							children: "Null test"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => {
								downloadWav(nullClip, `${clipA.name}_null.wav`);
								toast.success("Null WAV.");
							},
							children: "Download null"
						}),
						nullRms !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"Difference RMS ",
								nullRms.toFixed(1),
								" dB"
							]
						}) : null
					]
				}) : null
			] }) : null,
			active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
				clip: active,
				playhead: current,
				onSeek: (v) => deck.current?.seek(v)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
				playing,
				current,
				duration: active.duration,
				disabled: !clipA && !clipB,
				onPlay: () => void play(),
				onPause: () => deck.current?.pause(),
				onStop: () => deck.current?.stop()
			})] }) : null
		]
	});
}
function Row({ label, a, b }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "border-t border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-2 text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-2",
				children: a
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-2",
				children: b
			})
		]
	});
}
//#endregion
export { TestPage as component };

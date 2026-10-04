import { o as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { c as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
import { a as repairToTarget, i as measureLoudness, r as describeLoudness, t as LUFS_TARGETS } from "./lufs-9kCREdaj.mjs";
import { t as authMiddleware } from "./middleware-BenXLqm-.mjs";
import { n as useLabPrefs, t as createSsrRpc } from "./use-lab-prefs-Bb60At--.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
import { h as useLabStore, i as Waveform, n as ToolHeader, r as TransportBar, s as downloadWav, t as DropZone, u as formatDb } from "./tool-header-Ud05aUy4.mjs";
import { t as Choice } from "./choice-tFwZMcKu.mjs";
import { t as Panel } from "./panel-AOhpGiXC.mjs";
import { t as useTransport } from "./use-transport-GMPhlbKb.mjs";
import { t as analyzeMix } from "./analyze-Djy0ekwm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coproducer-Bt6r_chj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function pct(v, lo, hi) {
	return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
}
function LufsMeter({ report, target }) {
	const lufsPct = pct(report.lufs, -30, 0);
	const targetPct = pct(target, -30, 0);
	const peakPct = pct(report.truePeakDb, -30, 0);
	const over = report.lufs > target + .5;
	const under = report.lufs < target - .5;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "kicker text-muted",
					children: "Integrated"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-display text-4xl font-semibold tabular tracking-tight text-fg",
					children: [formatDb(report.lufs), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-lg font-medium text-muted",
						children: "LUFS"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: over ? `${(report.lufs - target).toFixed(1)} LU over ${target}` : under ? `${(target - report.lufs).toFixed(1)} LU under ${target}` : `On target (${target} LUFS)`
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-3 rounded-full bg-elevated",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("absolute inset-y-0 left-0 rounded-full", over ? "bg-warn" : under ? "bg-muted" : "bg-ok"),
					style: { width: `${lufsPct}%` }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-0 h-3 w-0.5 bg-fg",
					style: { left: `${targetPct}%` },
					title: `Target ${target}`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "True peak",
						value: `${formatDb(report.truePeakDb)} dBTP`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Sample peak",
						value: `${formatDb(report.samplePeakDb)} dBFS`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "LRA",
						value: `${report.lra.toFixed(1)} LU`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-1 text-xs text-muted",
				children: "True peak"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative h-1.5 rounded-full bg-elevated",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("absolute inset-y-0 left-0 rounded-full", report.truePeakDb > -1 ? "bg-danger" : "bg-accent"),
					style: { width: `${peakPct}%` }
				})
			})] })
		]
	});
}
function Stat$1({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-0.5 font-mono text-sm tabular text-fg",
		children: value
	})] });
}
var askCoproducer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("54d7f82873ed011262296da36b921c0650e74d8cf8cc6c0ceeb9dc9f47eb05d6"));
function CoproducerPage() {
	const clip = useLabStore((s) => s.clip);
	const setClip = useLabStore((s) => s.setClip);
	const [targetId, setTargetId] = (0, import_react.useState)("spotify");
	const [report, setReport] = (0, import_react.useState)(null);
	const [mix, setMix] = (0, import_react.useState)(null);
	const [reading, setReading] = (0, import_react.useState)(false);
	const [repaired, setRepaired] = (0, import_react.useState)(null);
	const [after, setAfter] = (0, import_react.useState)(null);
	const [ai, setAi] = (0, import_react.useState)(null);
	const [aiBusy, setAiBusy] = (0, import_react.useState)(false);
	const t = useTransport();
	const bench = useLabPrefs();
	const appliedPrefs = (0, import_react.useRef)(false);
	const target = LUFS_TARGETS.find((x) => x.id === targetId) ?? LUFS_TARGETS[0];
	(0, import_react.useEffect)(() => {
		if (!bench.ready || !bench.prefs || appliedPrefs.current) return;
		appliedPrefs.current = true;
		const known = LUFS_TARGETS.find((x) => x.id === bench.prefs?.targetId);
		if (known) setTargetId(known.id);
	}, [bench.ready, bench.prefs]);
	(0, import_react.useEffect)(() => {
		setRepaired(null);
		setAfter(null);
		setAi(null);
		if (!clip) {
			setReport(null);
			setMix(null);
			return;
		}
		setReading(true);
		const id = window.setTimeout(() => {
			setReport(measureLoudness(clip));
			setMix(analyzeMix(clip));
			setReading(false);
		}, 20);
		return () => window.clearTimeout(id);
	}, [clip]);
	const repair = () => {
		if (!clip || !target) return;
		setReading(true);
		window.setTimeout(() => {
			const named = {
				...repairToTarget(clip, target.lufs, target.tp),
				name: `${clip.name}_${target.id}`
			};
			setRepaired(named);
			setAfter(measureLoudness(named));
			setReading(false);
			toast.success(`Repaired to ${target.lufs} LUFS / ${target.tp} dBTP.`);
		}, 20);
	};
	const ask = async () => {
		if (!report || !clip || !target) return;
		if (!bench.signedIn) {
			toast.error("Sign in to ask CoProducer.");
			return;
		}
		setAiBusy(true);
		setAi(null);
		try {
			const res = await askCoproducer({ data: {
				report,
				target: target.lufs,
				name: clip.name,
				mix: mix ?? void 0
			} });
			if (res.ok) setAi(res.text);
			else toast.error(res.error);
		} catch (err) {
			const message = err instanceof Error ? err.message : "";
			toast.error(message === "Unauthorized" ? "Sign in to ask CoProducer." : "CoProducer AI did not respond.");
		} finally {
			setAiBusy(false);
		}
	};
	const saveTarget = () => {
		bench.save({
			targetId,
			stemModel: bench.prefs?.stemModel ?? "htdemucs_6s",
			quality: bench.prefs?.quality ?? "hq",
			stemMode: bench.prefs?.stemMode ?? 6
		}).then(() => toast.success("Target saved to this account.")).catch(() => toast.error("Sign in to save the target."));
	};
	const audible = repaired ?? clip;
	const notes = report && target ? describeLoudness(report, target.lufs, target.tp) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolHeader, { id: "coproducer" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, { label: "Drop a mix to check" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 kicker text-muted",
				children: "Target"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				ariaLabel: "Loudness target",
				value: targetId,
				onChange: setTargetId,
				options: LUFS_TARGETS.map((x) => ({
					id: x.id,
					label: x.label,
					note: `${x.lufs} LUFS / ${x.tp} dBTP`
				}))
			})] }),
			reading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Reading loudness"]
			}) }) : null,
			report && !reading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LufsMeter, {
					report: after ?? report,
					target: target.lufs
				}),
				after ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm text-muted",
					children: [
						"Before ",
						report.lufs.toFixed(1),
						" LUFS / ",
						report.truePeakDb.toFixed(1),
						" dBTP. After",
						" ",
						after.lufs.toFixed(1),
						" LUFS / ",
						after.truePeakDb.toFixed(1),
						" dBTP."
					]
				}) : null,
				mix ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Crest",
							value: `${mix.crestDb.toFixed(1)} dB`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Width",
							value: mix.width.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Stereo r",
							value: mix.stereoCorr.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "RMS",
							value: `${mix.rmsDb.toFixed(1)} dB`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Clips",
							value: String(mix.clipCount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "DC",
							value: mix.dcOffset.toExponential(1)
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-2 text-sm leading-relaxed text-muted",
					children: notes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: n }, n))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: repair,
							disabled: !clip,
							children: ["Repair to ", target.label]
						}),
						repaired ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => {
								downloadWav(repaired, `${repaired.name}.wav`);
								toast.success("Repaired WAV.");
							},
							children: "Download repair"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => {
								t.stop();
								setClip(repaired);
								toast.success("Repair is on the bench.");
							},
							children: "Repair to bench"
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => void ask(),
							disabled: aiBusy || !report,
							children: aiBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), "Asking"] }) : "Ask CoProducer"
						}),
						bench.signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: saveTarget,
							children: "Save target"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								children: "Sign in for CoProducer"
							})
						})
					]
				}),
				ai ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 whitespace-pre-wrap rounded-md border border-border bg-elevated p-4 text-sm leading-relaxed text-fg",
					children: ai
				}) : null
			] }) : null,
			audible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
				clip: audible,
				playhead: t.current,
				onSeek: (v) => t.seek(v)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransportBar, {
				playing: t.playing,
				current: t.current,
				duration: audible.duration,
				onPlay: () => void t.play(audible),
				onPause: t.pause,
				onStop: t.stop
			})] }) : null
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-mono tabular text-fg",
		children: value
	})] });
}
//#endregion
export { CoproducerPage as component };

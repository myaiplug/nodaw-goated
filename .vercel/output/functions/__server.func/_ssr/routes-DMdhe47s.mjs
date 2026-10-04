import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as ArrowRight } from "../_libs/lucide-react.mjs";
import { c as GravitySpine, l as cn, n as BRAND_LABEL, r as TOOLS, s as DiamondMark } from "./router-4C49-Z9Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DMdhe47s.js
var import_jsx_runtime = require_jsx_runtime();
var TRINITY = [
	{
		step: "01",
		name: "Split",
		href: "/split",
		line: "Finished mix in. 6-stem, 4-stem, or vocals."
	},
	{
		step: "02",
		name: "Shape",
		href: "/trim",
		line: "Trim, convert, print FX. No plugin host."
	},
	{
		step: "03",
		name: "Repair",
		href: "/coproducer",
		line: "A/B check. LUFS bounce to the platform."
	}
];
function Home() {
	const featured = TOOLS[0];
	const rest = TOOLS.slice(1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "enter-stagger flex flex-col gap-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative pt-4 md:min-h-96 md:pt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GravitySpine, {
						word: "GRAVITY",
						className: "absolute top-8 right-0 hidden lg:flex"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "kicker kicker-wide",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: "Chromatic Nihilism"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: " // "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-nag",
								children: "Newton AntiGravity"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-5 font-display text-5xl font-semibold uppercase leading-display tracking-tight text-fg md:text-7xl",
						children: ["NoDAW", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-accent",
							children: "Labs"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 font-mono text-xs uppercase tracking-label text-muted",
						children: "Hardware_Only // v.1.0 // DAWless"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-md text-base leading-relaxed text-muted",
						children: "Take a finished bounce. Walk out with six HTDemucs stems, a check, and a repaired WAV. Audio stays on this device. Sign in to keep the bench."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "kicker mb-4 text-subtle",
				children: "Trinity // Integration"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-3",
				children: TRINITY.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.href,
					className: cn("flex flex-col gap-3 bg-surface/40 p-5 no-underline transition-colors duration-150 hover:bg-elevated", i > 0 && "border-t border-border md:border-t-0 md:border-l"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-accent",
							children: item.step
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-semibold uppercase tracking-tight text-fg",
							children: item.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed text-muted",
							children: item.line
						})
					]
				}, item.step))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "kicker mb-3 text-subtle",
				children: "The job"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: TOOLS.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: tool.href,
						className: "flex min-h-11 items-center gap-2 rounded-sm border border-border bg-surface/80 px-3 no-underline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-accent",
							children: tool.step
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-fg",
							children: tool.short
						})]
					})
				}, tool.id))
			})] }),
			featured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: featured.href,
				className: "chromatic-edge group relative block overflow-hidden rounded-2xl glass no-underline",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "void-grid pointer-events-none absolute inset-0 opacity-50" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ripple-well pointer-events-none absolute inset-x-0 bottom-0 h-1/2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex items-start justify-between gap-4 p-5 md:p-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "kicker kicker-tight text-accent",
								children: [
									BRAND_LABEL[featured.system],
									" · ",
									featured.product
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-3 font-display text-3xl font-semibold uppercase leading-none tracking-tight text-fg md:text-5xl",
								children: featured.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-md text-sm leading-relaxed text-muted",
								children: featured.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-7 inline-flex items-center gap-2 text-sm text-fg",
								children: ["Start the job", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 transition-transform duration-200 group-hover:translate-x-0.5" })]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiamondMark, { className: "size-6 shrink-0 text-accent" })]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "kicker mb-4 text-subtle",
				children: "Kinetic bench"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
				children: rest.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: tool.href,
					className: "rounded-xl glass p-4 pl-5 no-underline transition-colors duration-150 hover:bg-elevated",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-xs text-accent",
								children: tool.step
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(tool.icon, { className: "size-4 text-muted" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-3 font-display text-xl font-semibold uppercase tracking-tight text-fg",
							children: tool.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("kicker kicker-tight mt-1", tool.system === "cn" ? "text-accent" : "text-nag"),
							children: BRAND_LABEL[tool.system]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: tool.blurb
						})
					]
				}, tool.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "border-t border-border pt-6 text-xs text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Built in Louisville, KY. bZ · Beat Mob Collective." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1",
					children: "NoDAW Labs · Chromatic Nihilism · Newton AntiGravity."
				})]
			})
		]
	});
}
//#endregion
export { Home as component };

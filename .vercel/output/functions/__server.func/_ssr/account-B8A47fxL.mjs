import { n as STEM_MODELS } from "./types-DyJMjOBu.mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as RedirectToSignIn, o as UserButton, u as useCurrentUserState } from "./router-4C49-Z9Y.mjs";
import { t as LUFS_TARGETS } from "./lufs-9kCREdaj.mjs";
import { n as useLabPrefs } from "./use-lab-prefs-Bb60At--.mjs";
import { t as Button } from "./button-CR5bjwvY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-B8A47fxL.js
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	const { user, isPending } = useCurrentUserState();
	const bench = useLabPrefs();
	if (isPending || !bench.ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-lg bg-elevated" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const model = STEM_MODELS.find((m) => m.id === bench.prefs?.stemModel);
	const target = LUFS_TARGETS.find((t) => t.id === bench.prefs?.targetId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-lg flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "kicker text-accent",
					children: "Account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold uppercase tracking-tight text-fg",
					children: user.displayName ?? "Bench"
				}),
				user.primaryEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: user.primaryEmail
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-elevated p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "kicker text-muted",
						children: "Saved setup"
					}),
					bench.prefs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2 text-sm text-fg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Split: ", model?.name ?? bench.prefs.stemModel] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Quality: ",
								bench.prefs.quality,
								" · ",
								bench.prefs.stemMode,
								" stems"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Loudness: ", target?.label ?? bench.prefs.targetId] })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Nothing saved yet. Split and CoProducer can store the setup on this account."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs leading-relaxed text-subtle",
						children: "Files stay on this device. The account does not store audio."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/split",
								children: "Split"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/coproducer",
								children: "CoProducer"
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
		]
	});
}
//#endregion
export { AccountPage as component };

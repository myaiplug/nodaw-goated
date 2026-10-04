import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as cn } from "./router-4C49-Z9Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/choice-tFwZMcKu.js
var import_jsx_runtime = require_jsx_runtime();
function Choice({ options, value, onChange, ariaLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		role: "radiogroup",
		"aria-label": ariaLabel,
		children: options.map((opt) => {
			const on = opt.id === value;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": on,
				onClick: () => onChange(opt.id),
				className: cn("min-h-11 rounded-sm border px-3 py-2 text-left text-sm transition-colors duration-150", on ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg hover:bg-surface"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-medium",
					children: opt.label
				}), opt.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("mt-0.5 block text-xs", on ? "text-accent-fg/70" : "text-muted"),
					children: opt.note
				}) : null]
			}, opt.id);
		})
	});
}
//#endregion
export { Choice as t };

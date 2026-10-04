import { o as __toESM } from "../_runtime.mjs";
import { a as normalizeStemModel } from "./types-DyJMjOBu.mjs";
import { s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { u as useCurrentUserState } from "./router-4C49-Z9Y.mjs";
import { t as authMiddleware } from "./middleware-BenXLqm-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-lab-prefs-Bb60At--.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var TARGETS = /* @__PURE__ */ new Set([
	"spotify",
	"apple",
	"youtube",
	"tiktok",
	"club",
	"ebu",
	"podcast"
]);
var MODELS = /* @__PURE__ */ new Set([
	"htdemucs_6s",
	"htdemucs",
	"htdemucs_ft",
	"mdx23c",
	"bs_roformer",
	"mel_roformer"
]);
var QUALITIES = /* @__PURE__ */ new Set([
	"preview",
	"studio",
	"hq"
]);
function cleanPrefs(input) {
	return {
		targetId: TARGETS.has(input.targetId) ? input.targetId : "spotify",
		stemModel: normalizeStemModel(MODELS.has(input.stemModel) ? input.stemModel : "htdemucs_6s"),
		quality: QUALITIES.has(input.quality) ? input.quality : "hq",
		stemMode: input.stemMode === 2 || input.stemMode === 4 || input.stemMode === 6 ? input.stemMode : 6
	};
}
var getLabPrefs = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6c6ce629e3dabe77ac54b48b0c22ffcd9ea11dbdf0362414e6fdfa25da159226"));
var saveLabPrefs = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanPrefs(input)).handler(createSsrRpc("367125e6e8aef6032ae469b72fc2d7e7afaaa42c04dbfd14d0a26cf222b76351"));
function useLabPrefs() {
	const { user, isPending } = useCurrentUserState();
	const [prefs, setPrefs] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setPrefs(null);
			setReady(true);
			return;
		}
		let cancel = false;
		setReady(false);
		getLabPrefs().then((next) => {
			if (!cancel) setPrefs(next);
		}).catch(() => {
			if (!cancel) setPrefs(null);
		}).finally(() => {
			if (!cancel) setReady(true);
		});
		return () => {
			cancel = true;
		};
	}, [user?.id, isPending]);
	return {
		user,
		isPending,
		prefs,
		ready,
		save: (0, import_react.useCallback)(async (next) => {
			const saved = await saveLabPrefs({ data: next });
			if (saved.ok) setPrefs(next);
			return saved;
		}, []),
		signedIn: Boolean(user)
	};
}
//#endregion
export { useLabPrefs as n, createSsrRpc as t };

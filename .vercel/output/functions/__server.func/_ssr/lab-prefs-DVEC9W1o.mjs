import { a as normalizeStemModel } from "./types-DyJMjOBu.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-D9jz3aJl.mjs";
import { t as authMiddleware } from "./middleware-BenXLqm-.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lab-prefs-DVEC9W1o.js
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
var getLabPrefs_createServerFn_handler = createServerRpc({
	id: "6c6ce629e3dabe77ac54b48b0c22ffcd9ea11dbdf0362414e6fdfa25da159226",
	name: "getLabPrefs",
	filename: "src/lib/lab-prefs.ts"
}, (opts) => getLabPrefs.__executeServer(opts));
var getLabPrefs = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLabPrefs_createServerFn_handler, async ({ context }) => {
	const row = (await (await getSql())`select target_id, stem_model, quality, stem_mode from lab_prefs where user_id = ${context.userId}`)[0];
	if (!row) return null;
	return cleanPrefs({
		targetId: row.target_id,
		stemModel: row.stem_model,
		quality: row.quality,
		stemMode: Number(row.stem_mode)
	});
});
var saveLabPrefs_createServerFn_handler = createServerRpc({
	id: "367125e6e8aef6032ae469b72fc2d7e7afaaa42c04dbfd14d0a26cf222b76351",
	name: "saveLabPrefs",
	filename: "src/lib/lab-prefs.ts"
}, (opts) => saveLabPrefs.__executeServer(opts));
var saveLabPrefs = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanPrefs(input)).handler(saveLabPrefs_createServerFn_handler, async ({ data, context }) => {
	await (await getSql())`
      insert into lab_prefs (user_id, target_id, stem_model, quality, stem_mode, updated_at)
      values (${context.userId}, ${data.targetId}, ${data.stemModel}, ${data.quality}, ${data.stemMode}, now())
      on conflict (user_id) do update set
        target_id = excluded.target_id,
        stem_model = excluded.stem_model,
        quality = excluded.quality,
        stem_mode = excluded.stem_mode,
        updated_at = now()
    `;
	return { ok: true };
});
//#endregion
export { getLabPrefs_createServerFn_handler, saveLabPrefs_createServerFn_handler };

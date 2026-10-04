import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { normalizeStemModel } from "@/lib/audio/types";

export type LabPrefs = {
  targetId: string;
  stemModel: string;
  quality: string;
  stemMode: number;
};

const TARGETS = new Set(["spotify", "apple", "youtube", "tiktok", "club", "ebu", "podcast"]);
const MODELS = new Set(["htdemucs_6s", "htdemucs", "htdemucs_ft", "mdx23c", "bs_roformer", "mel_roformer"]);
const QUALITIES = new Set(["preview", "studio", "hq"]);

function cleanPrefs(input: LabPrefs): LabPrefs {
  return {
    targetId: TARGETS.has(input.targetId) ? input.targetId : "spotify",
    stemModel: normalizeStemModel(MODELS.has(input.stemModel) ? input.stemModel : "htdemucs_6s"),
    quality: QUALITIES.has(input.quality) ? input.quality : "hq",
    stemMode: input.stemMode === 2 || input.stemMode === 4 || input.stemMode === 6 ? input.stemMode : 6,
  };
}

export const getLabPrefs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LabPrefs | null> => {
    const sql = await getSql();
    const rows = await sql<{
      target_id: string;
      stem_model: string;
      quality: string;
      stem_mode: number;
    }>`select target_id, stem_model, quality, stem_mode from lab_prefs where user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) return null;
    return cleanPrefs({
      targetId: row.target_id,
      stemModel: row.stem_model,
      quality: row.quality,
      stemMode: Number(row.stem_mode),
    });
  });

export const saveLabPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: LabPrefs) => cleanPrefs(input))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into lab_prefs (user_id, target_id, stem_model, quality, stem_mode, updated_at)
      values (${context.userId}, ${data.targetId}, ${data.stemModel}, ${data.quality}, ${data.stemMode}, now())
      on conflict (user_id) do update set
        target_id = excluded.target_id,
        stem_model = excluded.stem_model,
        quality = excluded.quality,
        stem_mode = excluded.stem_mode,
        updated_at = now()
    `;
    return { ok: true as const };
  });

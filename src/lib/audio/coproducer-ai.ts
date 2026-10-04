import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { MixReport } from "./analyze";
import type { LoudnessReport } from "./lufs";

export const askCoproducer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { report: LoudnessReport; target: number; name: string; mix?: MixReport }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "CoProducer AI is not available right now." };

    const mix = data.mix;
    const mixLine = mix
      ? `Crest: ${mix.crestDb.toFixed(1)} dB
Stereo correlation: ${mix.stereoCorr.toFixed(2)}
Width: ${mix.width.toFixed(2)}
DC offset: ${mix.dcOffset.toFixed(5)}
Clipped samples: ${mix.clipCount}
RMS: ${mix.rmsDb.toFixed(1)} dBFS`
      : "No extra mix metrics.";

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You are CoProducer, a concise mix engineer for hip-hop and trap. Give 5 short numbered notes. No filler. No markdown headings. Speak like a studio tech. Mention crest, stereo image, and clip risk when the numbers support it.",
          },
          {
            role: "user",
            content: `Track: ${data.name}
Integrated LUFS: ${data.report.lufs.toFixed(1)}
True peak: ${data.report.truePeakDb.toFixed(1)} dBTP
Sample peak: ${data.report.samplePeakDb.toFixed(1)} dBFS
Loudness range: ${data.report.lra.toFixed(1)} LU
Duration: ${data.report.duration.toFixed(1)}s
Target: ${data.target} LUFS
${mixLine}
Advise whether to repair, and what the numbers imply about punch, width, clip risk, and platform playback.`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true as const, text: body.choices?.[0]?.message?.content ?? "" };
  });

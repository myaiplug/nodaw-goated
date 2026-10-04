import { formatDb } from "@/lib/audio/format";
import type { LoudnessReport } from "@/lib/audio/lufs";
import { cn } from "@/lib/utils";

function pct(v: number, lo: number, hi: number) {
  return Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
}

export function LufsMeter({
  report,
  target,
}: {
  report: LoudnessReport;
  target: number;
}) {
  const lufsPct = pct(report.lufs, -30, 0);
  const targetPct = pct(target, -30, 0);
  const peakPct = pct(report.truePeakDb, -30, 0);
  const over = report.lufs > target + 0.5;
  const under = report.lufs < target - 0.5;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="kicker text-muted">
          Integrated
        </p>
        <p className="mt-1 font-display text-4xl font-semibold tabular tracking-tight text-fg">
          {formatDb(report.lufs)}
          <span className="ml-2 text-lg font-medium text-muted">LUFS</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {over
            ? `${(report.lufs - target).toFixed(1)} LU over ${target}`
            : under
              ? `${(target - report.lufs).toFixed(1)} LU under ${target}`
              : `On target (${target} LUFS)`}
        </p>
      </div>
      <div className="relative h-3 rounded-full bg-elevated">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            over ? "bg-warn" : under ? "bg-muted" : "bg-ok",
          )}
          style={{ width: `${lufsPct}%` }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-fg"
          style={{ left: `${targetPct}%` }}
          title={`Target ${target}`}
        />
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="True peak" value={`${formatDb(report.truePeakDb)} dBTP`} />
        <Stat label="Sample peak" value={`${formatDb(report.samplePeakDb)} dBFS`} />
        <Stat label="LRA" value={`${report.lra.toFixed(1)} LU`} />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted">True peak</p>
        <div className="relative h-1.5 rounded-full bg-elevated">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              report.truePeakDb > -1 ? "bg-danger" : "bg-accent",
            )}
            style={{ width: `${peakPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular text-fg">{value}</p>
    </div>
  );
}

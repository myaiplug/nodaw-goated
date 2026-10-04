import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DiamondMark, GravitySpine } from "@/components/brand/marks";
import { BRAND_LABEL, TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TRINITY = [
  {
    step: "01",
    name: "Split",
    href: "/split" as const,
    line: "Finished mix in. 6-stem, 4-stem, or vocals.",
  },
  {
    step: "02",
    name: "Shape",
    href: "/trim" as const,
    line: "Trim, convert, print FX. No plugin host.",
  },
  {
    step: "03",
    name: "Repair",
    href: "/coproducer" as const,
    line: "A/B check. LUFS bounce to the platform.",
  },
];

function Home() {
  const featured = TOOLS[0];
  const rest = TOOLS.slice(1);

  return (
    <div className="enter-stagger flex flex-col gap-12">
      <section className="relative pt-4 md:min-h-96 md:pt-10">
        <GravitySpine
          word="GRAVITY"
          className="absolute top-8 right-0 hidden lg:flex"
        />
        <p className="kicker kicker-wide">
          <span className="text-accent">Chromatic Nihilism</span>
          <span className="text-subtle"> // </span>
          <span className="text-nag">Newton AntiGravity</span>
        </p>
        <h1 className="mt-5 font-display text-5xl font-semibold uppercase leading-display tracking-tight text-fg md:text-7xl">
          NoDAW
          <span className="mt-1 block text-accent">Labs</span>
        </h1>
        <p className="mt-5 font-mono text-xs uppercase tracking-label text-muted">
          Hardware_Only // v.1.0 // DAWless
        </p>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          Take a finished bounce. Walk out with six HTDemucs stems, a check, and
          a repaired WAV. Audio stays on this device. Sign in to keep the bench.
        </p>
      </section>

      <section>
        <p className="kicker mb-4 text-subtle">Trinity // Integration</p>
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-3">
          {TRINITY.map((item, i) => (
            <Link
              key={item.step}
              to={item.href}
              className={cn(
                "flex flex-col gap-3 bg-surface/40 p-5 no-underline transition-colors duration-150 hover:bg-elevated",
                i > 0 && "border-t border-border md:border-t-0 md:border-l",
              )}
            >
              <span className="font-mono text-xs text-accent">{item.step}</span>
              <h2 className="font-display text-2xl font-semibold uppercase tracking-tight text-fg">
                {item.name}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{item.line}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="kicker mb-3 text-subtle">The job</p>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {TOOLS.map((tool) => (
            <li key={tool.id} className="shrink-0">
              <Link
                to={tool.href}
                className="flex min-h-11 items-center gap-2 rounded-sm border border-border bg-surface/80 px-3 no-underline"
              >
                <span className="font-mono text-xs text-accent">{tool.step}</span>
                <span className="text-sm text-fg">{tool.short}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {featured ? (
        <Link
          to={featured.href}
          className="chromatic-edge group relative block overflow-hidden rounded-2xl glass no-underline"
        >
          <div className="void-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="ripple-well pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />
          <div className="relative z-10 flex items-start justify-between gap-4 p-5 md:p-8">
            <div>
              <p className="kicker kicker-tight text-accent">
                {BRAND_LABEL[featured.system]} · {featured.product}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold uppercase leading-none tracking-tight text-fg md:text-5xl">
                {featured.name}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {featured.detail}
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm text-fg">
                Start the job
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
            <DiamondMark className="size-6 shrink-0 text-accent" />
          </div>
        </Link>
      ) : null}

      <section>
        <h2 className="kicker mb-4 text-subtle">Kinetic bench</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rest.map((tool) => (
            <Link
              key={tool.id}
              to={tool.href}
              className="rounded-xl glass p-4 pl-5 no-underline transition-colors duration-150 hover:bg-elevated"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-accent">{tool.step}</p>
                <tool.icon className="size-4 text-muted" />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold uppercase tracking-tight text-fg">
                {tool.name}
              </h3>
              <p
                className={cn(
                  "kicker kicker-tight mt-1",
                  tool.system === "cn" ? "text-accent" : "text-nag",
                )}
              >
                {BRAND_LABEL[tool.system]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{tool.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-subtle">
        <p>Built in Louisville, KY. bZ · Beat Mob Collective.</p>
        <p className="mt-1">NoDAW Labs · Chromatic Nihilism · Newton AntiGravity.</p>
      </footer>
    </div>
  );
}

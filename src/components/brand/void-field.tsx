import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

function RippleRings() {
  const rings = [1, 2, 3, 4, 5, 6];
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-2/5 w-full text-accent"
      viewBox="0 0 800 320"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      {rings.map((i) => (
        <ellipse
          key={i}
          cx="400"
          cy="310"
          rx={70 * i}
          ry={18 * i}
          fill="none"
          stroke="currentColor"
          strokeOpacity={Math.max(0.04, 0.22 - i * 0.03)}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function VoidField() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const home = pathname === "/";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg"
      aria-hidden
    >
      <div className="warp-stage">
        <div className="warp-grid" />
      </div>
      <div className="ripple-well absolute inset-x-0 bottom-0 h-1/2" />
      <RippleRings />
      <div className="read-veil absolute inset-y-0 left-0 w-full md:w-1/2" />

      <div className={cn("absolute inset-0", home ? "opacity-100" : "opacity-40")}>
        <img
          src="/brand/crystal-cluster.jpg"
          alt=""
          className="crystal gravity-drift-alt absolute -right-8 -top-6 w-40 opacity-55 md:right-0 md:top-6 md:w-96 md:opacity-90"
        />
        <img
          src="/brand/crystal-hero.jpg"
          alt=""
          className="crystal gravity-drift absolute right-0 top-28 hidden w-72 opacity-95 md:block lg:right-8 lg:w-96"
        />
        <img
          src="/brand/crystal-needle.jpg"
          alt=""
          className="crystal gravity-drift-alt absolute -left-16 bottom-24 hidden w-56 opacity-70 md:block"
        />
      </div>
    </div>
  );
}

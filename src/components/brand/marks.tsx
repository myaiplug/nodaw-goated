import { cn } from "@/lib/utils";

export function GravitySpine({
  word = "GRAVITY",
  className,
}: {
  word?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-1", className)}
      aria-hidden
    >
      {word.split("").map((ch, i) => (
        <span
          key={`${ch}${i}`}
          className="font-display text-xs font-semibold leading-none tracking-widest text-accent/45"
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

export function DiamondMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "size-4"}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3 L21 12 L12 21 L3 12 Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

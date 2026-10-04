import { cn } from "@/lib/utils";

type Option<T extends string> = {
  id: T;
  label: string;
  note?: string;
};

export function Choice<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt.id)}
            className={cn(
              "min-h-11 rounded-sm border px-3 py-2 text-left text-sm transition-colors duration-150",
              on
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-elevated text-fg hover:bg-surface",
            )}
          >
            <span className="block font-medium">{opt.label}</span>
            {opt.note ? (
              <span className={cn("mt-0.5 block text-xs", on ? "text-accent-fg/70" : "text-muted")}>
                {opt.note}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

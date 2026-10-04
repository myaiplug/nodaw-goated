import { DiamondMark, GravitySpine } from "@/components/brand/marks";
import { BRAND_LABEL, TOOLS, type ToolId } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolHeader({ id }: { id: ToolId }) {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) return null;
  const nag = tool.system === "nag";
  return (
    <div className="mb-6 flex items-start justify-between gap-6">
      <div>
        <p className={cn("kicker", nag ? "text-nag" : "text-accent")}>
          {BRAND_LABEL[tool.system]} · {tool.product}
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold uppercase tracking-tight text-fg">
          {tool.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{tool.detail}</p>
      </div>
      {nag ? (
        <GravitySpine className="hidden pt-1 md:flex" word="GRAVITY" />
      ) : (
        <DiamondMark className="mt-1 hidden size-5 text-accent md:block" />
      )}
    </div>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DiamondMark } from "@/components/brand/marks";
import { VoidField } from "@/components/brand/void-field";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg text-fg">
      <VoidField />
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 no-underline">
            <DiamondMark className="size-4 shrink-0 text-accent" />
            <span className="font-display text-lg font-semibold tracking-tight text-fg">
              NoDAW
            </span>
            <span className="kicker text-muted">Labs</span>
          </Link>
          <AuthSlot />
        </div>
        <nav
          className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex"
          aria-label="Tools"
        >
          {TOOLS.map((tool) => {
            const active = pathname === tool.href;
            return (
              <Link
                key={tool.id}
                to={tool.href}
                className={cn(
                  "relative rounded-none px-3 py-2 text-sm no-underline transition-colors duration-150",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {tool.name}
                {active ? (
                  <span className="absolute inset-x-3 bottom-0 h-px bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Tools"
      >
        <div className="grid grid-cols-6">
          {TOOLS.map((tool) => {
            const active = pathname === tool.href;
            return (
              <Link
                key={tool.id}
                to={tool.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 no-underline",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <tool.icon className="size-4" />
                <span className="text-xs font-medium tracking-wide">{tool.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-elevated" />;
  }
  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex min-h-11 items-center rounded-sm border border-border px-3 text-sm text-fg no-underline"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link to="/account" className="hidden text-sm text-muted no-underline sm:inline">
        Account
      </Link>
      <div className="hidden sm:block">
        <UserButton />
      </div>
      <Link
        to="/account"
        className="inline-flex min-h-11 items-center text-sm text-fg no-underline sm:hidden"
      >
        Account
      </Link>
    </div>
  );
}

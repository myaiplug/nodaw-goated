import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const showSession = mounted && !isPending;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-4">
      <div>
        <p className="kicker text-accent">Chromatic Nihilism · Account</p>
        <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-tight text-fg">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Google or X. The mix never uploads. The account only keeps your bench
          setup and unlocks CoProducer.
        </p>
      </div>

      {!showSession ? <div className="h-11 animate-pulse rounded-md bg-elevated" /> : null}

      {showSession && user ? (
        <div className="rounded-lg border border-border bg-elevated p-4">
          <p className="text-sm text-fg">
            Signed in{user.displayName ? ` as ${user.displayName}` : ""}.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link to="/account">Open account</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/split">Back to Split</Link>
            </Button>
          </div>
          <div className="mt-4">
            <UserButton />
          </div>
        </div>
      ) : null}

      {showSession && !user && authEnabled
        ? GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void signIn(p.providerId, { callbackURL: "/account" })}
            >
              Continue with {p.label}
            </Button>
          ))
        : null}

      {showSession && !user && !authEnabled ? (
        <p className="text-sm text-muted">Sign-in is disabled.</p>
      ) : null}

      <SignedIn>
        <p className="text-xs text-subtle">Audio still runs on this device.</p>
      </SignedIn>
    </div>
  );
}
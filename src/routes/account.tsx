import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { STEM_MODELS } from "@/lib/audio/types";
import { LUFS_TARGETS } from "@/lib/audio/lufs";
import { useLabPrefs } from "@/lib/use-lab-prefs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const bench = useLabPrefs();

  if (isPending || !bench.ready) {
    return <div className="h-40 animate-pulse rounded-lg bg-elevated" />;
  }
  if (!user) return <RedirectToSignIn />;

  const model = STEM_MODELS.find((m) => m.id === bench.prefs?.stemModel);
  const target = LUFS_TARGETS.find((t) => t.id === bench.prefs?.targetId);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <p className="kicker text-accent">Account</p>
        <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-tight text-fg">
          {user.displayName ?? "Bench"}
        </h1>
        {user.primaryEmail ? (
          <p className="mt-2 text-sm text-muted">{user.primaryEmail}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-elevated p-4">
        <p className="kicker text-muted">Saved setup</p>
        {bench.prefs ? (
          <ul className="mt-3 space-y-2 text-sm text-fg">
            <li>Split: {model?.name ?? bench.prefs.stemModel}</li>
            <li>
              Quality: {bench.prefs.quality} · {bench.prefs.stemMode} stems
            </li>
            <li>Loudness: {target?.label ?? bench.prefs.targetId}</li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Nothing saved yet. Split and CoProducer can store the setup on this
            account.
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Files stay on this device. The account does not store audio.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link to="/split">Split</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/coproducer">CoProducer</Link>
          </Button>
        </div>
      </div>

      <UserButton />
    </div>
  );
}

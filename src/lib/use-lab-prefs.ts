import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getLabPrefs, saveLabPrefs, type LabPrefs } from "@/lib/lab-prefs";

export function useLabPrefs() {
  const { user, isPending } = useCurrentUserState();
  const [prefs, setPrefs] = useState<LabPrefs | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setPrefs(null);
      setReady(true);
      return;
    }
    let cancel = false;
    setReady(false);
    void getLabPrefs()
      .then((next) => {
        if (!cancel) setPrefs(next);
      })
      .catch(() => {
        if (!cancel) setPrefs(null);
      })
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [user?.id, isPending]);

  const save = useCallback(async (next: LabPrefs) => {
    const saved = await saveLabPrefs({ data: next });
    if (saved.ok) setPrefs(next);
    return saved;
  }, []);

  return {
    user,
    isPending,
    prefs,
    ready,
    save,
    signedIn: Boolean(user),
  };
}

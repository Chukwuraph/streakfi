"use client";

import { useEffect } from "react";

/**
 * Re-run `load` when:
 *  - the tab regains focus
 *  - document visibility becomes visible
 *  - browser comes back online
 * Keeps streak/leaderboard data fresh without hard-polling.
 */
export function useFocusRefresh(load: () => void) {
  useEffect(() => {
    const onFocus = () => load();
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onFocus);
    };
  }, [load]);
}

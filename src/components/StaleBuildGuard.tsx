"use client";

import { useEffect } from "react";
import { BUILD_ID } from "@/lib/build-id";

const RELOAD_MARK = "booker.reloadedFor";

/**
 * Reloads once when the page is running an older build than what is deployed.
 *
 * GitHub Pages caches HTML for ten minutes and in-app browsers hold it longer,
 * so a fix can be live while someone is still exercising the previous bundle —
 * which reads as "the bug was never fixed". The marker keeps this to a single
 * reload per build, so a genuinely stale cache cannot become a loop.
 */
export function StaleBuildGuard() {
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/build-id.json", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { id } = (await res.json()) as { id?: string };
        if (!id || id === BUILD_ID) return;
        if (sessionStorage.getItem(RELOAD_MARK) === id) return;
        sessionStorage.setItem(RELOAD_MARK, id);
        window.location.reload();
      } catch {
        // Offline or blocked: keep serving what is already loaded.
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

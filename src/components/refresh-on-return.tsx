"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STALE_AFTER_MS = 30_000;

/** Re-fetch server data when a phone brings the app back after a while in the background. */
export function RefreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    let hiddenAt = 0;
    const onChange = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > STALE_AFTER_MS) router.refresh();
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [router]);
  return null;
}

"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

// The banner's last markup, kept for a moment after the committee area
// unmounts so the next page's shell can slide a copy of it away.
let lastBanner: { html: string; at: number } | null = null;

/**
 * The committee tab banner. It slides down from under the bar when the
 * committee area opens (the committee layout mounts once, so moving between
 * its sections doesn't replay it), and leaves a copy behind on the way out.
 */
export function CommitteeBanner({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    return () => {
      // Layout cleanup runs before the next page's layout effects, so the ghost can read it.
      if (node) lastBanner = { html: node.innerHTML, at: Date.now() };
    };
  }, []);
  return (
    <div className="overflow-hidden">
      <div ref={ref} className="subnav-banner banner-in bg-banner">
        {children}
      </div>
    </div>
  );
}

/**
 * On pages without the banner: if we just left the committee area, slide the
 * banner's copy up behind the bar, then remove it.
 */
export function BannerGhost() {
  const [html, setHtml] = useState<string | null>(null);
  useLayoutEffect(() => {
    const recent = lastBanner && Date.now() - lastBanner.at < 1000;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (recent && !reduce) setHtml(lastBanner!.html);
    lastBanner = null;
  }, []);
  if (!html) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-full overflow-hidden" aria-hidden inert>
      <div className="subnav-banner banner-out bg-banner" onAnimationEnd={() => setHtml(null)} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Fades a page in where it sits when it mounts (see `.page-fade` in
 * globals.css). The old page is gone at once, so the two never overlap.
 * Used inside each page's shell and by the committee template, which
 * remounts per section.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-fade">{children}</div>;
}

import { type ReactNode, ViewTransition } from "react";

/**
 * Animates page content on navigation: the old page fades out, the new one
 * rises into focus (see `.page` in globals.css). Lives inside each page's
 * tree, so it mounts fresh on every route change; refreshes don't animate.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}

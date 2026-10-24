"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { cx } from "./ui";

export function NavLink({ href, exact, children, badge }: { href: string; exact?: boolean; children: ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const ref = useRef<HTMLAnchorElement>(null);
  // On first load, bring the current section into view if it is off-screen.
  // Later taps never scroll the strip, so it stays exactly where it was left.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "u-host hit inline-flex h-8 items-center gap-1.5 px-2.5 text-body font-medium whitespace-nowrap transition-colors duration-200",
        // One weight in every state, so selecting a tab never changes its width; ink and the underline mark it.
        active ? "text-text" : "text-secondary hover:text-text",
      )}
    >
      <span className="u-line">{children}</span>
      {badge ? <span className="text-footnote font-bold text-crimson tabular-nums">{badge}</span> : null}
    </Link>
  );
}

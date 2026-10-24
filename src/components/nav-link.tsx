"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { cx } from "./ui";

export function NavLink({ href, exact, children, badge }: { href: string; exact?: boolean; children: ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const ref = useRef<HTMLAnchorElement>(null);
  // Bring the current section into view only if it is off-screen; a tab the
  // user just tapped is already visible, so the strip stays where they left it.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "u-host hit inline-flex h-8 items-center gap-1.5 px-2.5 text-body whitespace-nowrap transition-colors duration-200",
        active ? "font-semibold text-text" : "font-medium text-secondary hover:text-text",
      )}
    >
      <span className="u-line">{children}</span>
      {badge ? <span className="text-footnote font-bold text-crimson tabular-nums">{badge}</span> : null}
    </Link>
  );
}

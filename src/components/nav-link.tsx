"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { cx } from "./ui";

export function NavLink({ href, exact, children, badge }: { href: string; exact?: boolean; children: ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const ref = useRef<HTMLAnchorElement>(null);
  // Keep the current section visible in the horizontally scrolling subnav.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-body font-medium whitespace-nowrap transition-colors duration-150",
        active ? "bg-text text-ground" : "text-secondary hover:bg-fill hover:text-text",
      )}
    >
      {children}
      {badge ? (
        <span className="min-w-5 rounded-full bg-crimson px-1.5 text-center text-caption leading-5 font-bold text-on-crimson tabular-nums">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

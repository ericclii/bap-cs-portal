import Link from "next/link";
import type { ReactNode } from "react";
import type { CurrentUser } from "@/server/session";
import { NavLink } from "./nav-link";
import { RefreshOnReturn } from "./refresh-on-return";
import { UserMenu } from "./user-menu";

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-[9px] bg-crimson font-bold tracking-[-0.02em] text-on-crimson"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }}
    >
      ΒΑΨ
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg">
      <Mark />
      <span className="text-body font-semibold tracking-[-0.01em]">Community Service</span>
    </Link>
  );
}

export function AppShell({
  user,
  children,
  subnav,
}: {
  user: CurrentUser | null;
  children: ReactNode;
  subnav?: ReactNode;
}) {
  // One frame for every page so the bar and the content edge never jump between sections.
  const width = "max-w-5xl px-[max(1rem,env(safe-area-inset-left))]";
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-separator bg-ground/95 pt-[env(safe-area-inset-top)] backdrop-saturate-150">
        <div className={`mx-auto flex h-14 items-center justify-between gap-4 ${width}`}>
          <Logo />
          {user ? (
            <nav className="flex items-center gap-1" aria-label="Main">
              {user.role && (
                <span className="hidden sm:contents">
                  <NavLink href="/" exact>My service</NavLink>
                  <NavLink href="/committee">Committee</NavLink>
                </span>
              )}
              <UserMenu user={user} />
            </nav>
          ) : (
            <Link href="/signin" className="text-body font-semibold text-crimson">Sign in</Link>
          )}
        </div>
        {subnav && (
          <div className={`mx-auto pb-1 ${width}`}>
            <div
              className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1.5 pr-8 [scrollbar-width:none] sm:pr-1 [&::-webkit-scrollbar]:hidden"
              style={{ maskImage: "linear-gradient(to right, black calc(100% - 32px), transparent)" }}
            >
              {subnav}
            </div>
          </div>
        )}
      </header>
      {user && <RefreshOnReturn />}
      <main className={`mx-auto w-full flex-1 pt-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] ${width}`}>{children}</main>
    </>
  );
}

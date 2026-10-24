import Link from "next/link";
import type { ReactNode } from "react";
import type { CurrentUser } from "@/server/session";
import { BannerGhost, CommitteeBanner } from "./committee-banner";
import { Mark } from "./mark";
import { PageTransition } from "./page-transition";
import { NavLink } from "./nav-link";
import { RefreshOnReturn } from "./refresh-on-return";
import { UserMenu } from "./user-menu";

export { Mark };

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg">
      <Mark />
      <span className="font-display text-headline font-bold tracking-[-0.01em]">Community Service</span>
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
      {/* The tone sits on the bar alone, so the banner slides in over the page's own ground, not white. */}
      <header className="sticky top-0 z-30">
        <div className="relative z-10 bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className={`mx-auto flex h-14 items-center justify-between gap-4 ${width}`}>
          <Logo />
          {user ? (
            <nav className="flex items-center gap-1.5" aria-label="Main">
              {user.role && (
                <span className="hidden sm:contents">
                  <NavLink href="/service" exact>My service</NavLink>
                  <NavLink href="/committee">Committee</NavLink>
                </span>
              )}
              <UserMenu user={user} />
            </nav>
          ) : (
            <Link href="/signin" className="u-line text-body font-semibold text-crimson">Sign in</Link>
          )}
        </div>
        </div>
        {subnav ? (
          <CommitteeBanner>
            <div className={`mx-auto ${width}`}>
              {/* On phones the strip runs to the screen edges and fades there, so a cut-off tab reads as "scroll for more". */}
              <div className="-mx-4 flex scroll-px-4 overflow-x-auto py-1.5 pr-8 pl-1.5 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-32px),transparent)] [scrollbar-width:none] sm:-mx-2.5 sm:px-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
                {subnav}
              </div>
            </div>
          </CommitteeBanner>
        ) : (
          user?.role && <BannerGhost />
        )}
      </header>
      {user && <RefreshOnReturn />}
      <main className={`mx-auto w-full flex-1 pt-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] ${width}`}>
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}

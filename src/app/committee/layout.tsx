import { AppShell } from "@/components/app-shell";
import { NavLink } from "@/components/nav-link";
import { db } from "@/server/db";
import { requireCommitteePage } from "@/server/session";

export default async function CommitteeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCommitteePage("/committee");
  const openReviews = await db.reviewItem.count({ where: { status: "OPEN" } });

  return (
    <AppShell
      user={user}
      subnav={
        <>
          <NavLink href="/committee" exact>Overview</NavLink>
          <NavLink href="/committee/events">Events</NavLink>
          <NavLink href="/committee/reviews" badge={openReviews}>Reviews</NavLink>
          <NavLink href="/committee/points">Points</NavLink>
          <NavLink href="/committee/candidates">Candidates</NavLink>
          <NavLink href="/committee/settings">Manage</NavLink>
        </>
      }
    >
      {children}
    </AppShell>
  );
}

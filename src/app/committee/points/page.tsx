import type { Metadata } from "next";
import { buttonClass, Empty, LinkButton, PageTitle } from "@/components/ui";
import { appUrl } from "@/server/email";
import { feedToken } from "@/server/feed-token";
import { getCurrentUser } from "@/server/session";
import { termStandings } from "@/server/services/points";
import { getCurrentTerm } from "@/server/services/terms";
import { PointsManager } from "./points-manager";

export const metadata: Metadata = { title: "Points" };

export default async function PointsPage() {
  const term = await getCurrentTerm();
  if (!term) return <Empty title="Set up the current term first" action={<LinkButton href="/committee/settings">Settings</LinkButton>} />;
  const [standings, user] = await Promise.all([termStandings(term.id), getCurrentUser()]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Points"
        subtitle={`${term.name}${term.requiredPoints != null ? ` · ${term.requiredPoints} required` : ""}. Event points come from confirmed results; adjustments cover everything else.`}
        actions={<a href="/api/v1/committee/points/export" className={buttonClass("secondary")}>Download CSV</a>}
      />
      <PointsManager
        standings={standings}
        required={term.requiredPoints}
        isChair={user?.role === "CHAIR"}
        feedUrl={appUrl(`/api/feeds/points?token=${feedToken()}`)}
      />
    </div>
  );
}

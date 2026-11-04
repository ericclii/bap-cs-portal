import type { Metadata } from "next";
import { Empty, LinkButton, PageTitle } from "@/components/ui";
import { appUrl } from "@/server/email";
import { feedToken } from "@/server/feed-token";
import { getCurrentUser } from "@/server/session";
import { listCheckpoints } from "@/server/services/checkpoints";
import { termStandings } from "@/server/services/points";
import { listCandidates } from "@/server/services/roster";
import { getCurrentTerm } from "@/server/services/terms";
import { PointsManager } from "./points-manager";

export const metadata: Metadata = { title: "Points" };

export default async function PointsPage() {
  const term = await getCurrentTerm();
  if (!term) return <Empty title="Set up the current term first" action={<LinkButton href="/committee/settings">Manage</LinkButton>} />;
  const [standings, user, candidates, checkpoints] = await Promise.all([termStandings(term.id), getCurrentUser(), listCandidates(term.id), listCheckpoints(term.id)]);

  return (
    <div className="space-y-6">
      <PageTitle title="Points" />
      <PointsManager
        standings={standings}
        candidates={candidates}
        checkpoints={JSON.parse(JSON.stringify(checkpoints))}
        isChair={user?.role === "CHAIR"}
        feedUrl={appUrl(`/api/feeds/points?token=${feedToken()}`)}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Empty, LinkButton, PageTitle } from "@/components/ui";
import { listCheckpoints } from "@/server/services/checkpoints";
import { termStandings } from "@/server/services/points";
import { listCandidates } from "@/server/services/roster";
import { getCurrentTerm } from "@/server/services/terms";
import { CheckpointStanding } from "./checkpoint-standing";
import { RosterManager } from "./roster-manager";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage() {
  const term = await getCurrentTerm();
  if (!term) return <Empty title="Set up the current term first" action={<LinkButton href="/committee/settings">Manage</LinkButton>} />;
  const [candidates, standings, checkpoints] = await Promise.all([listCandidates(term.id), termStandings(term.id), listCheckpoints(term.id)]);
  const people = standings
    .filter((s) => s.isCandidate)
    .map((s) => ({ netId: s.netId, name: s.name, total: s.total, pendingEvents: s.pendingEvents }));
  return (
    <div className="space-y-10">
      <PageTitle title="Candidates" subtitle={`${term.name} · ${candidates.length} on the roster`} />
      <CheckpointStanding people={people} checkpoints={JSON.parse(JSON.stringify(checkpoints))} />
      <RosterManager candidates={candidates} />
    </div>
  );
}

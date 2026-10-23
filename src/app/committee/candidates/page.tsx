import type { Metadata } from "next";
import { Empty, LinkButton, PageTitle } from "@/components/ui";
import { listCandidates } from "@/server/services/roster";
import { getCurrentTerm } from "@/server/services/terms";
import { RosterManager } from "./roster-manager";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage() {
  const term = await getCurrentTerm();
  if (!term) return <Empty title="Set up the current term first" action={<LinkButton href="/committee/settings">Settings</LinkButton>} />;
  const candidates = await listCandidates(term.id);
  return (
    <div className="space-y-6">
      <PageTitle title="Candidates" subtitle={`${term.name} · ${candidates.length} on the roster`} />
      <RosterManager candidates={candidates} />
    </div>
  );
}

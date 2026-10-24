import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { emailConfigured } from "@/server/email";
import { requireCommitteePage } from "@/server/session";
import { listCommittee } from "@/server/services/committee";
import { listTerms } from "@/server/services/terms";
import { CommitteeManager } from "./committee-manager";
import { TermsManager } from "./terms-manager";

export const metadata: Metadata = { title: "Manage" };

export default async function SettingsPage() {
  const user = await requireCommitteePage("/committee/settings");
  const [terms, committee] = await Promise.all([listTerms(), listCommittee()]);
  const isChair = user.role === "CHAIR";
  return (
    <div className="max-w-3xl space-y-10">
      <PageTitle title="Manage" />
      <TermsManager terms={JSON.parse(JSON.stringify(terms))} isChair={isChair} />
      <CommitteeManager members={committee.members} bootstrapChairs={committee.bootstrapChairs} isChair={isChair} myNetId={user.netId} />
      <section className="space-y-2">
        <h2 className="text-headline font-semibold">Email</h2>
        <p className="text-footnote text-secondary">
          {emailConfigured
            ? `Confirmations, reminders and results are sent from ${process.env.GMAIL_USER}.`
            : "Email isn't connected yet, so confirmations and reminders are saved but not sent. Whoever set up the portal can connect the committee Gmail account."}
        </p>
      </section>
    </div>
  );
}

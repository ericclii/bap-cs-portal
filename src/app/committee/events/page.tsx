import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import { Empty, LinkButton, PageTitle } from "@/components/ui";
import { listEventsForCommittee } from "@/server/services/events";
import { getCurrentTerm } from "@/server/services/terms";
import { EventGroup } from "../event-group";

export const metadata: Metadata = { title: "Events" };

export default async function CommitteeEventsPage() {
  const term = await getCurrentTerm();
  if (!term) return <Empty title="Set up the current term first" action={<LinkButton href="/committee/settings">Settings</LinkButton>} />;
  const events = await listEventsForCommittee();
  const now = new Date();
  const upcoming = events.filter((e) => e.endsAt >= now && !e.canceledAt);
  const past = events.filter((e) => e.endsAt < now || e.canceledAt).reverse();

  return (
    <div className="space-y-8">
      <PageTitle title="Events" subtitle={term.name} actions={events.length > 0 ? <LinkButton href="/committee/events/new">New event</LinkButton> : undefined} />
      {events.length === 0 ? (
        <Empty icon={<CalendarPlus className="h-7 w-7" aria-hidden />} title="No events yet" action={<LinkButton href="/committee/events/new">Create an event</LinkButton>}>
          Each event has its own sign-up window, spots, points and check-in location.
        </Empty>
      ) : (
        <>
          <EventGroup title="Upcoming" events={upcoming} empty="Nothing upcoming." />
          {past.length > 0 && <EventGroup title="Past and canceled" events={past} />}
        </>
      )}
    </div>
  );
}

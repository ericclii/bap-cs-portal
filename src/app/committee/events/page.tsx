import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import { Empty, Group, LinkButton, PageTitle, Row, Section } from "@/components/ui";
import { relativeDay } from "@/lib/time";
import { openReviews } from "@/server/services/attendance";
import { listEventsForCommittee } from "@/server/services/events";
import { getCurrentTerm } from "@/server/services/terms";
import { EventGroup } from "../event-group";
import { ReviewList } from "./review-list";

export const metadata: Metadata = { title: "Events" };

/**
 * The committee's home: what needs a decision first (who goes, points to
 * award, attendance to review), then the events themselves. Sections with
 * nothing in them don't render.
 */
export default async function CommitteeEventsPage() {
  const term = await getCurrentTerm();
  if (!term) {
    return (
      <Empty title="Set up the current term" action={<LinkButton href="/committee/settings">Manage</LinkButton>}>
        Events, candidates and points all belong to a term, like Fall 2026.
      </Empty>
    );
  }
  const [events, reviews] = await Promise.all([listEventsForCommittee(), openReviews()]);
  const now = new Date();

  const todo = [
    ...events
      .filter((e) => e.phase === "needs_selection")
      .map((e) => ({ href: `/committee/events/${e.id}?tab=selection`, title: `Pick who goes: ${e.title}`, detail: `${e.applied} signed up for ${e.capacity} spots · ${relativeDay(e.startsAt, now)}` })),
    ...events
      .filter((e) => e.phase === "needs_finalize")
      .map((e) => ({ href: `/committee/events/${e.id}?tab=finalize`, title: `Award points: ${e.title}`, detail: `${e.checkedIn} of ${e.selected} checked in` })),
  ];
  // An event that needs a decision is listed once, under Needs attention.
  const listed = events.filter((e) => e.phase !== "needs_selection" && e.phase !== "needs_finalize");
  const live = listed.filter((e) => e.phase === "live");
  const upcoming = listed.filter((e) => e.phase !== "live" && e.endsAt >= now && !e.canceledAt);
  const past = listed.filter((e) => e.endsAt < now || e.canceledAt).reverse();

  return (
    <div className="space-y-8">
      <PageTitle title="Events" actions={events.length > 0 ? <LinkButton href="/committee/events/new">New event</LinkButton> : undefined} />

      {todo.length > 0 && (
        <Section title="Needs attention">
          <Group>
            {todo.map((t) => (
              <Row key={t.href} href={t.href} title={t.title} subtitle={t.detail} chevron />
            ))}
          </Group>
        </Section>
      )}

      {reviews.length > 0 && (
        <section id="reviews" className="scroll-mt-32 space-y-3">
          <h2 className="text-title">Reviews</h2>
          <ReviewList reviews={JSON.parse(JSON.stringify(reviews))} />
        </section>
      )}

      {events.length === 0 ? (
        <Empty icon={<CalendarPlus className="h-7 w-7" aria-hidden />} title="No events yet" action={<LinkButton href="/committee/events/new">Create an event</LinkButton>} />
      ) : (
        <>
          {live.length > 0 && <EventGroup title="Happening now" events={live} />}
          <EventGroup title="Upcoming" events={upcoming} empty="Nothing upcoming." />
          {past.length > 0 && <EventGroup title="Past and canceled" events={past} />}
        </>
      )}
    </div>
  );
}

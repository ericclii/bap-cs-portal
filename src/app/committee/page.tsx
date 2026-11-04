import { CalendarDays, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { Empty, Group, LinkButton, Notice, PageTitle, Row, Section } from "@/components/ui";
import { relativeDay } from "@/lib/time";
import { db } from "@/server/db";
import { emailConfigured } from "@/server/email";
import { listEventsForCommittee } from "@/server/services/events";
import { getCurrentTerm } from "@/server/services/terms";
import { EventGroup } from "./event-group";

export const metadata: Metadata = { title: "Committee" };

export default async function CommitteeOverview() {
  const term = await getCurrentTerm();
  if (!term) {
    return (
      <Empty icon={<CalendarDays className="h-7 w-7" aria-hidden />} title="Set up the current term" action={<LinkButton href="/committee/settings">Go to settings</LinkButton>}>
        Create a term, like Fall 2026, with its points requirement. Events, the candidate roster and points all belong to a term.
      </Empty>
    );
  }

  const [events, openReviews, candidates] = await Promise.all([
    listEventsForCommittee(),
    db.reviewItem.count({ where: { status: "OPEN" } }),
    db.candidate.count({ where: { termId: term.id } }),
  ]);
  const now = new Date();
  const live = events.filter((e) => e.phase === "live");
  const upcoming = events.filter((e) => ["signups_upcoming", "signups_open", "confirmed", "draft"].includes(e.phase));

  const todo = [
    ...(openReviews ? [{ href: "/committee/reviews", title: `${openReviews} ${openReviews === 1 ? "review" : "reviews"} waiting`, detail: "Location problems and early check-outs" }] : []),
    ...events.filter((e) => e.phase === "needs_selection").map((e) => ({ href: `/committee/events/${e.id}?tab=selection`, title: `Pick who goes: ${e.title}`, detail: `${e.applied} signed up for ${e.capacity} spots · ${relativeDay(e.startsAt, now)}` })),
    ...events.filter((e) => e.phase === "needs_finalize").map((e) => ({ href: `/committee/events/${e.id}?tab=finalize`, title: `Award points: ${e.title}`, detail: `${e.checkedIn} of ${e.selected} checked in` })),
    ...(candidates === 0 ? [{ href: "/committee/candidates", title: "Add this term's candidates", detail: "They rank first for spots and their checkpoints are tracked" }] : []),
  ];

  return (
    <div className="space-y-8">
      <PageTitle
        title={term.name}
        actions={<LinkButton href="/committee/events/new">New event</LinkButton>}
      />

      <Section title="Needs attention">
        {todo.length === 0 ? (
          <Empty icon={<CheckCircle2 className="h-7 w-7" aria-hidden />} title="All caught up" />
        ) : (
          <Group>
            {todo.map((t) => (
              <Row key={t.href + t.title} href={t.href} title={t.title} subtitle={t.detail} chevron />
            ))}
          </Group>
        )}
      </Section>

      {!emailConfigured && (
        <Notice tone="amber">Email isn&apos;t connected yet, so confirmations and reminders are saved but not sent. Whoever set up the portal can connect the committee Gmail account.</Notice>
      )}

      {live.length > 0 && <EventGroup title="Happening now" events={live} />}
      <EventGroup title="Coming up" events={upcoming} empty="No upcoming events." />
    </div>
  );
}

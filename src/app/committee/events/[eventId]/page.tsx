import type { Metadata } from "next";
import { utcToNyLocal } from "@/lib/time";
import { orNotFound } from "@/server/page-guard";
import { eventPhase, getEventForCommittee } from "@/server/services/events";
import { eventPeople } from "@/server/services/signups";
import { EventConsole } from "./event-console";

export const metadata: Metadata = { title: "Event" };

export default async function CommitteeEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab } = await searchParams;
  const event = await orNotFound(getEventForCommittee(eventId));
  const people = await eventPeople(eventId);
  const phase = eventPhase(event);
  const defaultTab = phase === "needs_selection" ? "selection" : phase === "needs_finalize" ? "finalize" : "people";

  return (
    <EventConsole
      event={JSON.parse(JSON.stringify({ ...event, phase, startsAtLocal: utcToNyLocal(event.startsAt) }))}
      initialPeople={JSON.parse(JSON.stringify(people))}
      initialTab={(["people", "selection", "finalize"].includes(tab ?? "") ? tab : defaultTab) as "people" | "selection" | "finalize"}
    />
  );
}

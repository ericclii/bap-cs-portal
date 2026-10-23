import { DateTile, Empty, Group, Row, Section } from "@/components/ui";
import { formatEventRange } from "@/lib/time";
import type { listEventsForCommittee } from "@/server/services/events";
import { PhasePill } from "./phase";

type Events = Awaited<ReturnType<typeof listEventsForCommittee>>;

export function EventGroup({ title, events, empty }: { title: string; events: Events; empty?: string }) {
  return (
    <Section title={title}>
      {events.length === 0 ? (
        <Empty title={empty ?? "Nothing here"} />
      ) : (
        <Group>
          {events.map((e) => (
            <Row
              key={e.id}
              href={`/committee/events/${e.id}`}
              leading={<DateTile date={e.startsAt} size="sm" muted={e.phase === "finalized" || e.phase === "canceled"} today={e.phase === "live" ? false : undefined} />}
              title={e.title}
              subtitle={`${formatEventRange(e.startsAt, e.endsAt)} · ${
                e.phase === "live" ? `${e.checkedIn}/${e.selected}\u00a0checked\u00a0in` : e.selectionPublishedAt ? `${e.selected}/${e.capacity}\u00a0confirmed` : `${e.applied}\u00a0signed\u00a0up`
              }`}
              trailing={<PhasePill phase={e.phase} />}
              stackTrailing
              chevron
            />
          ))}
        </Group>
      )}
    </Section>
  );
}

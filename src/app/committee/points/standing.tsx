"use client";

import { useState } from "react";
import Link from "next/link";
import { Empty, Group, Section, Select } from "@/components/ui";
import { type Checkpoint, checkpointStatus, formatDue, nextCheckpoint } from "@/lib/checkpoints";

export type Person = { netId: string; name: string | null; total: number; pendingEvents: number };

const byTotal = (people: Person[]) =>
  [...people].sort((a, b) => a.total - b.total || (a.name ?? a.netId).localeCompare(b.name ?? b.netId));

/** One compact line per person: name · NetID, then points. */
export function PersonLine({ netId, name, detail, total, note }: { netId: string; name: string | null; detail?: string | null; total: number; note?: string | null }) {
  return (
    <Link href={`/committee/points/${netId}`} className="flex items-center gap-3 px-4 py-1.5 transition-colors duration-150 hover:bg-ground active:bg-fill">
      <span className="min-w-0 flex-1 truncate text-body">
        <span className="font-medium">{name ?? netId}</span>
        {name && <span className="text-secondary"> · {netId}</span>}
        {detail && <span className="text-footnote text-secondary"> · {detail}</span>}
      </span>
      {note && <span className="shrink-0 text-footnote text-secondary tabular-nums">{note}</span>}
      <span className="w-10 shrink-0 text-right text-body font-semibold tabular-nums">{total}</span>
    </Link>
  );
}

function PersonRow({ p, target }: { p: Person; target: number }) {
  return (
    <PersonLine
      netId={p.netId}
      name={p.name}
      detail={p.pendingEvents ? `${p.pendingEvents} not awarded yet` : null}
      total={p.total}
      note={p.total < target ? `${target - p.total} short` : null}
    />
  );
}

/** Candidates short of the next checkpoint still ahead. */
export function RiskView({ people, checkpoints }: { people: Person[]; checkpoints: Checkpoint[] }) {
  const next = nextCheckpoint(checkpoints);
  if (!next) return <Empty title="Every checkpoint has passed" />;
  const short = byTotal(people).filter((p) => p.total < next.points);
  return (
    <Section title={`Short of ${next.name}`} footer={`${next.points} points ${next.dueAt ? `by ${formatDue(next)}` : "by the end of the semester"}`}>
      {short.length === 0 ? (
        <Empty title={`Every candidate has reached ${next.name}`} />
      ) : (
        <Group>
          {short.map((p) => (
            <PersonRow key={p.netId} p={p} target={next.points} />
          ))}
        </Group>
      )}
    </Section>
  );
}

/** For any one checkpoint: who hasn't reached it (or missed it) and who has. */
export function CheckpointView({ people, checkpoints }: { people: Person[]; checkpoints: Checkpoint[] }) {
  const now = new Date();
  const [chosenId, setChosenId] = useState(nextCheckpoint(checkpoints, now)?.id ?? checkpoints[0].id);
  const chosen = checkpoints.find((c) => c.id === chosenId) ?? checkpoints[0];
  const sorted = byTotal(people);
  const notYet = sorted.filter((p) => checkpointStatus(p.total, chosen, now) !== "passed");
  const passed = sorted.filter((p) => checkpointStatus(p.total, chosen, now) === "passed").reverse();
  const missed = chosen.dueAt != null && chosen.dueAt < now;
  return (
    <div className="space-y-6">
      <Select aria-label="Checkpoint" value={chosen.id} onChange={(e) => setChosenId(e.target.value)} className="w-full sm:w-80">
        {checkpoints.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.points} pts · {formatDue(c)}
          </option>
        ))}
      </Select>
      <Section title={`${missed ? "Missed" : "Not yet"} · ${notYet.length}`}>
        {notYet.length === 0 ? (
          <Empty title="No one" />
        ) : (
          <Group>
            {notYet.map((p) => (
              <PersonRow key={p.netId} p={p} target={chosen.points} />
            ))}
          </Group>
        )}
      </Section>
      <Section title={`Passed · ${passed.length}`}>
        {passed.length === 0 ? (
          <Empty title="No one yet" />
        ) : (
          <Group>
            {passed.map((p) => (
              <PersonRow key={p.netId} p={p} target={chosen.points} />
            ))}
          </Group>
        )}
      </Section>
    </div>
  );
}

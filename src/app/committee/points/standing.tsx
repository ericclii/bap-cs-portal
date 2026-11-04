"use client";

import { useState } from "react";
import { Empty, Group, Row, Section, Select } from "@/components/ui";
import { type Checkpoint, checkpointStatus, formatDue, nextCheckpoint } from "@/lib/checkpoints";

export type Person = { netId: string; name: string | null; total: number; pendingEvents: number };

const byTotal = (people: Person[]) =>
  [...people].sort((a, b) => a.total - b.total || (a.name ?? a.netId).localeCompare(b.name ?? b.netId));

function PersonRow({ p, target }: { p: Person; target: number }) {
  return (
    <Row
      href={`/committee/points/${p.netId}`}
      title={p.name ?? p.netId}
      subtitle={[p.netId, p.pendingEvents ? `${p.pendingEvents} not awarded yet` : null].filter(Boolean).join(" · ")}
      trailing={
        <span className="text-right text-body tabular-nums">
          <span className="font-semibold">{p.total}</span>
          {p.total < target && <span className="block text-footnote text-secondary">{target - p.total} short</span>}
        </span>
      }
      chevron
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

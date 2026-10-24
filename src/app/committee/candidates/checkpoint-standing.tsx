"use client";

import { useState } from "react";
import { Empty, Group, Row, Section, Segmented, Select } from "@/components/ui";
import { type Checkpoint, checkpointStatus, formatDue, nextCheckpoint } from "@/lib/checkpoints";

type Person = { netId: string; name: string | null; total: number; pendingEvents: number };
type WireCheckpoint = Omit<Checkpoint, "dueAt"> & { dueAt: string | null };

/**
 * Who has reached which checkpoint. "At risk" lists candidates short of the
 * next checkpoint still ahead; "By checkpoint" splits the roster for any one.
 */
export function CheckpointStanding({ people, checkpoints: wire }: { people: Person[]; checkpoints: WireCheckpoint[] }) {
  const checkpoints: Checkpoint[] = wire.map((c) => ({ ...c, dueAt: c.dueAt ? new Date(c.dueAt) : null }));
  const now = new Date();
  const next = nextCheckpoint(checkpoints, now);
  const [view, setView] = useState<"risk" | "checkpoint">("risk");
  const [chosenId, setChosenId] = useState(next?.id ?? checkpoints[0]?.id ?? "");
  const chosen = checkpoints.find((c) => c.id === chosenId) ?? checkpoints[0];

  if (checkpoints.length === 0) {
    return (
      <Section title="Checkpoints">
        <Empty title="No checkpoints yet">A chair can add them under Manage, with a date for each or none for the end of the semester.</Empty>
      </Section>
    );
  }

  const byTotal = [...people].sort((a, b) => a.total - b.total || (a.name ?? a.netId).localeCompare(b.name ?? b.netId));
  const row = (p: Person, target: number) => (
    <Row
      key={p.netId}
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

  return (
    <section className="space-y-4">
      <Segmented
        label="Candidate standing"
        value={view}
        onChange={setView}
        options={[
          { value: "risk", label: "At risk" },
          { value: "checkpoint", label: "By checkpoint" },
        ]}
      />

      {view === "risk" ? (
        next ? (
          (() => {
            const short = byTotal.filter((p) => p.total < next.points);
            return (
              <Section title={`Short of ${next.name}`} footer={`${next.points} points ${next.dueAt ? `by ${formatDue(next)}` : "by the end of the semester"}. ${short.length} of ${people.length} candidates short.`}>
                {short.length === 0 ? <Empty title={`Every candidate has reached ${next.name}`} /> : <Group>{short.map((p) => row(p, next.points))}</Group>}
              </Section>
            );
          })()
        ) : (
          <Empty title="Every checkpoint has passed" />
        )
      ) : (
        <div className="space-y-6">
          <Select aria-label="Checkpoint" value={chosen.id} onChange={(e) => setChosenId(e.target.value)} className="w-full sm:w-80">
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.points} pts · {formatDue(c)}
              </option>
            ))}
          </Select>
          {(() => {
            const notYet = byTotal.filter((p) => checkpointStatus(p.total, chosen, now) !== "passed");
            const passed = byTotal.filter((p) => checkpointStatus(p.total, chosen, now) === "passed").reverse();
            const missed = chosen.dueAt != null && chosen.dueAt < now;
            return (
              <>
                <Section title={`${missed ? "Missed" : "Not yet"} · ${notYet.length}`}>
                  {notYet.length === 0 ? <Empty title="No one" /> : <Group>{notYet.map((p) => row(p, chosen.points))}</Group>}
                </Section>
                <Section title={`Passed · ${passed.length}`}>
                  {passed.length === 0 ? <Empty title="No one yet" /> : <Group>{passed.map((p) => row(p, chosen.points))}</Group>}
                </Section>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}

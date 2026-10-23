"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Button, Group, inputBase, inputClass, Notice, Pill, Select } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { formatDuration } from "@/lib/event-window";
import { formatTime } from "@/lib/time";
import type { ConsoleEvent } from "./types";

type Outcome = "ATTENDED" | "NO_SHOW" | "EXCUSED";

type Row = {
  signupId: string;
  netId: string;
  name: string;
  image: string | null;
  status: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  minutes: number | null;
  flags: string[];
  suggested: { outcome: Outcome; points: number };
  current: { outcome: Outcome; points: number; note: string | null } | null;
  dropReason: string | null;
};

type Draft = { outcome: Outcome; points: number; note: string };

export function FinalizeTab({ event, onNotice }: { event: ConsoleEvent; onNotice: (m: string) => void }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [penalty, setPenalty] = useState(-1);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ rows: Row[]; noShowPenalty: number }>(`/committee/events/${event.id}/finalize`)
      .then(({ rows, noShowPenalty }) => {
        setRows(rows);
        setPenalty(noShowPenalty);
        setDrafts(
          Object.fromEntries(
            rows.map((r) => [r.signupId, r.current ? { ...r.current, note: r.current.note ?? "" } : { ...r.suggested, note: "" }]),
          ),
        );
      })
      .catch((err) => setError(errorMessage(err)));
  }, [event.id]);

  if (error && !rows) return <Notice tone="crimson">{error}</Notice>;
  if (!rows) return <div className="h-40 animate-pulse rounded-xl bg-fill" />;
  if (rows.length === 0) return <p className="rounded-2xl bg-surface px-6 py-10 text-center text-sm text-secondary">No one was confirmed for this event.</p>;

  const defaultPoints = (o: Outcome) => (o === "ATTENDED" ? event.points : o === "NO_SHOW" ? penalty : 0);
  const update = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const flagged = rows.filter((r) => r.flags.length > 0).length;
  const total = Object.values(drafts).reduce((s, d) => s + d.points, 0);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const outcomes = rows!.map((r) => ({ signupId: r.signupId, ...drafts[r.signupId] }));
      const res = await api<{ saved: number; emailed: number }>(`/committee/events/${event.id}/finalize`, { body: { outcomes } });
      onNotice(`Points saved for ${res.saved} people. ${res.emailed} ${res.emailed === 1 ? "person was" : "people were"} emailed their result.`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-secondary">
        Everyone who was confirmed, with a suggested result from their check-in data: attended = +{event.points}, no-show or late drop = {penalty}, excused = 0.
        {flagged > 0 && <> <span className="font-medium text-amber">{flagged} need a look.</span></>} Saving emails each person their result{event.finalizedAt ? " (only if it changed)" : ""}.
      </p>
      {error && <Notice tone="crimson">{error}</Notice>}

      <Group>
        {rows.map((r) => {
          const d = drafts[r.signupId];
          return (
            <div key={r.signupId} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={r.name} image={r.image} size={28} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-sm text-secondary">{r.netId}</span>
                  </div>
                  <div className="text-sm text-secondary">
                    {r.status === "DROPPED"
                      ? `Dropped late${r.dropReason ? `: “${r.dropReason}”` : ""}`
                      : r.checkedInAt
                        ? `In ${formatTime(new Date(r.checkedInAt))}${r.checkedOutAt ? ` · out ${formatTime(new Date(r.checkedOutAt))} · ${formatDuration(r.minutes)}` : ""}`
                        : "Didn't check in"}
                  </div>
                  {r.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.flags.map((f) => <Pill key={f} tone="amber">{f}</Pill>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`o-${r.signupId}`}>Result for {r.name}</label>
                <Select
                  size="sm"
                  className="w-36"
                  id={`o-${r.signupId}`}
                  value={d.outcome}
                  onChange={(e) => {
                    const outcome = e.target.value as Outcome;
                    update(r.signupId, { outcome, points: defaultPoints(outcome) });
                  }}
                >
                  <option value="ATTENDED">Attended</option>
                  <option value="NO_SHOW">No-show</option>
                  <option value="EXCUSED">Excused</option>
                </Select>
                <label className="sr-only" htmlFor={`p-${r.signupId}`}>Points for {r.name}</label>
                <input id={`p-${r.signupId}`} type="number" min={-50} max={50} className={`${inputBase} h-8 w-20 py-0 text-[13px]`} value={d.points} onChange={(e) => update(r.signupId, { points: Number(e.target.value) })} />
                <label className="sr-only" htmlFor={`n-${r.signupId}`}>Note for {r.name}</label>
                <input id={`n-${r.signupId}`} className={`${inputBase} h-8 w-48 py-0 text-[13px]`} placeholder="Note (optional)" maxLength={300} value={d.note} onChange={(e) => update(r.signupId, { note: e.target.value })} />
              </div>
            </div>
          );
        })}
      </Group>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={busy} onClick={save}>{busy ? "Saving…" : event.finalizedAt ? "Save changes" : "Save points & email results"}</Button>
        <span className="text-sm text-secondary tabular-nums">{total >= 0 ? "+" : ""}{total} points total across {rows.length} people</span>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Group, inputClass, Notice, Panel } from "@/components/ui";
import { formatDue, sortCheckpoints, utcToDueDate } from "@/lib/checkpoints";
import { api, errorMessage } from "@/lib/api-client";

type Term = {
  id: string;
  name: string;
  isCurrent: boolean;
  defaultEventPoints: number;
  noShowPenalty: number;
  lateDropHours: number;
  _count: { candidates: number; events: number };
  checkpoints: { id: string; name: string; points: number; dueAt: string | null }[];
};

export function TermsManager({ terms, isChair }: { terms: Term[]; isChair: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(suggestTermName());
  const [editing, setEditing] = useState<{ termId: string; what: "rules" | "checkpoints" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-headline font-semibold">Terms and points rules</h2>
      {error && <Notice tone="crimson">{error}</Notice>}
      {terms.length > 0 && (
        <Group>
          {terms.map((t) => (
            <div key={t.id} className="space-y-3 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-medium">{t.name}</span>
                  <div className="text-footnote text-secondary">
                    {t.defaultEventPoints} per event · no-show {t.noShowPenalty} · late drop under {t.lateDropHours}h
                  </div>
                  <div className="text-footnote text-secondary">
                    {t.checkpoints.length === 0
                      ? "No checkpoints"
                      : sortCheckpoints(t.checkpoints.map((c) => ({ ...c, dueAt: c.dueAt ? new Date(c.dueAt) : null })))
                          .map((c) => `${c.name} ${c.points} (${formatDue(c)})`)
                          .join(" · ")}
                  </div>
                  <div className="text-footnote text-secondary">{t._count.events} events · {t._count.candidates} candidates</div>
                </div>
                {isChair && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ termId: t.id, what: "checkpoints" })}>Checkpoints</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ termId: t.id, what: "rules" })}>Edit rules</Button>
                    {!t.isCurrent && (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api(`/committee/terms/${t.id}`, { method: "PATCH", body: { makeCurrent: true } }))}>
                        Make current
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {editing?.termId === t.id && editing.what === "checkpoints" && (
                <CheckpointsEditor term={t} onClose={() => setEditing(null)} />
              )}
              {editing?.termId === t.id && editing.what === "rules" && (
                <RulesForm
                  term={t}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={async (body) => {
                    if (await run(() => api(`/committee/terms/${t.id}`, { method: "PATCH", body }))) setEditing(null);
                  }}
                />
              )}
            </div>
          ))}
        </Group>
      )}
      {isChair ? (
        <Panel className="">
          <form
            className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api("/committee/terms", { body: { name, makeCurrent: true } }));
            }}
          >
            <Field label={terms.length ? "Start a new term" : "Create the current term"} htmlFor="term-name">
              <input id="term-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button type="submit" variant={terms.length === 0 ? "primary" : "secondary"} disabled={busy || !name.trim()}>Create term</Button>
          </form>
        </Panel>
      ) : (
        terms.length === 0 && <p className="text-footnote text-secondary">Ask a chair to create the current term.</p>
      )}
    </section>
  );
}

function RulesForm({
  term,
  busy,
  onSave,
  onCancel,
}: {
  term: Term;
  busy: boolean;
  onSave: (body: { defaultEventPoints: number; noShowPenalty: number; lateDropHours: number }) => void;
  onCancel: () => void;
}) {
  const [defaultEventPoints, setDefaultEventPoints] = useState(term.defaultEventPoints);
  const [noShowPenalty, setNoShowPenalty] = useState(term.noShowPenalty);
  const [lateDropHours, setLateDropHours] = useState(term.lateDropHours);
  const id = (k: string) => `${term.id}-${k}`;

  return (
    <form
      className="space-y-4 rounded-xl bg-fill/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ defaultEventPoints, noShowPenalty, lateDropHours });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Points per event" htmlFor={id("pts")}>
          <input id={id("pts")} type="number" min={0} max={50} required className={inputClass} value={defaultEventPoints} onChange={(e) => setDefaultEventPoints(Number(e.target.value))} />
        </Field>
        <Field label="No-show penalty" htmlFor={id("pen")}>
          <input id={id("pen")} type="number" min={-50} max={0} required className={inputClass} value={noShowPenalty} onChange={(e) => setNoShowPenalty(Number(e.target.value))} />
        </Field>
        <Field label="Late drop within (hours)" htmlFor={id("late")}>
          <input id={id("late")} type="number" min={0} max={336} required className={inputClass} value={lateDropHours} onChange={(e) => setLateDropHours(Number(e.target.value))} />
        </Field>
      </div>
      <p className="text-footnote text-secondary">Past points stay as they are.</p>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>Save rules</Button>
        <Button variant="plain" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}

/**
 * A term's checkpoints: each a name, the total points it takes, and the day
 * it falls due (left empty, it falls due at the end of the semester).
 */
function CheckpointsEditor({ term, onClose }: { term: Term; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = sortCheckpoints(term.checkpoints.map((c) => ({ ...c, dueAt: c.dueAt ? new Date(c.dueAt) : null })));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reveal space-y-4 rounded-xl bg-fill/60 p-4">
      {error && <Notice tone="crimson">{error}</Notice>}
      {rows.map((c) => (
        <CheckpointRow
          key={c.id}
          initial={{ name: c.name, points: String(c.points), dueDate: c.dueAt ? utcToDueDate(c.dueAt) : "" }}
          busy={busy}
          submitLabel="Save"
          onSubmit={(v) => run(() => api(`/committee/checkpoints/${c.id}`, { method: "PATCH", body: v }))}
          onRemove={() => run(() => api(`/committee/checkpoints/${c.id}`, { method: "DELETE" }))}
        />
      ))}
      <CheckpointRow
        key={rows.length}
        initial={{ name: "", points: "", dueDate: "" }}
        busy={busy}
        submitLabel="Add checkpoint"
        onSubmit={(v) => run(() => api(`/committee/terms/${term.id}/checkpoints`, { body: v }))}
      />
      <p className="text-footnote text-secondary">Leave the date empty for an end-of-semester checkpoint.</p>
      <Button variant="secondary" onClick={onClose} disabled={busy}>Done</Button>
    </div>
  );
}

function CheckpointRow({
  initial,
  busy,
  submitLabel,
  onSubmit,
  onRemove,
}: {
  initial: { name: string; points: string; dueDate: string };
  busy: boolean;
  submitLabel: string;
  onSubmit: (v: { name: string; points: number; dueDate: string | null }) => Promise<boolean>;
  onRemove?: () => void;
}) {
  const [v, setV] = useState(initial);
  const changed = v.name !== initial.name || v.points !== initial.points || v.dueDate !== initial.dueDate;
  const valid = v.name.trim().length >= 2 && v.points !== "" && Number(v.points) >= 0;
  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_5.5rem_10rem_auto] sm:items-center sm:gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await onSubmit({ name: v.name.trim(), points: Number(v.points), dueDate: v.dueDate || null });
        if (ok && !onRemove) setV(initial);
      }}
    >
      <input aria-label="Checkpoint name" className={inputClass} placeholder="Checkpoint name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <input aria-label="Points" type="number" min={0} max={500} className={inputClass} placeholder="Points" value={v.points} onChange={(e) => setV({ ...v, points: e.target.value })} />
      <input aria-label="Due date (empty for end of semester)" type="date" className={inputClass} value={v.dueDate} onChange={(e) => setV({ ...v, dueDate: e.target.value })} />
      <div className="flex gap-4">
        <Button type="submit" variant="secondary" disabled={busy || !valid || (!!onRemove && !changed)}>{submitLabel}</Button>
        {onRemove && <Button variant="destructive" disabled={busy} onClick={onRemove}>Remove</Button>}
      </div>
    </form>
  );
}

function suggestTermName() {
  const now = new Date();
  const month = now.getMonth();
  const season = month <= 4 ? "Spring" : month <= 7 ? "Summer" : "Fall";
  return `${season} ${now.getFullYear()}`;
}

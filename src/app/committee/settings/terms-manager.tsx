"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Group, inputClass, Notice, Panel, Pill } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";

type Term = {
  id: string;
  name: string;
  isCurrent: boolean;
  requiredPoints: number | null;
  defaultEventPoints: number;
  noShowPenalty: number;
  lateDropHours: number;
  _count: { candidates: number; events: number };
};

export function TermsManager({ terms, isChair }: { terms: Term[]; isChair: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(suggestTermName());
  const [required, setRequired] = useState<string>("");
  const [editing, setEditing] = useState<string | null>(null);
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
      <h2 className="text-[17px] font-semibold">Terms and points rules</h2>
      <p className="text-sm text-secondary">
        Events, the candidate roster and points belong to a term. Each term keeps its own points rules, so changing them next semester never rewrites past results. A new term starts with the current term&apos;s rules.
      </p>
      {error && <Notice tone="crimson">{error}</Notice>}
      {terms.length > 0 && (
        <Group>
          {terms.map((t) => (
            <div key={t.id} className="space-y-3 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    {t.isCurrent && <Pill tone="green">Current</Pill>}
                  </div>
                  <div className="text-sm text-secondary">
                    {t.requiredPoints != null ? `${t.requiredPoints} points required` : "No requirement set"} · {t.defaultEventPoints} per event · no-show {t.noShowPenalty} · late drop under {t.lateDropHours}h
                  </div>
                  <div className="text-sm text-secondary">{t._count.events} events · {t._count.candidates} candidates</div>
                </div>
                {isChair && (
                  <div className="flex gap-2">
                    {editing !== t.id && <Button size="sm" variant="secondary" onClick={() => setEditing(t.id)}>Edit rules</Button>}
                    {!t.isCurrent && (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api(`/committee/terms/${t.id}`, { method: "PATCH", body: { makeCurrent: true } }))}>
                        Make current
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {editing === t.id && (
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
            className="grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api("/committee/terms", { body: { name, requiredPoints: required === "" ? null : Number(required), makeCurrent: true } }));
            }}
          >
            <Field label={terms.length ? "Start a new term" : "Create the current term"} htmlFor="term-name">
              <input id="term-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Points required" htmlFor="term-required">
              <input id="term-required" type="number" min={0} max={500} className={inputClass} value={required} onChange={(e) => setRequired(e.target.value)} placeholder="e.g. 12" />
            </Field>
            <Button type="submit" variant={terms.length === 0 ? "primary" : "secondary"} disabled={busy || !name.trim()}>Create term</Button>
          </form>
        </Panel>
      ) : (
        terms.length === 0 && <p className="text-sm text-secondary">Ask a chair to create the current term.</p>
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
  onSave: (body: { requiredPoints: number | null; defaultEventPoints: number; noShowPenalty: number; lateDropHours: number }) => void;
  onCancel: () => void;
}) {
  const [requiredPoints, setRequiredPoints] = useState(term.requiredPoints?.toString() ?? "");
  const [defaultEventPoints, setDefaultEventPoints] = useState(term.defaultEventPoints);
  const [noShowPenalty, setNoShowPenalty] = useState(term.noShowPenalty);
  const [lateDropHours, setLateDropHours] = useState(term.lateDropHours);
  const id = (k: string) => `${term.id}-${k}`;

  return (
    <form
      className="space-y-4 rounded-xl bg-fill/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ requiredPoints: requiredPoints === "" ? null : Number(requiredPoints), defaultEventPoints, noShowPenalty, lateDropHours });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Points required this term" htmlFor={id("req")} hint="Leave empty for no requirement.">
          <input id={id("req")} type="number" min={0} max={500} className={inputClass} value={requiredPoints} onChange={(e) => setRequiredPoints(e.target.value)} />
        </Field>
        <Field label="Default points per event" htmlFor={id("pts")} hint="Pre-filled on new events; each event can differ.">
          <input id={id("pts")} type="number" min={0} max={50} required className={inputClass} value={defaultEventPoints} onChange={(e) => setDefaultEventPoints(Number(e.target.value))} />
        </Field>
        <Field label="No-show penalty" htmlFor={id("pen")} hint="Suggested for no-shows and late drops when confirming points.">
          <input id={id("pen")} type="number" min={-50} max={0} required className={inputClass} value={noShowPenalty} onChange={(e) => setNoShowPenalty(Number(e.target.value))} />
        </Field>
        <Field label="Late drop cutoff (hours before start)" htmlFor={id("late")} hint="Drops after this are flagged and don't auto-promote the waitlist.">
          <input id={id("late")} type="number" min={0} max={336} required className={inputClass} value={lateDropHours} onChange={(e) => setLateDropHours(Number(e.target.value))} />
        </Field>
      </div>
      <p className="text-sm text-secondary">Changes apply going forward. Points already confirmed for past events stay as they are.</p>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>Save rules</Button>
        <Button variant="plain" onClick={onCancel} disabled={busy}>Cancel</Button>
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

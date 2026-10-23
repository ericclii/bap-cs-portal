"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Button, cx, Group, Notice, Pill } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { signupWindowState } from "@/lib/event-window";
import { formatDateTime } from "@/lib/time";
import type { ConsoleEvent } from "./types";

type Ranked = {
  id: string;
  netId: string;
  name: string;
  image: string | null;
  isCandidate: boolean;
  points: number;
  signedUpAt: string;
  note: string | null;
  status: "APPLIED" | "SELECTED" | "WAITLISTED";
  waitlistPos: number | null;
  conflict: string | null;
  suggested: "SELECTED" | "WAITLISTED";
};

export function SelectionTab({ event, onNotice }: { event: ConsoleEvent; onNotice: (m: string) => void }) {
  const router = useRouter();
  const [rows, setRows] = useState<Map<string, Ranked> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [waitlist, setWaitlist] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = Boolean(event.selectionPublishedAt);
  const signupsOpen = signupWindowState({ signupOpensAt: new Date(event.signupOpensAt), signupClosesAt: new Date(event.signupClosesAt) }) === "open";

  useEffect(() => {
    api<{ ranked: Ranked[] }>(`/committee/events/${event.id}/selection`)
      .then(({ ranked }) => {
        setRows(new Map(ranked.map((r) => [r.id, r])));
        if (published) {
          setSelected(ranked.filter((r) => r.status === "SELECTED").map((r) => r.id));
          setWaitlist(
            ranked
              .filter((r) => r.status !== "SELECTED")
              .sort((a, b) => (a.waitlistPos ?? 1e9) - (b.waitlistPos ?? 1e9))
              .map((r) => r.id),
          );
        } else {
          setSelected(ranked.filter((r) => r.suggested === "SELECTED").map((r) => r.id));
          setWaitlist(ranked.filter((r) => r.suggested === "WAITLISTED").map((r) => r.id));
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [event.id, published]);

  if (error && !rows) return <Notice tone="crimson">{error}</Notice>;
  if (!rows) return <div className="h-40 animate-pulse rounded-xl bg-fill" />;
  if (rows.size === 0) {
    return <p className="rounded-2xl bg-surface px-6 py-10 text-center text-sm text-secondary">No one has signed up yet.</p>;
  }

  function move(id: string, to: "selected" | "waitlist") {
    if (to === "selected") {
      setWaitlist((w) => w.filter((x) => x !== id));
      setSelected((s) => [...s, id]);
    } else {
      setSelected((s) => s.filter((x) => x !== id));
      setWaitlist((w) => [id, ...w]);
    }
  }

  function shift(list: "selected" | "waitlist", id: string, delta: -1 | 1) {
    const set = list === "selected" ? setSelected : setWaitlist;
    set((arr) => {
      const i = arr.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ selected: number; waitlisted: number; emailed: number }>(`/committee/events/${event.id}/selection`, { body: { selected, waitlist } });
      onNotice(`${published ? "Updated" : "Published"}: ${res.selected} confirmed, ${res.waitlisted} waitlisted. ${res.emailed} ${res.emailed === 1 ? "email" : "emails"} sent.`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const over = selected.length > event.capacity;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-secondary">
        Suggested order: candidates first, then fewest points, then earliest sign-up. Anyone already going to another event that day is at the end.
        {signupsOpen && !published && ` Sign-ups are still open until ${formatDateTime(new Date(event.signupClosesAt))}; later sign-ups join the waitlist.`}
      </p>
      {error && <Notice tone="crimson">{error}</Notice>}

      <List
        title={`Confirmed ${selected.length} / ${event.capacity}`}
        warn={over ? `${selected.length - event.capacity} over the limit` : undefined}
        empty="No one yet. Use Confirm on the waitlist below."
        ids={selected}
        rows={rows}
        actionLabel="Waitlist"
        onAction={(id) => move(id, "waitlist")}
        onShift={(id, d) => shift("selected", id, d)}
      />
      <List
        title={`Waitlist ${waitlist.length}`}
        ids={waitlist}
        rows={rows}
        numbered
        empty="No one on the waitlist."
        actionLabel="Confirm"
        onAction={(id) => move(id, "selected")}
        onShift={(id, d) => shift("waitlist", id, d)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={busy || over} onClick={publish}>
          {busy ? "Sending…" : published ? "Save changes & email anyone affected" : `Confirm & email ${selected.length + waitlist.length} people`}
        </Button>
        <span className="text-sm text-secondary">Everyone gets an email with their result.</span>
      </div>
    </div>
  );
}

function List({
  title,
  warn,
  empty,
  ids,
  rows,
  numbered,
  actionLabel,
  onAction,
  onShift,
}: {
  title: string;
  warn?: string;
  empty: string;
  ids: string[];
  rows: Map<string, Ranked>;
  numbered?: boolean;
  actionLabel: string;
  onAction: (id: string) => void;
  onShift: (id: string, delta: -1 | 1) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[17px] font-semibold tabular-nums">{title}</h2>
        {warn && <Pill tone="amber">{warn}</Pill>}
      </div>
      <Group>
        {ids.length === 0 && <p className="px-4 py-6 text-center text-sm text-secondary">{empty}</p>}
        {ids.map((id, i) => {
          const r = rows.get(id)!;
          return (
            <div key={id} className="flex flex-col gap-3 px-4 py-2.5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {numbered && <span className="w-6 shrink-0 text-right text-sm text-secondary tabular-nums">{i + 1}</span>}
                <Avatar name={r.name} image={r.image} size={28} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-sm text-secondary">{r.netId}</span>
                    {!r.isCandidate && <Pill>Not a candidate</Pill>}
                    {r.conflict && <Pill tone="amber">Also going: {r.conflict}</Pill>}
                  </div>
                  <div className="text-sm text-secondary">
                    {r.points} pts · signed up {formatDateTime(new Date(r.signedUpAt))}
                    {r.note && ` · “${r.note}”`}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton label={`Move ${r.name} up`} disabled={i === 0} onClick={() => onShift(id, -1)} d="M5 12l5-5 5 5" />
                <IconButton label={`Move ${r.name} down`} disabled={i === ids.length - 1} onClick={() => onShift(id, 1)} d="M5 8l5 5 5-5" />
                <Button size="sm" variant="secondary" onClick={() => onAction(id)}>{actionLabel}</Button>
              </div>
            </div>
          );
        })}
      </Group>
    </section>
  );
}

function IconButton({ label, d, onClick, disabled }: { label: string; d: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx("grid h-8 w-8 place-items-center rounded-lg text-secondary hover:bg-fill hover:text-text disabled:opacity-30")}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </button>
  );
}

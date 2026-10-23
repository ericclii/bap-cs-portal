"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, cx, Group, Notice, Pill, inputBase } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { attendedMinutes, checkinWindowState, formatDuration } from "@/lib/event-window";
import { formatDateTime, formatTime } from "@/lib/time";
import type { ConsoleEvent, Person } from "./types";

const POLL_MS = 5000;

export function PeopleTab({ event, initialPeople, onNotice }: { event: ConsoleEvent; initialPeople: Person[]; onNotice: (m: string) => void }) {
  const [people, setPeople] = useState(initialPeople);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addNetId, setAddNetId] = useState("");
  const timing = { startsAt: new Date(event.startsAt), endsAt: new Date(event.endsAt), checkinOpensMinBefore: event.checkinOpensMinBefore, checkinClosesMinAfter: event.checkinClosesMinAfter };
  const live = checkinWindowState(timing) !== "before" && new Date() < new Date(new Date(event.endsAt).getTime() + 3 * 3600_000);

  const refresh = useCallback(async () => {
    try {
      const { people } = await api<{ people: Person[] }>(`/committee/events/${event.id}/people`);
      setPeople(people);
    } catch {
      // The next poll retries.
    }
  }, [event.id]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [live, refresh]);

  async function act(id: string, fn: () => Promise<unknown>, success?: string) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      if (success) onNotice(success);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const groups = useMemo(() => {
    const by = (s: Person["status"]) => people.filter((p) => p.status === s);
    return {
      confirmed: by("SELECTED").sort((a, b) => a.name.localeCompare(b.name)),
      waitlist: by("WAITLISTED").sort((a, b) => (a.waitlistPos ?? 0) - (b.waitlistPos ?? 0)),
      applied: by("APPLIED").sort((a, b) => a.signedUpAt.localeCompare(b.signedUpAt)),
      out: people.filter((p) => p.status === "DROPPED" || p.status === "REMOVED"),
    };
  }, [people]);

  const checkedIn = groups.confirmed.filter((p) => p.attendance).length;
  const onSite = groups.confirmed.filter((p) => p.attendance && !p.attendance.checkedOutAt).length;

  return (
    <div className="space-y-8">
      {error && <Notice tone="crimson">{error}</Notice>}

      <p className="text-footnote text-secondary">
        <span className="font-medium text-text">{groups.confirmed.length}</span> of {event.capacity} confirmed ·{" "}
        <span className="font-medium text-text">{checkedIn}</span> checked in · {onSite} on site now · {groups.waitlist.length} waitlisted
        {groups.applied.length > 0 && ` · ${groups.applied.length} awaiting selection`}
      </p>

      <Section title="Confirmed" count={groups.confirmed.length} action={
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const netId = addNetId.trim();
            act("add", () => api(`/committee/events/${event.id}/people`, { body: { netId } }), `Added ${netId} as confirmed.`).then(() => setAddNetId(""));
          }}
        >
          <label htmlFor="add-netid" className="sr-only">NetID to add</label>
          <input id="add-netid" className={`${inputBase} h-8 w-36 py-1`} placeholder="Add by NetID" value={addNetId} onChange={(e) => setAddNetId(e.target.value)} autoCapitalize="none" />
          <Button type="submit" size="sm" variant="secondary" disabled={!addNetId.trim() || busyId !== null}>Add</Button>
        </form>
      }>
        {groups.confirmed.length === 0 ? (
          <Empty>{event.selectionPublishedAt ? "No one is confirmed." : "No one is confirmed yet. Use “Pick who goes” once sign-ups close."}</Empty>
        ) : (
          groups.confirmed.map((p) => (
            <Row key={p.id} person={p} busy={busyId === p.id} detail={<AttendanceDetail person={p} event={event} />}>
              {!p.attendance && (
                <>
                  <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}/checkin`, { body: {} }))}>Check in</Button>
                  <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}`, { method: "PATCH", body: { status: "WAITLISTED" } }))}>To waitlist</Button>
                  <ConfirmButton confirmLabel="Remove" disabled={busyId !== null} onConfirm={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}`, { method: "PATCH", body: { status: "REMOVED" } }))}>Remove</ConfirmButton>
                </>
              )}
              {p.attendance && !p.attendance.checkedOutAt && (
                <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}/checkout`, { body: {} }))}>Check out</Button>
              )}
              {p.attendance?.checkedOutAt && (
                <Button size="sm" variant="plain" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}/undo-checkout`, { body: {} }))}>Undo check-out</Button>
              )}
              {p.attendance && !p.attendance.checkedOutAt && (
                <ConfirmButton confirmLabel="Undo check-in" disabled={busyId !== null} onConfirm={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}/undo-checkin`, { body: {} }))}>Undo check-in</ConfirmButton>
              )}
            </Row>
          ))
        )}
      </Section>

      {groups.waitlist.length > 0 && (
        <Section title="Waitlist" count={groups.waitlist.length}>
          {groups.waitlist.map((p) => (
            <Row key={p.id} person={p} busy={busyId === p.id} detail={`#${p.waitlistPos} · signed up ${formatDateTime(new Date(p.signedUpAt))}`}>
              <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}`, { method: "PATCH", body: { status: "SELECTED" } }), `${p.name} is confirmed and was emailed.`)}>Confirm</Button>
            </Row>
          ))}
        </Section>
      )}

      {groups.applied.length > 0 && (
        <Section title="Signed up, not yet picked" count={groups.applied.length}>
          {groups.applied.map((p) => (
            <Row key={p.id} person={p} busy={false} detail={`Signed up ${formatDateTime(new Date(p.signedUpAt))}${p.note ? ` · “${p.note}”` : ""}`} />
          ))}
        </Section>
      )}

      {groups.out.length > 0 && (
        <Section title="Dropped or removed" count={groups.out.length}>
          {groups.out.map((p) => (
            <Row
              key={p.id}
              person={p}
              busy={busyId === p.id}
              detail={
                p.status === "REMOVED"
                  ? "Removed by committee"
                  : `${p.wasSelected ? "Dropped" : "Left waitlist"} ${p.droppedAt ? formatDateTime(new Date(p.droppedAt)) : ""}${p.dropReason ? ` · “${p.dropReason}”` : ""}`
              }
              badge={p.lateDrop ? <Pill tone="amber">Late drop</Pill> : undefined}
            >
              <Button size="sm" variant="plain" disabled={busyId !== null} onClick={() => act(p.id, () => api(`/committee/events/${event.id}/people/${p.id}`, { method: "PATCH", body: { status: "SELECTED" } }))}>Re-confirm</Button>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function AttendanceDetail({ person: p, event }: { person: Person; event: ConsoleEvent }) {
  const a = p.attendance;
  const open = p.reviews.filter((r) => r.status === "OPEN");
  const parts: React.ReactNode[] = [];
  if (!a) parts.push(new Date(event.startsAt) < new Date() ? "Not checked in" : "Confirmed");
  else {
    parts.push(`In ${formatTime(new Date(a.checkedInAt))}${a.checkInMethod === "COMMITTEE" ? " (committee)" : a.checkInDistanceM != null ? ` · ${a.checkInDistanceM} m` : ""}${a.checkInViaQr ? " · QR" : ""}`);
    if (a.checkedOutAt) parts.push(`Out ${formatTime(new Date(a.checkedOutAt))} · ${formatDuration(attendedMinutes(new Date(a.checkedInAt), new Date(a.checkedOutAt)))}`);
    else if (a.lastSeenAt) parts.push(a.lastSeenInside ? `Seen on site ${formatTime(new Date(a.lastSeenAt))}` : `Left area ${formatTime(new Date(a.leftAreaAt ?? a.lastSeenAt))}`);
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>{parts.join(" · ")}</span>
      {a?.earlyCheckout && <span className="w-full text-amber">Left early: “{a.earlyReason}”</span>}
      {a?.leftAreaAt && !a.checkedOutAt && <Pill tone="amber">Phone left the area</Pill>}
      {open.length > 0 && <Pill tone="amber">{open.length} review open</Pill>}
      {p.outcome && <Pill tone={p.outcome === "ATTENDED" ? "green" : p.outcome === "EXCUSED" ? "neutral" : "amber"}>{p.points! > 0 ? "+" : ""}{p.points} pts</Pill>}
    </span>
  );
}

function Section({ title, count, action, children }: { title: string; count: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-headline font-semibold">
          {title} <span className="text-secondary tabular-nums">{count}</span>
        </h2>
        {action}
      </div>
      <Group>{children}</Group>
    </section>
  );
}

function Row({ person: p, detail, children, busy, badge }: { person: Person; detail: React.ReactNode; children?: React.ReactNode; busy: boolean; badge?: React.ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between", busy && "opacity-60")}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={p.name} image={p.image} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{p.name}</span>
            <span className="text-footnote text-secondary">{p.netId}</span>
            {!p.isCandidate && <Pill>Not a candidate</Pill>}
            {badge}
          </div>
          <div className="text-footnote text-secondary">{detail}</div>
        </div>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2 pl-11 md:pl-0">{children}</div>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-footnote text-secondary">{children}</p>;
}

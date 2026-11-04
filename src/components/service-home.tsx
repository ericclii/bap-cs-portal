import { CalendarPlus, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EventPass } from "@/components/event-pass";
import { Mark } from "@/components/app-shell";
import { MilestoneGrid, signed } from "@/components/stamp";
import type { Checkpoint } from "@/lib/checkpoints";
import { DateTile, Empty, Group, LinkButton, Pill, Row, Section } from "@/components/ui";
import { attendedMinutes, checkinWindowState, formatDuration, signupWindowState } from "@/lib/event-window";
import { formatDate, formatDateTime, formatEventRange, formatTime, relativeDay } from "@/lib/time";
import { getCurrentUser } from "@/server/session";
import { listEventsForStudent } from "@/server/services/events";
import { listCheckpoints } from "@/server/services/checkpoints";
import { personHistory, totalPoints } from "@/server/services/points";
import { isCandidate } from "@/server/services/roster";
import { getCurrentTerm } from "@/server/services/terms";

type Item = Awaited<ReturnType<typeof listEventsForStudent>>[number];

/** A student's own standing and events. Home for students; "My service" for the committee. */
export async function ServiceHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const term = await getCurrentTerm();

  if (!term) {
    return (
      <AppShell user={user}>
        <Empty title="Not set up for this semester yet">
          {user.role ? (
            <>
              Create the current term in <Link className="font-semibold text-crimson" href="/committee/settings">Committee → Manage</Link>.
            </>
          ) : (
            "Check back once the CS committee posts this semester's events."
          )}
        </Empty>
      </AppShell>
    );
  }

  const [items, points, candidate, history, checkpoints] = await Promise.all([
    listEventsForStudent(user.id),
    totalPoints(term.id, user.netId),
    isCandidate(term.id, user.netId),
    personHistory(term.id, user.netId),
    listCheckpoints(term.id),
  ]);
  const now = new Date();
  const active = items.filter((i) => !i.event.canceledAt);
  const mine = active.filter((i) => i.mine && ["APPLIED", "SELECTED", "WAITLISTED"].includes(i.mine.status) && i.event.endsAt >= now);
  const confirmed = mine.filter((i) => i.mine!.status === "SELECTED");
  const next = confirmed[0] ?? null;
  const rest = mine.filter((i) => i !== next);
  const open = active.filter((i) => !i.mine && i.event.startsAt > now && signupWindowState(i.event, now) === "open");
  const soon = active.filter((i) => !i.mine && signupWindowState(i.event, now) === "before");
  const pending = history.signups.filter((s) => s.status === "SELECTED" && !s.outcome && s.attendance);
  // Points have no cap; the seal appears once every checkpoint is reached.
  const met = checkpoints.length > 0 && checkpoints.every((c) => points >= c.points);
  const reachedOn = milestoneDates(history, checkpoints);
  // Time actually given, from completed check-ins this term.
  const minutesServed = history.signups.reduce((sum, s) => {
    const a = s.attendance;
    if (!a?.checkedOutAt || s.event.canceledAt || s.outcome === "NO_SHOW") return sum;
    return sum + (attendedMinutes(a.checkedInAt, a.checkedOutAt) ?? 0);
  }, 0);

  return (
    <AppShell user={user}>
      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-x-10 lg:space-y-0">
        <div className="space-y-8 lg:sticky lg:top-20">
          <section aria-labelledby="standing">
            <div className="flex items-start justify-between gap-4">
              <h1 id="standing" className="flex items-baseline gap-2.5">
                <span className="text-figure">{points}</span>
                <span className="text-headline font-semibold text-secondary">
                  {points === 1 ? "point" : "points"}
                </span>
              </h1>
              {met && <Mark size={56} />}
            </div>
            <StandingNote>
              {[
                candidate ? null : "Not on the candidate list",
                met ? `Every checkpoint reached${minutesServed > 0 ? ` · ${formatDuration(minutesServed)} of service` : ""}` : null,
                pending.length > 0 ? `${pending.length} ${pending.length === 1 ? "event" : "events"} awaiting points` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </StandingNote>
            {checkpoints.length > 0 && <div className="mt-5">
              <MilestoneGrid points={points} checkpoints={checkpoints} reachedOn={reachedOn} />
            </div>}
          </section>

          {next && <NextPass item={next} now={now} />}
        </div>

        <div className="space-y-8">

          {rest.length > 0 && (
            <Section title="Your events">
              <Group>
                {rest.map((i) => (
                  <Row
                    key={i.event.id}
                    href={`/events/${i.event.slug}`}
                    leading={<DateTile date={i.event.startsAt} size="sm" />}
                    title={i.event.title}
                    subtitle={formatEventRange(i.event.startsAt, i.event.endsAt)}
                    trailing={<MyStatus item={i} />}
                    stackTrailing
                    chevron
                  />
                ))}
              </Group>
            </Section>
          )}

          <Section
            title="Open for sign-up"
            footer={open.length > 0 && soon.length > 0 ? `Opening soon: ${soon.map((i) => i.event.title).join(", ")}` : undefined}
          >
            {open.length === 0 ? (
              <Empty icon={<CalendarPlus className="h-7 w-7" aria-hidden />} title="Nothing open right now">
                {soon.length > 0
                  ? `${soon.length} ${soon.length === 1 ? "event opens" : "events open"} soon. Next: ${soon[0].event.title}, ${formatDateTime(soon[0].event.signupOpensAt)}.`
                  : "New events are posted each week."}
              </Empty>
            ) : (
              <Group>
                {open.map((i) => (
                  <Row
                    key={i.event.id}
                    href={`/events/${i.event.slug}`}
                    leading={<DateTile date={i.event.startsAt} size="sm" />}
                    title={i.event.title}
                    subtitle={`${i.event.points} pts · closes ${relativeDay(i.event.signupClosesAt, now)}`}
                    chevron
                  />
                ))}
              </Group>
            )}
          </Section>

          <History history={history} />
        </div>
      </div>
    </AppShell>
  );
}

function NextPass({ item, now }: { item: Item; now: Date }) {
  const e = item.event;
  const a = item.mine?.attendance;
  const window = checkinWindowState(e, now);
  const href = `/events/${e.slug}`;
  let status: React.ReactNode;
  let action: React.ReactNode;
  if (a?.checkedOutAt) {
    status = <StatusLine tone="green" label="Checked out" detail={`In ${formatTime(a.checkedInAt)} · out ${formatTime(a.checkedOutAt)}`} />;
  } else if (a) {
    status = <StatusLine tone="green" label="Checked in" detail={`Since ${formatTime(a.checkedInAt)}`} />;
    action = <LinkButton href={href} size="lg" variant="secondary" className="w-full">Open to check out</LinkButton>;
  } else if (window === "open") {
    status = <StatusLine tone="crimson" label="Check-in is open" detail="Tap when you arrive" />;
    action = <LinkButton href={href} size="lg" className="w-full">Check in</LinkButton>;
  } else {
    status = <StatusLine tone="green" label="You're confirmed" detail={`Check-in opens ${formatDate(new Date(e.startsAt.getTime() - e.checkinOpensMinBefore * 60_000))}, ${formatTime(new Date(e.startsAt.getTime() - e.checkinOpensMinBefore * 60_000))}`} />;
  }
  return (
    <section aria-label="Your next event">
      <h2 className="mb-3 text-title">Next</h2>
      <EventPass event={e} href={href} status={status} action={action} accent titleAs="h3" checkedInAt={a?.checkedInAt ?? null} />
    </section>
  );
}

function StandingNote({ children }: { children: React.ReactNode }) {
  return children ? <p className="mt-2 text-body text-secondary">{children}</p> : null;
}

/** When the running total first reached each checkpoint, from points awarded in date order. */
function milestoneDates(history: Awaited<ReturnType<typeof personHistory>>, checkpoints: Checkpoint[]): (Date | null)[] {
  const awards = [
    ...history.signups.filter((s) => s.outcome && !s.event.canceledAt).map((s) => ({ date: s.event.startsAt, points: s.points ?? 0 })),
    ...history.adjustments.map((a) => ({ date: a.createdAt, points: a.points })),
  ].sort((x, y) => x.date.getTime() - y.date.getTime());
  const reached: (Date | null)[] = checkpoints.map(() => null);
  let total = 0;
  for (const a of awards) {
    total += a.points;
    checkpoints.forEach((m, i) => {
      if (!reached[i] && total >= m.points) reached[i] = a.date;
    });
  }
  return reached;
}

function StatusLine({ tone, label, detail }: { tone: "green" | "crimson"; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`flex items-center gap-2 text-body font-semibold ${tone === "green" ? "text-green" : "text-crimson"}`}>
        {label}
      </span>
      <span className="text-footnote text-secondary">{detail}</span>
    </div>
  );
}

function MyStatus({ item }: { item: Item }) {
  const s = item.mine!;
  if (s.status === "SELECTED") return <Pill tone="green">Confirmed</Pill>;
  if (s.status === "WAITLISTED") return <Pill tone="amber">Waitlist #{s.waitlistPos}</Pill>;
  return <Pill tone="blue">Signed up</Pill>;
}

function History({ history }: { history: Awaited<ReturnType<typeof personHistory>> }) {
  const past = history.signups.filter((s) => s.outcome || (s.wasSelected && s.event.endsAt < new Date()));
  const rows = [
    ...past.map((s) => ({
      key: s.id,
      date: s.event.startsAt,
      title: s.event.title,
      detail: s.outcome
        ? { ATTENDED: "Attended", NO_SHOW: s.status === "DROPPED" ? "Late drop" : "No-show", EXCUSED: "Excused" }[s.outcome]
        : s.attendance
          ? "Attended"
          : "Not checked in",
      points: s.outcome ? (s.points ?? 0) : null,
    })),
    ...history.adjustments.map((a) => ({ key: a.id, date: a.createdAt, title: a.reason, detail: "Added by the committee", points: a.points })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Section title="History">
      {rows.length === 0 ? (
        <Empty icon={<HistoryIcon className="h-7 w-7" aria-hidden />} title="No points yet">
          Events show up here once the committee awards points.
        </Empty>
      ) : (
        <Group>
          {rows.map((r) => (
            <Row
              key={r.key}
              title={r.title}
              subtitle={`${formatDate(r.date)} · ${r.detail}`}
              trailing={
                <span className={`text-body font-semibold tabular-nums ${r.points == null ? "text-secondary" : r.points > 0 ? "text-text" : r.points < 0 ? "text-amber" : "text-secondary"}`}>
                  {r.points == null ? "Pending" : signed(r.points)}
                </span>
              }
            />
          ))}
        </Group>
      )}
    </Section>
  );
}

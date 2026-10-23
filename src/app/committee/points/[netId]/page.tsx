import type { Metadata } from "next";
import Link from "next/link";
import { BackLink, Group, PageTitle, Pill } from "@/components/ui";
import { attendedMinutes, formatDuration } from "@/lib/event-window";
import { formatDateTime } from "@/lib/time";
import { db } from "@/server/db";
import { personHistory, totalPoints } from "@/server/services/points";
import { isCandidate } from "@/server/services/roster";
import { requireCurrentTerm } from "@/server/services/terms";
import { DeleteAdjustment } from "./delete-adjustment";

export const metadata: Metadata = { title: "Person" };

export default async function PersonPointsPage({ params }: { params: Promise<{ netId: string }> }) {
  const netId = (await params).netId.toLowerCase();
  const term = await requireCurrentTerm();
  const [history, total, candidate, user, rosterEntry] = await Promise.all([
    personHistory(term.id, netId),
    totalPoints(term.id, netId),
    isCandidate(term.id, netId),
    db.user.findUnique({ where: { netId }, select: { name: true } }),
    db.candidate.findFirst({ where: { termId: term.id, netId }, select: { name: true } }),
  ]);
  const name = user?.name ?? rosterEntry?.name ?? netId;

  return (
    <div className="space-y-6">
      <BackLink href="/committee/points">Points</BackLink>
      <PageTitle
        title={name}
        subtitle={<>{netId}@nyu.edu · {candidate ? "Candidate" : "Not a candidate"} · <span className="font-medium text-text">{total}</span>{term.requiredPoints != null && ` of ${term.requiredPoints}`} points in {term.name}{!user && " · hasn't signed in yet"}</>}
      />
      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold">Events</h2>
        <Group>
          {history.signups.length === 0 && <p className="px-4 py-6 text-center text-sm text-secondary">No sign-ups this term.</p>}
          {history.signups.map((s) => (
            <div key={s.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/committee/events/${s.event.id}`} className="font-medium hover:underline">{s.event.title}</Link>
                <div className="text-sm text-secondary">
                  {formatDateTime(s.event.startsAt)} · {s.status.toLowerCase()}
                  {s.attendance && ` · on site ${formatDuration(attendedMinutes(s.attendance.checkedInAt, s.attendance.checkedOutAt))}`}
                  {s.dropReason && ` · “${s.dropReason}”`}
                </div>
              </div>
              {s.outcome ? (
                <Pill tone={s.outcome === "ATTENDED" ? "green" : s.outcome === "EXCUSED" ? "neutral" : "amber"}>
                  {s.outcome === "ATTENDED" ? "Attended" : s.outcome === "EXCUSED" ? "Excused" : "No-show"} · {(s.points ?? 0) > 0 ? "+" : ""}{s.points}
                </Pill>
              ) : s.wasSelected && s.event.endsAt < new Date() ? <Pill tone="amber">Points not awarded</Pill> : null}
            </div>
          ))}
        </Group>
      </section>
      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold">Adjustments</h2>
        <Group>
          {history.adjustments.length === 0 && <p className="px-4 py-6 text-center text-sm text-secondary">None.</p>}
          {history.adjustments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <div className="font-medium">{a.reason}</div>
                <div className="text-sm text-secondary">{formatDateTime(a.createdAt)}{a.createdBy && ` · by ${a.createdBy}`}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold tabular-nums ${a.points > 0 ? "text-green" : "text-amber"}`}>{a.points > 0 ? "+" : ""}{a.points}</span>
                <DeleteAdjustment id={a.id} />
              </div>
            </div>
          ))}
        </Group>
      </section>
    </div>
  );
}

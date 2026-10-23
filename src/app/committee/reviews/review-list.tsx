"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, Empty, Group, inputClass, Notice, Pill } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { formatDuration } from "@/lib/event-window";
import { formatDateTime, formatTime } from "@/lib/time";

type Review = {
  id: string;
  kind: "CHECKIN_LOCATION" | "CHECKOUT_LOCATION" | "EARLY_CHECKOUT";
  message: string | null;
  requestedAt: string;
  distanceM: number | null;
  accuracyM: number | null;
  latitude: number | null;
  longitude: number | null;
  event: { id: string; title: string; startsAt: string; endsAt: string; minMinutes: number; radiusMeters: number };
  signup: {
    netId: string;
    user: { name: string; image: string | null };
    attendance: { checkedInAt: string; checkedOutAt: string | null } | null;
  };
};

const KIND = {
  CHECKIN_LOCATION: { label: "Couldn't check in", approve: "Record check-in" },
  CHECKOUT_LOCATION: { label: "Couldn't check out", approve: "Record check-out" },
  EARLY_CHECKOUT: { label: "Left early", approve: "Approve (full points)" },
} as const;

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function resolve(id: string, decision: "APPROVED" | "DENIED") {
    setBusy(id);
    setError(null);
    try {
      await api(`/committee/reviews/${id}`, { body: { decision, note: notes[id] || null } });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (reviews.length === 0) return <Empty title="Nothing to review" />;

  return (
    <div className="space-y-4">
      {error && <Notice tone="crimson">{error}</Notice>}
      <Group>
        {reviews.map((r) => {
          const a = r.signup.attendance;
          const stayed = a?.checkedOutAt ? Math.round((Date.parse(a.checkedOutAt) - Date.parse(a.checkedInAt)) / 60_000) : null;
          return (
            <div key={r.id} className="space-y-3 px-4 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={r.signup.user.name} image={r.signup.user.image} />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.signup.user.name}</span>
                      <span className="text-sm text-secondary">{r.signup.netId}</span>
                      <Pill tone="amber">{KIND[r.kind].label}</Pill>
                    </div>
                    <div className="text-sm text-secondary">
                      <Link className="underline" href={`/committee/events/${r.event.id}`}>{r.event.title}</Link> · asked {formatDateTime(new Date(r.requestedAt))}
                    </div>
                    {r.message && <p className="max-w-prose text-sm">&ldquo;{r.message}&rdquo;</p>}
                    <p className="text-sm text-secondary">
                      {r.kind === "EARLY_CHECKOUT"
                        ? `Stayed ${formatDuration(stayed)} of the ${formatDuration(r.event.minMinutes)} minimum (in ${formatTime(new Date(a!.checkedInAt))}).`
                        : r.distanceM != null
                          ? `Phone reported ${r.distanceM} m from the venue (±${Math.round(r.accuracyM ?? 0)} m); the fence is ${r.event.radiusMeters} m.`
                          : "No location was shared."}
                      {r.latitude != null && (
                        <>
                          {" "}
                          <a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`}>See on map</a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor={`note-${r.id}`}>Note</label>
                <input id={`note-${r.id}`} className={`${inputClass} sm:max-w-sm`} placeholder="Note (optional, saved with the decision)" value={notes[r.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy !== null} onClick={() => resolve(r.id, "APPROVED")}>{KIND[r.kind].approve}</Button>
                  <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => resolve(r.id, "DENIED")}>Deny</Button>
                </div>
              </div>
            </div>
          );
        })}
      </Group>
    </div>
  );
}

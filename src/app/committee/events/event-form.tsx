"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressField } from "@/components/address-field";
import { DateTimeField } from "@/components/date-time-field";
import { Button, Field, Notice, Panel, Toggle, inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import type { EventInput } from "@/lib/contracts";
import { formatDuration } from "@/lib/event-window";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-fill" />,
});

export type EventFormValues = Omit<EventInput, "latitude" | "longitude"> & {
  latitude: number | null;
  longitude: number | null;
};

/** Datetime-local string in New York time for a Date. */
function nyLocal(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function addDays(local: string, days: number, time?: string) {
  const d = new Date(`${local.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${time ?? local.slice(11)}`;
}

export function defaultEventValues(points = 3): EventFormValues {
  const today = nyLocal(new Date());
  const startsAtLocal = addDays(today, 7, "09:00");
  return {
    title: "",
    partnerOrg: "",
    description: "",
    instructions: "",
    locationName: "",
    address: "",
    latitude: null,
    longitude: null,
    radiusMeters: 150,
    startsAtLocal,
    endsAtLocal: addDays(startsAtLocal, 0, "12:00"),
    capacity: 10,
    points,
    minMinutes: 180,
    signupOpensAtLocal: nyLocal(new Date()).slice(0, 14) + "00",
    signupClosesAtLocal: addDays(startsAtLocal, -3, "12:00"),
    checkinMode: "LINK",
    checkinOpensMinBefore: 30,
    checkinClosesMinAfter: 60,
    publish: true,
  };
}

/** Moves a wall-clock datetime-local string by some minutes. */
function shiftLocal(local: string, minutes: number) {
  const ms = Date.parse(`${local}:00Z`);
  return Number.isFinite(ms) ? new Date(ms + minutes * 60_000).toISOString().slice(0, 16) : local;
}

function minutesBetween(a: string, b: string) {
  const ms = Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / 60_000) : 0;
}

export function EventForm({ eventId, initial }: { eventId?: string; initial: EventFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<EventFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minTouched, setMinTouched] = useState(Boolean(eventId));
  const duration = minutesBetween(v.startsAtLocal, v.endsAtLocal);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setV((prev) => {
      const next = { ...prev, [key]: value };
      // Moving the start carries the end with it, so the event keeps its length.
      if (key === "startsAtLocal") {
        next.endsAtLocal = shiftLocal(prev.endsAtLocal, minutesBetween(prev.startsAtLocal, value as string));
      }
      // Until someone sets it, the minimum time tracks the event's length.
      if (!minTouched && (key === "startsAtLocal" || key === "endsAtLocal")) {
        next.minMinutes = Math.max(0, minutesBetween(next.startsAtLocal, next.endsAtLocal));
      }
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.latitude == null || v.longitude == null) {
      setError("Drop the venue pin on the map so check-in can verify location.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (eventId) {
        await api(`/committee/events/${eventId}`, { method: "PUT", body: v });
        router.push(`/committee/events/${eventId}`);
      } else {
        const { event } = await api<{ event: { id: string } }>("/committee/events", { body: v });
        router.push(`/committee/events/${event.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <Notice tone="crimson">{error}</Notice>}

      <Panel className="space-y-5">
        <h2 className="text-headline font-semibold">Event</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title">
            <input id="title" className={inputClass} required maxLength={140} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Food pantry packing" />
          </Field>
          <Field label="Partner organization" htmlFor="partner">
            <input id="partner" className={inputClass} maxLength={140} value={v.partnerOrg ?? ""} onChange={(e) => set("partnerOrg", e.target.value)} placeholder="Father's Heart Ministries" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts (New York time)" htmlFor="startsAt">
            <DateTimeField id="startsAt" label="Starts" value={v.startsAtLocal} onChange={(x) => set("startsAtLocal", x)} />
          </Field>
          <Field label="Ends" htmlFor="endsAt" hint={duration > 0 ? formatDuration(duration) : undefined} error={duration <= 0 ? "Ends before it starts" : null}>
            <DateTimeField id="endsAt" label="Ends" value={v.endsAtLocal} onChange={(x) => set("endsAtLocal", x)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Spots" htmlFor="capacity">
            <input id="capacity" type="number" min={1} max={500} required className={inputClass} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
          </Field>
          <Field label="Points for attending" htmlFor="points">
            <input id="points" type="number" min={0} max={50} required className={inputClass} value={v.points} onChange={(e) => set("points", Number(e.target.value))} />
          </Field>
          <Field label="Minimum time on site (min)" htmlFor="minMinutes" hint={formatDuration(v.minMinutes)}>
            <input id="minMinutes" type="number" min={0} max={duration || 1440} required className={inputClass} value={v.minMinutes} onChange={(e) => { setMinTouched(true); set("minMinutes", Number(e.target.value)); }} />
          </Field>
        </div>
        <Field label="What to know" htmlFor="instructions">
          <textarea id="instructions" rows={3} className={inputClass} maxLength={3000} value={v.instructions ?? ""} onChange={(e) => set("instructions", e.target.value)} placeholder="Wear closed-toe shoes and clothes that can get dirty. Meet at the side entrance on 3rd Ave." />
        </Field>
        <Field label="Description (optional)" htmlFor="description">
          <textarea id="description" rows={3} className={inputClass} maxLength={5000} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </Panel>

      <Panel className="space-y-5">
        <div>
          <h2 className="text-headline font-semibold">Location</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Place name" htmlFor="locationName">
            <input id="locationName" className={inputClass} maxLength={200} value={v.locationName ?? ""} onChange={(e) => set("locationName", e.target.value)} placeholder="Father's Heart food pantry" />
          </Field>
          <Field label="Address" htmlFor="address">
            <AddressField
              id="address"
              value={v.address ?? ""}
              onChange={(a) => set("address", a)}
              onPick={(p) => setV((prev) => ({ ...prev, latitude: p.latitude, longitude: p.longitude, locationName: prev.locationName || p.name || prev.locationName }))}
              placeholder="545 E 11th St, New York, NY"
            />
          </Field>
        </div>
        <LocationPicker
          value={v.latitude != null && v.longitude != null ? { latitude: v.latitude, longitude: v.longitude } : null}
          radiusMeters={v.radiusMeters}
          onChange={(p) => setV((prev) => ({ ...prev, latitude: p.latitude, longitude: p.longitude }))}
          address={v.address ?? ""}
        />
        <Field label={`Radius: ${v.radiusMeters} m`} htmlFor="radius">
          <input id="radius" type="range" min={50} max={1000} step={25} value={v.radiusMeters} onChange={(e) => set("radiusMeters", Number(e.target.value))} className="range w-full" style={{ "--range-fill": `${((v.radiusMeters - 50) / 950) * 100}%` } as React.CSSProperties} />
        </Field>
      </Panel>

      <Panel className="space-y-5">
        <div>
          <h2 className="text-headline font-semibold">Sign-ups</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sign-ups open" htmlFor="signupOpens">
            <DateTimeField id="signupOpens" label="Sign-ups open" value={v.signupOpensAtLocal} onChange={(x) => set("signupOpensAtLocal", x)} />
          </Field>
          <Field label="Sign-ups close" htmlFor="signupCloses">
            <DateTimeField id="signupCloses" label="Sign-ups close" value={v.signupClosesAtLocal} onChange={(x) => set("signupClosesAtLocal", x)} />
          </Field>
        </div>
      </Panel>

      <Panel className="space-y-5">
        <h2 className="text-headline font-semibold">Check-in</h2>
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">How people check in</legend>
          {([
            ["LINK", "Event page link", "No one from BAP on site"],
            ["QR", "Rotating QR code", "A committee member is on site"],
          ] as const).map(([value, label, description]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-xl p-3.5 transition-colors duration-200 ${v.checkinMode === value ? "bg-crimson-soft" : "bg-fill hover:bg-fill-strong"}`}>
              <input type="radio" name="checkinMode" value={value} checked={v.checkinMode === value} onChange={() => set("checkinMode", value)} className="mt-1 accent-[var(--crimson)]" />
              <span>
                <span className="block text-body font-medium">{label}</span>
                <span className="mt-0.5 block text-footnote leading-snug text-secondary">{description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in opens (min before start)" htmlFor="opens">
            <input id="opens" type="number" min={0} max={240} className={inputClass} value={v.checkinOpensMinBefore} onChange={(e) => set("checkinOpensMinBefore", Number(e.target.value))} />
          </Field>
          <Field label="Late check-in allowed until (min after start)" htmlFor="closes">
            <input id="closes" type="number" min={0} max={1440} className={inputClass} value={v.checkinClosesMinAfter} onChange={(e) => set("checkinClosesMinAfter", Number(e.target.value))} />
          </Field>
        </div>
      </Panel>

      <Panel>
        <Toggle id="publish" label="Visible to students" checked={v.publish} onChange={(c) => set("publish", c)} />
      </Panel>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button size="lg" variant="secondary" onClick={() => router.back()} disabled={busy}>Cancel</Button>
        <Button type="submit" size="lg" disabled={busy}>{eventId ? "Save changes" : "Create event"}</Button>
      </div>
    </form>
  );
}

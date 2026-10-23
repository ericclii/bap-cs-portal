"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { Check, Clock, LocateFixed, QrCode, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Notice, cx, inputClass } from "@/components/ui";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import {
  attendedMinutes,
  checkinOpensAt,
  checkinWindowState,
  checkoutDeadline,
  checkoutUnlocksAt,
  formatDuration,
  isLateDrop,
  signupWindowState,
} from "@/lib/event-window";
import { getPosition, type Position } from "@/lib/geolocation";
import { formatDateTime, formatTime } from "@/lib/time";

type Attendance = {
  checkedInAt: string;
  checkedOutAt: string | null;
  earlyCheckout: boolean;
  checkInMethod: "SELF" | "COMMITTEE";
};

type View = {
  event: {
    id: string;
    title: string;
    partnerOrg: string | null;
    startsAt: string;
    endsAt: string;
    capacity: number;
    points: number;
    minMinutes: number;
    signupOpensAt: string;
    signupClosesAt: string;
    selectionPublishedAt: string | null;
    finalizedAt: string | null;
    canceledAt: string | null;
    checkinMode: "LINK" | "QR";
    checkinOpensMinBefore: number;
    checkinClosesMinAfter: number;
  };
  rules: { lateDropHours: number; noShowPenalty: number };
  mine: {
    status: "APPLIED" | "SELECTED" | "WAITLISTED" | "DROPPED" | "REMOVED";
    waitlistPos: number | null;
    lateDrop: boolean;
    wasSelected: boolean;
    outcome: "ATTENDED" | "NO_SHOW" | "EXCUSED" | null;
    points: number | null;
    attendance: Attendance | null;
  } | null;
  selectedCount: number;
  latestReview: { kind: string; status: "OPEN" | "APPROVED" | "DENIED"; resolution: string | null } | null;
};

const PRESENCE_EVERY_MS = 3 * 60_000;

export function EventActions({ view, hasVenuePass }: { view: View; hasVenuePass: boolean; user?: { name: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [panel, setPanel] = useState<null | "drop" | "early" | "review-in" | "review-out">(null);
  const [text, setText] = useState("");
  const [ack, setAck] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const e = view.event;
  const timing = {
    startsAt: new Date(e.startsAt),
    endsAt: new Date(e.endsAt),
    checkinOpensMinBefore: e.checkinOpensMinBefore,
    checkinClosesMinAfter: e.checkinClosesMinAfter,
    minMinutes: e.minMinutes,
    signupOpensAt: new Date(e.signupOpensAt),
    signupClosesAt: new Date(e.signupClosesAt),
  };
  const mine = view.mine;
  const a = mine?.attendance ?? null;
  const onSite = Boolean(a && !a.checkedOutAt);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);

  // Best-effort presence while the page is open between check-in and check-out.
  useEffect(() => {
    if (!onSite) return;
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      getPosition({ maximumAgeMs: 60_000 })
        .then((position) => api(`/events/${e.id}/presence`, { body: { position } }))
        .catch(() => {});
    };
    const id = setInterval(ping, PRESENCE_EVERY_MS);
    return () => clearInterval(id);
  }, [onSite, e.id]);

  async function run(label: string, fn: () => Promise<unknown>, opts: { celebrate?: boolean } = {}) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      setPanel(null);
      setText("");
      setAck(false);
      if (opts.celebrate) setCelebrate(true);
      router.refresh();
    } catch (err) {
      setError({ message: err instanceof ApiClientError ? err.message : errorMessage(err), code: err instanceof ApiClientError ? err.code : undefined });
    } finally {
      setBusy(null);
    }
  }

  async function withLocation<T>(fn: (position: Position) => Promise<T>) {
    setBusy("Finding your location…");
    const position = await getPosition();
    setBusy("Saving…");
    return fn(position);
  }

  const checkIn = () =>
    run("Checking in…", () => withLocation((position) => api(`/events/${e.id}/checkin`, { body: { position } })), { celebrate: true });
  const checkOut = (earlyReason?: string) =>
    run("Checking out…", () => withLocation((position) => api(`/events/${e.id}/checkout`, { body: { position, earlyReason } })), { celebrate: true });
  const requestReview = (kind: "CHECKIN_LOCATION" | "CHECKOUT_LOCATION") =>
    run("Sending…", async () => {
      const position = await getPosition().catch(() => null);
      await api(`/events/${e.id}/review-request`, { body: { kind, message: text, position } });
    });

  const locationTrouble = error && ["outside_geofence", "location_inaccurate", "location_required"].includes(error.code ?? "");
  const errorBox = error && (
    <Notice
      tone="crimson"
      action={
        locationTrouble ? (
          <Button size="sm" variant="secondary" onClick={() => { setPanel(a ? "review-out" : "review-in"); setError(null); }}>
            Ask the committee
          </Button>
        ) : undefined
      }
    >
      {error.message}
    </Notice>
  );
  const pendingReview = view.latestReview?.status === "OPEN" ? view.latestReview : null;

  if (e.canceledAt) return <Status icon="info" title="Canceled" body="No check-in needed. This event isn't happening." />;

  // ---- Not signed up --------------------------------------------------------
  if (mine?.status === "REMOVED") return <Status icon="info" title="You're not on the list" body="Contact the committee if this is a mistake." />;
  if (!mine || (mine.status === "DROPPED" && !mine.wasSelected)) {
    const window = signupWindowState(timing, now);
    if (now >= timing.startsAt) return <Status icon="info" title="This event has started" body="Sign-ups are closed." />;
    if (window === "before") return <Status icon="clock" title="Sign-ups open soon" body={formatDateTime(timing.signupOpensAt)} />;
    if (window === "closed" && !e.selectionPublishedAt) {
      return <Status icon="clock" title="Sign-ups are closed" body="The committee is picking who goes. You'll get an email either way." />;
    }
    const waitlistOnly = Boolean(e.selectionPublishedAt);
    return (
      <div className="space-y-4">
        {errorBox}
        <p className="text-body leading-snug text-secondary">
          {waitlistOnly ? "Event full" : `Sign-ups close ${formatDateTime(timing.signupClosesAt)}`}
        </p>
        <Button size="lg" className="w-full" disabled={busy !== null} onClick={() => run("Signing you up…", () => api(`/events/${e.id}/signup`, { body: {} }))}>
          {busy ?? (waitlistOnly ? "Join waitlist" : "Sign up")}
        </Button>
      </div>
    );
  }

  // ---- Signed up, waiting for selection --------------------------------------
  if (mine.status === "APPLIED") {
    return (
      <div className="space-y-3">
        {errorBox}
        <Status icon="check" tone="blue" title="You're signed up" body={`You'll get an email after sign-ups close ${formatDateTime(timing.signupClosesAt)}.`} />
        <ConfirmButton confirmLabel="Withdraw" disabled={busy !== null} onConfirm={() => run("Withdrawing…", () => api(`/events/${e.id}/drop`, { body: {} }))}>
          Withdraw
        </ConfirmButton>
      </div>
    );
  }

  // ---- Waitlisted ----------------------------------------------------------
  if (mine.status === "WAITLISTED") {
    const spotOpen = view.selectedCount < e.capacity && now < timing.startsAt;
    return (
      <div className="space-y-3">
        {errorBox}
        <Status icon="clock" tone="amber" title={`#${mine.waitlistPos} on the waitlist`} body={spotOpen ? "A spot is open. It goes to whoever claims it first." : "We'll email you if a spot opens."} />
        {spotOpen && (
          <Button size="lg" className="w-full" disabled={busy !== null} onClick={() => run("Claiming…", () => api(`/events/${e.id}/claim`, { body: {} }), { celebrate: true })}>
            {busy ?? "Claim the spot"}
          </Button>
        )}
        <ConfirmButton confirmLabel="Leave waitlist" disabled={busy !== null} onConfirm={() => run("Leaving…", () => api(`/events/${e.id}/drop`, { body: {} }))}>
          Leave waitlist
        </ConfirmButton>
      </div>
    );
  }

  // ---- Dropped after being confirmed -----------------------------------------
  if (mine.status === "DROPPED") {
    return (
      <Status
        icon={mine.lateDrop ? "warn" : "info"}
        tone={mine.lateDrop ? "amber" : undefined}
        title="You dropped out"
        body={
          mine.outcome
            ? outcomeText(mine.outcome, mine.points)
            : mine.lateDrop
              ? `It was within ${view.rules.lateDropHours} hours of the start, so the committee will decide whether it's excused.`
              : "Your spot went to the waitlist. No points lost."
        }
      />
    );
  }

  // ---- Confirmed -----------------------------------------------------------
  if (mine.outcome) {
    return (
      <Status
        icon={mine.outcome === "ATTENDED" ? "check" : mine.outcome === "EXCUSED" ? "info" : "warn"}
        tone={mine.outcome === "ATTENDED" ? "green" : mine.outcome === "EXCUSED" ? undefined : "crimson"}
        title={{ ATTENDED: "Attendance confirmed", NO_SHOW: "Marked as a no-show", EXCUSED: "Absence excused" }[mine.outcome]}
        body={outcomeText(mine.outcome, mine.points)}
      />
    );
  }

  if (a?.checkedOutAt) {
    const inAt = new Date(a.checkedInAt);
    const outAt = new Date(a.checkedOutAt);
    return (
      <div className="space-y-3">
        <Status
          icon="check"
          tone="green"
          animate={celebrate}
          title={`${formatDuration(attendedMinutes(inAt, outAt))} with ${e.partnerOrg ?? "your community"}`}
          body={`Thank you. ${formatTime(inAt)} – ${formatTime(outAt)}. Your ${e.points} points are added once the committee reviews the event.`}
        />
        {a.earlyCheckout && <Notice tone="amber">You checked out early. The committee will review your reason before awarding points.</Notice>}
      </div>
    );
  }

  if (a) {
    const inAt = new Date(a.checkedInAt);
    const unlocks = checkoutUnlocksAt(timing, inAt);
    const early = now < unlocks;
    const closed = now > checkoutDeadline(timing);
    return (
      <div className="space-y-4">
        {errorBox}
        <Status
          icon="check"
          tone="green"
          animate={celebrate}
          title={`Checked in at ${formatTime(inAt)}`}
          body={closed ? "Check-out has closed. The committee will review your attendance." : early ? `Check out at ${formatTime(unlocks)} or later.` : "You can check out whenever you're done."}
        />
        {pendingReview && <Notice tone="blue">Your location request is with the committee.</Notice>}
        {!closed && panel === null && (
          early ? (
            <Button size="lg" variant="secondary" className="w-full" disabled={busy !== null} onClick={() => setPanel("early")}>
              Check out early
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={busy !== null} onClick={() => checkOut()}>
              {busy ?? "Check out"}
            </Button>
          )
        )}
        {panel === "early" && (
          <ReasonForm
            title="Check out early?"
            warning={`The minimum is ${formatDuration(e.minMinutes)}. Leaving early notifies the committee, and you may lose points unless it was authorized, for example if the site dismissed your group.`}
            label="Reason for the committee"
            placeholder="The organizer finished our tasks and dismissed us at 11:40"
            text={text}
            setText={setText}
            ack={ack}
            setAck={setAck}
            ackLabel="I understand this may cost me points"
            submitLabel={busy ?? "Check out early"}
            busy={busy !== null}
            onCancel={() => setPanel(null)}
            onSubmit={() => checkOut(text)}
          />
        )}
        {panel === "review-out" && (
          <ReasonForm
            title="Ask the committee to record your check-out"
            label="What's happening?"
            placeholder="I'm in the basement and my phone can't get a location"
            text={text}
            setText={setText}
            submitLabel={busy ?? "Send"}
            busy={busy !== null}
            onCancel={() => setPanel(null)}
            onSubmit={() => requestReview("CHECKOUT_LOCATION")}
          />
        )}
      </div>
    );
  }

  const window = checkinWindowState(timing, now);
  const late = isLateDrop(timing, view.rules.lateDropHours, now);
  const penalty = Math.abs(view.rules.noShowPenalty);

  if (window === "before" || panel === "drop") {
    const opens = checkinOpensAt(timing);
    return (
      <div className="space-y-3">
        {errorBox}
        <Status
          icon="check"
          tone="green"
          animate={celebrate}
          title="You're confirmed"
          body={`Check-in opens ${formatDateTime(opens)}. ${e.checkinMode === "QR" ? "A committee member will have a QR code to scan." : "Open this page when you arrive."}`}
        />
        {panel === "drop" ? (
          <ReasonForm
            title="Drop out?"
            warning={
              late
                ? `It's within ${view.rules.lateDropHours} hours of the start, so this is a late drop. You may lose ${penalty} point${penalty === 1 ? "" : "s"} unless the committee excuses it.`
                : "Your spot goes to the next person on the waitlist."
            }
            label="Reason for the committee"
            placeholder="My midterm review was moved to Saturday"
            text={text}
            setText={setText}
            ack={late ? ack : undefined}
            setAck={late ? setAck : undefined}
            ackLabel="I understand this is a late drop"
            submitLabel={busy ?? "Drop out"}
            destructive
            busy={busy !== null}
            onCancel={() => setPanel(null)}
            onSubmit={() => run("Dropping…", () => api(`/events/${e.id}/drop`, { body: { reason: text } }))}
          />
        ) : (
          <Button variant="plain" size="sm" onClick={() => setPanel("drop")}>
            Can&apos;t make it?
          </Button>
        )}
      </div>
    );
  }

  if (window === "closed") {
    return (
      <div className="space-y-3">
        {errorBox}
        <Status icon="warn" tone="amber" title="Check-in has closed" body="If you were there, ask the committee to record it." />
        {pendingReview ? (
          <Notice tone="blue">Your request is with the committee.</Notice>
        ) : panel === "review-in" ? (
          <ReasonForm title="Ask the committee to record your check-in" label="What happened?" placeholder="I arrived on time but couldn't get a location in the basement" text={text} setText={setText} submitLabel={busy ?? "Send"} busy={busy !== null} onCancel={() => setPanel(null)} onSubmit={() => requestReview("CHECKIN_LOCATION")} />
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => setPanel("review-in")}>Ask the committee</Button>
        )}
      </div>
    );
  }

  // Check-in window open.
  const needsScan = e.checkinMode === "QR" && !hasVenuePass;
  return (
    <div className="space-y-4">
      {errorBox}
      {pendingReview ? (
        <Status icon="clock" tone="blue" title="Waiting for the committee" />
      ) : needsScan ? (
        <Status icon="qr" title="Scan the QR code to check in" body="A committee member on site has the code." />
      ) : panel !== "review-in" ? (
        <>
          <Button size="lg" className="w-full" disabled={busy !== null} onClick={checkIn}>
            {busy ?? "Check in"}
          </Button>
        </>
      ) : null}
      {panel === "review-in" && (
        <ReasonForm title="Ask the committee to record your check-in" label="What's happening?" placeholder="I'm here but in the basement with no signal" text={text} setText={setText} submitLabel={busy ?? "Send"} busy={busy !== null} onCancel={() => setPanel(null)} onSubmit={() => requestReview("CHECKIN_LOCATION")} />
      )}
      {!pendingReview && panel === null && (
        <button type="button" className="mx-auto flex items-center gap-1.5 text-footnote font-medium text-secondary hover:text-text" onClick={() => setPanel("review-in")}>
          <LocateFixed className="h-3.5 w-3.5" aria-hidden />
          Location not working?
        </button>
      )}
    </div>
  );
}

function outcomeText(o: "ATTENDED" | "NO_SHOW" | "EXCUSED", points: number | null) {
  const p = points ?? 0;
  if (o === "EXCUSED") return "No points were added or removed.";
  return `${p > 0 ? "+" : ""}${p} ${Math.abs(p) === 1 ? "point" : "points"} recorded by the committee.`;
}

const ICONS = { check: Check, clock: Clock, warn: TriangleAlert, info: Clock, qr: QrCode } as const;

function Status({
  title,
  body,
  icon,
  tone,
  animate,
}: {
  title: string;
  body?: string;
  icon: keyof typeof ICONS;
  tone?: "green" | "blue" | "amber" | "crimson";
  animate?: boolean;
}) {
  const ring = {
    green: "bg-green text-ground",
    blue: "bg-blue-soft text-blue",
    amber: "bg-amber-soft text-amber",
    crimson: "bg-crimson-soft text-crimson",
  }[tone ?? "blue"];
  const Icon = ICONS[icon];
  return (
    <div className="flex items-start gap-3">
      <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-full", tone ? ring : "bg-fill text-secondary", animate && icon === "check" && "confirm-mark")} aria-hidden>
        {animate && icon === "check" ? (
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        ) : (
          <Icon className="h-[18px] w-[18px]" strokeWidth={icon === "check" ? 2.75 : 2} />
        )}
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-headline leading-snug font-semibold">{title}</p>
        {body && <p className="mt-0.5 text-body leading-snug text-secondary text-pretty">{body}</p>}
      </div>
    </div>
  );
}

function ReasonForm(props: {
  title: string;
  warning?: string;
  label: string;
  placeholder: string;
  text: string;
  setText: (v: string) => void;
  ack?: boolean;
  setAck?: (v: boolean) => void;
  ackLabel?: string;
  submitLabel: string;
  destructive?: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const needsAck = props.setAck !== undefined;
  const ready = props.text.trim().length >= 3 && (!needsAck || props.ack);
  return (
    <form
      className="space-y-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (ready) props.onSubmit();
      }}
    >
      <p className="text-headline font-semibold">{props.title}</p>
      {props.warning && <Notice tone="amber">{props.warning}</Notice>}
      <label className="block space-y-1.5">
        <span className="text-footnote font-medium text-secondary">{props.label}</span>
        <textarea rows={3} required minLength={3} maxLength={500} className={inputClass} placeholder={props.placeholder} value={props.text} onChange={(ev) => props.setText(ev.target.value)} />
      </label>
      {needsAck && (
        <label className="flex items-start gap-2.5 text-body">
          <input type="checkbox" className="mt-0.5 h-[18px] w-[18px] accent-[var(--crimson)]" checked={props.ack} onChange={(ev) => props.setAck!(ev.target.checked)} />
          {props.ackLabel}
        </label>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="secondary" size="lg" className="sm:flex-1" onClick={props.onCancel} disabled={props.busy}>
          Cancel
        </Button>
        <Button type="submit" variant={props.destructive ? "destructive" : "primary"} size="lg" className="sm:flex-1" disabled={!ready || props.busy}>
          {props.submitLabel}
        </Button>
      </div>
    </form>
  );
}

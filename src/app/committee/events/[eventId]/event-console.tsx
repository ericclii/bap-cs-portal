"use client";

import { Ellipsis, Link2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink, Button, DateTile, LinkButton, Notice, Segmented, buttonClass, cx, inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { formatEventRange } from "@/lib/time";
import { PhasePill } from "../../phase";
import { FinalizeTab } from "./finalize-tab";
import { PeopleTab } from "./people-tab";
import { SelectionTab } from "./selection-tab";
import type { ConsoleEvent, Person } from "./types";

type Tab = "people" | "selection" | "finalize";

export function EventConsole({ event, initialPeople, initialTab }: { event: ConsoleEvent; initialPeople: Person[]; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ended = new Date(event.endsAt) < new Date();

  function switchTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "people", label: "People" },
    { key: "selection", label: event.selectionPublishedAt ? "Selection" : "Pick who goes" },
    { key: "finalize", label: event.finalizedAt ? "Points" : "Award points", disabled: !ended },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/committee/events">Events</BackLink>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <DateTile date={new Date(event.startsAt)} size="lg" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display font-bold text-balance break-words">{event.title}</h1>
              <PhasePill phase={event.phase} />
            </div>
            <p className="text-body text-secondary">
              {formatEventRange(new Date(event.startsAt), new Date(event.endsAt))}
              {event.partnerOrg && ` · ${event.partnerOrg}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.checkinMode === "QR" && (
            <a href={`/qr/${event.id}`} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm")}>
              <QrCode className="h-4 w-4" aria-hidden /> Show QR
            </a>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const url = `${window.location.origin}/events/${event.slug}`;
              await navigator.clipboard.writeText(url);
              setNotice(`Copied ${url}`);
            }}
          >
            <Link2 className="h-4 w-4" aria-hidden /> Copy link
          </Button>
          <LinkButton href={`/committee/events/${event.id}/edit`} size="sm" variant="secondary">Edit</LinkButton>
          <MoreMenu event={event} onError={setError} onNotice={setNotice} />
        </div>
      </div>

      {event.canceledAt && <Notice tone="crimson">Canceled. Students see it as canceled and can&apos;t check in.</Notice>}
      {!event.publishedAt && <Notice tone="amber">Draft: students can&apos;t see this event yet. Edit it and turn on &ldquo;Visible to students&rdquo;.</Notice>}
      {error && <Notice tone="crimson">{error}</Notice>}
      {notice && <Notice tone="green">{notice}</Notice>}

      <Segmented
        label="Event sections"
        value={tab}
        onChange={switchTab}
        options={tabs.map((t) => ({ value: t.key, label: t.label, disabled: t.disabled }))}
      />

      {tab === "people" && <PeopleTab event={event} initialPeople={initialPeople} onNotice={setNotice} />}
      {tab === "selection" && <SelectionTab event={event} onNotice={(m) => { setNotice(m); switchTab("people"); }} />}
      {tab === "finalize" && <FinalizeTab event={event} onNotice={setNotice} />}
    </div>
  );
}

function MoreMenu({ event, onError, onNotice }: { event: ConsoleEvent; onError: (m: string) => void; onNotice: (m: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [armed, setArmed] = useState<null | "cancel" | "delete">(null);
  const [startsAtLocal, setStartsAtLocal] = useState(event.startsAtLocal);

  async function run(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (err) {
      onError(errorMessage(err));
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => { setOpen((o) => !o); setArmed(null); }}><Ellipsis className="h-4 w-4" aria-hidden /></Button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-72 rounded-2xl bg-surface p-1.5 pop-in shadow-pop">
          {!duplicating ? (
            <>
              <a role="menuitem" href={`/api/v1/committee/events/${event.id}/export`} className="block rounded-lg px-3 py-2 text-body hover:bg-ground">Download CSV</a>
              <MenuItem onClick={() => setDuplicating(true)}>Duplicate for another date…</MenuItem>
              <MenuItem
                onClick={() =>
                  armed !== "cancel" ? setArmed("cancel") :
                  run(async () => {
                    const res = await api<{ emailed: number }>(`/committee/events/${event.id}/cancel`, { body: { canceled: !event.canceledAt } });
                    setOpen(false);
                    const who = `${res.emailed} ${res.emailed === 1 ? "person" : "people"} emailed`;
                    onNotice(event.canceledAt ? `Event restored. ${who}.` : `Event canceled. ${who}.`);
                    router.refresh();
                  })
                }
              >
                {armed === "cancel"
                  ? event.canceledAt
                    ? "Tap again: restore and email confirmed people"
                    : "Tap again: cancel and email everyone signed up"
                  : event.canceledAt
                    ? "Restore event"
                    : "Cancel event"}
              </MenuItem>
              <MenuItem
                danger
                onClick={() =>
                  armed !== "delete" ? setArmed("delete") :
                  run(async () => {
                    await api(`/committee/events/${event.id}`, { method: "DELETE" });
                    router.push("/committee/events");
                  })
                }
              >
                {armed === "delete" ? "Tap again to delete for good" : "Delete event"}
              </MenuItem>
            </>
          ) : (
            <div className="space-y-3 p-3">
              <label className="block space-y-1 text-footnote">
                <span className="font-medium">New start (New York time)</span>
                <input type="datetime-local" className={inputClass} value={startsAtLocal} onChange={(e) => setStartsAtLocal(e.target.value)} />
              </label>
              <p className="text-caption text-secondary">Saved as a draft.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    run(async () => {
                      const { event: copy } = await api<{ event: { id: string } }>(`/committee/events/${event.id}/duplicate`, { body: { startsAtLocal } });
                      router.push(`/committee/events/${copy.id}/edit`);
                    })
                  }
                >
                  Create copy
                </Button>
                <Button size="sm" variant="plain" onClick={() => setDuplicating(false)}>Back</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" type="button" onClick={onClick} className={cx("w-full rounded-lg px-3 py-2 text-left text-body hover:bg-ground", danger && "text-crimson")}>
      {children}
    </button>
  );
}

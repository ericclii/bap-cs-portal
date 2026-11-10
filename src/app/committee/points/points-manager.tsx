"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, cx, Empty, Field, Group, inputBase, inputClass, Notice, Panel, Pill, Row, Segmented } from "@/components/ui";
import { MenuButton } from "@/components/menu-button";
import { api, errorMessage } from "@/lib/api-client";
import type { Checkpoint } from "@/lib/checkpoints";
import { parseRoster } from "@/lib/netid";
import { type Candidate, RosterManager } from "./roster-manager";
import { CheckpointView, RiskView } from "./standing";
import { TrackerSync } from "./tracker-sync";

type Standing = {
  netId: string;
  name: string | null;
  isCandidate: boolean;
  eventPoints: number;
  adjustmentPoints: number;
  total: number;
  attended: number;
  noShows: number;
  excused: number;
  pendingEvents: number;
};

type Panel = null | "adjust" | "import" | "sheets" | "roster";
type View = "risk" | "checkpoint" | "everyone";

/**
 * Points and candidates in one place: who is short of the next checkpoint,
 * who has passed which, and everyone's totals; the roster and point
 * corrections sit behind the actions.
 */
export function PointsManager({
  standings,
  candidates,
  checkpoints: wire,
  isChair,
  feedUrl,
}: {
  standings: Standing[];
  candidates: Candidate[];
  checkpoints: (Omit<Checkpoint, "dueAt"> & { dueAt: string | null })[];
  isChair: boolean;
  feedUrl: string;
}) {
  const router = useRouter();
  const checkpoints: Checkpoint[] = wire.map((c) => ({ ...c, dueAt: c.dueAt ? new Date(c.dueAt) : null }));
  const [panel, setPanel] = useState<Panel>(null);
  const [view, setView] = useState<View>(checkpoints.length ? "risk" : "everyone");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const people = standings.filter((s) => s.isCandidate);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return standings.filter((s) => !q || s.netId.includes(q) || (s.name ?? "").toLowerCase().includes(q));
  }, [standings, query]);

  const done = () => {
    setPanel(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setPanel(panel === "adjust" ? null : "adjust")}>Add points</Button>
        <MenuButton
          align="left"
          items={[
            { label: "Edit roster", onSelect: () => setPanel("roster") },
            ...(isChair ? [{ label: "Sync from tracker", onSelect: () => setPanel("import") }] : []),
            { label: "Google Sheets link", onSelect: () => setPanel("sheets") },
            { label: "Download CSV", href: "/api/v1/committee/points/export" },
          ]}
        />
      </div>

      {notice && <Notice tone="green">{notice}</Notice>}
      {panel === "adjust" && <AdjustForm onDone={(m) => { setNotice(m); done(); }} />}
      {panel === "import" && <TrackerSync rosterNetIds={candidates.map((c) => c.netId)} onDone={(m) => { setNotice(m); done(); }} />}
      {panel === "sheets" && <SheetsHelp feedUrl={feedUrl} />}
      {panel === "roster" && (
        <div className="reveal space-y-3">
          <RosterManager candidates={candidates} />
          <Button variant="secondary" onClick={() => setPanel(null)}>Done</Button>
        </div>
      )}

      <Segmented
        label="Points view"
        value={view}
        onChange={setView}
        options={[
          ...(checkpoints.length ? [{ value: "risk" as const, label: "At risk" }, { value: "checkpoint" as const, label: "By checkpoint" }] : []),
          { value: "everyone" as const, label: "Everyone" },
        ]}
      />

      {view !== "everyone" && people.length === 0 ? (
        <Empty title="No candidates yet" action={<Button variant="secondary" onClick={() => setPanel("roster")}>Add candidates</Button>} />
      ) : view === "risk" ? (
        <RiskView people={people} checkpoints={checkpoints} />
      ) : view === "checkpoint" ? (
        <CheckpointView people={people} checkpoints={checkpoints} />
      ) : (
        <div className="space-y-4">
          <input aria-label="Search people" className={`${inputBase} w-full sm:w-64`} placeholder="Search name or NetID" value={query} onChange={(e) => setQuery(e.target.value)} />

          {/* Phones: one row per person; the full table from the small breakpoint up. */}
          <Group className="sm:hidden">
            {visible.length === 0 && <p className="px-4 py-8 text-center text-footnote text-secondary">No one matches.</p>}
            {visible.map((s) => (
              <Row
                key={s.netId}
                href={`/committee/points/${s.netId}`}
                title={s.name ?? s.netId}
                subtitle={`${s.netId} · attended ${s.attended}${s.noShows ? ` · ${s.noShows} no-show${s.noShows === 1 ? "" : "s"}` : ""}${s.pendingEvents ? ` · ${s.pendingEvents} not awarded yet` : ""}`}
                trailing={
                  <span className="text-body font-semibold tabular-nums">{s.total}</span>
                }
                chevron
              />
            ))}
          </Group>
          <Group className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-body">
              <thead className="border-b border-separator text-left text-secondary">
                <tr>
                  <th className="px-4 py-2 font-medium">Person</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Attended</th>
                  <th className="px-4 py-2 text-right font-medium">No-shows</th>
                  <th className="px-4 py-2 text-right font-medium">Not awarded yet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {visible.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary">No one matches.</td></tr>
                )}
                {visible.map((s) => (
                  <tr key={s.netId} className="hover:bg-fill">
                    <td className="px-4 py-2.5">
                      <Link href={`/committee/points/${s.netId}`} className="font-medium hover:underline">{s.name ?? s.netId}</Link>
                      <span className="ml-2 text-secondary">{s.netId}</span>
                      {!s.isCandidate && <span className="ml-2"><Pill>Not a candidate</Pill></span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{s.total}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.attended}</td>
                    <td className={cx("px-4 py-2.5 text-right tabular-nums", s.noShows > 0 && "text-amber")}>{s.noShows}</td>
                    <td className="px-4 py-2.5 text-right text-secondary tabular-nums">{s.pendingEvents || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Group>
        </div>
      )}
    </div>
  );
}

function AdjustForm({ onDone }: { onDone: (m: string) => void }) {
  const [people, setPeople] = useState("");
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => parseRoster(people), [people]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ count: number }>("/committee/points", { body: { netIds: parsed.rows.map((r) => r.netId), points, reason } });
      onDone(`${points > 0 ? "+" : ""}${points} points for ${res.count} ${res.count === 1 ? "person" : "people"}: ${reason}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Panel className="">
      <form onSubmit={submit} className="space-y-4">
        <Field label="NetIDs or emails" htmlFor="adj-people" hint={`${parsed.rows.length} ${parsed.rows.length === 1 ? "person" : "people"}${parsed.invalid.length ? ` · ${parsed.invalid.length} not recognized` : ""}`}>
          <textarea id="adj-people" rows={3} className={`${inputClass} font-mono`} placeholder={"ab1234\ncd5678@stern.nyu.edu"} value={people} onChange={(e) => setPeople(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Field label="Points" htmlFor="adj-points">
            <input id="adj-points" type="number" step={0.5} min={-50} max={50} className={inputClass} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </Field>
          <Field label="Reason" htmlFor="adj-reason">
            <input id="adj-reason" required className={inputClass} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Card writing for NYU Langone, Oct 14 meeting" />
          </Field>
        </div>
        {error && <Notice tone="crimson">{error}</Notice>}
        <Button type="submit" disabled={busy || parsed.rows.length === 0 || !reason.trim() || points === 0}>Add points</Button>
      </form>
    </Panel>
  );
}

function SheetsHelp({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false);
  const formula = `=IMPORTDATA("${feedUrl}")`;
  return (
    <Panel className="space-y-3">
      <p className="text-footnote">Paste into cell A1 of an empty sheet. It refreshes hourly.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly aria-label="Sheets formula" className={`${inputClass} font-mono text-caption`} value={formula} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(formula); setCopied(true); }}>{copied ? "Copied" : "Copy formula"}</Button>
      </div>
      <p className="text-footnote text-secondary">Anyone with this link can read the points list. Share it only in committee sheets.</p>
    </Panel>
  );
}

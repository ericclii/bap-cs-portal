"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, cx, Field, Group, inputClass, Notice, Panel, Pill, inputBase } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { parsePointsImport, parseRoster } from "@/lib/netid";

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

type Panel = null | "adjust" | "import" | "sheets";

export function PointsManager({ standings, required, isChair, feedUrl }: { standings: Standing[]; required: number | null; isChair: boolean; feedUrl: string }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"candidates" | "all" | "behind">("candidates");
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return standings
      .filter((s) => (filter === "all" ? true : filter === "candidates" ? s.isCandidate : s.isCandidate && required != null && s.total < required))
      .filter((s) => !q || s.netId.includes(q) || (s.name ?? "").toLowerCase().includes(q));
  }, [standings, query, filter, required]);

  const done = () => {
    setPanel(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={panel === "adjust" ? "primary" : "secondary"} onClick={() => setPanel(panel === "adjust" ? null : "adjust")}>Add points</Button>
        {isChair && <Button variant={panel === "import" ? "primary" : "secondary"} onClick={() => setPanel(panel === "import" ? null : "import")}>Import old tracker</Button>}
        <Button variant={panel === "sheets" ? "primary" : "secondary"} onClick={() => setPanel(panel === "sheets" ? null : "sheets")}>Google Sheets link</Button>
      </div>

      {notice && <Notice tone="green">{notice}</Notice>}
      {panel === "adjust" && <AdjustForm onDone={(m) => { setNotice(m); done(); }} />}
      {panel === "import" && <ImportForm onDone={(m) => { setNotice(m); done(); }} />}
      {panel === "sheets" && <SheetsHelp feedUrl={feedUrl} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1" role="tablist">
          {([["candidates", "Candidates"], ...(required != null ? [["behind", "Behind requirement"]] : []), ["all", "Everyone"]] as [typeof filter, string][]).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={cx("rounded-lg px-3 py-1.5 text-sm", filter === key ? "bg-fill font-medium" : "text-secondary hover:text-text")}>
              {label}
            </button>
          ))}
        </div>
        <input aria-label="Search people" className={`${inputBase} w-full sm:w-64`} placeholder="Search name or NetID" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Group className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-separator text-left text-secondary">
            <tr>
              <th className="px-4 py-2 font-medium">Person</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
              <th className="px-4 py-2 text-right font-medium">Events</th>
              <th className="px-4 py-2 text-right font-medium">Adjustments</th>
              <th className="px-4 py-2 text-right font-medium">Attended</th>
              <th className="px-4 py-2 text-right font-medium">No-shows</th>
              <th className="px-4 py-2 text-right font-medium">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {visible.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary">No one matches.</td></tr>
            )}
            {visible.map((s) => (
              <tr key={s.netId} className="hover:bg-fill">
                <td className="px-4 py-2.5">
                  <Link href={`/committee/points/${s.netId}`} className="font-medium hover:underline">{s.name ?? s.netId}</Link>
                  <span className="ml-2 text-secondary">{s.netId}</span>
                  {!s.isCandidate && <span className="ml-2"><Pill>Not a candidate</Pill></span>}
                </td>
                <td className={cx("px-4 py-2.5 text-right font-semibold tabular-nums", required != null && s.isCandidate && (s.total >= required ? "text-gold" : "text-text"))}>
                  {s.total}{required != null && <span className="font-normal text-secondary"> / {required}</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s.eventPoints}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s.adjustmentPoints}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s.attended}</td>
                <td className={cx("px-4 py-2.5 text-right tabular-nums", s.noShows > 0 && "text-amber")}>{s.noShows}</td>
                <td className="px-4 py-2.5 text-right text-secondary tabular-nums">{s.pendingEvents || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Group>
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
        <p className="text-sm text-secondary">For points earned outside an event here, like card-writing at a chapter meeting, or a correction. Use negative points to take away.</p>
        <Field label="NetIDs or emails" htmlFor="adj-people" hint={`${parsed.rows.length} ${parsed.rows.length === 1 ? "person" : "people"}${parsed.invalid.length ? ` · ${parsed.invalid.length} not recognized` : ""}`}>
          <textarea id="adj-people" rows={3} className={`${inputClass} font-mono`} placeholder={"ab1234\ncd5678@stern.nyu.edu"} value={people} onChange={(e) => setPeople(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Field label="Points" htmlFor="adj-points">
            <input id="adj-points" type="number" min={-50} max={50} className={inputClass} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
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

function ImportForm({ onDone }: { onDone: (m: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => parsePointsImport(text), [text]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ imported: number }>("/committee/points/import", { body: { rows: parsed.rows, reason: "Imported from previous tracker" } });
      onDone(`Imported starting points for ${res.imported} people.`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Panel className="space-y-4">
      <p className="text-sm text-secondary">
        Paste the current Google Sheet tracker (or upload it as CSV). Each row needs a NetID or NYU email and a points number; a name column is optional. Points are added as one &ldquo;Imported from previous tracker&rdquo; adjustment per person, so only do this once.
      </p>
      <textarea aria-label="Tracker rows" rows={6} className={`${inputClass} font-mono`} placeholder={"NetID,Name,Points\nab1234,Alex Chen,6\ncd5678,Sam Park,3"} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <label className={cx("inline-flex h-10 cursor-pointer items-center rounded-lg border border-separator bg-surface px-4 text-sm font-medium hover:bg-fill")}>
          Upload CSV
          <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
        </label>
        <Button disabled={busy || parsed.rows.length === 0} onClick={submit}>Import {parsed.rows.length} {parsed.rows.length === 1 ? "person" : "people"}</Button>
        {parsed.invalid.length > 0 && <span className="text-sm text-crimson">{parsed.invalid.length} rows skipped: {parsed.invalid.slice(0, 2).join("; ")}</span>}
      </div>
      {error && <Notice tone="crimson">{error}</Notice>}
    </Panel>
  );
}

function SheetsHelp({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false);
  const formula = `=IMPORTDATA("${feedUrl}")`;
  return (
    <Panel className="space-y-3">
      <p className="text-sm">
        Keep a Google Sheet that updates itself: paste this formula into cell A1 of an empty tab. Sheets refreshes it about once an hour.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly aria-label="Sheets formula" className={`${inputClass} font-mono text-xs`} value={formula} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(formula); setCopied(true); }}>{copied ? "Copied" : "Copy formula"}</Button>
      </div>
      <p className="text-sm text-secondary">The link is private: anyone who has it can read the points list, so only paste it into committee-owned sheets. Change <code>FEED_TOKEN_VERSION</code> to revoke it.</p>
    </Panel>
  );
}

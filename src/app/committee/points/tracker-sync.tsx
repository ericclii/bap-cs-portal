"use client";

import { useMemo, useState } from "react";
import { Button, cx, Notice, Panel, Toggle } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { parseTracker } from "@/lib/tracker";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ""));

/**
 * Upload the committee's tracker sheet (File → Download → CSV) and make the
 * app match it: everyone listed becomes a candidate and each filled cell
 * becomes a point entry named after its column. Re-uploading replaces the
 * last sync, so it can be done as often as the sheet changes.
 */
export function TrackerSync({ rosterNetIds, onDone }: { rosterNetIds: string[]; onDone: (message: string) => void }) {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [replaceRoster, setReplaceRoster] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);

  const parsed = useMemo(() => (file ? parseTracker(file.text) : null), [file]);
  const listed = useMemo(() => new Set(parsed?.people.map((p) => p.netId)), [parsed]);
  const leaving = rosterNetIds.filter((n) => !listed.has(n)).length;
  const joining = parsed ? parsed.people.filter((p) => !rosterNetIds.includes(p.netId)).length : 0;
  const entries = parsed?.people.reduce((s, p) => s + p.entries.length, 0) ?? 0;
  const points = parsed?.people.reduce((s, p) => s + p.entries.reduce((t, e) => t + e.points, 0), 0) ?? 0;
  const ready = parsed && !parsed.error && parsed.people.length > 0;

  async function read(f: File | undefined) {
    if (!f) return;
    setError(null);
    setFile({ name: f.name, text: await f.text() });
  }

  async function sync() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ people: number; entries: number; points: number; added: number; removed: number }>("/committee/points/tracker", {
        body: { people: parsed.people.map(({ netId, name, entries }) => ({ netId, name, entries })), replaceRoster },
      });
      onDone(
        `Synced ${res.people} candidates and ${res.entries} point entries (${fmt(res.points)} points).` +
          (res.added ? ` ${res.added} new to the roster.` : "") +
          (res.removed ? ` ${res.removed} removed from the roster.` : ""),
      );
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Panel className="reveal space-y-5">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold">Sync from tracker</h2>
        <p className="text-footnote text-secondary">
          In the tracker sheet, choose File → Download → Comma-separated values, then drop the file here. Columns: First Name, Last Name, Email, Total, then one column per event.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          read(e.dataTransfer.files[0]);
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-150",
          dragging ? "border-crimson bg-crimson-soft" : "border-fill-strong bg-fill/50 hover:bg-fill",
        )}
      >
        <span className="text-body font-semibold">{file ? file.name : "Drop the tracker CSV"}</span>
        <span className="text-footnote text-secondary">{file ? "Choose a different file" : "or click to choose a file"}</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => read(e.target.files?.[0])} />
      </label>

      {parsed?.error && <Notice tone="crimson">{parsed.error}</Notice>}

      {ready && (
        <div className="space-y-4">
          <dl className="grid grid-cols-3 gap-2">
            {[
              ["Candidates", parsed.people.length],
              ["Events", parsed.events.length],
              ["Points", fmt(points)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-fill px-3 py-2.5">
                <dt className="text-caption text-secondary">{label}</dt>
                <dd className="text-title font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="space-y-1.5 text-footnote">
            <Check ok={parsed.mismatches.length === 0}>
              {parsed.mismatches.length === 0
                ? "Every Total matches the sum of its event columns."
                : `${parsed.mismatches.length} Total${parsed.mismatches.length === 1 ? " doesn't" : "s don't"} match their event columns (${parsed.mismatches
                    .slice(0, 3)
                    .map((m) => `${m.netId}: sheet ${fmt(m.sheetTotal)}, columns ${fmt(m.sum)}`)
                    .join("; ")}). The event columns are what gets imported.`}
            </Check>
            {parsed.invalid.length > 0 && <Check ok={false}>{parsed.invalid.length} rows have no NYU email and are skipped: {parsed.invalid.slice(0, 3).join(", ")}</Check>}
            {parsed.duplicates.length > 0 && <Check ok={false}>Listed twice, first row used: {parsed.duplicates.join(", ")}</Check>}
          </ul>

          <div>
            <button type="button" className="text-footnote font-semibold text-secondary hover:text-text" onClick={() => setShowEvents((v) => !v)} aria-expanded={showEvents}>
              {showEvents ? "Hide" : "Show"} the {parsed.events.length} event columns
            </button>
            {showEvents && (
              <ul className="reveal mt-2 divide-y divide-separator rounded-xl bg-fill/60 text-footnote">
                {parsed.events.map((e) => (
                  <li key={e.label} className="flex justify-between gap-3 px-3 py-1.5">
                    <span className="truncate">{e.label}</span>
                    <span className="shrink-0 text-secondary tabular-nums">{e.people ? `${e.people} people · ${fmt(e.points)} pts` : "No one yet"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Toggle
            id="tracker-replace"
            label="Everyone listed is a candidate, and only them"
            description={
              replaceRoster
                ? `${joining} added, ${leaving} removed from the current roster of ${rosterNetIds.length}.`
                : `${joining} added; the ${leaving} not in the sheet stay on the roster.`
            }
            checked={replaceRoster}
            onChange={setReplaceRoster}
          />
          <p className="text-footnote text-secondary">Replaces the points from the last tracker sync. Points added in the app and points from in-app events stay.</p>
          {error && <Notice tone="crimson">{error}</Notice>}
          <Button disabled={busy} onClick={sync}>{busy ? "Syncing…" : `Sync ${parsed.people.length} candidates`}</Button>
        </div>
      )}
    </Panel>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className={cx("mt-px font-bold", ok ? "text-green" : "text-amber")}>{ok ? "✓" : "!"}</span>
      <span className={ok ? "text-secondary" : "text-amber"}>{children}</span>
    </li>
  );
}

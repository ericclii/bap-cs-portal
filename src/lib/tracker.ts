// Parses the committee's points tracker spreadsheet (exported as CSV):
//
//   First Name, Last Name, Email, <NYU ID>, Total, (10/3) NYC Parks (3), (10/4) Bowery Mission, 10/31, …
//
// One row per person, one column per event, each cell the points earned
// there (negative for a no-show). Column order doesn't matter; the name,
// email and total columns are found by their headers and every other
// column whose cells are numbers is an event.

import { normalizeNetId } from "./netid";

/** RFC 4180 CSV: quoted cells, doubled quotes, newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export type TrackerEntry = { label: string; points: number; month: number | null; day: number | null };
export type TrackerPerson = { netId: string; name: string | null; sheetTotal: number | null; entries: TrackerEntry[] };
export type TrackerEvent = { label: string; month: number | null; day: number | null; people: number; points: number };
export type TrackerParse = {
  people: TrackerPerson[];
  events: TrackerEvent[];
  /** Rows that have a name or points but no NYU email/NetID. */
  invalid: string[];
  /** People whose Total column doesn't equal the sum of their event cells. */
  mismatches: { netId: string; sheetTotal: number; sum: number }[];
  duplicates: string[];
  /** Null when the text doesn't look like a tracker (no email/NetID header). */
  error: string | null;
};

const NUMBER = /^-?\d+(\.\d+)?$/;
const norm = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** "(10/3) NYC Parks (3)" → "10/3 NYC Parks", plus its month and day. */
export function eventLabel(header: string): { label: string; month: number | null; day: number | null } {
  const label = header
    .trim()
    .replace(/^\((\d{1,2}\/\d{1,2})\)/, "$1")
    .replace(/\s*\(\d+(\.\d+)?\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const m = label.match(/(\d{1,2})\/(\d{1,2})/);
  const month = m ? Number(m[1]) : null;
  const day = m ? Number(m[2]) : null;
  return { label, month: month && month <= 12 ? month : null, day: day && day <= 31 ? day : null };
}

export function parseTracker(text: string): TrackerParse {
  const empty = { people: [], events: [], invalid: [], mismatches: [], duplicates: [] };
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const headerAt = rows.findIndex((r) => r.some((c) => /^(email|e mail|net ?id|netid|nyu email)$/.test(norm(c))));
  if (headerAt < 0) return { ...empty, error: "No Email or NetID column found. The first row should be the column headers." };
  const header = rows[headerAt];
  const body = rows.slice(headerAt + 1);

  const find = (...names: string[]) => header.findIndex((h) => names.includes(norm(h)));
  const idCol = find("email", "e mail", "nyu email", "netid", "net id");
  const firstCol = find("first name", "first");
  const lastCol = find("last name", "last");
  const nameCol = find("name", "full name");
  const totalCol = find("total", "total points", "points");
  const known = new Set([idCol, firstCol, lastCol, nameCol, totalCol]);

  // Event columns: a header, and every filled cell is a number.
  const eventCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => h.trim() && !known.has(i) && body.every((r) => !(r[i] ?? "").trim() || NUMBER.test(r[i].trim())))
    .filter(({ h }) => !/^(id|n ?number|nyu id|university id|student id)$/.test(norm(h)));

  const events: TrackerEvent[] = eventCols.map(({ h }) => ({ ...eventLabel(h), people: 0, points: 0 }));
  const people: TrackerPerson[] = [];
  const invalid: string[] = [];
  const mismatches: TrackerParse["mismatches"] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  for (const r of body) {
    const netId = normalizeNetId(cell(r, idCol));
    const name = [cell(r, firstCol), cell(r, lastCol)].filter(Boolean).join(" ") || cell(r, nameCol) || null;
    const entries: TrackerEntry[] = [];
    eventCols.forEach(({ i }, k) => {
      const v = cell(r, i);
      if (!v || Number(v) === 0) return;
      entries.push({ label: events[k].label, month: events[k].month, day: events[k].day, points: Number(v) });
    });
    if (!netId) {
      // Spreadsheet padding rows have nothing but a 0 total.
      if (name || entries.length || cell(r, idCol)) invalid.push(name ?? cell(r, idCol) ?? r.join(",").slice(0, 60));
      continue;
    }
    if (seen.has(netId)) {
      duplicates.push(netId);
      continue;
    }
    seen.add(netId);
    const sum = entries.reduce((s, e) => s + e.points, 0);
    const totalText = cell(r, totalCol);
    const sheetTotal = NUMBER.test(totalText) ? Number(totalText) : null;
    if (sheetTotal !== null && Math.abs(sheetTotal - sum) > 1e-9) mismatches.push({ netId, sheetTotal, sum });
    for (const e of entries) {
      const ev = events.find((x) => x.label === e.label)!;
      ev.people++;
      ev.points += e.points;
    }
    people.push({ netId, name, sheetTotal, entries });
  }

  return { people, events, invalid, mismatches, duplicates, error: null };
}

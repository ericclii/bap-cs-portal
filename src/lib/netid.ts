// NYU identity helpers. A person is identified by their NetID; their
// @nyu.edu and @stern.nyu.edu addresses are treated as the same person.

export const NYU_DOMAINS = ["nyu.edu", "stern.nyu.edu"] as const;

/** NetIDs are letters followed by digits, e.g. el4640 or abc123. */
const NETID_RE = /^[a-z]{2,8}\d{1,6}$/;

export function isNetId(value: string): boolean {
  return NETID_RE.test(value.trim().toLowerCase());
}

/** NetID for an NYU or Stern email, or null for any other address. */
export function netIdFromEmail(email: string): string | null {
  const [local, domain, ...rest] = email.trim().toLowerCase().split("@");
  if (rest.length || !local || !domain) return null;
  if (!(NYU_DOMAINS as readonly string[]).includes(domain)) return null;
  return isNetId(local) ? local : null;
}

export function canonicalEmail(netId: string): string {
  return `${netId.toLowerCase()}@nyu.edu`;
}

/**
 * Accepts a NetID or an NYU/Stern email and returns the NetID, or null.
 * "EL4640", "el4640@stern.nyu.edu" and "el4640@nyu.edu" all give "el4640".
 */
export function normalizeNetId(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (value.includes("@")) return netIdFromEmail(value);
  return isNetId(value) ? value : null;
}

export type RosterRow = { netId: string; name: string | null };

/**
 * Parses pasted roster text or CSV. Each line can be a NetID or NYU email,
 * optionally with a name: "el4640", "Eric Li, el4640@stern.nyu.edu",
 * "Eric Li <el4640@nyu.edu>". Header rows are skipped; duplicates collapse.
 */
export function parseRoster(text: string): { rows: RosterRow[]; invalid: string[] } {
  const rows: RosterRow[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const angle = line.match(/^(.*?)<([^>]+)>\s*,?\s*$/);
    const cells = angle
      ? [angle[1], angle[2]]
      : line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));

    let netId: string | null = null;
    const others: string[] = [];
    for (const cell of cells) {
      const id: string | null = !netId ? normalizeNetId(cell) : null;
      if (id) netId = id;
      else if (cell.trim()) others.push(cell.trim());
    }
    if (!netId) {
      if (!/^(name|net\s*id|netid|email|e-mail)$/i.test(cells[0]?.trim() ?? "")) invalid.push(line);
      continue;
    }
    if (seen.has(netId)) continue;
    seen.add(netId);
    // The first non-ID, non-numeric cell is taken as the name.
    const name = others.find((c) => !/^-?\d+(\.\d+)?$/.test(c)) ?? null;
    rows.push({ netId, name: name ? name.replace(/^"|"$/g, "").trim() || null : null });
  }
  return { rows, invalid };
}

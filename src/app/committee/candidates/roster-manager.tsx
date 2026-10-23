"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, Button, Group, inputClass, Notice, Panel, Pill, Toggle, inputBase } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { parseRoster } from "@/lib/netid";

type Candidate = { id: string; netId: string; name: string | null; image: string | null; signedIn: boolean };

export function RosterManager({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const parsed = useMemo(() => parseRoster(text), [text]);
  const visible = candidates.filter((c) => !query || c.netId.includes(query.toLowerCase()) || (c.name ?? "").toLowerCase().includes(query.toLowerCase()));

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api<{ added: number; alreadyListed: number; removed: number }>("/committee/roster", { body: { rows: parsed.rows, replace } });
      setNotice(`Added ${res.added}${res.alreadyListed ? `, ${res.alreadyListed} already listed` : ""}${res.removed ? `, removed ${res.removed}` : ""}.`);
      setText("");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Candidate) {
    await api(`/committee/roster/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Panel className="space-y-4">
        <label htmlFor="roster" className="block font-medium">Add candidates</label>
        <textarea
          id="roster"
          rows={5}
          className={`${inputClass} font-mono`}
          placeholder={"Alex Chen, ac1234\nSam Park <sp5678@stern.nyu.edu>\nef9012"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            One per line: NetID or NYU email, with an optional name. {parsed.rows.length} recognized
            {parsed.invalid.length > 0 && <span className="text-crimson"> · {parsed.invalid.length} skipped ({parsed.invalid.slice(0, 2).join("; ")})</span>}
          </p>
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-separator bg-surface px-4 text-sm font-medium hover:bg-fill">
            Upload CSV
            <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
          </label>
        </div>
        <Toggle id="replace" label="Replace the roster with this list" description="Removes anyone not in the list. Their points and history are kept." checked={replace} onChange={setReplace} />
        <Button disabled={busy || parsed.rows.length === 0} onClick={save}>{replace ? "Replace roster" : "Add to roster"}</Button>
        {error && <Notice tone="crimson">{error}</Notice>}
        {notice && <Notice tone="green">{notice}</Notice>}
      </Panel>

      {candidates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold">Roster <span className="text-secondary tabular-nums">{candidates.length}</span></h2>
            <input aria-label="Search candidates" className={`${inputBase} w-56`} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Group>
            {visible.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.name ?? c.netId} image={c.image} size={28} />
                  <span className="truncate font-medium">{c.name ?? c.netId}</span>
                  <span className="text-sm text-secondary">{c.netId}</span>
                  {!c.signedIn && <Pill>Hasn&apos;t signed in</Pill>}
                </div>
                <ConfirmButton confirmLabel="Remove" onConfirm={() => remove(c)}>Remove</ConfirmButton>
              </div>
            ))}
          </Group>
        </section>
      )}
    </div>
  );
}

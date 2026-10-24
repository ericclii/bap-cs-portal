"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, Group, inputClass, Notice, Pill, Select } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";

type Member = { id: string; netId: string; role: "CHAIR" | "MEMBER"; name: string | null; image: string | null; signedIn: boolean };

export function CommitteeManager({ members, bootstrapChairs, isChair, myNetId }: { members: Member[]; bootstrapChairs: string[]; isChair: boolean; myNetId: string }) {
  const router = useRouter();
  const [netId, setNetId] = useState("");
  const [role, setRole] = useState<"MEMBER" | "CHAIR">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-headline font-semibold">CS committee</h2>
      {error && <Notice tone="crimson">{error}</Notice>}
      <Group>
        {bootstrapChairs.filter((n) => !members.some((m) => m.netId === n)).map((n) => (
          <div key={n} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={n} size={28} />
              <span className="font-medium">{n}</span>
              <Pill>Chair</Pill>
            </div>
            <span className="text-footnote text-secondary">Permanent chair</span>
          </div>
        ))}
        {members.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={m.name ?? m.netId} image={m.image} size={28} />
              <span className="font-medium">{m.name ?? m.netId}</span>
              <span className="text-footnote text-secondary">{m.netId}</span>
              {!m.signedIn && <Pill>Hasn&apos;t signed in</Pill>}
            </div>
            {isChair ? (
              <div className="flex items-center gap-2">
                <Select size="sm" className="w-28" aria-label={`Role for ${m.netId}`} value={m.role} disabled={busy} onChange={(e) => run(() => api(`/committee/members/${m.id}`, { method: "PATCH", body: { role: e.target.value } }))}>
                  <option value="MEMBER">Member</option>
                  <option value="CHAIR">Chair</option>
                </Select>
                <ConfirmButton disabled={busy} confirmLabel={m.netId === myNetId ? "Leave committee" : "Remove"} onConfirm={() => run(() => api(`/committee/members/${m.id}`, { method: "DELETE" }))}>Remove</ConfirmButton>
              </div>
            ) : (
              <Pill tone="neutral">{m.role === "CHAIR" ? "Chair" : "Member"}</Pill>
            )}
          </div>
        ))}
      </Group>
      {isChair && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/committee/members", { body: { netId, role } });
              setNetId("");
            });
          }}
        >
          <label htmlFor="member-netid" className="sr-only">NetID</label>
          <input id="member-netid" className={inputClass} placeholder="NetID or NYU email" value={netId} onChange={(e) => setNetId(e.target.value)} autoCapitalize="none" />
          <label htmlFor="member-role" className="sr-only">Role</label>
          <Select id="member-role" className="w-full sm:w-36" value={role} onChange={(e) => setRole(e.target.value as "MEMBER" | "CHAIR")}>
            <option value="MEMBER">Member</option>
            <option value="CHAIR">Chair</option>
          </Select>
          <Button type="submit" variant="secondary" disabled={busy || !netId.trim()}>Add</Button>
        </form>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { api } from "@/lib/api-client";

export function DeleteAdjustment({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      confirmLabel="Delete"
      onConfirm={async () => {
        await api(`/committee/points/adjustments/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Delete
    </ConfirmButton>
  );
}

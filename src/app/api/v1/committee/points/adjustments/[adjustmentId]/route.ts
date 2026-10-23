import { json, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { deleteAdjustment } from "@/server/services/points";

type P = { adjustmentId: string };

export const DELETE = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  await deleteAdjustment((await params).adjustmentId);
  return json({ ok: true });
});

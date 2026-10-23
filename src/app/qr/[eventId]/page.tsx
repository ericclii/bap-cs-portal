import type { Metadata } from "next";
import { orNotFound } from "@/server/page-guard";
import { requireCommitteePage } from "@/server/session";
import { getEventForCommittee } from "@/server/services/events";
import { QrDisplay } from "./qr-display";

export const metadata: Metadata = { title: "Check-in QR" };

export default async function QrPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requireCommitteePage(`/qr/${eventId}`);
  const event = await orNotFound(getEventForCommittee(eventId));
  return <QrDisplay eventId={event.id} title={event.title} />;
}

import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { utcToNyLocal } from "@/lib/time";
import { orNotFound } from "@/server/page-guard";
import { getEventForCommittee } from "@/server/services/events";
import { EventForm } from "../../event-form";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const e = await orNotFound(getEventForCommittee(eventId));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title={`Edit ${e.title}`} />
      <EventForm
        eventId={e.id}
        initial={{
          title: e.title,
          partnerOrg: e.partnerOrg ?? "",
          description: e.description ?? "",
          instructions: e.instructions ?? "",
          locationName: e.locationName ?? "",
          address: e.address ?? "",
          latitude: e.latitude,
          longitude: e.longitude,
          radiusMeters: e.radiusMeters,
          startsAtLocal: utcToNyLocal(e.startsAt),
          endsAtLocal: utcToNyLocal(e.endsAt),
          capacity: e.capacity,
          points: e.points,
          minMinutes: e.minMinutes,
          signupOpensAtLocal: utcToNyLocal(e.signupOpensAt),
          signupClosesAtLocal: utcToNyLocal(e.signupClosesAt),
          checkinMode: e.checkinMode,
          checkinOpensMinBefore: e.checkinOpensMinBefore,
          checkinClosesMinAfter: e.checkinClosesMinAfter,
          publish: e.publishedAt != null,
        }}
      />
    </div>
  );
}

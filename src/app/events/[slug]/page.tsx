import { Award, Info, ListChecks, Map } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { EventPass } from "@/components/event-pass";
import { BackLink, Group, Notice, Section } from "@/components/ui";
import { formatDuration } from "@/lib/event-window";
import { orNotFound } from "@/server/page-guard";
import { requireUser } from "@/server/session";
import { getEventForStudent, hasValidVenuePass } from "@/server/services/events";
import { venuePassCookieName } from "@/server/venue-qr";
import { EventActions } from "./event-actions";

export const metadata: Metadata = { title: "Event" };

export default async function StudentEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ scan?: string }>;
}) {
  const { slug } = await params;
  const { scan } = await searchParams;
  const user = await requireUser(`/events/${slug}`);
  const view = await orNotFound(getEventForStudent(slug, user.id));
  const { event } = view;
  const hasVenuePass =
    event.checkinMode === "QR" && (await hasValidVenuePass(event.id, (await cookies()).get(venuePassCookieName(event.id))?.value));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <BackLink href="/service">My service</BackLink>
        {scan === "expired" && <Notice tone="amber">That QR code expired. Scan the code on the screen again.</Notice>}
        {event.canceledAt && <Notice tone="crimson">This event was canceled. You don&apos;t need to do anything.</Notice>}

        <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-x-10 lg:space-y-0">
          <EventPass event={event} titleAs="h1" checkedInAt={view.mine?.attendance?.checkedInAt ?? null}>
            <div className="mt-4 border-t border-separator pt-4">
              <EventActions user={{ name: user.name }} hasVenuePass={hasVenuePass} view={JSON.parse(JSON.stringify(view))} />
            </div>
          </EventPass>

          <Section title="Details">
            <Group>
              <DetailRow icon={<Award className="h-[18px] w-[18px]" aria-hidden />} title={`${event.points} CS points`}>
                Stay at least {formatDuration(event.minMinutes)} to check out normally.
              </DetailRow>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="block transition-colors duration-150 hover:bg-fill/60">
                <DetailRow icon={<Map className="h-[18px] w-[18px]" aria-hidden />} title={event.address ?? "Directions"} link>
                  Open in Google Maps
                </DetailRow>
              </a>
              {event.instructions && (
                <DetailRow icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />} title="What to know">
                  <span className="whitespace-pre-line">{event.instructions}</span>
                </DetailRow>
              )}
              {event.description && (
                <DetailRow icon={<Info className="h-[18px] w-[18px]" aria-hidden />} title="About">
                  <span className="whitespace-pre-line">{event.description}</span>
                </DetailRow>
              )}
            </Group>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function DetailRow({ icon, title, children, link }: { icon: React.ReactNode; title: string; children: React.ReactNode; link?: boolean }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className="mt-0.5 text-secondary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-body font-medium ${link ? "text-crimson" : ""}`}>{title}</div>
        <div className="mt-0.5 text-body leading-relaxed text-secondary text-pretty">{children}</div>
      </div>
    </div>
  );
}

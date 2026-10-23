import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCurrentTerm } from "@/server/services/terms";
import { NewEventForm } from "./new-event-form";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  const term = await getCurrentTerm();
  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle title="New event" />
      <NewEventForm defaultPoints={term?.defaultEventPoints ?? 3} />
    </div>
  );
}

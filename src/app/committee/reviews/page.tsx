import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { openReviews } from "@/server/services/attendance";
import { ReviewList } from "./review-list";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const reviews = await openReviews();
  return (
    <div className="space-y-6">
      <PageTitle title="Reviews" subtitle="Location problems and early check-outs. Approving a location request records the check-in or check-out at the time it was asked." />
      <ReviewList reviews={JSON.parse(JSON.stringify(reviews))} />
    </div>
  );
}

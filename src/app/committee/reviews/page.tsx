import { redirect } from "next/navigation";

// Reviews are listed on the Events screen.
export default function ReviewsPage() {
  redirect("/committee/events#reviews");
}

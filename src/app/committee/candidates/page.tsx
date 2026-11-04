import { redirect } from "next/navigation";

// Candidates now live on the Points screen.
export default function CandidatesPage() {
  redirect("/committee/points");
}

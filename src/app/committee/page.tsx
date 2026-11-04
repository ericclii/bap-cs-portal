import { redirect } from "next/navigation";

// The committee area opens on Events, which leads with what needs attention.
export default function CommitteeHome() {
  redirect("/committee/events");
}

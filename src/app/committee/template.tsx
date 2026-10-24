import type { ReactNode } from "react";
import { PageTransition } from "@/components/page-transition";

// The committee layout keeps one shell across sections; the template remounts
// per page, so each section change gets the page transition.
export default function CommitteeTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

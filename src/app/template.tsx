import type { ReactNode } from "react";
import { PageTransition } from "@/components/page-transition";

// Remounts whenever the top-level section changes (My service, an event,
// Committee); the committee template covers moves between its sections.
export default function RootTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

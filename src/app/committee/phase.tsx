import { Pill, type Tone } from "@/components/ui";
import type { EventPhase } from "@/server/services/events";

const PHASES: Record<EventPhase, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  canceled: { label: "Canceled", tone: "neutral" },
  signups_upcoming: { label: "Opens soon", tone: "neutral" },
  signups_open: { label: "Sign-ups open", tone: "blue" },
  needs_selection: { label: "Pick who goes", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "green" },
  live: { label: "Live", tone: "crimson" },
  needs_finalize: { label: "Award points", tone: "amber" },
  finalized: { label: "Done", tone: "neutral" },
};

export function PhasePill({ phase }: { phase: EventPhase }) {
  const p = PHASES[phase];
  return <Pill tone={p.tone}>{p.label}</Pill>;
}

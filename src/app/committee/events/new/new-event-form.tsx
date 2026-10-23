"use client";

import { useState } from "react";
import { EventForm, defaultEventValues } from "../event-form";

/** Defaults depend on today's date, so they're built in the browser. */
export function NewEventForm({ defaultPoints }: { defaultPoints: number }) {
  const [initial] = useState(() => defaultEventValues(defaultPoints));
  return <EventForm initial={initial} />;
}

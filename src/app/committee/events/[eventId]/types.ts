import type { EventPhase } from "@/server/services/events";

export type ConsoleEvent = {
  id: string;
  slug: string;
  title: string;
  partnerOrg: string | null;
  locationName: string | null;
  address: string | null;
  startsAt: string;
  endsAt: string;
  startsAtLocal: string;
  capacity: number;
  points: number;
  minMinutes: number;
  signupOpensAt: string;
  signupClosesAt: string;
  checkinMode: "LINK" | "QR";
  checkinOpensMinBefore: number;
  checkinClosesMinAfter: number;
  publishedAt: string | null;
  selectionPublishedAt: string | null;
  finalizedAt: string | null;
  canceledAt: string | null;
  phase: EventPhase;
};

export type Review = {
  id: string;
  kind: "CHECKIN_LOCATION" | "CHECKOUT_LOCATION" | "EARLY_CHECKOUT";
  status: "OPEN" | "APPROVED" | "DENIED";
  message: string | null;
  requestedAt: string;
  distanceM: number | null;
  resolution: string | null;
};

export type Person = {
  id: string;
  netId: string;
  name: string;
  image: string | null;
  isCandidate: boolean;
  status: "APPLIED" | "SELECTED" | "WAITLISTED" | "DROPPED" | "REMOVED";
  waitlistPos: number | null;
  note: string | null;
  signedUpAt: string;
  droppedAt: string | null;
  dropReason: string | null;
  lateDrop: boolean;
  wasSelected: boolean;
  outcome: "ATTENDED" | "NO_SHOW" | "EXCUSED" | null;
  points: number | null;
  attendance: {
    checkedInAt: string;
    checkInMethod: "SELF" | "COMMITTEE";
    checkInDistanceM: number | null;
    checkInViaQr: boolean;
    checkedOutAt: string | null;
    earlyCheckout: boolean;
    earlyReason: string | null;
    lastSeenAt: string | null;
    lastSeenInside: boolean | null;
    leftAreaAt: string | null;
  } | null;
  reviews: Review[];
};

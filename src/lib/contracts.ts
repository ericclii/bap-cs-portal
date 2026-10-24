/**
 * Request contracts for the /api/v1 JSON API.
 *
 * Kept free of server-only imports so the same schemas can be shared with
 * the web client today and an Expo/React Native app later.
 */
import { z } from "zod";
import { normalizeNetId } from "./netid";

export const netIdField = z
  .string()
  .transform((v, ctx) => {
    const id = normalizeNetId(v);
    if (!id) {
      ctx.addIssue({ code: "custom", message: "Enter a NetID or an @nyu.edu / @stern.nyu.edu email" });
      return z.NEVER;
    }
    return id;
  });

/** Local wall-clock time in New York, e.g. 2026-10-24T09:00. */
const nyDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use YYYY-MM-DDTHH:mm");

const optionalText = (max: number) => z.string().trim().max(max).nullish();

export const eventInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  partnerOrg: optionalText(140),
  description: optionalText(5000),
  instructions: optionalText(3000),
  locationName: optionalText(200),
  address: optionalText(300),
  latitude: z.number({ error: "Drop the venue pin on the map" }).min(-90).max(90),
  longitude: z.number({ error: "Drop the venue pin on the map" }).min(-180).max(180),
  radiusMeters: z.number().int().min(25).max(2000).default(150),
  startsAtLocal: nyDateTime,
  endsAtLocal: nyDateTime,
  capacity: z.number().int().min(1).max(500),
  points: z.number().int().min(0).max(50).default(3),
  minMinutes: z.number().int().min(0).max(24 * 60),
  signupOpensAtLocal: nyDateTime,
  signupClosesAtLocal: nyDateTime,
  checkinMode: z.enum(["LINK", "QR"]).default("LINK"),
  checkinOpensMinBefore: z.number().int().min(0).max(240).default(30),
  checkinClosesMinAfter: z.number().int().min(0).max(24 * 60).default(60),
  publish: z.boolean().default(true),
});

export type EventInput = z.infer<typeof eventInput>;

export const signupInput = z.object({ note: optionalText(300) });

export const dropInput = z.object({ reason: z.string().trim().min(3, "Tell the committee why").max(500) });

export const positionInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().min(0),
});

export const checkInInput = z.object({
  position: positionInput.nullish(),
  /** Code read from the venue QR (mobile apps send it directly). */
  venueCode: z.string().max(64).nullish(),
});

export const checkOutInput = z.object({
  position: positionInput.nullish(),
  /** Required when checking out before the minimum time. */
  earlyReason: z.string().trim().max(500).nullish(),
});

export const reviewRequestInput = z.object({
  kind: z.enum(["CHECKIN_LOCATION", "CHECKOUT_LOCATION"]),
  message: z.string().trim().min(3, "Add a short note for the committee").max(500),
  position: positionInput.nullish(),
});

export const presenceInput = z.object({ position: positionInput });

export const resolveReviewInput = z.object({
  decision: z.enum(["APPROVED", "DENIED"]),
  note: optionalText(500),
});

export const selectionInput = z.object({
  /** Signup ids in final order: the first `capacity` are selected, the rest waitlisted. */
  selected: z.array(z.string()).max(500),
  waitlist: z.array(z.string()).max(2000),
});

export const outcomeInput = z.object({
  outcomes: z
    .array(
      z.object({
        signupId: z.string(),
        outcome: z.enum(["ATTENDED", "NO_SHOW", "EXCUSED"]),
        points: z.number().int().min(-50).max(50),
        note: optionalText(300),
      }),
    )
    .max(1000),
});

export const adjustmentInput = z.object({
  netIds: z.array(netIdField).min(1).max(1000),
  points: z.number().int().min(-50).max(50).refine((v) => v !== 0, "Points can't be 0"),
  reason: z.string().trim().min(2, "Add a reason").max(200),
});

export const rosterInput = z.object({
  rows: z.array(z.object({ netId: netIdField, name: optionalText(120) })).min(1).max(2000),
  replace: z.boolean().default(false),
});

export const importPointsInput = z.object({
  rows: z
    .array(z.object({ netId: netIdField, name: optionalText(120), points: z.number().int().min(-500).max(500) }))
    .min(1)
    .max(2000),
  reason: z.string().trim().min(2).max(200).default("Imported from previous tracker"),
});

/** Points rules a chair can change between semesters. */
export const termRules = {
  defaultEventPoints: z.number().int().min(0).max(50),
  noShowPenalty: z.number().int().min(-50).max(0),
  lateDropHours: z.number().int().min(0).max(14 * 24),
};

export const termInput = z.object({
  name: z.string().trim().min(2).max(40),
  makeCurrent: z.boolean().default(true),
});

export const termUpdateInput = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  makeCurrent: z.boolean().optional(),
  defaultEventPoints: termRules.defaultEventPoints.optional(),
  noShowPenalty: termRules.noShowPenalty.optional(),
  lateDropHours: termRules.lateDropHours.optional(),
});

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-24")
  .nullable();

/** A checkpoint: a name, the points it takes, and the day it falls due (null = end of semester). */
export const checkpointInput = z.object({
  name: z.string().trim().min(2).max(60),
  points: z.number().int().min(0).max(500),
  dueDate,
});

export const checkpointUpdateInput = checkpointInput.partial();

export const committeeInput = z.object({
  netId: netIdField,
  role: z.enum(["CHAIR", "MEMBER"]).default("MEMBER"),
});

export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } };

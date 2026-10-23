import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Rotating venue QR codes.
 *
 * The venue screen shows a QR whose code is HMAC(event.qrSecret, timeStep).
 * Codes rotate every STEP_SECONDS; a scanned code is accepted for the
 * current step plus GRACE_STEPS previous ones, so a photo of the screen sent
 * to a friend stops working within about a minute.
 */
export const STEP_SECONDS = 20;
const GRACE_STEPS = 2;
const CODE_LENGTH = 10;

export function newQrSecret(): string {
  return randomBytes(32).toString("base64url");
}

function codeForStep(secret: string, step: number): string {
  return createHmac("sha256", secret)
    .update(`venue:${step}`)
    .digest("base64url")
    .slice(0, CODE_LENGTH);
}

function stepAt(nowMs: number): number {
  return Math.floor(nowMs / 1000 / STEP_SECONDS);
}

export function currentVenueCode(secret: string, nowMs = Date.now()) {
  const step = stepAt(nowMs);
  return {
    code: codeForStep(secret, step),
    rotatesAt: new Date((step + 1) * STEP_SECONDS * 1000),
  };
}

export function verifyVenueCode(secret: string, code: string, nowMs = Date.now()): boolean {
  if (typeof code !== "string" || code.length !== CODE_LENGTH) return false;
  const step = stepAt(nowMs);
  const given = Buffer.from(code);
  for (let i = 0; i <= GRACE_STEPS; i++) {
    const expected = Buffer.from(codeForStep(secret, step - i));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return true;
  }
  return false;
}

/**
 * A scan can be followed by a Google sign-in round trip that outlasts the
 * code itself, so a valid scan is exchanged for a short-lived "venue pass"
 * bound to the event. Check-in accepts either a fresh code or this pass.
 */
const PASS_TTL_SECONDS = 15 * 60;

function passSignature(secret: string, eventId: string, exp: number) {
  return createHmac("sha256", secret).update(`pass:${eventId}:${exp}`).digest("base64url");
}

export function issueVenuePass(secret: string, eventId: string, nowMs = Date.now()) {
  const exp = Math.floor(nowMs / 1000) + PASS_TTL_SECONDS;
  return { value: `${exp}.${passSignature(secret, eventId, exp)}`, maxAge: PASS_TTL_SECONDS };
}

export function verifyVenuePass(
  secret: string,
  eventId: string,
  value: string | undefined,
  nowMs = Date.now(),
): boolean {
  if (!value) return false;
  const [expRaw, sig] = value.split(".");
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || !sig || exp * 1000 < nowMs) return false;
  const expected = Buffer.from(passSignature(secret, eventId, exp));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function venuePassCookieName(eventId: string) {
  return `venue_pass_${eventId}`;
}

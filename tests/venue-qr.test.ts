import { describe, expect, it } from "vitest";
import {
  currentVenueCode,
  issueVenuePass,
  newQrSecret,
  STEP_SECONDS,
  verifyVenueCode,
  verifyVenuePass,
} from "@/server/venue-qr";

const secret = newQrSecret();
const t0 = Date.UTC(2026, 9, 22, 18, 0, 0);

describe("rotating venue codes", () => {
  it("accepts the current code", () => {
    const { code } = currentVenueCode(secret, t0);
    expect(verifyVenueCode(secret, code, t0)).toBe(true);
  });
  it("accepts a code for a short grace period, then rejects it", () => {
    const { code } = currentVenueCode(secret, t0);
    expect(verifyVenueCode(secret, code, t0 + 2 * STEP_SECONDS * 1000)).toBe(true);
    expect(verifyVenueCode(secret, code, t0 + 3 * STEP_SECONDS * 1000)).toBe(false);
  });
  it("rejects codes from another event's secret", () => {
    const { code } = currentVenueCode(newQrSecret(), t0);
    expect(verifyVenueCode(secret, code, t0)).toBe(false);
  });
  it("rotates every step", () => {
    const a = currentVenueCode(secret, t0).code;
    const b = currentVenueCode(secret, t0 + STEP_SECONDS * 1000).code;
    expect(a).not.toBe(b);
  });
});

describe("venue pass", () => {
  it("is bound to the event and expires", () => {
    const pass = issueVenuePass(secret, "evt_1", t0);
    expect(verifyVenuePass(secret, "evt_1", pass.value, t0 + 60_000)).toBe(true);
    expect(verifyVenuePass(secret, "evt_2", pass.value, t0)).toBe(false);
    expect(verifyVenuePass(secret, "evt_1", pass.value, t0 + 16 * 60_000)).toBe(false);
    expect(verifyVenuePass(secret, "evt_1", "123.forged", t0)).toBe(false);
  });
});

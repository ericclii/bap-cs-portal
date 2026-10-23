import { describe, expect, it } from "vitest";
import {
  attendedMinutes,
  checkinWindowState,
  checkoutDeadline,
  checkoutUnlocksAt,
  formatDuration,
  isLateDrop,
  sameNyDay,
  signupWindowState,
} from "@/lib/event-window";

const e = {
  startsAt: new Date("2026-10-24T13:00:00Z"), // 9:00 AM New York
  endsAt: new Date("2026-10-24T17:00:00Z"), // 1:00 PM
  checkinOpensMinBefore: 30,
  checkinClosesMinAfter: 60,
  minMinutes: 180,
};

describe("check-in window", () => {
  it("opens N minutes before the start", () => {
    expect(checkinWindowState(e, new Date("2026-10-24T12:29:00Z"))).toBe("before");
    expect(checkinWindowState(e, new Date("2026-10-24T12:30:00Z"))).toBe("open");
  });
  it("closes N minutes after the start for late arrivals", () => {
    expect(checkinWindowState(e, new Date("2026-10-24T14:00:00Z"))).toBe("open");
    expect(checkinWindowState(e, new Date("2026-10-24T14:01:00Z"))).toBe("closed");
  });
});

describe("check-out", () => {
  it("unlocks after the minimum time on site", () => {
    expect(checkoutUnlocksAt(e, new Date("2026-10-24T13:05:00Z")).toISOString()).toBe("2026-10-24T16:05:00.000Z");
  });
  it("never requires staying past the end, even for late arrivals", () => {
    expect(checkoutUnlocksAt(e, new Date("2026-10-24T14:30:00Z")).toISOString()).toBe("2026-10-24T17:00:00.000Z");
  });
  it("closes a few hours after the end", () => {
    expect(checkoutDeadline(e).toISOString()).toBe("2026-10-24T20:00:00.000Z");
  });
});

describe("sign-ups and drops", () => {
  it("knows when sign-ups are open", () => {
    const w = { signupOpensAt: new Date("2026-10-19T14:00:00Z"), signupClosesAt: new Date("2026-10-21T14:00:00Z") };
    expect(signupWindowState(w, new Date("2026-10-19T13:59:00Z"))).toBe("before");
    expect(signupWindowState(w, new Date("2026-10-20T00:00:00Z"))).toBe("open");
    expect(signupWindowState(w, new Date("2026-10-21T14:01:00Z"))).toBe("closed");
  });
  it("flags drops within 24 hours as late", () => {
    expect(isLateDrop(e, 24, new Date("2026-10-23T12:00:00Z"))).toBe(false);
    expect(isLateDrop(e, 24, new Date("2026-10-23T14:00:00Z"))).toBe(true);
    expect(isLateDrop(e, 48, new Date("2026-10-23T12:00:00Z"))).toBe(true);
  });
  it("compares calendar days in New York, not UTC", () => {
    // 9 PM and 11 PM New York on Oct 24 are different UTC days.
    expect(sameNyDay(new Date("2026-10-25T01:00:00Z"), new Date("2026-10-25T03:00:00Z"))).toBe(true);
    expect(sameNyDay(new Date("2026-10-24T13:00:00Z"), new Date("2026-10-25T05:00:00Z"))).toBe(false);
  });
});

describe("durations", () => {
  it("computes and formats minutes", () => {
    const m = attendedMinutes(new Date("2026-10-24T13:05:00Z"), new Date("2026-10-24T14:50:00Z"));
    expect(m).toBe(105);
    expect(formatDuration(m)).toBe("1h 45m");
    expect(formatDuration(null)).toBe("—");
  });
});

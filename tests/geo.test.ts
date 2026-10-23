import { describe, expect, it } from "vitest";
import { checkGeofence, distanceMeters } from "@/lib/geo";

const venue = { latitude: 40.7484, longitude: -73.9857 }; // Empire State Building

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(venue, venue)).toBe(0);
  });
  it("matches a known distance (~1.1 km per 0.01° latitude)", () => {
    const d = distanceMeters(venue, { latitude: 40.7584, longitude: -73.9857 });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1120);
  });
});

describe("checkGeofence", () => {
  it("accepts a point inside the radius", () => {
    const r = checkGeofence(venue, 150, { latitude: 40.7489, longitude: -73.9857, accuracyM: 10 });
    expect(r.ok).toBe(true);
  });
  it("forgives part of the reported accuracy at the edge", () => {
    // ~190 m away, 50 m accuracy, 150 m fence: 190 - 50 <= 150
    const p = { latitude: 40.7501, longitude: -73.9857, accuracyM: 50 };
    expect(checkGeofence(venue, 150, p).ok).toBe(true);
  });
  it("caps the forgiveness so a vague fix can't stretch the fence", () => {
    const p = { latitude: 40.7520, longitude: -73.9857, accuracyM: 240 }; // ~400 m
    const r = checkGeofence(venue, 150, p);
    expect(r).toMatchObject({ ok: false, reason: "outside" });
  });
  it("rejects very inaccurate fixes", () => {
    const p = { ...venue, accuracyM: 1000 };
    expect(checkGeofence(venue, 150, p)).toMatchObject({ ok: false, reason: "inaccurate" });
  });
});

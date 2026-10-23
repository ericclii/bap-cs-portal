const EARTH_RADIUS_M = 6_371_000;

export type LatLng = { latitude: number; longitude: number };

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** GPS fixes worse than this are rejected; the attendee is asked to retry. */
export const MAX_ACCEPTED_ACCURACY_M = 250;
/** How much of a fix's reported uncertainty we forgive at the fence edge. */
const MAX_ACCURACY_SLACK_M = 75;

export type GeofenceResult =
  | { ok: true; distanceM: number }
  | { ok: false; reason: "inaccurate" | "outside"; distanceM: number | null };

/**
 * Accepts a position when it is inside the fence, giving the benefit of the
 * doubt for part of the reported GPS accuracy (indoor fixes are often noisy).
 */
export function checkGeofence(
  center: LatLng,
  radiusM: number,
  position: LatLng & { accuracyM: number },
): GeofenceResult {
  const distanceM = Math.round(distanceMeters(center, position));
  if (!(position.accuracyM >= 0) || position.accuracyM > MAX_ACCEPTED_ACCURACY_M) {
    return { ok: false, reason: "inaccurate", distanceM };
  }
  const slack = Math.min(position.accuracyM, MAX_ACCURACY_SLACK_M);
  if (distanceM - slack <= radiusM) return { ok: true, distanceM };
  return { ok: false, reason: "outside", distanceM };
}

"use client";

export type Position = { latitude: number; longitude: number; accuracyM: number };

/** One fresh, high-accuracy fix, with errors phrased for the person holding the phone. */
export function getPosition(options: { maximumAgeMs?: number } = {}): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser can't share your location. Try Safari or Chrome."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracyM: pos.coords.accuracy }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location is blocked for this site. Allow location in your browser settings, then try again."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Your phone took too long to find your location. Try again, ideally near a window or entrance."));
        } else {
          reject(new Error("Couldn't get your location. Try again in a moment."));
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: options.maximumAgeMs ?? 0 },
    );
  });
}

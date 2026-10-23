"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { Mark } from "@/components/mark";
import { api } from "@/lib/api-client";

type VenueCode = { code: string; url: string; rotatesAt: string; stepSeconds: number; checkedIn: number; confirmed: number };

/**
 * Shown on a committee member's phone or laptop on site. The code rotates
 * every 20 seconds, so a screenshot sent to someone off site stops working.
 */
export function QrDisplay({ eventId, title }: { eventId: string; title: string }) {
  const [data, setData] = useState<VenueCode | null>(null);
  const [svg, setSvg] = useState("");
  const [offline, setOffline] = useState(false);
  const [remaining, setRemaining] = useState(1);

  const load = useCallback(async () => {
    try {
      setData(await api<VenueCode>(`/committee/events/${eventId}/venue-code`));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [eventId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const url = data?.url;
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then((s) => !cancelled && setSvg(s));
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (!data) return;
    const tick = () => {
      const ms = new Date(data.rotatesAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.min(1, ms / (data.stepSeconds * 1000))));
      if (ms <= 0) load();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [data, load]);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => void lock?.release().catch(() => {});
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ground px-6 py-8 text-text">
      <div className="flex flex-col items-center gap-4 text-center">
        <Mark size={56} />
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
      </div>
      <div className="w-full max-w-[min(56vh,520px)]">
        <div className="relative aspect-square rounded-3xl bg-surface p-4 ring-1 ring-rule">
          {svg ? (
            <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="h-full w-full animate-pulse rounded-2xl bg-fill" />
          )}
          {offline && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-surface/90 text-center text-lg font-medium text-crimson">
              No connection. Reconnecting…
            </div>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fill" aria-hidden>
          <div className="h-full bg-text transition-[width] duration-200 ease-linear" style={{ width: `${remaining * 100}%` }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-medium sm:text-2xl">Scan with your phone camera to check in</p>
        <p className="mt-1 text-secondary">The code changes every few seconds.</p>
      </div>
      {data && (
        <p className="text-lg text-secondary tabular-nums">
          <span className="font-semibold text-text">{data.checkedIn}</span> of {data.confirmed} checked in
        </p>
      )}
    </main>
  );
}

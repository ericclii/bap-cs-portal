"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const stripQuery = (url: string) => url.split("?")[0];

/**
 * Vercel Web Analytics (cookieless, aggregate page views) and Speed
 * Insights (real-user load performance). Query strings are dropped before
 * sending so sign-in return paths and scan results never leave the app.
 */
export function Analytics() {
  return (
    <>
      <VercelAnalytics beforeSend={(event) => ({ ...event, url: stripQuery(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: stripQuery(event.url) })} />
    </>
  );
}

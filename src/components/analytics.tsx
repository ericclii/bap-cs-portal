"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics (cookieless, aggregate page views). Query strings
 * are dropped before sending so sign-in return paths and scan results
 * never reach analytics.
 */
export function Analytics() {
  return <VercelAnalytics beforeSend={(event) => ({ ...event, url: event.url.split("?")[0] })} />;
}

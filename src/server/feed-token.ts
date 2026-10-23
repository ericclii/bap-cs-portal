import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Secret token for the Google Sheets points feed. Derived from the app
 * secret; change FEED_TOKEN_VERSION to revoke links that were shared.
 */
export function feedToken(): string {
  const version = process.env.FEED_TOKEN_VERSION ?? "1";
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev").update(`points-feed:${version}`).digest("base64url").slice(0, 32);
}

export function verifyFeedToken(token: string): boolean {
  const expected = Buffer.from(feedToken());
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

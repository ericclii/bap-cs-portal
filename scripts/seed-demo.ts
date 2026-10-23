/**
 * Creates a practice event for a committee dry run.
 *
 *   npm run seed:demo -- --start 2026-10-27T17:00 [--minutes 60] [--qr]
 *
 * The event is at NYU Stern (44 W 4th St), worth 0 points so it never
 * affects real standings, with sign-ups open from now until 15 minutes
 * before the start. Uses DATABASE_URL, so point it at the database you
 * want (local or production). Creates the current term if none exists.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { fromZonedTime } from "date-fns-tz";
import { PrismaClient } from "../src/generated/prisma/client";

const STERN = { latitude: 40.72906, longitude: -73.99645 };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const start = arg("start");
  if (!start || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)) {
    console.error("Usage: npm run seed:demo -- --start YYYY-MM-DDTHH:mm [--minutes 60] [--qr]   (New York time)");
    process.exit(1);
  }
  const minutes = Number(arg("minutes") ?? 60);
  const qr = process.argv.includes("--qr");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    let term = await db.term.findFirst({ where: { isCurrent: true } });
    if (!term) {
      term = await db.term.create({ data: { name: "Fall 2026", requiredPoints: 12, isCurrent: true } });
      console.log(`Created current term ${term.name}`);
    }

    const startsAt = fromZonedTime(start, "America/New_York");
    const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
    const now = new Date();
    if (startsAt.getTime() - now.getTime() < 20 * 60_000) {
      console.error("Pick a start at least 20 minutes from now so sign-ups have time to open and close.");
      process.exit(1);
    }

    const slug = Array.from(randomBytes(8), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
    const event = await db.event.create({
      data: {
        termId: term.id,
        slug,
        qrSecret: randomBytes(32).toString("base64url"),
        title: "[Dry run] Portal practice",
        partnerOrg: "BAP CS Committee",
        description: "A practice event to test the portal end to end. Worth 0 points.",
        instructions: "Meet in the Stern lobby. Try signing up, checking in, and checking out. Try once from a block away too.",
        locationName: "NYU Stern, Kaufman Management Center",
        address: "44 W 4th St, New York, NY",
        ...STERN,
        radiusMeters: 150,
        startsAt,
        endsAt,
        capacity: 20,
        points: 0,
        minMinutes: Math.min(30, minutes),
        signupOpensAt: now,
        signupClosesAt: new Date(startsAt.getTime() - 15 * 60_000),
        checkinMode: qr ? "QR" : "LINK",
        checkinOpensMinBefore: 15,
        checkinClosesMinAfter: Math.min(30, minutes),
        publishedAt: now,
      },
    });
    const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    console.log(`Created "${event.title}" (${qr ? "QR" : "link"} check-in), ${minutes} min starting ${start} New York time.`);
    console.log(`Student link:   ${base}/events/${event.slug}`);
    console.log(`Committee view: ${base}/committee/events/${event.id}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

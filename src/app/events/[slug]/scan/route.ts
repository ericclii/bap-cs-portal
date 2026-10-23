import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { issueVenuePass, venuePassCookieName, verifyVenueCode } from "@/server/venue-qr";

type P = { slug: string };

/**
 * Target of the rotating on-site QR. A valid code is exchanged for a
 * short-lived, httpOnly venue pass so there's time to sign in.
 */
export async function GET(req: Request, { params }: { params: Promise<P> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("c") ?? "";
  const event = await db.event.findUnique({ where: { slug }, select: { id: true, qrSecret: true } });
  const dest = new URL(`/events/${slug}`, url.origin);
  if (!event) return NextResponse.redirect(dest);

  if (!verifyVenueCode(event.qrSecret, code)) {
    dest.searchParams.set("scan", "expired");
    return NextResponse.redirect(dest);
  }
  const pass = issueVenuePass(event.qrSecret, event.id);
  dest.searchParams.set("scan", "ok");
  const res = NextResponse.redirect(dest);
  res.cookies.set(venuePassCookieName(event.id), pass.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: pass.maxAge,
  });
  return res;
}

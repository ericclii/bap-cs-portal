import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { netIdFromEmail } from "@/lib/netid";
import { auth } from "./auth";
import { db } from "./db";
import { ApiError, forbidden } from "./http";

export type Role = "CHAIR" | "MEMBER";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  netId: string;
  /** Committee role, or null for students. */
  role: Role | null;
};

/** NetIDs that are always chairs, so a fresh deployment has someone in charge. */
function bootstrapChairs(): string[] {
  return (process.env.CHAIR_NETIDS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function toCurrentUser(u: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  netId?: string | null;
}): Promise<CurrentUser | null> {
  const netId = u.netId ?? netIdFromEmail(u.email);
  if (!netId) return null;
  const member = await db.committeeMember.findUnique({ where: { netId } });
  const role: Role | null = member?.role ?? (bootstrapChairs().includes(netId) ? "CHAIR" : null);
  return { id: u.id, name: u.name, email: u.email, image: u.image ?? null, netId, role };
}

/** The signed-in user for the current page render, or null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? toCurrentUser(session.user) : null;
});

/** For pages: redirects to sign-in (and back to `returnTo`) when signed out. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For committee pages: students are sent to their own dashboard. */
export async function requireCommitteePage(returnTo: string, role: Role = "MEMBER"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!user.role || (role === "CHAIR" && user.role !== "CHAIR")) redirect("/");
  return user;
}

/** For API routes: accepts the session cookie or `Authorization: Bearer`. */
export async function requireApiUser(req: Request): Promise<CurrentUser> {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session ? await toCurrentUser(session.user) : null;
  if (!user) throw new ApiError(401, "unauthenticated", "Sign in to continue");
  return user;
}

export async function requireCommittee(req: Request, role: Role = "MEMBER"): Promise<CurrentUser> {
  const user = await requireApiUser(req);
  if (!user.role) throw forbidden("Only the CS committee can do this");
  if (role === "CHAIR" && user.role !== "CHAIR") throw forbidden("Only chairs can do this");
  return user;
}

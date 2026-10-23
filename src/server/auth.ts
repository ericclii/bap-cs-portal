import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins";
import { canonicalEmail, netIdFromEmail } from "@/lib/netid";
import { db } from "./db";

/**
 * Dev-only NetID sign-in, for testing several "people" locally without real
 * Google accounts. Never enabled in production builds.
 */
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_LOGIN === "true";

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  user: {
    additionalFields: {
      netId: { type: "string", required: false, input: false },
    },
  },
  emailAndPassword: { enabled: devLoginEnabled, minPasswordLength: 8 },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
          // Map @stern.nyu.edu to the person's canonical @nyu.edu identity
          // *before* lookup, so both addresses sign in to the same account.
          mapProfileToUser: (profile) => {
            const netId = profile.email_verified ? netIdFromEmail(profile.email) : null;
            return netId ? { email: canonicalEmail(netId), netId } : {};
          },
        },
      }
    : undefined,
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        // Only NYU accounts may create a user; store the NetID.
        before: async (user) => {
          const netId = netIdFromEmail(user.email);
          if (!netId) {
            throw new APIError("FORBIDDEN", {
              message: "Sign in with your NYU Google account (NetID@nyu.edu or NetID@stern.nyu.edu).",
            });
          }
          return { data: { ...user, email: canonicalEmail(netId), netId } };
        },
      },
    },
  },
  // `bearer` lets future iOS/Android clients send `Authorization: Bearer …`
  // instead of cookies; `nextCookies` must stay last.
  plugins: [bearer(), nextCookies()],
});

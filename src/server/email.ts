import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";

/**
 * Sends email through the committee's Gmail account (free, ~500/day) using
 * an app password. Without credentials, messages are only logged to the
 * EmailMessage table so local development works with no setup.
 */
const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;
export const emailConfigured = Boolean(gmailUser && gmailPassword);

const transport = emailConfigured
  ? nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPassword } })
  : null;

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "BAP Community Service";

export function appUrl(path = ""): string {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  kind: string;
  eventId?: string | null;
};

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  const record = await db.emailMessage.create({
    data: {
      to: message.to,
      subject: message.subject,
      body: message.text,
      kind: message.kind,
      eventId: message.eventId ?? null,
      status: transport ? "queued" : "logged",
    },
  });
  if (!transport) {
    if (process.env.NODE_ENV !== "test") console.info(`[email:logged] ${message.kind} → ${message.to}: ${message.subject}`);
    return;
  }
  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${gmailUser}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    await db.emailMessage.update({ where: { id: record.id }, data: { status: "sent", sentAt: new Date() } });
  } catch (err) {
    console.error("Email failed", err);
    await db.emailMessage.update({
      where: { id: record.id },
      data: { status: "failed", error: String((err as Error).message ?? err).slice(0, 500) },
    });
  }
}

/** Sends a batch sequentially (Gmail rate-limits parallel SMTP sessions). */
export async function sendEmails(messages: OutgoingEmail[]): Promise<void> {
  for (const m of messages) await sendEmail(m);
}

/** Canonical emails of everyone on the committee, for committee alerts. */
export async function committeeEmails(): Promise<string[]> {
  const members = await db.committeeMember.findMany({ select: { netId: true } });
  const bootstrap = (process.env.CHAIR_NETIDS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const netIds = [...new Set([...members.map((m) => m.netId), ...bootstrap])];
  return netIds.map((n) => `${n}@nyu.edu`);
}

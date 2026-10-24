"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { normalizeNetId } from "@/lib/netid";
import { Button, Notice, inputClass } from "./ui";

/** Only for local development (see ALLOW_DEV_LOGIN); one shared password. */
const DEV_PASSWORD = "dev-password-123";

export function SignInPanel({
  next,
  googleConfigured,
  devLoginEnabled,
  initialError,
}: {
  next: string;
  googleConfigured: boolean;
  devLoginEnabled: boolean;
  initialError: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [devNetId, setDevNetId] = useState("");
  const [devName, setDevName] = useState("");

  async function google() {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: `/signin?error=google&next=${encodeURIComponent(next)}`,
    });
    if (res.error) {
      setError(res.error.message ?? "Couldn't start Google sign-in. Try again.");
      setBusy(false);
    }
  }

  async function devSignIn(e: React.FormEvent) {
    e.preventDefault();
    const netId = normalizeNetId(devNetId);
    if (!netId) {
      setError("Enter a NetID like ab1234.");
      return;
    }
    setBusy(true);
    setError(null);
    const email = `${netId}@nyu.edu`;
    const signIn = await authClient.signIn.email({ email, password: DEV_PASSWORD });
    if (signIn.error) {
      const signUp = await authClient.signUp.email({ email, password: DEV_PASSWORD, name: devName.trim() || netId });
      if (signUp.error) {
        setError(signUp.error.message ?? "Dev sign-in failed.");
        setBusy(false);
        return;
      }
    }
    window.location.assign(next);
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="crimson">{error}</Notice>}
      {googleConfigured ? (
        <div className="flex justify-center">
          <Button size="lg" className="px-8" onClick={google} disabled={busy}>
            Login with NYU Account
          </Button>
        </div>
      ) : (
        <Notice tone="amber">
          Google sign-in isn&apos;t configured. Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>.
        </Notice>
      )}
      <p className="text-center text-footnote leading-snug text-secondary">
        Use your NYU or Stern Google account.
      </p>

      {devLoginEnabled && (
        <form onSubmit={devSignIn} className="mt-8 space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-rule">
          <div>
            <p className="text-footnote font-semibold text-amber">Development sign-in</p>
            <p className="mt-0.5 text-footnote text-secondary">Act as any NetID. Disabled in production.</p>
          </div>
          <label className="sr-only" htmlFor="dev-netid">NetID</label>
          <input id="dev-netid" required className={inputClass} value={devNetId} onChange={(e) => setDevNetId(e.target.value)} placeholder="NetID" autoCapitalize="none" autoCorrect="off" />
          <label className="sr-only" htmlFor="dev-name">Name (first time)</label>
          <input id="dev-name" className={inputClass} value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="Name (first time only)" />
          <Button type="submit" variant="secondary" className="w-full" disabled={busy || !devNetId}>
            Sign in as NetID
          </Button>
        </form>
      )}
    </div>
  );
}

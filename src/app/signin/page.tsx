import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/app-shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { safeNext } from "@/lib/safe-redirect";
import { devLoginEnabled, googleConfigured } from "@/server/auth";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next, "/");
  if (await getCurrentUser()) redirect(next);
  const error = params.error
    ? "Couldn't sign you in. Choose your NYU Google account (NetID@nyu.edu or NetID@stern.nyu.edu)."
    : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex flex-col items-center text-center">
        <Mark size={96} />
        <h1 className="mt-6 text-display font-bold">BAP Community Service</h1>
        <p className="mt-1 text-body text-secondary">Beta Alpha Psi · Mu Chapter</p>
      </div>
      <div className="mt-10">
        <SignInPanel next={next} googleConfigured={googleConfigured} devLoginEnabled={devLoginEnabled} initialError={error} />
      </div>
      <p className="mt-10 text-center text-footnote text-secondary">
        <Link href="/privacy" className="underline underline-offset-2 hover:text-text">Privacy policy</Link>
      </p>
    </main>
  );
}

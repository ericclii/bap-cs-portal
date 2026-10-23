"use client";

import { TriangleAlert } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <TriangleAlert className="h-7 w-7 text-amber" aria-hidden />
      <h1 className="mt-3 text-title font-bold">This page didn&apos;t load</h1>
      <p className="mt-1 text-body leading-snug text-secondary">
        Something went wrong on our end. Your check-ins and points are safe. Try again, or go back to your events.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">My service</LinkButton>
      </div>
    </main>
  );
}

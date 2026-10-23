import { SearchX } from "lucide-react";
import { Mark } from "@/components/app-shell";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <Mark size={44} />
      <SearchX className="mt-8 h-7 w-7 text-tertiary" aria-hidden />
      <h1 className="mt-3 text-[22px] font-bold tracking-[-0.02em]">Page not found</h1>
      <p className="mt-1 text-[15px] leading-snug text-secondary">
        The link may be old, or the event was removed. If someone sent it to you, ask them for a new one.
      </p>
      <LinkButton href="/" className="mt-6">Go to My service</LinkButton>
    </main>
  );
}

"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "./ui";

type Props = { user: { name: string; email: string; image: string | null; netId: string; role: "CHAIR" | "MEMBER" | null } };

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  }

  const item = "flex w-full items-center rounded-lg px-3 py-2 text-left text-body hover:bg-ground";

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hit flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-200 hover:opacity-80"
      >
        {/* Phones get a menu icon; wider screens show who is signed in. */}
        <span className="sm:hidden" aria-hidden>
          {open ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
        </span>
        <span className="hidden sm:flex">
          <Avatar name={user.name} image={user.image} size={32} />
        </span>
        <span className="sr-only">Menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-2xl bg-surface p-1.5 pop-in shadow-pop">
          <div className="px-3 pt-2 pb-2.5">
            <div className="truncate text-body font-semibold">{user.name}</div>
            <div className="truncate text-footnote text-secondary">{user.netId}@nyu.edu</div>
          </div>
          {user.role && (
            <div className="mt-1 py-1 sm:hidden">
              <Link role="menuitem" href="/service" className={item} onClick={() => setOpen(false)}>My service</Link>
              <Link role="menuitem" href="/committee" className={item} onClick={() => setOpen(false)}>Committee</Link>
            </div>
          )}
          <div className="mt-1 pt-1">
            <button role="menuitem" type="button" onClick={signOut} className={`${item} text-crimson`}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

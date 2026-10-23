"use client";

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

  const item = "flex w-full items-center rounded-lg px-3 py-2 text-left text-body hover:bg-fill";

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hit flex rounded-full transition-opacity duration-150 hover:opacity-80"
      >
        <Avatar name={user.name} image={user.image} size={32} />
        <span className="sr-only">Account</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-2xl bg-surface p-1.5 shadow-[0_12px_32px_rgb(46_46_46/0.12)] ring-1 ring-rule">
          <div className="px-3 pt-2 pb-2.5">
            <div className="truncate text-body font-semibold">{user.name}</div>
            <div className="truncate text-footnote text-secondary">{user.netId}@nyu.edu</div>
          </div>
          {user.role && (
            <div className="border-t border-separator py-1 sm:hidden">
              <Link role="menuitem" href="/" className={item} onClick={() => setOpen(false)}>My service</Link>
              <Link role="menuitem" href="/committee" className={item} onClick={() => setOpen(false)}>Committee</Link>
            </div>
          )}
          <div className="border-t border-separator pt-1">
            <button role="menuitem" type="button" onClick={signOut} className={`${item} text-crimson`}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

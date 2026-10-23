"use client";

import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

export type MenuItem = { label: string; onSelect?: () => void; href?: string };

/** A "more actions" button with a small popover list. */
export function MenuButton({ items, label = "More actions", align = "right" }: { items: MenuItem[]; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full rounded-lg px-3 py-2 text-left text-body hover:bg-fill";
  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Ellipsis className="h-4 w-4" aria-hidden />
      </Button>
      {open && (
        <div role="menu" className={`absolute ${align === "left" ? "left-0" : "right-0"} z-40 mt-2 w-60 rounded-2xl bg-surface p-1.5 shadow-[0_12px_32px_rgb(46_46_46/0.12)] ring-1 ring-rule`}>
          {items.map((i) =>
            i.href ? (
              <a key={i.label} role="menuitem" href={i.href} className={item} onClick={() => setOpen(false)}>
                {i.label}
              </a>
            ) : (
              <button key={i.label} role="menuitem" type="button" className={item} onClick={() => { setOpen(false); i.onSelect?.(); }}>
                {i.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

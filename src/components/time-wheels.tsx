"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cx } from "./ui";

const ROW = 40; // px per row; the wheel shows five, the middle one is the value

type Item = { value: string; label: string };

/**
 * One scroll wheel: rows snap into the middle band and the middle row is the
 * value. Flick or drag it, tap a row, or use the arrow keys.
 */
function Wheel({ items, value, onChange, label }: { items: Item[]; value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = Math.max(0, items.findIndex((i) => i.value === value));

  // Start on the current value without animating.
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ROW;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => void (settle.current && clearTimeout(settle.current)), []);

  const scrollTo = (i: number) => ref.current?.scrollTo({ top: i * ROW, behavior: "smooth" });

  return (
    <div className="relative h-[200px] w-16">
      {/* The band that marks the chosen row. */}
      <div className="pointer-events-none absolute inset-x-0 top-20 h-10 rounded-lg bg-fill" aria-hidden />
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${label}-${index}`}
        tabIndex={0}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain py-20 outline-none [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-crimson/60 [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (settle.current) clearTimeout(settle.current);
          // Read the value once the wheel comes to rest on a row.
          settle.current = setTimeout(() => {
            const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)));
            if (items[i].value !== value) onChange(items[i].value);
          }, 90);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          scrollTo(Math.min(items.length - 1, Math.max(0, index + (e.key === "ArrowDown" ? 1 : -1))));
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.value}
            id={`${label}-${i}`}
            role="option"
            aria-selected={i === index}
            onClick={() => scrollTo(i)}
            className={cx(
              "flex h-10 cursor-pointer snap-center items-center justify-center text-headline tabular-nums transition-colors duration-200",
              i === index ? "font-bold text-text" : "text-secondary",
            )}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const HOURS: Item[] = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const PERIODS: Item[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

/** Hour, minute and AM/PM wheels for a 24-hour `HH:mm` value. */
export function TimeWheels({ value, onChange, label }: { value: string; onChange: (hhmm: string) => void; label: string }) {
  const [h24, minute] = value.split(":").map(Number);
  const hour12 = String(h24 % 12 || 12);
  const period = h24 < 12 ? "AM" : "PM";
  // Minutes move in fives; an off-step minute (say :53 from an older event) stays selectable.
  const steps = Array.from({ length: 12 }, (_, i) => i * 5);
  const minuteValues: Item[] = (minute % 5 ? [...steps, minute].sort((x, y) => x - y) : steps).map((m) => ({
    value: String(m),
    label: String(m).padStart(2, "0"),
  }));

  const emit = (h: string, m: string, p: string) => {
    const h24Next = (Number(h) % 12) + (p === "PM" ? 12 : 0);
    onChange(`${String(h24Next).padStart(2, "0")}:${m.padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center gap-1">
      <Wheel label={`${label} hour`} items={HOURS} value={hour12} onChange={(h) => emit(h, String(minute), period)} />
      <span className="text-headline font-bold text-secondary" aria-hidden>:</span>
      <Wheel label={`${label} minute`} items={minuteValues} value={String(minute)} onChange={(m) => emit(hour12, m, period)} />
      <Wheel label={`${label} AM or PM`} items={PERIODS} value={period} onChange={(p) => emit(hour12, String(minute), p)} />
    </div>
  );
}

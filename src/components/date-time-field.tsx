"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { cx, inputBase, Select } from "./ui";

// Values are New York wall-clock strings, `2026-11-08T09:00`, the same shape a
// datetime-local input uses, so the form and API don't change. The calendar
// only ever reads and writes the date part as plain calendar fields.

const DAY = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const DAY_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
// The year only when it isn't this one.
const dayLabel = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? DAY : DAY_YEAR).format(d);

function toCalendarDate(value: string): Date | undefined {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

function fromCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// Every 15 minutes, plus the current value if it falls between steps.
function timeOptions(current: string) {
  const all: string[] = [];
  for (let m = 0; m < 24 * 60; m += 15) all.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  if (current && !all.includes(current)) all.push(current);
  return all.sort();
}

/** A calendar date button and a time list, side by side. */
export function DateTimeField({ id, value, onChange, label }: { id: string; value: string; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const date = toCalendarDate(value);
  const time = value.slice(11, 16);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex gap-2">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${date ? dayLabel(date) : "pick a date"}`}
        onClick={() => setOpen((o) => !o)}
        className={cx(inputBase, "flex min-w-0 flex-1 items-center gap-2 text-left", open && "bg-surface ring-2 ring-crimson/60")}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
        <span className="truncate tabular-nums">{date ? dayLabel(date) : "Pick a date"}</span>
      </button>
      <Select aria-label={`${label} time`} value={time} onChange={(e) => onChange(`${value.slice(0, 10)}T${e.target.value}`)} className="w-32 shrink-0">
        {timeOptions(time).map((t) => (
          <option key={t} value={t}>
            {timeLabel(t)}
          </option>
        ))}
      </Select>
      {open && (
        <div role="dialog" aria-label={`${label} date`} className="pop-in absolute top-full left-0 z-40 mt-2 rounded-2xl bg-surface p-3 shadow-pop [transform-origin:top_left]">
          <DayPicker
            mode="single"
            required
            animate
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              onChange(`${fromCalendarDate(d)}T${time || "09:00"}`);
              setOpen(false);
            }}
            showOutsideDays
            classNames={{
              root: "relative",
              months: "relative overflow-hidden",
              month: "space-y-2",
              month_caption: "flex h-9 items-center justify-center",
              caption_label: "font-display text-headline font-bold",
              nav: "absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between",
              button_previous: "hit grid h-9 w-9 place-items-center rounded-full text-secondary transition-colors hover:bg-fill hover:text-text disabled:opacity-30",
              button_next: "hit grid h-9 w-9 place-items-center rounded-full text-secondary transition-colors hover:bg-fill hover:text-text disabled:opacity-30",
              chevron: "h-4 w-4 fill-current",
              month_grid: "border-collapse",
              weekdays: "",
              weekday: "h-8 w-10 text-caption font-semibold text-secondary",
              week: "",
              day: "p-0 text-center",
              day_button: "h-10 w-10 rounded-full text-body tabular-nums transition-colors duration-200 hover:bg-fill",
              today: "font-bold text-crimson",
              selected: "[&>button]:bg-crimson [&>button]:font-semibold [&>button]:text-on-crimson [&>button]:hover:bg-crimson-hover",
              outside: "text-tertiary",
              disabled: "opacity-30",
            }}
          />
        </div>
      )}
    </div>
  );
}

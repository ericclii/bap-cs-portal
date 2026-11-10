"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "./ui";

export type AddressPick = { address: string; name: string | null; latitude: number; longitude: number };

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
};

type Suggestion = AddressPick & { key: string; detail: string };

function toSuggestion(f: PhotonFeature, i: number): Suggestion {
  const p = f.properties;
  const street = p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : null;
  const line1 = street ?? p.name ?? "";
  const place = [p.city ?? p.district, [p.state, p.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const address = [line1, place].filter(Boolean).join(", ");
  const [longitude, latitude] = f.geometry.coordinates;
  return {
    key: `${i}-${latitude},${longitude}`,
    address,
    // A named place (e.g. a pantry) whose name isn't just the street line.
    name: p.name && p.name !== line1 ? p.name : null,
    latitude,
    longitude,
    detail: [p.locality, p.district !== p.city ? p.district : null].filter(Boolean).join(" · "),
  };
}

/**
 * Address input with search-as-you-type suggestions (Photon, a free
 * OpenStreetMap geocoder that permits autocomplete), biased to NYC.
 */
export function AddressField({
  id,
  value,
  onChange,
  onPick,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (p: AddressPick) => void;
  placeholder?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const typed = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typed.current) return;
    const q = value.trim();
    if (q.length < 3) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?limit=6&lang=en&lat=40.73&lon=-73.99&bbox=-74.26,40.49,-73.70,40.92&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        const data = (await res.json()) as { features: PhotonFeature[] };
        const seen = new Set<string>();
        const next = data.features.map(toSuggestion).filter((s) => s.address && !seen.has(s.address + s.name) && seen.add(s.address + s.name));
        setItems(next);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted or offline: keep whatever was showing.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  function choose(s: Suggestion) {
    typed.current = false;
    onChange(s.address);
    onPick(s);
    setOpen(false);
    setItems([]);
  }

  const showList = open && items.length > 0;

  return (
    <div ref={wrap} className="relative">
      <input
        id={id}
        className={inputClass}
        maxLength={300}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            choose(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {loading && <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-separator border-t-secondary" />}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-[1100] mt-1.5 max-h-72 overflow-auto rounded-xl bg-surface py-1 shadow-lg ring-1 ring-separator"
        >
          {items.map((s, i) => (
            <li
              key={s.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-3.5 py-2 ${i === active ? "bg-fill" : ""}`}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
            >
              <div className="truncate text-body font-medium">{s.name ?? s.address}</div>
              <div className="truncate text-footnote text-secondary">{s.name ? s.address : s.detail || "\u00a0"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

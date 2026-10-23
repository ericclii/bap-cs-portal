"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Button } from "./ui";

type Point = { latitude: number; longitude: number };

const FALLBACK_CENTER: [number, number] = [40.7295, -73.9965]; // Washington Square

function ClickToPlace({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ point, zoom }: { point: Point | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.latitude, point.longitude], Math.max(map.getZoom(), zoom));
  }, [point, map, zoom]);
  return null;
}

/** Map for choosing the venue pin and visualizing the geofence radius. */
export default function LocationPicker({
  value,
  radiusMeters,
  onChange,
  address,
}: {
  value: Point | null;
  radiusMeters: number;
  onChange: (p: Point) => void;
  /** The form's address field; "Find on map" searches for it. */
  address: string;
}) {
  const query = address;
  const [status, setStatus] = useState<string | null>(null);
  const [focus, setFocus] = useState<Point | null>(value);

  function place(p: Point) {
    onChange(p);
    setFocus(p);
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setStatus("Searching…");
    try {
      // OpenStreetMap Nominatim: free, fine for occasional lookups.
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&viewbox=-74.26,40.92,-73.70,40.49&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (!results[0]) {
        setStatus("No match. Try a fuller address, or click the map.");
        return;
      }
      place({ latitude: Number(results[0].lat), longitude: Number(results[0].lon) });
      setStatus(results[0].display_name);
    } catch {
      setStatus("Search failed. Click the map to place the pin instead.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("Your browser doesn't support location.");
      return;
    }
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        place({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus(`Placed at your location (±${Math.round(pos.coords.accuracy)} m)`);
      },
      () => setStatus("Couldn't get your location."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={!query.trim()} onClick={() => search()}>Find address on map</Button>
        <Button size="sm" variant="secondary" onClick={useMyLocation}>Use my location</Button>
      </div>
      <div className="h-72 overflow-hidden rounded-xl">
        <MapContainer
          center={value ? [value.latitude, value.longitude] : FALLBACK_CENTER}
          zoom={value ? 16 : 13}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={place} />
          <Recenter point={focus} zoom={16} />
          {value && (
            <>
              <Circle center={[value.latitude, value.longitude]} radius={radiusMeters} pathOptions={{ color: "#bc202f", weight: 2, fillOpacity: 0.12 }} />
              <CircleMarker center={[value.latitude, value.longitude]} radius={6} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#bc202f", fillOpacity: 1 }} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-footnote text-secondary">
        {status ?? (value ? "Pin placed. Tap the map to move it." : "Find the address or tap the map to place the pin.")}
      </p>
    </div>
  );
}

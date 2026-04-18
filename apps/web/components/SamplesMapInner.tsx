"use client";

import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { shortHash } from "@/lib/format";
import type { ParsedSample } from "@/lib/types";

// Leaflet's default marker icons rely on bundler-hostile asset paths; point them
// at the CDN copies so markers render without extra config.
const defaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Default to Jurerê Internacional, Florianópolis.
const FLORIPA: [number, number] = [-27.439, -48.497];

export default function SamplesMapInner({ samples }: { samples: ParsedSample[] }) {
  const located = samples.filter((s): s is ParsedSample & { lat: number; lon: number } => s.lat !== null && s.lon !== null);

  const first = located[0];
  const center: [number, number] = first ? [first.lat, first.lon] : FLORIPA;

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-aqua-500/20">
      <MapContainer center={center} zoom={first ? 13 : 12} className="h-full w-full">
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((s) => (
          <Marker key={s.attestationUID} position={[s.lat, s.lon]} icon={defaultIcon}>
            <Popup>
              <div className="min-w-[200px] space-y-1 text-xs">
                <div className="font-mono text-[11px]">{shortHash(s.attestationUID)}</div>
                <div>{new Date(Number(s.publishedAt) * 1000).toLocaleString()}</div>
                <Link href={`/sample/${s.attestationUID}`} className="text-aqua-700 underline">
                  open →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

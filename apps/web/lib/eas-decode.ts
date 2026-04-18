import { keccak256, encodePacked, type Hex } from "viem";

const LATLON_SCALE = 1_000_000;
const LATLON_BIAS = 180 * LATLON_SCALE;

/** Inverse of the Capture PWA's encodeLatLon. */
export function decodeLatLon(encoded: bigint): number {
  const shifted = Number(encoded) - LATLON_BIAS;
  return shifted / LATLON_SCALE;
}

/** Mirrors apps/capture/lib/eas.ts canonicalPayloadBytes. */
export function dataHashOf(fields: {
  timestamp: bigint;
  lat: bigint;
  lon: bigint;
  collectorName: string;
  imageCid: string;
  labReadingsJson: string;
  notes: string;
}): Hex {
  return keccak256(
    encodePacked(
      ["uint256", "uint256", "uint256", "string", "string", "string", "string"],
      [
        fields.timestamp,
        fields.lat,
        fields.lon,
        fields.collectorName,
        fields.imageCid,
        fields.labReadingsJson,
        fields.notes
      ]
    )
  );
}

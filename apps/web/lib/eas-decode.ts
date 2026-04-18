/**
 * Re-export of the shared EAS codec for web-side verification logic.
 * Kept as a thin module so call sites in /verify and /sample don't reach
 * across package boundaries directly and can be refactored in one place.
 */
export { dataHash, decodeLatLon, encodeLatLon, attestationUID } from "@aguas/shared";

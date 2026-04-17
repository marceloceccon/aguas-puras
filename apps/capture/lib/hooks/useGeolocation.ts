"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeoFix {
  lat: number;
  lon: number;
  accuracyMeters: number;
  timestamp: number;
}

export interface GeoState {
  fix?: GeoFix;
  error?: string;
  loading: boolean;
}

export function useGeolocation(options: PositionOptions = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }) {
  const [state, setState] = useState<GeoState>({ loading: false });
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ loading: false, error: "Geolocation not supported on this device." });
      return;
    }
    setState({ loading: true });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          loading: false,
          fix: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            timestamp: pos.timestamp
          }
        });
      },
      (err) => {
        setState({ loading: false, error: err.message });
      },
      options
    );
  }, [options]);

  useEffect(() => stop, [stop]);

  return { ...state, start, stop };
}

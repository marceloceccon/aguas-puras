"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Skip in dev — next/dev's HMR doesn't play nicely with aggressive caching.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[sw] registration failed:", err);
    });
  }, []);
  return null;
}

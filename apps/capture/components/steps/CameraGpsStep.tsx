"use client";

import { useEffect } from "react";
import { useCamera, type CapturedImage } from "@/lib/hooks/useCamera";
import { useGeolocation, type GeoFix } from "@/lib/hooks/useGeolocation";

interface Props {
  onContinue: (image: CapturedImage, fix: GeoFix) => void;
}

export function CameraGpsStep({ onContinue }: Props) {
  const cam = useCamera();
  const geo = useGeolocation();

  useEffect(() => {
    geo.start();
  }, [geo]);

  const canContinue = Boolean(cam.image && geo.fix);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">1 · Photo</h3>
        <label
          htmlFor="sample-photo"
          className="mt-2 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-aqua-500/40 bg-white/50 text-sm text-aqua-700 transition hover:bg-aqua-500/5 dark:bg-aqua-900/30 dark:text-aqua-50/70"
        >
          {cam.image ? (
            <img
              src={cam.image.previewUrl}
              alt="Sample preview"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span>Tap to take a photo</span>
            </>
          )}
          <input
            id="sample-photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) cam.handleFile(f);
            }}
          />
        </label>
        {cam.error && <p className="mt-2 text-xs text-red-600">{cam.error}</p>}
      </section>

      <section>
        <h3 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">2 · Location</h3>
        <div className="mt-2 rounded-xl border border-aqua-500/20 bg-white/50 p-4 text-sm dark:bg-aqua-900/30">
          {geo.loading && <p className="text-aqua-700 dark:text-aqua-50/70">Acquiring GPS…</p>}
          {geo.error && <p className="text-red-600">{geo.error}</p>}
          {geo.fix && (
            <dl className="grid grid-cols-2 gap-y-1 font-mono text-xs text-aqua-900 dark:text-aqua-50">
              <dt className="text-aqua-700 dark:text-aqua-50/60">lat</dt>
              <dd>{geo.fix.lat.toFixed(6)}</dd>
              <dt className="text-aqua-700 dark:text-aqua-50/60">lon</dt>
              <dd>{geo.fix.lon.toFixed(6)}</dd>
              <dt className="text-aqua-700 dark:text-aqua-50/60">± m</dt>
              <dd>{geo.fix.accuracyMeters.toFixed(0)}</dd>
            </dl>
          )}
        </div>
      </section>

      <button
        disabled={!canContinue}
        onClick={() => {
          if (cam.image && geo.fix) onContinue(cam.image, geo.fix);
        }}
        className="h-12 w-full rounded-xl bg-aqua-500 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
      >
        Continue →
      </button>
    </div>
  );
}

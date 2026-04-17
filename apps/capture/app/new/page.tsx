"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CameraGpsStep } from "@/components/steps/CameraGpsStep";
import { FormStep } from "@/components/steps/FormStep";
import { ReviewStep } from "@/components/steps/ReviewStep";
import { newDraftId, saveDraft } from "@/lib/drafts";
import type { CapturedImage } from "@/lib/hooks/useCamera";
import type { GeoFix } from "@/lib/hooks/useGeolocation";
import { pinImage } from "@/lib/ipfs";
import type { LabReadings, SampleDraft, StepKey } from "@/lib/types";

export default function NewSamplePage() {
  const [step, setStep] = useState<StepKey>("capture");
  const [draftId] = useState<string>(() => newDraftId());
  const [image, setImage] = useState<CapturedImage | null>(null);
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [formData, setFormData] = useState<{ collectorName: string; notes: string; labReadings: LabReadings }>({
    collectorName: "",
    notes: "",
    labReadings: {}
  });
  const [pinning, setPinning] = useState(false);
  const [imageCid, setImageCid] = useState<string | undefined>(undefined);
  const [imageSha, setImageSha] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const draft: SampleDraft = useMemo(
    () => ({
      id: draftId,
      createdAt: Date.now(),
      lat: fix?.lat,
      lon: fix?.lon,
      accuracyMeters: fix?.accuracyMeters,
      collectorName: formData.collectorName,
      notes: formData.notes,
      labReadings: formData.labReadings,
      imageCid,
      imageSha256: imageSha
    }),
    [draftId, fix, formData, imageCid, imageSha]
  );

  const handleCaptureContinue = useCallback(async (img: CapturedImage, f: GeoFix) => {
    setImage(img);
    setFix(f);
    setStep("form");
  }, []);

  const handleFormContinue = useCallback(
    async (data: { collectorName: string; notes: string; labReadings: LabReadings }) => {
      setFormData(data);
      setError(null);
      if (image && !imageCid) {
        setPinning(true);
        try {
          const { cid, sha256 } = await pinImage(image.file);
          setImageCid(cid);
          setImageSha(sha256);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to pin image");
          setPinning(false);
          return;
        }
        setPinning(false);
      }
      const next: SampleDraft = {
        ...draft,
        collectorName: data.collectorName,
        notes: data.notes,
        labReadings: data.labReadings
      };
      await saveDraft(next);
      setStep("review");
    },
    [draft, image, imageCid]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Home
        </Link>
        <StepPips step={step} />
      </header>

      <h2 className="text-xl font-semibold text-aqua-900 dark:text-aqua-50">
        {step === "capture" && "Capture"}
        {step === "form" && "Details"}
        {step === "review" && "Review"}
        {step === "sign" && "Sign"}
        {step === "success" && "Success"}
      </h2>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "capture" && <CameraGpsStep onContinue={handleCaptureContinue} />}

      {step === "form" && (
        <FormStep
          initial={formData}
          onBack={() => setStep("capture")}
          onContinue={handleFormContinue}
        />
      )}

      {step === "review" && image && (
        <>
          {pinning && (
            <p className="text-sm text-aqua-700 dark:text-aqua-50/70">Hashing image…</p>
          )}
          <ReviewStep
            draft={draft}
            previewUrl={image.previewUrl}
            onBack={() => setStep("form")}
            onSign={() => setStep("sign")}
          />
        </>
      )}

      {step === "sign" && (
        <div className="rounded-xl border border-aqua-500/20 bg-white/50 p-6 text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/80">
          Signing UI lands in the next deliverable (D6). Draft is safe in IndexedDB.
        </div>
      )}
    </main>
  );
}

function StepPips({ step }: { step: StepKey }) {
  const order: StepKey[] = ["capture", "form", "review", "sign", "success"];
  const currentIdx = order.indexOf(step);
  return (
    <div className="flex gap-1.5">
      {order.map((k, i) => (
        <span
          key={k}
          className={`h-1.5 w-6 rounded-full transition ${
            i <= currentIdx ? "bg-aqua-500" : "bg-aqua-500/20"
          }`}
        />
      ))}
    </div>
  );
}

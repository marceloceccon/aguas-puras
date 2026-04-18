"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Hex } from "viem";
import { CameraGpsStep } from "@/components/steps/CameraGpsStep";
import { FormStep } from "@/components/steps/FormStep";
import { ReviewStep } from "@/components/steps/ReviewStep";
import { SignStep } from "@/components/steps/SignStep";
import { SuccessStep } from "@/components/steps/SuccessStep";
import { deleteDraft, newDraftId, saveDraft, saveSubmitted } from "@/lib/drafts";
import type { CapturedImage } from "@/lib/hooks/useCamera";
import type { GeoFix } from "@/lib/hooks/useGeolocation";
import { pinImage } from "@/lib/ipfs";
import { watermarkImage } from "@/lib/watermark";
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
  const [pinFallback, setPinFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ uid: Hex; txHash: Hex; attester: Hex } | null>(null);

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
          const watermarked = await watermarkImage(image.file, {
            isoTime: new Date(draft.createdAt).toISOString(),
            lat: fix?.lat,
            lon: fix?.lon,
            accuracyMeters: fix?.accuracyMeters,
            collectorName: data.collectorName
          });
          const pinned = await pinImage(watermarked);
          setImageCid(pinned.cid);
          setImageSha(pinned.sha256);
          setPinFallback(Boolean(pinned.fallback));
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
            <p className="text-sm text-aqua-700 dark:text-aqua-50/70">Pinning image…</p>
          )}
          {pinFallback && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              IPFS pinning failed — stub CID used. The on-chain attestation will still succeed, but
              the image is not publicly retrievable. Check PINATA_JWT on the server.
            </p>
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
        <SignStep
          draft={draft}
          onBack={() => setStep("review")}
          onSuccess={async (r) => {
            setResult(r);
            await saveSubmitted({
              ...draft,
              attestationUID: r.uid,
              txHash: r.txHash,
              attester: r.attester,
              ...(pinFallback ? { pinFallback: true as const } : {})
            });
            await deleteDraft(draftId);
            setStep("success");
          }}
        />
      )}

      {step === "success" && result && (
        <SuccessStep
          uid={result.uid}
          txHash={result.txHash}
          attester={result.attester}
          onNew={() => {
            if (typeof window !== "undefined") window.location.assign("/new");
          }}
        />
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

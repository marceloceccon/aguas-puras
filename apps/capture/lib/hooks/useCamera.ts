"use client";

import { useCallback, useState } from "react";

export interface CapturedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export function useCamera() {
  const [image, setImage] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Selected file is not an image.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const dims = await readImageDimensions(previewUrl);
    setImage({ file, previewUrl, ...dims });
  }, []);

  const clear = useCallback(() => {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  }, [image]);

  return { image, error, handleFile, clear };
}

function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

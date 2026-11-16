"use client";

import { useState } from "react";

type MediaFrameProps = {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
};

export default function MediaFrame({ src, alt, fallbackLabel, className = "" }: MediaFrameProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = Boolean(src) && failedSrc !== src;

  return (
    <div className={`media-frame ${className}`} aria-label={alt} role="img">
      {hasImage ? (
        // Local resort media is intentionally served directly from public/media.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setFailedSrc(src)} />
      ) : (
        <div className="media-fallback" aria-hidden="true">
          <span>{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}

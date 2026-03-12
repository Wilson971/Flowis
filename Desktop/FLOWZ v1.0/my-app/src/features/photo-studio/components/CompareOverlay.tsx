/**
 * Re-export from new location.
 * The canonical implementation lives in `./viewer/CompareOverlay`.
 *
 * This shim keeps backward-compatible imports (e.g. LightTable)
 * that reference the old path with the old prop names.
 */
"use client";

import { CompareOverlay as CompareOverlayNew } from "./viewer/CompareOverlay";

// Adapter: old props (sourceUrl/generatedUrl) -> new props (originalUrl/generatedUrl)
interface LegacyCompareOverlayProps {
  sourceUrl: string;
  generatedUrl: string;
  sourceName?: string;
  generatedName?: string;
  className?: string;
}

export const CompareOverlay = ({
  sourceUrl,
  generatedUrl,
  className,
}: LegacyCompareOverlayProps) => (
  <CompareOverlayNew
    originalUrl={sourceUrl}
    generatedUrl={generatedUrl}
    className={className}
  />
);

export default CompareOverlay;

"use client";

/**
 * PreviewTypography
 *
 * Renders h1–h4, body, label, and caption text samples
 * using typography settings from the live design config.
 */

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewTypographyProps {
  config: Record<string, unknown>;
}

interface TypographyScale {
  size: string;
  weight: number;
  lineHeight: number;
  letterSpacing?: string;
}

type ScaleKey = "h1" | "h2" | "h3" | "h4" | "body" | "label" | "caption";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveScale(
  config: Record<string, unknown>,
  key: ScaleKey
): TypographyScale | null {
  const typography = config.typography as Record<string, unknown> | undefined;
  const scale = typography?.scale as Record<string, TypographyScale> | undefined;
  return scale?.[key] ?? null;
}

function resolveFontFamily(
  config: Record<string, unknown>,
  role: "heading" | "body"
): string {
  const typography = config.typography as Record<string, unknown> | undefined;
  const families = typography?.fontFamilies as Record<string, string> | undefined;
  return families?.[role] ?? (role === "heading" ? "Geist" : "Inter");
}

// ---------------------------------------------------------------------------
// Type sample definitions
// ---------------------------------------------------------------------------

const SAMPLES: { key: ScaleKey; label: string; sample: string }[] = [
  { key: "h1", label: "H1", sample: "Heading One" },
  { key: "h2", label: "H2", sample: "Heading Two" },
  { key: "h3", label: "H3", sample: "Heading Three" },
  { key: "h4", label: "H4", sample: "Heading Four" },
  { key: "body", label: "Body", sample: "Body text — the quick brown fox jumps over the lazy dog." },
  { key: "label", label: "Label", sample: "Form label · 500 weight" },
  { key: "caption", label: "Caption", sample: "Caption · small supplementary text" },
];

const HEADING_KEYS: ScaleKey[] = ["h1", "h2", "h3", "h4"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewTypography({ config }: PreviewTypographyProps) {
  const headingFont = resolveFontFamily(config, "heading");
  const bodyFont = resolveFontFamily(config, "body");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Typography Scale
      </p>
      <motion.div
        className="space-y-2"
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {SAMPLES.map(({ key, label, sample }) => {
          const scale = resolveScale(config, key);
          const isHeading = HEADING_KEYS.includes(key);
          const fontFamily = isHeading ? headingFont : bodyFont;

          const textStyle: React.CSSProperties = scale
            ? {
                fontSize: scale.size,
                fontWeight: scale.weight,
                lineHeight: scale.lineHeight,
                letterSpacing: scale.letterSpacing ?? "0",
                fontFamily,
              }
            : { fontFamily };

          return (
            <motion.div
              key={key}
              variants={motionTokens.variants.staggerItem}
              className="flex items-baseline gap-3 py-0.5 border-b border-border/40 last:border-0"
            >
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0 w-10"
              )}>
                {label}
              </span>
              <span
                className="text-foreground truncate"
                style={textStyle}
              >
                {sample}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

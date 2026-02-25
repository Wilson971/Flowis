"use client";

/**
 * PreviewBadges
 *
 * Renders a row of all badge variants using the current design config.
 * Colors are driven by inline styles resolved from the config object.
 */

import { cn } from "@/lib/utils";
import { styles } from "@/lib/design-system";
import { motionTokens } from "@/lib/design-system";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewBadgesProps {
  config: Record<string, unknown>;
}

type BadgeVariantKey = "success" | "warning" | "error" | "info" | "neutral" | "primary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveColor(
  config: Record<string, unknown>,
  key: string,
  mode: "dark" = "dark"
): string {
  const colors = config.colors as Record<string, Record<string, string>> | undefined;
  return colors?.[mode]?.[key] ?? "";
}

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

const BADGE_DEFS: {
  key: BadgeVariantKey;
  label: string;
  colorKey: string;
}[] = [
  { key: "success", label: "Success", colorKey: "success" },
  { key: "warning", label: "Warning", colorKey: "warning" },
  { key: "error", label: "Error", colorKey: "destructive" },
  { key: "info", label: "Info", colorKey: "info" },
  { key: "neutral", label: "Neutral", colorKey: "muted" },
  { key: "primary", label: "Primary", colorKey: "primary" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewBadges({ config }: PreviewBadgesProps) {
  return (
    <div className="space-y-2">
      <p className={cn(styles.text.labelSmall, "mb-3")}>Badge Variants</p>
      <motion.div
        className="flex flex-wrap gap-2"
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {BADGE_DEFS.map(({ key, label, colorKey }) => {
          const color = resolveColor(config, colorKey);

          const isNeutral = key === "neutral";
          const badgeStyle: React.CSSProperties = isNeutral
            ? {
                backgroundColor: `${color}33`,
                color: "hsl(var(--muted-foreground))",
                border: "1px solid hsl(var(--border))",
              }
            : {
                backgroundColor: color ? `${color}22` : undefined,
                color: color || undefined,
                border: `1px solid ${color}44`,
              };

          return (
            <motion.span
              key={key}
              variants={motionTokens.variants.staggerItem}
              className={cn(styles.badge.base, styles.badge.md)}
              style={badgeStyle}
            >
              {label}
            </motion.span>
          );
        })}
      </motion.div>
    </div>
  );
}

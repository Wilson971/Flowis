"use client";

/**
 * PreviewButtons
 *
 * Renders all button variants (primary, secondary, outline, ghost, destructive)
 * using colors and radius resolved from the live design config.
 */

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewButtonsProps {
  config: Record<string, unknown>;
}

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

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

function resolveButtonRadius(config: Record<string, unknown>): number {
  const effects = config.effects as Record<string, unknown> | undefined;
  const radius = effects?.radius as Record<string, number> | undefined;
  return radius?.sm ?? 8;
}

// ---------------------------------------------------------------------------
// Button definitions
// ---------------------------------------------------------------------------

const BUTTON_DEFS: { variant: ButtonVariant; label: string }[] = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outline", label: "Outline" },
  { variant: "ghost", label: "Ghost" },
  { variant: "destructive", label: "Danger" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewButtons({ config }: PreviewButtonsProps) {
  const radius = resolveButtonRadius(config);
  const primary = resolveColor(config, "primary");
  const secondary = resolveColor(config, "secondary");
  const destructive = resolveColor(config, "destructive");
  const foreground = resolveColor(config, "foreground");
  const border = resolveColor(config, "border");

  function getButtonStyle(variant: ButtonVariant): React.CSSProperties {
    const base: React.CSSProperties = {
      borderRadius: `${radius}px`,
      fontSize: "0.75rem",
      fontWeight: 500,
      padding: "5px 12px",
      border: "1px solid transparent",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      transition: "all 0.2s",
    };

    switch (variant) {
      case "primary":
        return {
          ...base,
          backgroundColor: primary || "hsl(var(--primary))",
          color: "#fff",
        };
      case "secondary":
        return {
          ...base,
          backgroundColor: secondary ? `${secondary}22` : "hsl(var(--secondary))",
          color: secondary || "hsl(var(--secondary-foreground))",
          borderColor: secondary ? `${secondary}44` : "transparent",
        };
      case "outline":
        return {
          ...base,
          backgroundColor: "transparent",
          color: foreground || "hsl(var(--foreground))",
          borderColor: border || "hsl(var(--border))",
        };
      case "ghost":
        return {
          ...base,
          backgroundColor: "transparent",
          color: foreground || "hsl(var(--foreground))",
          borderColor: "transparent",
        };
      case "destructive":
        return {
          ...base,
          backgroundColor: destructive || "hsl(var(--destructive))",
          color: "#fff",
        };
      default:
        return base;
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Button Variants
      </p>
      <motion.div
        className="flex flex-wrap gap-2"
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {BUTTON_DEFS.map(({ variant, label }) => (
          <motion.button
            key={variant}
            variants={motionTokens.variants.staggerItem}
            style={getButtonStyle(variant)}
            whileHover={motionTokens.variants.hoverLift}
            whileTap={motionTokens.variants.tap}
            type="button"
          >
            {label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

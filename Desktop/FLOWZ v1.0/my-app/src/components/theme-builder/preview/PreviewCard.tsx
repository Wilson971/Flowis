"use client";

/**
 * PreviewCard
 *
 * Renders a live sample card using the current design config.
 * Applies radius, shadow, and color settings from config via inline styles.
 */

import { cn } from "@/lib/utils";
import { styles } from "@/lib/design-system";
import { motionTokens } from "@/lib/design-system";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewCardProps {
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveRadius(config: Record<string, unknown>): number {
  const effects = config.effects as Record<string, unknown> | undefined;
  const radius = effects?.radius as Record<string, number> | undefined;
  return radius?.base ?? 12;
}

function resolveShadow(config: Record<string, unknown>, key: string): string {
  const effects = config.effects as Record<string, unknown> | undefined;
  const shadows = effects?.shadows as Record<string, string> | undefined;
  return shadows?.[key] ?? "0 1px 2px rgba(0,0,0,0.05)";
}

function resolveColor(
  config: Record<string, unknown>,
  key: string,
  mode: "light" | "dark" = "dark"
): string {
  const colors = config.colors as Record<string, Record<string, string>> | undefined;
  return colors?.[mode]?.[key] ?? "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewCard({ config }: PreviewCardProps) {
  const radius = resolveRadius(config);
  const shadow = resolveShadow(config, "md");
  const cardBg = resolveColor(config, "card");
  const border = resolveColor(config, "border");
  const primaryColor = resolveColor(config, "primary");
  const successColor = resolveColor(config, "success");

  const cardStyle: React.CSSProperties = {
    borderRadius: `${radius}px`,
    boxShadow: shadow,
    backgroundColor: cardBg || undefined,
    borderColor: border || undefined,
  };

  const badgeStyle: React.CSSProperties = {
    borderRadius: 9999,
    backgroundColor: `${successColor}22`,
    color: successColor || undefined,
    border: `1px solid ${successColor}44`,
  };

  const accentBarStyle: React.CSSProperties = {
    backgroundColor: primaryColor || undefined,
    borderRadius: `${Math.min(radius, 4)}px`,
  };

  return (
    <motion.div
      variants={motionTokens.variants.fadeInScale}
      initial="hidden"
      animate="visible"
      className={cn(
        "border p-4 space-y-3",
        !cardBg && "bg-card",
        !border && "border-border"
      )}
      style={cardStyle}
    >
      {/* Accent bar */}
      <div className="h-1 w-10" style={accentBarStyle} />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className={cn(styles.text.h4, "leading-tight")}>Product Card</p>
          <p className={styles.text.bodyMuted}>Sample card preview</p>
        </div>
        <span
          className={cn(styles.badge.base, styles.badge.sm, "shrink-0")}
          style={badgeStyle}
        >
          Live
        </span>
      </div>

      {/* Body */}
      <p className={cn(styles.text.bodyMuted, "text-xs leading-relaxed")}>
        This card reflects your current radius, shadow, and color settings in
        real time.
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-2 pt-1">
        <div
          className="h-5 w-20 rounded"
          style={{
            backgroundColor: primaryColor ? `${primaryColor}33` : undefined,
            borderRadius: `${Math.max(radius - 4, 4)}px`,
          }}
        />
        <div
          className="h-5 w-12 rounded"
          style={{
            backgroundColor: border ? `${border}66` : undefined,
            borderRadius: `${Math.max(radius - 4, 4)}px`,
          }}
        />
      </div>
    </motion.div>
  );
}

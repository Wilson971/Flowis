"use client";

/**
 * ThemePreviewPanel
 *
 * Sticky right-side panel that aggregates all preview sub-components
 * (Card, Badges, Buttons, Typography) into a single "Live Preview" panel.
 * Mimics a mini app mockup feel with a dark card area wrapper.
 */

import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { PreviewCard } from "./preview/PreviewCard";
import { PreviewBadges } from "./preview/PreviewBadges";
import { PreviewButtons } from "./preview/PreviewButtons";
import { PreviewTypography } from "./preview/PreviewTypography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThemePreviewPanelProps {
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ThemePreviewPanel({ config }: ThemePreviewPanelProps) {
  return (
    <div className="sticky top-24 flex flex-col gap-4">
      {/* Panel header card */}
      <Card className="rounded-xl">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Live pulse indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
          </div>
          <p className={cn(styles.text.bodyMuted, "text-xs")}>
            Updates as you change settings
          </p>
        </CardHeader>
      </Card>

      {/* Mini app mockup shell */}
      <div
        className={cn(
          "rounded-xl overflow-hidden border border-border/60",
          "bg-[#0e0e0e]"          // dark shell — intentional per DS rule 10
        )}
      >
        {/* Fake window chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[10px] text-white/30 font-mono tracking-wide">
            flowz — design-system
          </span>
        </div>

        {/* Preview content area */}
        <motion.div
          className="p-4 space-y-5 overflow-y-auto max-h-[70vh]"
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
        >
          {/* Card preview */}
          <PreviewCard config={config} />

          <div className="h-px bg-white/10" />

          {/* Badges preview */}
          <div className="bg-card/10 rounded-xl p-3 space-y-1">
            <PreviewBadges config={config} />
          </div>

          <div className="h-px bg-white/10" />

          {/* Buttons preview */}
          <div className="bg-card/10 rounded-xl p-3 space-y-1">
            <PreviewButtons config={config} />
          </div>

          <div className="h-px bg-white/10" />

          {/* Typography preview */}
          <div className="bg-card/10 rounded-xl p-3 space-y-1">
            <PreviewTypography config={config} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

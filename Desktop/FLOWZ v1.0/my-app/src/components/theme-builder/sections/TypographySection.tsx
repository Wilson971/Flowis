"use client";

/**
 * TypographySection
 *
 * Configures font families (heading / body / mono) and the full type scale.
 * Each scale entry (h1–h4, body, label, caption) shows:
 *   - A live preview of the text rendered with the configured style
 *   - Editable controls: size (text input), weight (select), lineHeight (slider)
 *
 * Props:
 *   typography – { fontFamilies: Record<role, family>, scale: Record<name, ScaleEntry> }
 *   onChange   – called with the full updated typography object
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FontFamilyPicker } from "@/components/theme-builder/controls/FontFamilyPicker";
import { SliderControl } from "@/components/theme-builder/controls/SliderControl";
import { BuilderSection } from "@/components/theme-builder/BuilderSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScaleEntry {
  size: string;
  weight: number;
  lineHeight: number;
  letterSpacing: string;
}

export interface TypographyConfig {
  fontFamilies: Record<string, string>;
  scale: Record<string, ScaleEntry>;
}

export interface TypographySectionProps {
  typography: TypographyConfig;
  onChange: (typo: TypographyConfig) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_ROLES = [
  { key: "heading", label: "Heading Font",  description: "Used for h1–h4 titles" },
  { key: "body",    label: "Body Font",     description: "Used for body text & UI" },
  { key: "mono",    label: "Monospace Font",description: "Used for code & labels" },
] as const;

const SCALE_ORDER = ["h1", "h2", "h3", "h4", "body", "label", "caption"] as const;

const SCALE_LABELS: Record<string, string> = {
  h1:      "Heading 1",
  h2:      "Heading 2",
  h3:      "Heading 3",
  h4:      "Heading 4",
  body:    "Body",
  label:   "Label",
  caption: "Caption",
};

/** Text rendered as the live preview for each scale level */
const SCALE_PREVIEW: Record<string, string> = {
  h1:      "The quick brown fox",
  h2:      "Design is in the details",
  h3:      "Typography matters",
  h4:      "Every pixel counts",
  body:    "FLOWZ helps you craft e-commerce content at scale.",
  label:   "Input label / UI text",
  caption: "Caption or helper text",
};

const WEIGHT_OPTIONS = [
  { value: "300", label: "300 — Light" },
  { value: "400", label: "400 — Regular" },
  { value: "500", label: "500 — Medium" },
  { value: "600", label: "600 — SemiBold" },
  { value: "700", label: "700 — Bold" },
  { value: "800", label: "800 — ExtraBold" },
];

// ---------------------------------------------------------------------------
// ScaleRow sub-component
// ---------------------------------------------------------------------------

interface ScaleRowProps {
  name: string;
  entry: ScaleEntry;
  onUpdate: (updated: ScaleEntry) => void;
}

function ScaleRow({ name, entry, onUpdate }: ScaleRowProps) {
  const label = SCALE_LABELS[name] ?? name;
  const preview = SCALE_PREVIEW[name] ?? label;

  const set = <K extends keyof ScaleEntry>(key: K, value: ScaleEntry[K]) =>
    onUpdate({ ...entry, [key]: value });

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      {/* Preview banner */}
      <div
        className="px-4 py-3 bg-muted/20 border-b border-border/30"
        aria-label={`Preview of ${label}`}
      >
        <p
          className="text-foreground truncate"
          style={{
            fontSize: entry.size,
            fontWeight: entry.weight,
            lineHeight: entry.lineHeight,
            letterSpacing: entry.letterSpacing,
          }}
        >
          {preview}
        </p>
      </div>

      {/* Controls */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Size */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Size
          </Label>
          <Input
            type="text"
            value={entry.size}
            onChange={(e) => set("size", e.target.value)}
            placeholder="1rem"
            className={cn(
              "h-8 rounded-lg text-xs font-mono",
              "bg-muted/40 border-border/60 focus:bg-card"
            )}
            aria-label={`Font size for ${label}`}
          />
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Weight
          </Label>
          <Select
            value={String(entry.weight)}
            onValueChange={(v) => set("weight", Number(v))}
          >
            <SelectTrigger
              className={cn(
                "h-8 rounded-lg text-xs bg-muted/40 border-border/60 focus:bg-card"
              )}
              aria-label={`Font weight for ${label}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60">
              {WEIGHT_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value} className="text-xs">
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Letter Spacing
          </Label>
          <Input
            type="text"
            value={entry.letterSpacing}
            onChange={(e) => set("letterSpacing", e.target.value)}
            placeholder="0em"
            className={cn(
              "h-8 rounded-lg text-xs font-mono",
              "bg-muted/40 border-border/60 focus:bg-card"
            )}
            aria-label={`Letter spacing for ${label}`}
          />
        </div>

        {/* Line Height — full width slider */}
        <div className="sm:col-span-3">
          <SliderControl
            label="Line Height"
            value={entry.lineHeight}
            onChange={(v) => set("lineHeight", v)}
            min={1}
            max={3}
            step={0.05}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TypographySection({
  typography,
  onChange,
  className,
}: TypographySectionProps) {
  const handleFontChange = (role: string, family: string) => {
    onChange({
      ...typography,
      fontFamilies: { ...typography.fontFamilies, [role]: family },
    });
  };

  const handleScaleChange = (name: string, updated: ScaleEntry) => {
    onChange({
      ...typography,
      scale: { ...typography.scale, [name]: updated },
    });
  };

  // Ordered scale entries — use SCALE_ORDER when possible, then append any extras
  const orderedKeys = [
    ...SCALE_ORDER.filter((k) => typography.scale[k]),
    ...Object.keys(typography.scale).filter(
      (k) => !(SCALE_ORDER as readonly string[]).includes(k)
    ),
  ];

  return (
    <BuilderSection
      title="Typography"
      description="Configure font families and the full type scale."
      className={cn("", className)}
    >
      {/* ── Font Families ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Font Families
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FONT_ROLES.map((role) => (
            <FontFamilyPicker
              key={role.key}
              label={role.label}
              value={typography.fontFamilies[role.key] ?? "Inter"}
              onChange={(family) => handleFontChange(role.key, family)}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Type Scale ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Type Scale
          </span>
          <Separator className="flex-1" />
          <Badge variant="outline" className="text-[10px] font-mono rounded-full">
            {orderedKeys.length} levels
          </Badge>
        </div>

        <div className="space-y-3">
          {orderedKeys.map((key) => (
            <ScaleRow
              key={key}
              name={key}
              entry={typography.scale[key]}
              onUpdate={(updated) => handleScaleChange(key, updated)}
            />
          ))}
        </div>
      </div>
    </BuilderSection>
  );
}

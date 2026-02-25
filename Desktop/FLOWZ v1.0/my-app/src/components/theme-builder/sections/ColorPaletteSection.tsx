"use client";

/**
 * ColorPaletteSection
 *
 * Lets the user configure the full color palette for both light and dark
 * modes. A Tabs switcher toggles between the two mode sets. Each color
 * token is exposed via a ColorPickerControl; primary and accent additionally
 * show their generated 11-stop scale.
 *
 * Props:
 *   colors   – { light: Record<token, hex>, dark: Record<token, hex> }
 *   onChange – called with the entire updated colors object on any change
 */

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ColorPickerControl } from "@/components/theme-builder/controls/ColorPickerControl";
import { BuilderSection } from "@/components/theme-builder/BuilderSection";

// ---------------------------------------------------------------------------
// Color token catalogue
// ---------------------------------------------------------------------------

interface TokenEntry {
  key: string;
  label: string;
  description: string;
  showScale?: boolean;
  group: "brand" | "base" | "state";
}

const COLOR_TOKENS: TokenEntry[] = [
  // Brand
  { key: "primary",     label: "Primary",     description: "Main action color",         showScale: true,  group: "brand" },
  { key: "secondary",   label: "Secondary",   description: "Secondary action color",                      group: "brand" },
  { key: "accent",      label: "Accent",      description: "Highlight / decorative",    showScale: true,  group: "brand" },
  // Base
  { key: "background",  label: "Background",  description: "Page background",                             group: "base" },
  { key: "foreground",  label: "Foreground",  description: "Default text color",                          group: "base" },
  { key: "card",        label: "Card",        description: "Card surface",                                group: "base" },
  { key: "muted",       label: "Muted",       description: "Muted / subtle surfaces",                     group: "base" },
  { key: "border",      label: "Border",      description: "Default border color",                        group: "base" },
  // State
  { key: "destructive", label: "Destructive", description: "Error / danger actions",                      group: "state" },
  { key: "success",     label: "Success",     description: "Success confirmations",                        group: "state" },
  { key: "warning",     label: "Warning",     description: "Caution / warning states",                    group: "state" },
  { key: "info",        label: "Info",        description: "Informational messages",                       group: "state" },
];

const GROUP_LABELS: Record<string, string> = {
  brand: "Brand Colors",
  base:  "Base Palette",
  state: "Semantic / State",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorSet {
  light: Record<string, string>;
  dark:  Record<string, string>;
}

export interface ColorPaletteSectionProps {
  colors: ColorSet;
  onChange: (colors: ColorSet) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inner panel (one mode at a time)
// ---------------------------------------------------------------------------

interface ModePanelProps {
  mode: "light" | "dark";
  values: Record<string, string>;
  onTokenChange: (mode: "light" | "dark", key: string, hex: string) => void;
}

function ModePanel({ mode, values, onTokenChange }: ModePanelProps) {
  const groups = ["brand", "base", "state"] as const;

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => {
        const tokens = COLOR_TOKENS.filter((t) => t.group === group);
        return (
          <div key={group} className="space-y-4">
            {/* Group heading */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {GROUP_LABELS[group]}
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Token grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokens.map((token) => (
                <ColorPickerControl
                  key={token.key}
                  label={token.label}
                  value={values[token.key] ?? "#000000"}
                  onChange={(hex) => onTokenChange(mode, token.key, hex)}
                  showScale={token.showScale}
                />
              ))}
            </div>

            {/* Separator between groups (not after last) */}
            {gi < groups.length - 1 && <Separator className="mt-2" />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorPaletteSection({
  colors,
  onChange,
  className,
}: ColorPaletteSectionProps) {
  const handleTokenChange = (
    mode: "light" | "dark",
    key: string,
    hex: string
  ) => {
    onChange({
      ...colors,
      [mode]: {
        ...colors[mode],
        [key]: hex,
      },
    });
  };

  return (
    <BuilderSection
      title="Color Palette"
      description="Define token values for both light and dark modes."
      className={cn("", className)}
    >
      <Tabs defaultValue="light">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="rounded-lg h-9 bg-muted/50">
            <TabsTrigger value="light" className="rounded-lg text-xs px-4">
              Light Mode
            </TabsTrigger>
            <TabsTrigger value="dark" className="rounded-lg text-xs px-4">
              Dark Mode
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="text-[10px] font-mono rounded-full">
            {COLOR_TOKENS.length} tokens
          </Badge>
        </div>

        <TabsContent value="light" className="mt-0">
          <ModePanel
            mode="light"
            values={colors.light}
            onTokenChange={handleTokenChange}
          />
        </TabsContent>

        <TabsContent value="dark" className="mt-0">
          <ModePanel
            mode="dark"
            values={colors.dark}
            onTokenChange={handleTokenChange}
          />
        </TabsContent>
      </Tabs>
    </BuilderSection>
  );
}

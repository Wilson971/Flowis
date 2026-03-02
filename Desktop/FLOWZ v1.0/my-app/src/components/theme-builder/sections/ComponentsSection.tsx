"use client";

/**
 * ComponentsSection
 *
 * Tabbed editor for component-level design tokens.
 * Types are aligned with design-system-config.json schema.
 */

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { VariantBuilder } from "@/components/theme-builder/controls/VariantBuilder";
import { HoverEffectPicker, type HoverEffectDescriptor } from "@/components/theme-builder/controls/HoverEffectPicker";
import { BuilderSection } from "@/components/theme-builder/BuilderSection";

// ---------------------------------------------------------------------------
// Types — aligned with design-system-config.json
// ---------------------------------------------------------------------------

export interface CardVariant {
  bg: string;        // semantic token: "card", "glass", "muted"
  border: boolean;
  shadow: string;    // "none" | "sm" | "md" | "lg" | "xl"
  radius: string;    // "lg" | "xl" | "2xl"
  hover: string;     // "none" | "lift" | "scale" | "glow"
  blur?: boolean;    // for glass variant
}

export interface BadgeVariant {
  bg: string;        // "success/10", "primary/10", "muted"
  text: string;      // "success", "primary", "muted-foreground"
  border: boolean;
}

export interface ButtonVariant {
  bg: string;        // "primary", "secondary", "transparent"
  text: string;      // "primary-foreground", "foreground"
  hover: string;     // "none" | "lift" | "scale" | "glow"
  radius: string;    // "lg" | "xl"
}

export interface ComponentsConfig {
  cards: Record<string, CardVariant>;
  badges: Record<string, BadgeVariant>;
  buttons: Record<string, ButtonVariant>;
  hoverEffects: Record<string, HoverEffectDescriptor>;
}

export interface ComponentsSectionProps {
  components: ComponentsConfig;
  onChange: (components: ComponentsConfig) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Default variant data
// ---------------------------------------------------------------------------

const DEFAULT_CARD_VARIANT: CardVariant = {
  bg: "card",
  border: true,
  shadow: "sm",
  radius: "xl",
  hover: "none",
};

const DEFAULT_BADGE_VARIANT: BadgeVariant = {
  bg: "muted",
  text: "muted-foreground",
  border: true,
};

const DEFAULT_BUTTON_VARIANT: ButtonVariant = {
  bg: "primary",
  text: "primary-foreground",
  hover: "lift",
  radius: "lg",
};

// ---------------------------------------------------------------------------
// Options for selects
// ---------------------------------------------------------------------------

const BG_TOKEN_OPTIONS = [
  "card", "glass", "muted", "background", "primary", "secondary",
  "primary/10", "secondary/10", "success/10", "warning/10", "destructive/10", "info/10",
  "transparent",
];

const TEXT_TOKEN_OPTIONS = [
  "foreground", "primary", "secondary", "primary-foreground", "secondary-foreground",
  "destructive-foreground", "muted-foreground", "success", "warning", "destructive", "info",
];

const SHADOW_OPTIONS = ["none", "sm", "md", "lg", "xl"];
const RADIUS_OPTIONS = ["sm", "lg", "xl", "2xl"];
const HOVER_OPTIONS = ["none", "lift", "scale", "glow"];

// ---------------------------------------------------------------------------
// Shared token select field
// ---------------------------------------------------------------------------

interface TokenSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

function TokenSelect({ label, value, onChange, options }: TokenSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
          aria-label={label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/60 max-h-60">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-xs font-mono">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle field
// ---------------------------------------------------------------------------

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleField({ label, value, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full",
          "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          value ? "bg-primary" : "bg-muted border border-border/60"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            value ? "translate-x-4.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ── CARDS TAB ─────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

function CardSubForm({ data, onUpdate }: { data: CardVariant; onUpdate: (d: CardVariant) => void }) {
  const set = <K extends keyof CardVariant>(k: K, v: CardVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <TokenSelect label="Background" value={data.bg} onChange={(v) => set("bg", v)} options={BG_TOKEN_OPTIONS} />
      <TokenSelect label="Shadow" value={data.shadow} onChange={(v) => set("shadow", v)} options={SHADOW_OPTIONS} />
      <TokenSelect label="Radius" value={data.radius} onChange={(v) => set("radius", v)} options={RADIUS_OPTIONS} />
      <TokenSelect label="Hover" value={data.hover} onChange={(v) => set("hover", v)} options={HOVER_OPTIONS} />
      <ToggleField label="Border" value={data.border} onChange={(v) => set("border", v)} />
      {data.bg === "glass" && (
        <ToggleField label="Blur" value={data.blur ?? false} onChange={(v) => set("blur", v)} />
      )}
    </div>
  );
}

function CardVariantPreview(data: CardVariant) {
  return (
    <div
      className={cn(
        "w-12 h-8",
        data.border && "border border-border/60",
        data.bg === "glass" ? "bg-card/40 backdrop-blur-sm" :
        data.bg === "muted" ? "bg-muted" : "bg-card",
        data.shadow === "sm" ? "shadow-sm" :
        data.shadow === "md" ? "shadow-md" :
        data.shadow === "lg" ? "shadow-lg" :
        data.shadow === "xl" ? "shadow-xl" : "",
        data.radius === "lg" ? "rounded-lg" :
        data.radius === "xl" ? "rounded-xl" :
        data.radius === "2xl" ? "rounded-2xl" : "rounded-lg",
      )}
      aria-hidden="true"
    />
  );
}

function CardsTab({ variants, onChange }: { variants: Record<string, CardVariant>; onChange: (v: Record<string, CardVariant>) => void }) {
  const [selected, setSelected] = React.useState<string | null>(
    Object.keys(variants)[0] ?? null
  );
  const selectedData = selected ? variants[selected] : null;

  return (
    <div className="space-y-4">
      <VariantBuilder
        label="Card Variants"
        variants={variants}
        onChange={onChange}
        renderPreview={(data) => CardVariantPreview(data)}
        defaultVariant={DEFAULT_CARD_VARIANT}
        selectedVariant={selected}
        onSelect={setSelected}
      />
      {selectedData && selected && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Editing: {selected}
              </span>
              <Separator className="flex-1" />
            </div>
            {/* Live preview */}
            <div
              className={cn(
                "w-full h-16 flex items-center justify-center text-xs text-muted-foreground transition-all duration-200",
                selectedData.border && "border border-border/60",
                selectedData.bg === "glass" ? "bg-card/40 backdrop-blur-sm" :
                selectedData.bg === "muted" ? "bg-muted" : "bg-card",
                selectedData.shadow === "sm" ? "shadow-sm" :
                selectedData.shadow === "md" ? "shadow-md" :
                selectedData.shadow === "lg" ? "shadow-lg" :
                selectedData.shadow === "xl" ? "shadow-xl" : "",
                selectedData.radius === "lg" ? "rounded-lg" :
                selectedData.radius === "xl" ? "rounded-xl" :
                selectedData.radius === "2xl" ? "rounded-2xl" : "rounded-lg",
              )}
              aria-label={`Live preview for "${selected}" card variant`}
            >
              {selected} card
            </div>
            <CardSubForm
              data={selectedData}
              onUpdate={(updated) => onChange({ ...variants, [selected]: updated })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ── BADGES TAB ────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

function BadgeSubForm({ data, onUpdate }: { data: BadgeVariant; onUpdate: (d: BadgeVariant) => void }) {
  const set = <K extends keyof BadgeVariant>(k: K, v: BadgeVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <TokenSelect label="Background" value={data.bg} onChange={(v) => set("bg", v)} options={BG_TOKEN_OPTIONS} />
      <TokenSelect label="Text" value={data.text} onChange={(v) => set("text", v)} options={TEXT_TOKEN_OPTIONS} />
      <ToggleField label="Border" value={data.border} onChange={(v) => set("border", v)} />
    </div>
  );
}

function BadgeVariantPreview(data: BadgeVariant, name: string) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full",
        data.border && "border border-border/60",
        "bg-muted text-muted-foreground"
      )}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function BadgesTab({ variants, onChange }: { variants: Record<string, BadgeVariant>; onChange: (v: Record<string, BadgeVariant>) => void }) {
  const [selected, setSelected] = React.useState<string | null>(
    Object.keys(variants)[0] ?? null
  );
  const selectedData = selected ? variants[selected] : null;

  return (
    <div className="space-y-4">
      <VariantBuilder
        label="Badge Variants"
        variants={variants}
        onChange={onChange}
        renderPreview={(data, name) => BadgeVariantPreview(data, name)}
        defaultVariant={DEFAULT_BADGE_VARIANT}
        selectedVariant={selected}
        onSelect={setSelected}
      />
      {selectedData && selected && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Editing: {selected}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-all duration-200",
                  selectedData.border && "border border-border/60",
                  "bg-muted text-muted-foreground"
                )}
              >
                {selected}
              </span>
            </div>
            <BadgeSubForm
              data={selectedData}
              onUpdate={(updated) => onChange({ ...variants, [selected]: updated })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ── BUTTONS TAB ───────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

function ButtonSubForm({ data, onUpdate }: { data: ButtonVariant; onUpdate: (d: ButtonVariant) => void }) {
  const set = <K extends keyof ButtonVariant>(k: K, v: ButtonVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <TokenSelect label="Background" value={data.bg} onChange={(v) => set("bg", v)} options={BG_TOKEN_OPTIONS} />
      <TokenSelect label="Text" value={data.text} onChange={(v) => set("text", v)} options={TEXT_TOKEN_OPTIONS} />
      <TokenSelect label="Hover Effect" value={data.hover} onChange={(v) => set("hover", v)} options={HOVER_OPTIONS} />
      <TokenSelect label="Radius" value={data.radius} onChange={(v) => set("radius", v)} options={RADIUS_OPTIONS} />
    </div>
  );
}

function ButtonVariantPreview(data: ButtonVariant, name: string) {
  const isPrimary = data.bg === "primary";
  const isSecondary = data.bg === "secondary";
  const isDestructive = data.bg === "destructive";
  const isTransparent = data.bg === "transparent";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-lg",
        isPrimary && "bg-primary text-primary-foreground",
        isSecondary && "bg-secondary text-secondary-foreground",
        isDestructive && "bg-destructive text-destructive-foreground",
        isTransparent && "bg-transparent text-foreground border border-border/60",
        !isPrimary && !isSecondary && !isDestructive && !isTransparent && "bg-muted text-foreground",
      )}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function ButtonsTab({ variants, onChange }: { variants: Record<string, ButtonVariant>; onChange: (v: Record<string, ButtonVariant>) => void }) {
  const [selected, setSelected] = React.useState<string | null>(
    Object.keys(variants)[0] ?? null
  );
  const selectedData = selected ? variants[selected] : null;

  return (
    <div className="space-y-4">
      <VariantBuilder
        label="Button Variants"
        variants={variants}
        onChange={onChange}
        renderPreview={(data, name) => ButtonVariantPreview(data, name)}
        defaultVariant={DEFAULT_BUTTON_VARIANT}
        selectedVariant={selected}
        onSelect={setSelected}
      />
      {selectedData && selected && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Editing: {selected}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              {ButtonVariantPreview(selectedData, selected)}
            </div>
            <ButtonSubForm
              data={selectedData}
              onUpdate={(updated) => onChange({ ...variants, [selected]: updated })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ── HOVER EFFECTS TAB ─────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

function HoverEffectsTab({ effects, onChange }: { effects: Record<string, HoverEffectDescriptor>; onChange: (e: Record<string, HoverEffectDescriptor>) => void }) {
  const [selected, setSelected] = React.useState<string>(
    Object.keys(effects)[0] ?? ""
  );

  const selectedDescriptor = effects[selected];

  const updateDescriptor = <K extends keyof HoverEffectDescriptor>(
    key: K,
    value: HoverEffectDescriptor[K]
  ) => {
    if (!selected) return;
    onChange({
      ...effects,
      [selected]: { ...effects[selected], [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <HoverEffectPicker
        label="Hover Effects"
        value={selected}
        onChange={setSelected}
        effects={effects}
      />

      {selectedDescriptor && selected && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Editing: {selected}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Translate Y (px)
                </Label>
                <Input
                  type="number"
                  value={selectedDescriptor.translateY ?? 0}
                  onChange={(e) => updateDescriptor("translateY", Number(e.target.value))}
                  className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
                  aria-label="translateY value"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Scale
                </Label>
                <Input
                  type="number"
                  value={selectedDescriptor.scale ?? 1}
                  onChange={(e) => updateDescriptor("scale", Number(e.target.value))}
                  step={0.01}
                  className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
                  aria-label="scale value"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Box Shadow
                </Label>
                <Input
                  type="text"
                  value={selectedDescriptor.boxShadow ?? ""}
                  onChange={(e) => updateDescriptor("boxShadow", e.target.value || undefined)}
                  placeholder="0 8px 24px …"
                  className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
                  aria-label="box-shadow value"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComponentsSection({
  components,
  onChange,
  className,
}: ComponentsSectionProps) {
  const set = <K extends keyof ComponentsConfig>(
    key: K,
    value: ComponentsConfig[K]
  ) => onChange({ ...components, [key]: value });

  return (
    <BuilderSection
      title="Components"
      description="Design variants for cards, badges, buttons, and hover interactions."
      className={cn("", className)}
    >
      <Tabs defaultValue="cards">
        <TabsList className="w-full rounded-lg h-9 bg-muted/50 grid grid-cols-4 mb-4">
          <TabsTrigger value="cards"   className="rounded-lg text-xs">Cards</TabsTrigger>
          <TabsTrigger value="badges"  className="rounded-lg text-xs">Badges</TabsTrigger>
          <TabsTrigger value="buttons" className="rounded-lg text-xs">Buttons</TabsTrigger>
          <TabsTrigger value="hover"   className="rounded-lg text-xs">Hover</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-0">
          <CardsTab variants={components.cards} onChange={(v) => set("cards", v)} />
        </TabsContent>
        <TabsContent value="badges" className="mt-0">
          <BadgesTab variants={components.badges} onChange={(v) => set("badges", v)} />
        </TabsContent>
        <TabsContent value="buttons" className="mt-0">
          <ButtonsTab variants={components.buttons} onChange={(v) => set("buttons", v)} />
        </TabsContent>
        <TabsContent value="hover" className="mt-0">
          <HoverEffectsTab effects={components.hoverEffects} onChange={(v) => set("hoverEffects", v)} />
        </TabsContent>
      </Tabs>
    </BuilderSection>
  );
}

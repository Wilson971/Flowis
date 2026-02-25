"use client";

/**
 * ComponentsSection
 *
 * Tabbed editor for component-level design tokens:
 *
 *   Cards        – variant list + property sub-form; each variant previewed as a
 *                  small Card with bg, border, shadow, radius applied.
 *   Badges       – variant list + property sub-form; previewed as real Badge chips.
 *   Buttons      – variant list + property sub-form; previewed as real Button elements.
 *   Hover Effects – HoverEffectPicker for the configured effect catalogue.
 *
 * Props:
 *   components – { cards, badges, buttons, hoverEffects }
 *   onChange   – called with the full updated components object on any change
 */

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { HoverEffectPicker, HoverEffectDescriptor } from "@/components/theme-builder/controls/HoverEffectPicker";
import { BuilderSection } from "@/components/theme-builder/BuilderSection";

// ---------------------------------------------------------------------------
// Shared variant types
// ---------------------------------------------------------------------------

export interface CardVariant {
  bg: string;
  border: string;
  shadow: string;
  radius: string;
}

export interface BadgeVariant {
  bg: string;
  text: string;
  border: string;
  radius: string;
}

export interface ButtonVariant {
  bg: string;
  text: string;
  border: string;
  radius: string;
  paddingX: string;
  paddingY: string;
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
  bg:     "#ffffff",
  border: "#e5e7eb",
  shadow: "0 1px 3px 0 rgba(0,0,0,0.10)",
  radius: "12px",
};

const DEFAULT_BADGE_VARIANT: BadgeVariant = {
  bg:     "#f3f4f6",
  text:   "#374151",
  border: "#e5e7eb",
  radius: "9999px",
};

const DEFAULT_BUTTON_VARIANT: ButtonVariant = {
  bg:       "#6366f1",
  text:     "#ffffff",
  border:   "transparent",
  radius:   "8px",
  paddingX: "16px",
  paddingY: "8px",
};

// ---------------------------------------------------------------------------
// Shared labeled text input for variant property forms
// ---------------------------------------------------------------------------

interface PropFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}

function PropField({ label, value, onChange, placeholder, mono = true }: PropFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={cn(
          "h-8 rounded-lg text-xs bg-muted/40 border-border/60 focus:bg-card",
          mono && "font-mono"
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ── CARDS TAB ─────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

interface CardSubFormProps {
  data: CardVariant;
  onUpdate: (updated: CardVariant) => void;
}

function CardSubForm({ data, onUpdate }: CardSubFormProps) {
  const set = <K extends keyof CardVariant>(k: K, v: CardVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <PropField label="Background"   value={data.bg}     onChange={(v) => set("bg", v)}     placeholder="#ffffff" />
      <PropField label="Border color" value={data.border} onChange={(v) => set("border", v)} placeholder="#e5e7eb" />
      <PropField label="Shadow"       value={data.shadow} onChange={(v) => set("shadow", v)} placeholder="0 2px 8px …" />
      <PropField label="Radius"       value={data.radius} onChange={(v) => set("radius", v)} placeholder="12px" />
    </div>
  );
}

function CardVariantPreview(data: CardVariant) {
  return (
    <div
      className="w-12 h-8 border"
      style={{
        backgroundColor: data.bg,
        borderColor:      data.border,
        boxShadow:        data.shadow,
        borderRadius:     data.radius,
      }}
      aria-hidden="true"
    />
  );
}

interface CardsTabProps {
  variants: Record<string, CardVariant>;
  onChange: (variants: Record<string, CardVariant>) => void;
}

function CardsTab({ variants, onChange }: CardsTabProps) {
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
              className="w-full h-16 border flex items-center justify-center text-xs text-muted-foreground transition-all duration-200"
              style={{
                backgroundColor: selectedData.bg,
                borderColor:     selectedData.border,
                boxShadow:       selectedData.shadow,
                borderRadius:    selectedData.radius,
              }}
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

interface BadgeSubFormProps {
  data: BadgeVariant;
  onUpdate: (updated: BadgeVariant) => void;
}

function BadgeSubForm({ data, onUpdate }: BadgeSubFormProps) {
  const set = <K extends keyof BadgeVariant>(k: K, v: BadgeVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <PropField label="Background"   value={data.bg}     onChange={(v) => set("bg", v)}     placeholder="#f3f4f6" />
      <PropField label="Text color"   value={data.text}   onChange={(v) => set("text", v)}   placeholder="#374151" />
      <PropField label="Border color" value={data.border} onChange={(v) => set("border", v)} placeholder="#e5e7eb" />
      <PropField label="Radius"       value={data.radius} onChange={(v) => set("radius", v)} placeholder="9999px" />
    </div>
  );
}

function BadgeVariantPreview(data: BadgeVariant, name: string) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border"
      style={{
        backgroundColor: data.bg,
        color:           data.text,
        borderColor:     data.border,
        borderRadius:    data.radius,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

interface BadgesTabProps {
  variants: Record<string, BadgeVariant>;
  onChange: (variants: Record<string, BadgeVariant>) => void;
}

function BadgesTab({ variants, onChange }: BadgesTabProps) {
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
            {/* Live preview */}
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <span
                className="inline-flex items-center px-3 py-1 text-xs font-medium border transition-all duration-200"
                style={{
                  backgroundColor: selectedData.bg,
                  color:           selectedData.text,
                  borderColor:     selectedData.border,
                  borderRadius:    selectedData.radius,
                }}
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

interface ButtonSubFormProps {
  data: ButtonVariant;
  onUpdate: (updated: ButtonVariant) => void;
}

function ButtonSubForm({ data, onUpdate }: ButtonSubFormProps) {
  const set = <K extends keyof ButtonVariant>(k: K, v: ButtonVariant[K]) =>
    onUpdate({ ...data, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <PropField label="Background"  value={data.bg}       onChange={(v) => set("bg", v)}       placeholder="#6366f1" />
      <PropField label="Text color"  value={data.text}     onChange={(v) => set("text", v)}     placeholder="#ffffff" />
      <PropField label="Border"      value={data.border}   onChange={(v) => set("border", v)}   placeholder="transparent" />
      <PropField label="Radius"      value={data.radius}   onChange={(v) => set("radius", v)}   placeholder="8px" />
      <PropField label="Padding X"   value={data.paddingX} onChange={(v) => set("paddingX", v)} placeholder="16px" />
      <PropField label="Padding Y"   value={data.paddingY} onChange={(v) => set("paddingY", v)} placeholder="8px" />
    </div>
  );
}

function ButtonVariantPreview(data: ButtonVariant, name: string) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-medium border"
      style={{
        backgroundColor: data.bg,
        color:           data.text,
        borderColor:     data.border,
        borderRadius:    data.radius,
        paddingLeft:     "8px",
        paddingRight:    "8px",
        paddingTop:      "4px",
        paddingBottom:   "4px",
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

interface ButtonsTabProps {
  variants: Record<string, ButtonVariant>;
  onChange: (variants: Record<string, ButtonVariant>) => void;
}

function ButtonsTab({ variants, onChange }: ButtonsTabProps) {
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
            {/* Live preview */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <button
                type="button"
                className="inline-flex items-center text-sm font-medium border transition-all duration-200"
                style={{
                  backgroundColor: selectedData.bg,
                  color:           selectedData.text,
                  borderColor:     selectedData.border,
                  borderRadius:    selectedData.radius,
                  paddingLeft:     selectedData.paddingX,
                  paddingRight:    selectedData.paddingX,
                  paddingTop:      selectedData.paddingY,
                  paddingBottom:   selectedData.paddingY,
                }}
                aria-label={`Preview of "${selected}" button variant`}
              >
                {selected}
              </button>
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

interface HoverEffectsTabProps {
  effects: Record<string, HoverEffectDescriptor>;
  onChange: (effects: Record<string, HoverEffectDescriptor>) => void;
}

function HoverEffectsTab({ effects, onChange }: HoverEffectsTabProps) {
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
              {/* Translate Y */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Translate Y (px)
                </Label>
                <Input
                  type="number"
                  value={selectedDescriptor.translateY ?? 0}
                  onChange={(e) =>
                    updateDescriptor("translateY", Number(e.target.value))
                  }
                  className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
                  aria-label="translateY value"
                />
              </div>

              {/* Scale */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Scale
                </Label>
                <Input
                  type="number"
                  value={selectedDescriptor.scale ?? 1}
                  onChange={(e) =>
                    updateDescriptor("scale", Number(e.target.value))
                  }
                  step={0.01}
                  className="h-8 rounded-lg text-xs font-mono bg-muted/40 border-border/60 focus:bg-card"
                  aria-label="scale value"
                />
              </div>

              {/* Box shadow */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Box Shadow
                </Label>
                <Input
                  type="text"
                  value={selectedDescriptor.boxShadow ?? ""}
                  onChange={(e) =>
                    updateDescriptor("boxShadow", e.target.value || undefined)
                  }
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
          <CardsTab
            variants={components.cards}
            onChange={(v) => set("cards", v)}
          />
        </TabsContent>

        <TabsContent value="badges" className="mt-0">
          <BadgesTab
            variants={components.badges}
            onChange={(v) => set("badges", v)}
          />
        </TabsContent>

        <TabsContent value="buttons" className="mt-0">
          <ButtonsTab
            variants={components.buttons}
            onChange={(v) => set("buttons", v)}
          />
        </TabsContent>

        <TabsContent value="hover" className="mt-0">
          <HoverEffectsTab
            effects={components.hoverEffects}
            onChange={(v) => set("hoverEffects", v)}
          />
        </TabsContent>
      </Tabs>
    </BuilderSection>
  );
}

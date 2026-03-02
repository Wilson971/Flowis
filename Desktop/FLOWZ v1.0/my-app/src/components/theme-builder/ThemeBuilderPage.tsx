"use client";

/**
 * ThemeBuilderPage
 *
 * Main layout for the FLOWZ Design System Builder.
 * - Left 2/3: stacked editor sections with sticky tab nav
 * - Right 1/3: sticky live preview panel
 * - Top bar: title, Save, Export actions
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, Download, Loader2, Palette, Save } from "lucide-react";

import { ColorPaletteSection, type ColorSet } from "./sections/ColorPaletteSection";
import { TypographySection, type TypographyConfig } from "./sections/TypographySection";
import { EffectsMotionSection, type EffectsConfig } from "./sections/EffectsMotionSection";
import { ComponentsSection, type ComponentsConfig } from "./sections/ComponentsSection";
import { ThemePreviewPanel } from "./ThemePreviewPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionId = "colors" | "typography" | "effects" | "components";

interface SectionNav {
  id: SectionId;
  label: string;
  icon: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTIONS: SectionNav[] = [
  { id: "colors", label: "Colors", icon: "🎨" },
  { id: "typography", label: "Typography", icon: "Aa" },
  { id: "effects", label: "Effects & Motion", icon: "✨" },
  { id: "components", label: "Components", icon: "⬜" },
];

// ---------------------------------------------------------------------------
// Toast — simple state-based notification (no external dependency)
// ---------------------------------------------------------------------------

function Toast({ toast }: { toast: ToastState }) {
  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          variants={motionTokens.variants.slideDown}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            toast.type === "success"
              ? "bg-card border border-border text-foreground"
              : "bg-destructive text-white"
          )}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-primary shrink-0" />
          ) : null}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ThemeBuilderPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exported, setExported] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("colors");
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  // Section refs for scroll-spy
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({});

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    },
    []
  );

  // ── Load config ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/design-config");
        if (!res.ok) throw new Error("Failed to load config");
        const data = await res.json();
        setConfig(data);
      } catch {
        showToast("Could not load design config", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  // ── Scroll-spy ────────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  // ── Config change handlers — typed per section ────────────────────────────
  const handleColorsChange = useCallback((colors: ColorSet) => {
    setConfig((prev) => ({ ...prev, colors }));
  }, []);

  const handleTypographyChange = useCallback((typography: TypographyConfig) => {
    setConfig((prev) => ({ ...prev, typography }));
  }, []);

  const handleEffectsChange = useCallback((effects: EffectsConfig) => {
    setConfig((prev) => ({ ...prev, effects }));
  }, []);

  const handleComponentsChange = useCallback((components: ComponentsConfig) => {
    setConfig((prev) => ({ ...prev, components }));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/design-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Design config saved successfully");
    } catch {
      showToast("Failed to save config", "error");
    } finally {
      setSaving(false);
    }
  }, [config, showToast]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setExported(true);
      showToast("Config JSON copied to clipboard");
      setTimeout(() => setExported(false), 2000);
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  }, [config, showToast]);

  // ── Scroll to section ────────────────────────────────────────────────────
  const scrollToSection = useCallback((id: SectionId) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(id);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn(styles.layout.flexCenter, "h-96")}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className={cn(styles.text.bodyMuted, "ml-2")}>
          Loading design config…
        </span>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="min-h-screen bg-background">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className={cn(styles.layout.flexBetween, "h-14 gap-4")}>
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground leading-tight">
                    Design System Builder
                  </h1>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    FLOWZ v1.0
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="rounded-lg h-8 gap-1.5 text-xs"
                >
                  {exported ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Export JSON
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg h-8 gap-1.5 text-xs"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6 items-start">
            {/* ── Left: editor sections ──────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Sticky section tab nav */}
              <div className="sticky top-14 z-20 -mx-1 px-1 py-2 bg-background/90 backdrop-blur-sm">
                <Card className="rounded-xl p-1">
                  <div className="flex gap-1">
                    {SECTIONS.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => scrollToSection(id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                          activeSection === id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="text-sm leading-none">{icon}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Section: Colors */}
              <motion.div
                id="colors"
                ref={(el) => { sectionRefs.current.colors = el; }}
                variants={motionTokens.variants.slideUp}
                initial="hidden"
                animate="visible"
              >
                <ColorPaletteSection
                  colors={(config.colors as ColorSet) ?? { light: {}, dark: {} }}
                  onChange={handleColorsChange}
                />
              </motion.div>

              {/* Section: Typography */}
              <motion.div
                id="typography"
                ref={(el) => { sectionRefs.current.typography = el; }}
                variants={motionTokens.variants.slideUp}
                initial="hidden"
                animate="visible"
              >
                <TypographySection
                  typography={(config.typography as TypographyConfig) ?? { fontFamilies: {}, scale: {} }}
                  onChange={handleTypographyChange}
                />
              </motion.div>

              {/* Section: Effects & Motion */}
              <motion.div
                id="effects"
                ref={(el) => { sectionRefs.current.effects = el; }}
                variants={motionTokens.variants.slideUp}
                initial="hidden"
                animate="visible"
              >
                <EffectsMotionSection
                  effects={(config.effects as EffectsConfig) ?? {
                    radius: { base: 12, sm: 8, lg: 16, xl: 20, "2xl": 24 },
                    shadows: { sm: "0 1px 2px rgba(0,0,0,0.05)", md: "0 4px 6px -1px rgba(0,0,0,0.1)", lg: "0 10px 15px -3px rgba(0,0,0,0.1)", xl: "0 20px 25px -5px rgba(0,0,0,0.1)", glow: "0 0 20px rgba(16,185,129,0.3)" },
                    glass: { enabled: false, blur: 12, opacity: 0.1 },
                    motion: { intensity: "normal", durations: { fast: 200, default: 300, slow: 400 }, easings: { default: "cubic-bezier(0.4,0,0.2,1)", smooth: "cubic-bezier(0.23,1,0.32,1)", bounce: "cubic-bezier(0.68,-0.55,0.265,1.55)" } }
                  }}
                  onChange={handleEffectsChange}
                />
              </motion.div>

              {/* Section: Components */}
              <motion.div
                id="components"
                ref={(el) => { sectionRefs.current.components = el; }}
                variants={motionTokens.variants.slideUp}
                initial="hidden"
                animate="visible"
              >
                <ComponentsSection
                  components={(config.components as ComponentsConfig) ?? { cards: {}, badges: {}, buttons: {}, hoverEffects: {} }}
                  onChange={handleComponentsChange}
                />
              </motion.div>
            </div>

            {/* ── Right: live preview ────────────────────────────────────── */}
            <div className="w-80 shrink-0 hidden lg:block">
              <ThemePreviewPanel config={config} />
            </div>
          </div>

          {/* Mobile preview — shown below sections on small screens */}
          <div className="mt-6 lg:hidden">
            <ThemePreviewPanel config={config} />
          </div>
        </div>
      </div>
    </>
  );
}

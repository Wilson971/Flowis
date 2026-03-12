"use client"

/**
 * ImageAdjustments — Editor-level CSS filter sliders with Canvas bake-in.
 *
 * Provides real-time preview via CSS filters and an "Appliquer" action
 * that rasterises the filters onto a canvas and returns a Blob.
 */

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { styles } from "@/lib/design-system"
import { Sun, Contrast, Droplets, Sparkles, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AdjustmentValues {
  brightness: number
  contrast: number
  saturation: number
  sharpness: number
}

export interface ImageAdjustmentsProps {
  adjustments: AdjustmentValues
  onAdjustmentsChange: (adjustments: Partial<AdjustmentValues>) => void
  onReset: () => void
  onApply: (blob: Blob) => void
  imageUrl: string
}

/* ------------------------------------------------------------------ */
/*  Slider config                                                      */
/* ------------------------------------------------------------------ */

interface SliderConfig {
  key: keyof AdjustmentValues
  label: string
  icon: React.ReactNode
  min: number
  max: number
  note?: string
}

const SLIDERS: SliderConfig[] = [
  { key: "brightness", label: "Luminosité", icon: <Sun className="h-3.5 w-3.5" /> },
  { key: "contrast", label: "Contraste", icon: <Contrast className="h-3.5 w-3.5" /> },
  { key: "saturation", label: "Saturation", icon: <Droplets className="h-3.5 w-3.5" /> },
  {
    key: "sharpness",
    label: "Netteté",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    note: "Métadonnée uniquement",
  },
].map((s) => ({ min: 0, max: 200, ...s }))

const DEFAULT_VALUE = 100

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ImageAdjustments({
  adjustments,
  onAdjustmentsChange,
  onReset,
  onApply,
  imageUrl,
}: ImageAdjustmentsProps) {
  const [applying, setApplying] = useState(false)

  const isModified = (Object.keys(adjustments) as (keyof AdjustmentValues)[]).some(
    (k) => adjustments[k] !== DEFAULT_VALUE
  )

  const handleApply = useCallback(async () => {
    setApplying(true)
    try {
      const b = adjustments.brightness
      const c = adjustments.contrast
      const s = adjustments.saturation

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Image load failed"))
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.filter = `brightness(${b / 100}) contrast(${c / 100}) saturate(${s / 100})`
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) onApply(blob)
          setApplying(false)
        },
        "image/png"
      )
    } catch {
      setApplying(false)
    }
  }, [adjustments, imageUrl, onApply])

  return (
    <div className={cn("flex flex-col gap-4 p-4", styles.card.base)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={cn(styles.text.label, "uppercase tracking-wider")}>
          Ajustements
        </p>
      </div>

      <Separator />

      {/* Sliders */}
      <div className="space-y-4">
        {SLIDERS.map((slider) => (
          <div key={slider.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {slider.icon}
                <span>{slider.label}</span>
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-10 text-right">
                {adjustments[slider.key]}
              </span>
            </div>
            <Slider
              value={[adjustments[slider.key]]}
              onValueChange={([v]) => onAdjustmentsChange({ [slider.key]: v })}
              min={slider.min}
              max={slider.max}
              step={1}
              className="w-full"
              aria-label={slider.label}
            />
            {slider.note && (
              <p className="text-[10px] text-muted-foreground/60 italic">{slider.note}</p>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!isModified}
          className="flex-1 gap-1.5 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!isModified || applying}
          className="flex-1 gap-1.5 text-xs"
        >
          <Check className="h-3.5 w-3.5" />
          {applying ? "Application…" : "Appliquer"}
        </Button>
      </div>
    </div>
  )
}

export default ImageAdjustments

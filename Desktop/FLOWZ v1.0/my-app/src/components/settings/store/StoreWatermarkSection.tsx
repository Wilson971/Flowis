'use client'

import { useRef } from 'react'
import { useSelectedStore } from '@/contexts/StoreContext'
import {
  useWatermarkSettings,
  useUpdateWatermarkSettings,
  useToggleWatermark,
  useUploadWatermarkImage,
  WATERMARK_POSITIONS,
} from '@/hooks/stores/useWatermarkSettings'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard'
import {
  Droplets,
  Image,
  Type,
  Move,
  SunDim,
  Maximize2,
  Loader2,
  Upload,
  Store,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'
import type { WatermarkPosition } from '@/types/store'

const POSITION_GRID: { value: WatermarkPosition; short: string }[] = [
  { value: 'top-left', short: 'HG' },
  { value: 'top-center', short: 'HC' },
  { value: 'top-right', short: 'HD' },
  { value: 'center-left', short: 'CG' },
  { value: 'center', short: 'C' },
  { value: 'center-right', short: 'CD' },
  { value: 'bottom-left', short: 'BG' },
  { value: 'bottom-center', short: 'BC' },
  { value: 'bottom-right', short: 'BD' },
]

export default function StoreWatermarkSection() {
  const { selectedStore, isLoading: storeLoading } = useSelectedStore()
  const storeId = selectedStore?.id || null
  const { data: settings, isLoading: settingsLoading } = useWatermarkSettings(storeId)
  const updateSettings = useUpdateWatermarkSettings()
  const { toggle: toggleWatermark } = useToggleWatermark()
  const uploadImage = useUploadWatermarkImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = storeLoading || settingsLoading

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storeId) return
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo")
      return
    }
    uploadImage.mutate({ storeId, file })
  }

  const handleSettingChange = (key: string, value: unknown) => {
    if (!storeId) return
    updateSettings.mutate({ storeId, settings: { [key]: value } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16 space-y-3"
        variants={motionTokens.variants.fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Store className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sélectionnez une boutique dans la barre latérale</p>
      </motion.div>
    )
  }

  if (!settings) return null

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Enable toggle card */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard className="space-y-4">
          <SettingsHeader
            icon={Droplets}
            title="Filigrane"
            description="Protégez vos images produit"
          >
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => toggleWatermark(storeId!, checked)}
            />
          </SettingsHeader>

          {!settings.enabled && (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              Activez le watermark pour configurer les options
            </p>
          )}
        </SettingsCard>
      </motion.div>

      {settings.enabled && (
        <>
          {/* Image / Text source card */}
          <motion.div variants={motionTokens.variants.staggerItem}>
            <SettingsCard className="space-y-4">
              <SettingsHeader
                icon={Image}
                title="Source du watermark"
                description="Image ou texte"
              />

              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Image
                </Label>
                {settings.image_url ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl border border-border/40 bg-muted/30 overflow-hidden">
                      <img
                        src={settings.image_url}
                        alt="Watermark"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {settings.image_url.split('/').pop()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadImage.isPending}
                          className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
                        >
                          {uploadImage.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Changer
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSettingChange('image_url', null)}
                          className="h-7 text-[11px] rounded-lg font-medium text-muted-foreground hover:bg-accent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 rounded-xl border-dashed border-border/60 hover:bg-accent gap-2 font-medium text-[13px]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadImage.isPending}
                  >
                    {uploadImage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Uploader une image
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Text input */}
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Texte (alternatif)
                </Label>
                <Input
                  placeholder="ex: Ma Boutique"
                  value={settings.text || ''}
                  onChange={(e) => handleSettingChange('text', e.target.value || null)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Utilisé si aucune image n&apos;est définie
                </p>
              </div>
            </SettingsCard>
          </motion.div>

          {/* Position grid card */}
          <motion.div variants={motionTokens.variants.staggerItem}>
            <SettingsCard className="space-y-4">
              <SettingsHeader
                icon={Move}
                title="Position"
                description={WATERMARK_POSITIONS.find(p => p.value === settings.position)?.label || 'Bas droite'}
              />

              {/* 3x3 position grid */}
              <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                {POSITION_GRID.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => handleSettingChange('position', pos.value)}
                    className={cn(
                      'h-10 rounded-lg border text-xs font-medium transition-all',
                      settings.position === pos.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-muted/30 text-muted-foreground border-border/60 hover:bg-accent'
                    )}
                  >
                    {pos.short}
                  </button>
                ))}
              </div>
            </SettingsCard>
          </motion.div>

          {/* Sliders card */}
          <motion.div variants={motionTokens.variants.staggerItem}>
            <SettingsCard className="space-y-5">
              <SettingsHeader
                icon={SunDim}
                title="Apparence"
                description="Opacité, taille et marge"
              />

              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    <SunDim className="h-3.5 w-3.5 text-muted-foreground/60" />
                    Opacité
                  </Label>
                  <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded-lg text-muted-foreground">
                    {settings.opacity}%
                  </span>
                </div>
                <Slider
                  value={[settings.opacity]}
                  onValueChange={([value]) => handleSettingChange('opacity', value)}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>

              {/* Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                    Taille
                  </Label>
                  <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded-lg text-muted-foreground">
                    {settings.size}%
                  </span>
                </div>
                <Slider
                  value={[settings.size]}
                  onValueChange={([value]) => handleSettingChange('size', value)}
                  min={5}
                  max={50}
                  step={1}
                />
              </div>

              {/* Padding */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-muted-foreground/60" />
                    Marge
                  </Label>
                  <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded-lg text-muted-foreground">
                    {settings.padding}px
                  </span>
                </div>
                <Slider
                  value={[settings.padding]}
                  onValueChange={([value]) => handleSettingChange('padding', value)}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
            </SettingsCard>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

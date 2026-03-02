'use client'

import { useSelectedStore } from '@/contexts/StoreContext'
import {
  useStoreSyncSettings,
  useUpdateStoreSyncSettings,
  useToggleAutoSync,
} from '@/hooks/stores/useStoreSyncSettings'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Clock,
  Package,
  FolderTree,
  Layers,
  FileText,
  Bell,
  AlertTriangle,
  Loader2,
  Store,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'
import type { StoreSyncSettings } from '@/types/store'
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard'

interface SyncToggleRowProps {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  badge?: string
  onCheckedChange: (checked: boolean) => void
}

function SyncToggleRow({ icon: Icon, label, description, checked, disabled, badge, onCheckedChange }: SyncToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-[13px] font-medium cursor-pointer">{label}</Label>
            {badge && (
              <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted text-muted-foreground">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

export default function StoreSyncSection() {
  const { selectedStore, isLoading: storeLoading } = useSelectedStore()
  const storeId = selectedStore?.id || null
  const { data: settings, isLoading: settingsLoading } = useStoreSyncSettings(storeId)
  const updateSettings = useUpdateStoreSyncSettings()
  const { toggle: toggleAutoSync } = useToggleAutoSync()

  const isLoading = storeLoading || settingsLoading

  const handleSettingChange = (key: keyof StoreSyncSettings, value: boolean | number) => {
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
      {/* Auto-sync card */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard className="space-y-4">
          <SettingsHeader
            icon={RefreshCw}
            title="Synchronisation automatique"
            description="Synchronisez automatiquement vos données"
          />

          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-muted-foreground/60" />
              <div>
                <p className="text-[13px] font-medium">Auto-sync</p>
                <p className="text-xs text-muted-foreground">
                  {settings.auto_sync_enabled ? 'Activée' : 'Désactivée'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.auto_sync_enabled}
              onCheckedChange={(checked) => toggleAutoSync(storeId!, checked)}
            />
          </div>

          {/* Interval slider */}
          {settings.auto_sync_enabled && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-[13px] font-medium">Intervalle de synchronisation</Label>
                </div>
                <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted text-muted-foreground">
                  {settings.sync_interval_hours}h
                </Badge>
              </div>
              <Slider
                value={[settings.sync_interval_hours]}
                onValueChange={([value]) => handleSettingChange('sync_interval_hours', value)}
                min={1}
                max={72}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">1h</span>
                <span className="text-[10px] text-muted-foreground">72h</span>
              </div>
            </div>
          )}
        </SettingsCard>
      </motion.div>

      {/* Entities card */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard noPadding className="p-6">
          <div className="mb-2">
            <SettingsHeader
              icon={Layers}
              title="Entités à synchroniser"
              description="Choisissez les données à inclure"
            />
          </div>

          <div className="divide-y divide-border/40">
            <SyncToggleRow
              icon={Package}
              label="Produits"
              description="Synchroniser les produits et leur contenu"
              checked={settings.sync_products}
              onCheckedChange={(v) => handleSettingChange('sync_products', v)}
            />
            <SyncToggleRow
              icon={FolderTree}
              label="Catégories"
              description="Synchroniser l'arborescence de catégories"
              checked={settings.sync_categories}
              onCheckedChange={(v) => handleSettingChange('sync_categories', v)}
            />
            <SyncToggleRow
              icon={Layers}
              label="Variations"
              description="Synchroniser les variations de produits"
              checked={settings.sync_variations}
              onCheckedChange={(v) => handleSettingChange('sync_variations', v)}
            />
            <SyncToggleRow
              icon={FileText}
              label="Articles"
              description="Synchroniser les articles de blog"
              checked={settings.sync_posts}
              onCheckedChange={(v) => handleSettingChange('sync_posts', v)}
              badge="Beta"
            />
          </div>
        </SettingsCard>
      </motion.div>

      {/* Notifications card */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard noPadding className="p-6">
          <div className="mb-2">
            <SettingsHeader
              icon={Bell}
              title="Notifications"
              description="Alertes de synchronisation"
            />
          </div>

          <div className="divide-y divide-border/40">
            <SyncToggleRow
              icon={Bell}
              label="Sync terminée"
              description="Notification à la fin de chaque synchronisation"
              checked={settings.notify_on_complete}
              onCheckedChange={(v) => handleSettingChange('notify_on_complete', v)}
            />
            <SyncToggleRow
              icon={AlertTriangle}
              label="Erreurs de sync"
              description="Notification en cas d'erreur pendant la synchronisation"
              checked={settings.notify_on_error}
              onCheckedChange={(v) => handleSettingChange('notify_on_error', v)}
            />
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  )
}

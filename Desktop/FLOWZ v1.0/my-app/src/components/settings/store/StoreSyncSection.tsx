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
import { styles, motionTokens } from '@/lib/design-system'
import type { StoreSyncSettings } from '@/types/store'

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
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium cursor-pointer">{label}</Label>
            {badge && (
              <Badge variant="outline" className="text-[10px] px-1.5">
                {badge}
              </Badge>
            )}
          </div>
          <p className={cn(styles.text.bodySmall, 'text-xs')}>{description}</p>
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
        <p className={styles.text.bodyMuted}>Sélectionnez une boutique dans la barre latérale</p>
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
      {/* Header */}
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Synchronisation</h2>
        <p className={styles.text.bodyMuted}>Paramètres de sync pour {selectedStore.name}</p>
      </motion.div>

      {/* Auto-sync card */}
      <motion.div
        variants={motionTokens.variants.staggerItem}
        className={cn(styles.card.glass, 'p-6 space-y-4')}
      >
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Synchronisation automatique</h3>
            <p className={styles.text.bodySmall}>Synchronisez automatiquement vos données</p>
          </div>
        </div>

        {/* Auto-sync toggle */}
        <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/30 border border-border/40">
          <div className="flex items-center gap-3">
            <RefreshCw className={cn('h-4 w-4', settings.auto_sync_enabled ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className={styles.text.label}>Auto-sync</p>
              <p className={cn(styles.text.bodySmall, 'text-xs')}>
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
                <Label className="text-sm">Intervalle de synchronisation</Label>
              </div>
              <Badge variant="outline" className="text-xs">
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
              <span className={cn(styles.text.bodySmall, 'text-[10px]')}>1h</span>
              <span className={cn(styles.text.bodySmall, 'text-[10px]')}>72h</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Entities card */}
      <motion.div
        variants={motionTokens.variants.staggerItem}
        className={cn(styles.card.glass, 'p-6')}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Entités à synchroniser</h3>
            <p className={styles.text.bodySmall}>Choisissez les données à inclure</p>
          </div>
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
      </motion.div>

      {/* Notifications card */}
      <motion.div
        variants={motionTokens.variants.staggerItem}
        className={cn(styles.card.glass, 'p-6')}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Notifications</h3>
            <p className={styles.text.bodySmall}>Alertes de synchronisation</p>
          </div>
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
      </motion.div>
    </motion.div>
  )
}

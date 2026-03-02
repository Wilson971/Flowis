"use client"

/**
 * Stores Management Page — Bento Dashboard Redesign
 *
 * Layout: Header → Global Stats Bar → View Toggle → Animated Store Cards Grid
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store as StoreIcon, Plus, LayoutGrid, Maximize2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { textStyles } from '@/lib/design-system/styles'
import { motionTokens } from '@/lib/design-system/tokens'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StoreCard } from '@/components/stores/StoreCard'
import { StoresGlobalStats } from '@/components/stores/StoresGlobalStats'
import { DeleteStoreDialog } from '@/components/stores/DeleteStoreDialog'
import { DisconnectStoreDialog } from '@/components/stores/DisconnectStoreDialog'
import { StoreSettingsModal } from '@/components/stores/StoreSettingsModal'
import { WooSyncModal } from '@/components/sync/WooSyncModal'
import { useSelectedStore } from '@/contexts/StoreContext'
import type { Store as StoreContextStore } from '@/contexts/StoreContext'
import { useToggleActive } from '@/hooks/stores/useStores'
import { useScheduleStoreDeletion } from '@/hooks/stores/useScheduleStoreDeletion'
import { useDisconnectStore } from '@/hooks/stores/useDisconnectStore'
import { useAutoHealthCheck } from '@/hooks/stores/useStoreHeartbeat'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Store, SyncEntity } from '@/types/store'

// ============================================================================
// VIEW MODE TOGGLE
// ============================================================================

type ViewMode = 'compact' | 'expanded'

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/60">
      <button
        onClick={() => onChange('compact')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'compact'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Compact
      </button>
      <button
        onClick={() => onChange('expanded')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'expanded'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        Détaillé
      </button>
    </div>
  )
}

// ============================================================================
// STORE CARD WRAPPER — binds actions + modals per store
// ============================================================================

function StoreCardConnected({
  store: rawStore,
  viewMode,
}: {
  store: StoreContextStore
  viewMode: ViewMode
}) {
  const store = rawStore as unknown as Store
  const [showSync, setShowSync] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const { mutate: toggleActive } = useToggleActive()
  const { mutate: scheduleDeletion, isPending: isDeletingPending } = useScheduleStoreDeletion()
  const { mutate: disconnectStore, isPending: isDisconnectPending } = useDisconnectStore()

  const handleSync = (storeId: string, entities: SyncEntity[]) => {
    setShowSync(true)
  }

  return (
    <>
      <StoreCard
        store={store}
        viewMode={viewMode}
        onSync={handleSync}
        onEdit={() => setShowSettings(true)}
        onDisconnect={() => setShowDisconnect(true)}
        onDelete={() => setShowDelete(true)}
        onToggleActive={(id, active) => toggleActive({ id, active })}
      />

      <WooSyncModal
        open={showSync}
        onOpenChange={setShowSync}
        storeId={store.id}
        storeName={store.name}
      />
      <StoreSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        store={rawStore}
      />
      <DeleteStoreDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        store={store}
        onScheduleDeletion={(storeId, confirmation) => scheduleDeletion({ storeId, confirmation })}
        isPending={isDeletingPending}
      />
      <DisconnectStoreDialog
        open={showDisconnect}
        onOpenChange={setShowDisconnect}
        store={store}
        onConfirm={(storeId, force) => disconnectStore({ storeId, force })}
        isPending={isDisconnectPending}
      />
    </>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export default function StoresPage() {
  const { stores, isLoading } = useSelectedStore()
  const router = useRouter()
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('flowz-stores-view', 'compact')

  const storeIds = stores.map((s: StoreContextStore) => s.id)
  useAutoHealthCheck(storeIds)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des boutiques…</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(textStyles.h1, 'text-foreground')}>Boutiques</h1>
          <p className={cn(textStyles.bodyMuted, 'mt-1')}>
            Gérez vos boutiques en ligne connectées
          </p>
        </div>
        <Button onClick={() => router.push('/app/onboarding')}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une boutique
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <StoreIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune boutique configurée</h3>
            <p className="text-muted-foreground mb-4">
              Connectez votre première boutique pour commencer
            </p>
            <Button onClick={() => router.push('/app/onboarding')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une boutique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Global Stats Bar */}
          <StoresGlobalStats />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <p className={textStyles.bodySmall}>
              {stores.length} boutique{stores.length > 1 ? 's' : ''} connectée{stores.length > 1 ? 's' : ''}
            </p>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* Store Cards Grid */}
          <motion.div
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
            className={cn(
              'grid gap-6',
              viewMode === 'compact'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
            )}
          >
            {stores.map((store: StoreContextStore) => (
              <StoreCardConnected
                key={store.id}
                store={store}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

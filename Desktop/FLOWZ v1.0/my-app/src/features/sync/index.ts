/**
 * Sync Feature - Unified Synchronization System
 *
 * Architecture v2 avec:
 * - State Machine pour transitions d'état prévisibles
 * - Subscription Manager centralisé (plus de memory leaks)
 * - Query Invalidation avec debouncing (plus de cascades)
 * - React Context pour état global
 *
 * Usage:
 *
 * 1. Wrapper votre app avec SyncProvider:
 *    ```tsx
 *    <SyncProvider>
 *      <DashboardLayout />
 *    </SyncProvider>
 *    ```
 *
 * 2. Utiliser les hooks dans vos composants:
 *    ```tsx
 *    // Hook simple pour un store
 *    const { start, isSyncing, progress } = useSyncForStore(storeId);
 *
 *    // Ou hooks individuels
 *    const { startSync } = useSyncActions();
 *    const { isSyncing, progress } = useSyncStatus();
 *    ```
 */

// ============================================================================
// PROVIDER & CONTEXT HOOKS
// ============================================================================

export {
    SyncProvider,
    useSyncContext,
    useSyncState,
    useSyncStatus,
    useSyncActions,
    useSyncProgress,
    useStartSync,
    useSyncForStore,
} from './SyncProvider';

// ============================================================================
// ENGINE HOOK (pour usage avancé)
// ============================================================================

export { useSyncEngine } from './useSyncEngine';

// ============================================================================
// STATE MACHINE
// ============================================================================

export {
    syncReducer,
    initialSyncState,
    syncSelectors,
    canTransition,
    mapStatusToMachineState,
} from './machine';

// ============================================================================
// MANAGERS (pour usage avancé/debug)
// ============================================================================

export { syncSubscriptions } from './subscriptions';
export { queryInvalidation, invalidationPatterns } from './invalidation';

// ============================================================================
// COMPONENTS
// ============================================================================

export { SyncButton, SyncIconButton } from './components/SyncButton';
export { SyncModal } from './components/SyncModal';

// ============================================================================
// TYPES
// ============================================================================

export type {
    // State Machine
    SyncMachineState,
    SyncMachineEvent,
    SyncEngineState,

    // Options & Config
    SyncOptions,
    SubscriptionConfig,
    InvalidationConfig,

    // Progress
    SyncProgressData,
    PhaseProgressData,
    DetailedProgress,

    // Result
    SyncResult,

    // Context
    SyncContextValue,

    // Utilities
    UnsubscribeFn,
    QueryKeyPattern,
} from './types';

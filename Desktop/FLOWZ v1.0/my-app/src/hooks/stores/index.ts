/**
 * Stores Hooks - Export centralisé
 */

// Core store hooks
export {
    useStores,
    useStore,
    useActiveStore,
    useCreateStore,
    useUpdateStore,
    useDeleteStore,
} from './useStores';

// Heartbeat & Health
export {
    useStoreHeartbeat,
    useConnectionHealth,
    useHeartbeatLogs,
    useCheckAllStoresHealth,
    getHealthColor,
    getHealthBgColor,
    getHealthLabel,
} from './useStoreHeartbeat';

// Store lifecycle
export { useDisconnectStore } from './useDisconnectStore';
export { useReconnectStore } from './useReconnectStore';
export { useScheduleStoreDeletion } from './useScheduleStoreDeletion';
export { useCancelStoreDeletion } from './useCancelStoreDeletion';
export { usePermanentDeleteStore } from './usePermanentDeleteStore';

// Settings
export {
    useStoreSyncSettings,
    useUpdateStoreSyncSettings,
    useToggleAutoSync,
} from './useStoreSyncSettings';

// KPIs
export {
    useStoreKPIs,
    useAllStoresKPIs,
} from './useStoreKPIs';

// Watermark
export {
    useWatermarkSettings,
    useUpdateWatermarkSettings,
    useToggleWatermark,
    useUploadWatermarkImage,
    WATERMARK_POSITIONS,
} from './useWatermarkSettings';

// Re-export types
export type {
    Store,
    Platform,
    ConnectionHealth,
    StoreStatus,
    StoreMetadata,
    PlatformConnection,
    CredentialsEncrypted,
    HeartbeatResult,
    HeartbeatResponse,
    HeartbeatLog,
    WatermarkSettings,
    WatermarkPosition,
    StoreKPIs,
    CreateStoreParams,
    UpdateStoreParams,
    DisconnectStoreParams,
    ReconnectStoreParams,
    ScheduleDeletionParams,
    StoreSyncSettings,
} from '@/types/store';

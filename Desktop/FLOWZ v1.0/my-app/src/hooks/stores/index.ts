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
    useToggleActive,
    // Scope 7 — Advanced actions
    usePauseStore,
    useResumeStore,
    useDuplicateStore,
} from './useStores';

// Heartbeat & Health
export {
    useStoreHeartbeat,
    useConnectionHealth,
    useHeartbeatLogs,
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

// Realtime sync progress + latest sync job
export {
    useStoreRealtime,
    useLatestSyncJob,
} from './useStoreRealtime';
export type { LatestSyncJob } from './useStoreRealtime';

// AI Quota (Scope 5)
export { useStoreAIQuota } from './useStoreAIQuota';

// Members & Access (Scope 8)
export {
    useStoreMembers,
    useStoreInvitations,
    useStoreAuditLog,
    useInviteStoreMember,
    useUpdateMemberRole,
    useRemoveStoreMember,
    useCancelInvitation,
} from './useStoreMembers';

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
    StoreSyncConfig,
    SyncEntity,
    SyncFrequency,
    SyncProgressPayload,
    StoreHealthCheck,
    HealthCheckStatus,
    HealthErrorCode,
    StoreMetrics,
    StoreAIQuota,
    StoreAIQuotaByFeature,
    // Scope 8
    StoreMemberRole,
    StoreMember,
    StoreInvitation,
    StoreAuditLogEntry,
    // Scope 6
    AIProvider,
    ToneOfVoice,
    StoreAISettings,
} from '@/types/store';

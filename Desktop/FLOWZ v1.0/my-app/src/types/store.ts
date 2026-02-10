/**
 * Types pour la gestion des boutiques
 */

// ============================================================================
// STORE TYPES
// ============================================================================

export type Platform = 'woocommerce' | 'shopify';

export type ConnectionHealth = 'healthy' | 'unhealthy' | 'unknown';

export type StoreStatus = 'active' | 'inactive' | 'pending_deletion' | 'disconnected';

export interface Store {
    id: string;
    tenant_id: string;
    name: string;
    platform: Platform;
    description?: string | null;
    active: boolean;
    status?: StoreStatus;
    avatar_url?: string | null;
    connection_id?: string | null;
    metadata?: StoreMetadata | null;
    last_synced_at?: string | null;
    deletion_scheduled_at?: string | null;
    deletion_execute_at?: string | null;
    created_at: string;
    updated_at?: string;

    // Relations
    platform_connections?: PlatformConnection | null;
}

export interface StoreMetadata {
    currency?: string;
    timezone?: string;
    sync_interval_hours?: number;
    last_sync_stats?: {
        products: number;
        variations: number;
        categories: number;
        errors: number;
    };
    watermark_settings?: WatermarkSettings;
    [key: string]: unknown;
}

// ============================================================================
// PLATFORM CONNECTION
// ============================================================================

export interface PlatformConnection {
    id: string;
    store_id?: string;
    tenant_id: string;
    platform: Platform;
    shop_url: string;
    credentials_encrypted?: CredentialsEncrypted;
    connection_health?: ConnectionHealth;
    last_heartbeat_at?: string | null;
    heartbeat_error?: string | null;
    last_sync_at?: string | null;
    api_key?: string;
    api_secret?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CredentialsEncrypted {
    shop_url?: string;
    consumer_key?: string;
    consumer_secret?: string;
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    [key: string]: unknown;
}

// ============================================================================
// HEARTBEAT
// ============================================================================

export interface HeartbeatResult {
    store_id: string;
    connection_id: string;
    status: ConnectionHealth;
    response_time_ms: number;
    store_info?: {
        name: string;
        url: string;
        currency?: string;
    };
    error?: string;
}

export interface HeartbeatResponse {
    success: boolean;
    results: HeartbeatResult[];
    total_checked: number;
    healthy_count: number;
    unhealthy_count: number;
}

export interface HeartbeatLog {
    id: string;
    connection_id: string;
    store_id: string;
    status: 'success' | 'failure';
    response_time_ms: number | null;
    error_message: string | null;
    store_info: Record<string, unknown> | null;
    created_at: string;
}

// ============================================================================
// WATERMARK
// ============================================================================

export type WatermarkPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export interface WatermarkSettings {
    enabled: boolean;
    image_url?: string | null;
    text?: string | null;
    position: WatermarkPosition;
    opacity: number; // 0-100
    size: number; // percentage of image
    padding: number; // pixels
}

// ============================================================================
// STORE KPIS
// ============================================================================

export interface StoreKPIs {
    totalProducts: number;
    optimizedProducts: number;
    pendingProducts: number;
    totalCategories: number;
    lastSyncAt: string | null;
    syncSuccessRate: number;
    avgSyncDuration: number;
}

// ============================================================================
// STORE ACTIONS
// ============================================================================

export interface CreateStoreParams {
    name: string;
    platform: Platform;
    shop_url: string;
    credentials: {
        consumer_key?: string;
        consumer_secret?: string;
        api_key?: string;
        api_secret?: string;
        access_token?: string;
    };
    description?: string;
}

export interface UpdateStoreParams {
    id: string;
    name?: string;
    description?: string;
    active?: boolean;
    avatar_url?: string;
    metadata?: Partial<StoreMetadata>;
}

export interface DisconnectStoreParams {
    storeId: string;
    force?: boolean;
}

export interface ReconnectStoreParams {
    storeId: string;
    credentials: {
        consumer_key?: string;
        consumer_secret?: string;
        api_key?: string;
        api_secret?: string;
    };
}

export interface ScheduleDeletionParams {
    storeId: string;
    confirmation: string;
}

// ============================================================================
// SYNC SETTINGS
// ============================================================================

export interface StoreSyncSettings {
    auto_sync_enabled: boolean;
    sync_interval_hours: number;
    sync_products: boolean;
    sync_categories: boolean;
    sync_variations: boolean;
    sync_posts: boolean;
    notify_on_complete: boolean;
    notify_on_error: boolean;
}

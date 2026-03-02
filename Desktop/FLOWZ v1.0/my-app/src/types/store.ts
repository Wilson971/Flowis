/**
 * Types pour la gestion des boutiques
 */

// ============================================================================
// STORE TYPES
// ============================================================================

export type Platform = 'woocommerce' | 'shopify';

export type ConnectionHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type HealthCheckStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export type HealthErrorCode =
  | 'AUTH_EXPIRED'
  | 'SSL_ERROR'
  | 'SITE_DOWN'
  | 'RATE_LIMITED'
  | 'PERMISSION_DENIED'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface StoreHealthCheck {
  id: string;
  store_id: string;
  tenant_id: string;
  status: HealthCheckStatus;
  response_time_ms: number | null;
  error_code: HealthErrorCode | null;
  error_message: string | null;
  cms_version: string | null;
  checked_at: string;
}

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
    // Scope 1 — Identity fields
    logo_url?: string | null;
    currency?: string | null;
    primary_language?: string | null;
    country_code?: string | null;
    // Scope 7 — Advanced actions
    paused_at?: string | null;
    deleted_at?: string | null;
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
    // Scope 4 — Extended metrics
    totalBlogPosts: number;
    avgSeoScore: number;
    coveragePercent: number;
    productsWithoutDesc: number;
}

// ============================================================================
// STORE METRICS (Scope 4 — from get_store_metrics RPC)
// ============================================================================

export interface StoreMetrics {
    total_products: number;
    products_with_ai: number;
    products_without_desc: number;
    total_blog_posts: number;
    avg_seo_score: number;
    coverage_percent: number;
}

// ============================================================================
// STORE AI QUOTA (Scope 5)
// ============================================================================

export interface StoreAIQuotaByFeature {
    flowriter: number;
    photo_studio: number;
    [key: string]: number;
}

export interface StoreAIQuota {
    storeId: string;
    used: number;
    limit: number;
    percent: number;
    byFeature: StoreAIQuotaByFeature;
    periodStart: string | null;
    resetDate: string | null;
    alert80Sent: boolean;
    alert95Sent: boolean;
}

// ============================================================================
// STORE MEMBERS & ACCESS (Scope 8)
// ============================================================================

export type StoreMemberRole = 'owner' | 'admin' | 'viewer';

export interface StoreMember {
    id: string;
    store_id: string;
    tenant_id: string;
    user_id: string;
    role: StoreMemberRole;
    invited_by: string | null;
    joined_at: string;
    created_at: string;
    // Join: user profile
    profiles?: {
        email?: string;
        full_name?: string;
        avatar_url?: string;
    } | null;
}

export interface StoreInvitation {
    id: string;
    store_id: string;
    tenant_id: string;
    email: string;
    role: Exclude<StoreMemberRole, 'owner'>;
    token: string;
    invited_by: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
}

export interface StoreAuditLogEntry {
    id: string;
    store_id: string;
    tenant_id: string;
    user_id: string | null;
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
}

// ============================================================================
// STORE AI SETTINGS (Scope 6 — stored in stores.metadata.ai_settings)
// ============================================================================

export type AIProvider = 'gemini' | 'openai';

export type ToneOfVoice =
    | 'professional'
    | 'casual'
    | 'persuasive'
    | 'educational'
    | 'storytelling';

export interface StoreAISettings {
    provider: AIProvider;
    tone_of_voice: ToneOfVoice;
    default_language: string;
    template_badges: string[];
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
    logo_url?: string;
    currency?: string;
    primary_language?: string;
    country_code?: string;
    paused_at?: string | null;
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

// ============================================================================
// STORE SYNC CONFIG (Scope 3)
// ============================================================================

export type SyncEntity = 'products' | 'categories' | 'blog' | 'commercial';

export type SyncFrequency = '6h' | '12h' | '24h' | 'weekly';

export interface StoreSyncConfig {
    store_id: string;
    tenant_id: string;
    auto_sync_enabled: boolean;
    frequency: SyncFrequency;
    selected_entities: SyncEntity[];
    cron_expression: string | null;
    next_sync_at: string | null;
    created_at: string;
    updated_at: string;
}

// Realtime sync progress payload
export interface SyncProgressPayload {
    step: number;
    totalSteps: number;
    entity: SyncEntity;
    processed: number;
    total: number;
    percent: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
}

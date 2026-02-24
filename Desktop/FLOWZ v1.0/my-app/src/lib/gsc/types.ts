/**
 * Google Search Console Integration - Types
 *
 * Matches the REAL remote Supabase schema:
 *   - gsc_connections (tokens as separate encrypted fields)
 *   - gsc_sites (sites linked to connections)
 *   - gsc_keywords (keyword data linked to sites)
 *   - gsc_oauth_states (DB-based CSRF)
 */

// ============================================================================
// OAuth Tokens (in-memory only, never stored as JSONB)
// ============================================================================

export interface GscTokens {
    access_token: string;
    refresh_token: string;
    expiry_at: string; // ISO 8601
    scope?: string;
}

// ============================================================================
// GSC API Response Types
// ============================================================================

export interface GscSearchAnalyticsRow {
    keys: string[]; // [page_url, query] when dimensions = ['page', 'query']
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscSearchAnalyticsResponse {
    rows?: GscSearchAnalyticsRow[];
    responseAggregationType?: string;
}

export interface GscSiteEntry {
    siteUrl: string;
    permissionLevel: 'siteOwner' | 'siteFullUser' | 'siteRestrictedUser' | 'siteUnverifiedUser';
}

export interface GscSitesResponse {
    siteEntry?: GscSiteEntry[];
}

// ============================================================================
// Database Row Types (matches real remote schema)
// ============================================================================

/** gsc_connections table */
export interface GscConnection {
    id: string;
    tenant_id: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string;
    token_expires_at: string;       // TIMESTAMPTZ
    email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** gsc_sites table */
export interface GscSite {
    id: string;
    gsc_connection_id: string;
    tenant_id: string;
    site_url: string;
    permission_level: string;
    store_id: string | null;
    is_active: boolean;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

/** gsc_keywords table */
export interface GscKeywordRow {
    id: string;
    site_id: string;
    tenant_id: string;
    page_url: string;
    query: string;
    date_range: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    fetched_at: string;
}

/** gsc_oauth_states table */
export interface GscOAuthState {
    id: string;
    state: string;
    tenant_id: string;
    created_at: string;
    expires_at: string;
}

// ============================================================================
// Client-side types (used in hooks & components)
// ============================================================================

/** Flattened view returned by /api/gsc/sites for UI consumption */
export interface GscConnectionView {
    connection_id: string;
    site_id: string;
    site_url: string;
    email: string | null;
    is_active: boolean;
    last_synced_at: string | null;
    permission_level: string;
    store_id: string | null;
    created_at: string;
}

export interface GscKeywordData {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export type GscDateRange = 'last_7_days' | 'last_28_days';

// ============================================================================
// Dashboard types
// ============================================================================

export interface GscDailyStats {
    stat_date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscKpiSummary {
    total_clicks: number;
    total_impressions: number;
    avg_ctr: number;
    avg_position: number;
}

export interface GscTopPage {
    page_url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscCountryStats {
    country: string; // ISO 3166-1 alpha-3 code (e.g. "FRA", "BEL")
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscDeviceStats {
    device: string; // "DESKTOP" | "MOBILE" | "TABLET"
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscDashboardResponse {
    kpis: GscKpiSummary;
    kpis_previous: GscKpiSummary;
    daily: GscDailyStats[];
    top_keywords: GscKeywordData[];
    top_pages: GscTopPage[];
    countries: GscCountryStats[];
    devices: GscDeviceStats[];
}

// ============================================================================
// Keywords Explorer
// ============================================================================

export interface GscKeywordExplorerRow {
    query: string;
    page_url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    product_id: string | null;
    product_title: string | null;
}

export interface GscKeywordsAggregates {
    total_clicks: number;
    total_impressions: number;
    avg_position: number;
    quick_wins_count: number;
    position_distribution: { bucket: string; count: number }[];
}

export type GscKeywordsSortBy = 'clicks' | 'impressions' | 'ctr' | 'position' | 'query';
export type GscSortOrder = 'asc' | 'desc';

export interface GscKeywordsExplorerResponse {
    keywords: GscKeywordExplorerRow[];
    total: number;
    page: number;
    per_page: number;
    aggregates: GscKeywordsAggregates;
}

// ============================================================================
// Pages & Products
// ============================================================================

export interface GscPageWithProduct {
    page_url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    product_id: string | null;
    product_title: string | null;
    has_product: boolean;
}

// ============================================================================
// Opportunities
// ============================================================================

export interface GscOpportunityKeyword {
    query: string;
    page_url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscCannibalizationEntry {
    query: string;
    page_count: number;
    total_impressions: number;
    pages: Array<{ page_url: string; position: number; clicks: number; impressions: number }>;
}

export interface GscOpportunitiesResponse {
    quick_wins: GscOpportunityKeyword[];
    low_ctr: GscOpportunityKeyword[];
    no_clicks: GscOpportunityKeyword[];
    cannibalization: GscCannibalizationEntry[];
    avg_ctr: number;
}

// ============================================================================
// Position Tracking
// ============================================================================

export interface GscPositionChange {
    query: string;
    position_7d: number;
    position_28d: number;
    delta: number;
    direction: 'up' | 'down' | 'stable';
    impressions_7d: number;
}

// ============================================================================
// Indexation Feature Types
// ============================================================================

export type GscIndexationVerdict =
    | 'indexed'
    | 'not_indexed'
    | 'crawled_not_indexed'
    | 'discovered_not_indexed'
    | 'noindex'
    | 'blocked_robots'
    | 'error'
    | 'unknown';

export type GscQueueStatus = 'pending' | 'submitted' | 'failed' | 'quota_exceeded';

export type GscUrlSource = 'sitemap' | 'product' | 'blog' | 'manual';

export type GscUrlFilterRule = 'contains' | 'not_contains' | 'starts_with' | 'ends_with';

/** Combined URL + indexation status view */
export interface GscIndexationUrl {
    id: string;
    url: string;
    source: GscUrlSource;
    source_id: string | null;
    verdict: GscIndexationVerdict;
    coverage_state: string | null;
    last_crawl_time: string | null;
    inspected_at: string | null;
    lastmod: string | null;
    is_active: boolean;
}

/** Overview stats for the indexation dashboard */
export interface GscIndexationOverview {
    total: number;
    indexed: number;
    not_indexed: number;
    crawled_not_indexed: number;
    discovered_not_indexed: number;
    noindex: number;
    blocked_robots: number;
    errors: number;
    unknown: number;
    history: Array<{
        date: string;
        total: number;
        indexed: number;
        not_indexed: number;
    }>;
}

/** Queue stats for "Pages en attente" */
export interface GscQueueStats {
    total_submitted: number;
    pending: number;
    submitted: number;
    failed: number;
    daily_quota_used: number;
    daily_quota_limit: number;
}

/** Auto-indexation settings */
export interface GscIndexationSettings {
    auto_index_new: boolean;
    auto_index_updated: boolean;
}

/** Parsed sitemap entry */
export interface GscSitemapEntry {
    url: string;
    lastmod: string | null;
}

/** Queue item row */
export interface GscQueueItem {
    id: string;
    url: string;
    action: 'URL_UPDATED' | 'URL_DELETED';
    status: GscQueueStatus;
    attempts: number;
    submitted_at: string | null;
    error_message: string | null;
    created_at: string;
}

/** URL Inspection API raw result (from Google) */
export interface UrlInspectionResult {
    inspectionResultLink?: string;
    indexStatusResult?: {
        verdict: 'VERDICT_UNSPECIFIED' | 'PASS' | 'NEUTRAL' | 'FAIL' | 'PARTIAL';
        coverageState: string;
        robotsTxtState?: string;
        indexingState?: string;
        lastCrawlTime?: string;
        pageFetchState?: string;
        googleCanonical?: string;
        userCanonical?: string;
        sitemap?: string[];
        referringUrls?: string[];
        crawledAs?: string;
    };
}

/** URL Notification response (from Google Indexing API) */
export interface UrlNotificationMetadata {
    url: string;
    latest_update?: {
        url: string;
        type: string;
        notify_time: string;
    };
    latest_remove?: {
        url: string;
        type: string;
        notify_time: string;
    };
}

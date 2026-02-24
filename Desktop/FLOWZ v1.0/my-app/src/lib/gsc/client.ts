/**
 * Google Search Console - API Client
 *
 * Handles OAuth token refresh and GSC API calls.
 * Adapted for the real schema where tokens are stored as separate encrypted fields.
 * Server-side only (uses env vars for client credentials).
 */

import type {
    GscTokens,
    GscSearchAnalyticsResponse,
    GscSearchAnalyticsRow,
    GscSitesResponse,
    GscSiteEntry,
    GscDateRange,
    GscSitemapEntry,
    GscIndexationVerdict,
    UrlInspectionResult,
    UrlNotificationMetadata,
} from './types';

// ============================================================================
// Token Refresh
// ============================================================================

/**
 * Refresh an expired access token using the refresh token.
 * Returns updated tokens (new access_token + updated expiry_at).
 */
export async function refreshAccessToken(tokens: GscTokens): Promise<GscTokens> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokens.refresh_token,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${error.error_description || error.error || response.status}`);
    }

    const data = await response.json();

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expiry_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        scope: data.scope || tokens.scope,
    };
}

/**
 * Check if tokens need refresh (expires in < 5 minutes).
 */
export function needsRefresh(expiresAt: string): boolean {
    const expiryMs = new Date(expiresAt).getTime();
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() > (expiryMs - bufferMs);
}

/**
 * Ensure tokens are valid, refresh if needed.
 */
export async function ensureValidTokens(tokens: GscTokens): Promise<{ tokens: GscTokens; refreshed: boolean }> {
    if (needsRefresh(tokens.expiry_at)) {
        const refreshed = await refreshAccessToken(tokens);
        return { tokens: refreshed, refreshed: true };
    }
    return { tokens, refreshed: false };
}

// ============================================================================
// GSC API Calls
// ============================================================================

/**
 * Fetch verified sites from Google Search Console.
 */
export async function fetchVerifiedSites(accessToken: string): Promise<GscSiteEntry[]> {
    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error(`GSC sites fetch failed: ${response.status}`);
    }

    const data: GscSitesResponse = await response.json();
    return data.siteEntry || [];
}

/**
 * Fetch search analytics data from GSC for a specific site.
 * Dimensions: ['page', 'query'] -- returns per-page, per-keyword data.
 */
export async function fetchSearchAnalytics(
    accessToken: string,
    siteUrl: string,
    dateRange: GscDateRange = 'last_28_days',
    rowLimit: number = 5000
): Promise<GscSearchAnalyticsRow[]> {
    const { startDate, endDate } = getDateRangeBounds(dateRange);

    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['page', 'query'],
            rowLimit,
            dataState: 'all',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`GSC searchAnalytics failed: ${error.error?.message || response.status}`);
    }

    const data: GscSearchAnalyticsResponse = await response.json();
    return data.rows || [];
}

/**
 * Fetch Google user email from the access token.
 */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.email || null;
    } catch {
        return null;
    }
}

/**
 * Fetch daily aggregated stats from GSC (for time-series charts).
 * Uses dimensions: ['date'] — one row per day, site-level totals.
 */
export async function fetchSearchAnalyticsByDate(
    accessToken: string,
    siteUrl: string,
    startDate: string,
    endDate: string
): Promise<GscSearchAnalyticsRow[]> {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['date'],
            rowLimit: 1000,
            dataState: 'all',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`GSC daily stats failed: ${error.error?.message || response.status}`);
    }

    const data: GscSearchAnalyticsResponse = await response.json();
    return data.rows || [];
}

/**
 * Fetch search analytics aggregated by country.
 */
export async function fetchSearchAnalyticsByCountry(
    accessToken: string,
    siteUrl: string,
    dateRange: GscDateRange = 'last_28_days',
): Promise<GscSearchAnalyticsRow[]> {
    const { startDate, endDate } = getDateRangeBounds(dateRange);
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['country'],
            rowLimit: 50,
            dataState: 'all',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`GSC country stats failed: ${error.error?.message || response.status}`);
    }

    const data: GscSearchAnalyticsResponse = await response.json();
    return data.rows || [];
}

/**
 * Fetch search analytics aggregated by device.
 */
export async function fetchSearchAnalyticsByDevice(
    accessToken: string,
    siteUrl: string,
    dateRange: GscDateRange = 'last_28_days',
): Promise<GscSearchAnalyticsRow[]> {
    const { startDate, endDate } = getDateRangeBounds(dateRange);
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ['device'],
            rowLimit: 10,
            dataState: 'all',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`GSC device stats failed: ${error.error?.message || response.status}`);
    }

    const data: GscSearchAnalyticsResponse = await response.json();
    return data.rows || [];
}

// ============================================================================
// URL Normalization
// ============================================================================

/**
 * Normalize a URL for matching GSC page URLs with product permalinks.
 */
export function normalizeGscUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
        return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
    } catch {
        return url.toLowerCase().replace(/\/$/, '');
    }
}

// ============================================================================
// Date Range Helpers
// ============================================================================

// ============================================================================
// Sitemap Parsing
// ============================================================================

/**
 * Parse a sitemap XML (handles sitemapindex recursion).
 * Returns all discovered URLs with their lastmod dates.
 */
export async function parseSitemap(siteUrl: string): Promise<GscSitemapEntry[]> {
    const baseUrl = siteUrl.replace(/\/$/, '');
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    return parseSitemapUrl(sitemapUrl);
}

async function parseSitemapUrl(url: string): Promise<GscSitemapEntry[]> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'FLOWZ-Bot/1.0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        console.warn(`[GSC Sitemap] Failed to fetch ${url}: ${response.status}`);
        return [];
    }

    const contentType = response.headers.get('content-type') || '';
    let text: string;

    if (contentType.includes('gzip') || url.endsWith('.gz')) {
        const buffer = await response.arrayBuffer();
        const { gunzipSync } = await import('zlib');
        text = gunzipSync(Buffer.from(buffer)).toString('utf-8');
    } else {
        text = await response.text();
    }

    // Detect sitemapindex vs urlset
    if (text.includes('<sitemapindex')) {
        const sitemapLocs = extractXmlTags(text, 'sitemap', 'loc');
        const results: GscSitemapEntry[] = [];
        for (const loc of sitemapLocs) {
            const childEntries = await parseSitemapUrl(loc);
            results.push(...childEntries);
        }
        return results;
    }

    // Standard urlset
    return extractUrlsetEntries(text);
}

function extractXmlTags(xml: string, parentTag: string, childTag: string): string[] {
    const results: string[] = [];
    const parentRegex = new RegExp(`<${parentTag}[^>]*>([\\s\\S]*?)<\\/${parentTag}>`, 'gi');
    let parentMatch;
    while ((parentMatch = parentRegex.exec(xml)) !== null) {
        const childRegex = new RegExp(`<${childTag}>([^<]+)<\\/${childTag}>`, 'i');
        const childMatch = childRegex.exec(parentMatch[1]);
        if (childMatch) {
            results.push(childMatch[1].trim());
        }
    }
    return results;
}

function extractUrlsetEntries(xml: string): GscSitemapEntry[] {
    const entries: GscSitemapEntry[] = [];
    const urlRegex = /<url>([\s\S]*?)<\/url>/gi;
    let match;
    while ((match = urlRegex.exec(xml)) !== null) {
        const block = match[1];
        const locMatch = /<loc>([^<]+)<\/loc>/i.exec(block);
        if (!locMatch) continue;
        const lastmodMatch = /<lastmod>([^<]+)<\/lastmod>/i.exec(block);
        entries.push({
            url: locMatch[1].trim().replace(/&amp;/g, '&'),
            lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
        });
    }
    return entries;
}

// ============================================================================
// URL Inspection API
// ============================================================================

/**
 * Inspect a single URL via Google URL Inspection API.
 */
export async function inspectUrl(
    accessToken: string,
    inspectionUrl: string,
    siteUrl: string
): Promise<UrlInspectionResult> {
    const response = await fetch(
        'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inspectionUrl,
                siteUrl,
                languageCode: 'fr',
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            `URL Inspection failed for ${inspectionUrl}: ${error.error?.message || response.status}`
        );
    }

    const data = await response.json();
    return data.inspectionResult || {};
}

/**
 * Map Google URL Inspection result to FLOWZ verdict.
 */
export function mapInspectionToVerdict(result: UrlInspectionResult): GscIndexationVerdict {
    const idx = result.indexStatusResult;
    if (!idx) return 'unknown';

    // Check noindex first (specific signal)
    if (
        idx.indexingState === 'BLOCKED_BY_META_TAG' ||
        idx.indexingState === 'BLOCKED_BY_HTTP_HEADER'
    ) {
        return 'noindex';
    }

    // Check robots.txt block
    if (idx.robotsTxtState === 'DISALLOWED') {
        return 'blocked_robots';
    }

    // Map by verdict
    switch (idx.verdict) {
        case 'PASS':
            return 'indexed';
        case 'FAIL':
            return 'error';
        case 'NEUTRAL': {
            const cs = (idx.coverageState || '').toLowerCase();
            if (cs.includes('crawled')) return 'crawled_not_indexed';
            if (cs.includes('discovered')) return 'discovered_not_indexed';
            return 'not_indexed';
        }
        default:
            return 'unknown';
    }
}

// ============================================================================
// Google Indexing API
// ============================================================================

/**
 * Submit a single URL for indexing via Google Indexing API.
 */
export async function submitUrlForIndexing(
    accessToken: string,
    url: string,
    type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<UrlNotificationMetadata> {
    const response = await fetch(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, type }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            `Indexing API failed for ${url}: ${error.error?.message || response.status}`
        );
    }

    return response.json();
}

/**
 * Submit multiple URLs in batch via Google Indexing API.
 * Max 100 URLs per batch.
 */
export async function submitUrlsBatch(
    accessToken: string,
    urls: Array<{ url: string; type: 'URL_UPDATED' | 'URL_DELETED' }>
): Promise<Array<{ url: string; success: boolean; error?: string }>> {
    const BATCH_SIZE = 100;
    const results: Array<{ url: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const boundary = `batch_${Date.now()}_${i}`;

        let body = '';
        for (const item of batch) {
            body += `--${boundary}\r\n`;
            body += 'Content-Type: application/http\r\n';
            body += 'Content-Transfer-Encoding: binary\r\n\r\n';
            body += 'POST /v3/urlNotifications:publish\r\n';
            body += 'Content-Type: application/json\r\n\r\n';
            body += JSON.stringify({ url: item.url, type: item.type }) + '\r\n';
        }
        body += `--${boundary}--\r\n`;

        try {
            const response = await fetch('https://indexing.googleapis.com/batch', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': `multipart/mixed; boundary=${boundary}`,
                },
                body,
            });

            if (response.ok) {
                // Parse multipart response
                const responseText = await response.text();
                // Simple success: if batch returns 200, mark all as successful
                for (const item of batch) {
                    const hasError = responseText.includes(`"error"`) &&
                        responseText.includes(item.url);
                    results.push({
                        url: item.url,
                        success: !hasError,
                        error: hasError ? 'Batch item failed' : undefined,
                    });
                }
            } else {
                const error = await response.text();
                for (const item of batch) {
                    results.push({
                        url: item.url,
                        success: false,
                        error: `Batch failed: ${response.status}`,
                    });
                }
            }
        } catch (err) {
            for (const item of batch) {
                results.push({
                    url: item.url,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }
    }

    return results;
}

// ============================================================================
// Date Range Helpers
// ============================================================================

function getDateRangeBounds(dateRange: GscDateRange): { startDate: string; endDate: string } {
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const endDate = end.toISOString().slice(0, 10);

    const start = new Date(end);
    switch (dateRange) {
        case 'last_7_days':
            start.setDate(start.getDate() - 7);
            break;
        case 'last_28_days':
        default:
            start.setDate(start.getDate() - 28);
            break;
    }
    const startDate = start.toISOString().slice(0, 10);

    return { startDate, endDate };
}

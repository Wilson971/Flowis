/**
 * gsc-sync — Edge Function
 *
 * Scheduled every 6 hours to sync ALL GSC data for all active sites:
 *   - Keywords (page + query dimensions)
 *   - Daily stats (date dimension, 90 days)
 *   - Country stats (country dimension)
 *   - Device stats (device dimension)
 *
 * Uses the current schema: separate encrypted token fields on gsc_connections
 * (access_token_encrypted, refresh_token_encrypted, token_expires_at).
 *
 * Iterates over gsc_sites (joined with gsc_connections) — not gsc_connections directly.
 *
 * Deploy: supabase functions deploy gsc-sync --no-verify-jwt
 * Cron: every 6 hours via pg_cron
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { scryptSync, createDecipheriv, createCipheriv, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GSC_TOKEN_ENCRYPTION_KEY = Deno.env.get("GSC_TOKEN_ENCRYPTION_KEY")!;

// ============================================================================
// Crypto (AES-256-GCM — mirrors lib/gsc/crypto.ts exactly, using node:crypto)
// ============================================================================

function getEncryptionKey(): Buffer {
    return scryptSync(GSC_TOKEN_ENCRYPTION_KEY, "flowz-gsc-salt", 32);
}

/**
 * Decrypt a single encrypted token string.
 * Format: salt:iv:tag:ciphertext (hex-encoded).
 * Uses scryptSync (same KDF as the Node.js API route).
 */
function decryptToken(encryptedStr: string): string {
    const key = getEncryptionKey();
    const parts = encryptedStr.split(":");
    if (parts.length !== 4) throw new Error("Invalid encrypted token format");

    const [, ivHex, tagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Encrypt a single token string.
 * Returns salt:iv:tag:ciphertext (hex-encoded).
 */
function encryptToken(tokenValue: string): string {
    const key = getEncryptionKey();
    const salt = randomBytes(16);
    const iv = randomBytes(16);

    const cipher = createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(tokenValue, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return [
        salt.toString("hex"),
        iv.toString("hex"),
        tag.toString("hex"),
        encrypted,
    ].join(":");
}

// ============================================================================
// Google API Helpers
// ============================================================================

interface TokenSet {
    access_token: string;
    refresh_token: string;
    expiry_at: string;
}

async function refreshAccessToken(tokens: TokenSet): Promise<TokenSet> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokens.refresh_token,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${err.error_description || err.error || response.status}`);
    }

    const data = await response.json();
    // M6 fix: Validate response structure
    if (typeof data.access_token !== "string" || !data.access_token) {
        throw new Error("Token refresh response missing access_token");
    }
    if (typeof data.expires_in !== "number") {
        throw new Error("Token refresh response missing expires_in");
    }
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expiry_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
}

function needsRefresh(expiryAt: string): boolean {
    return Date.now() > new Date(expiryAt).getTime() - 5 * 60 * 1000;
}

interface SearchAnalyticsRow {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

async function fetchGscAnalytics(
    accessToken: string,
    siteUrl: string,
    dimensions: string[],
    startDate: string,
    endDate: string,
    rowLimit: number = 5000
): Promise<SearchAnalyticsRow[]> {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions,
            rowLimit,
            dataState: "all",
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`GSC API error (${dimensions.join(",")}): ${err.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.rows || [];
}

// ============================================================================
// Date helpers
// ============================================================================

function getDateBounds(daysBack: number): { startDate: string; endDate: string } {
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data lag
    const start = new Date(end);
    start.setDate(start.getDate() - daysBack);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    };
}

// ============================================================================
// Batch upsert helper
// ============================================================================

async function batchUpsert(
    supabase: ReturnType<typeof createClient>,
    table: string,
    rows: Record<string, unknown>[],
    onConflict: string,
    batchSize = 500
): Promise<number> {
    let errors = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase
            .from(table)
            .upsert(batch, { onConflict });
        if (error) {
            console.error(`[gsc-sync] ${table} upsert error:`, error.message);
            errors++;
        }
    }
    return errors;
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (_req: Request) => {
    console.log("[gsc-sync] Starting sync run...");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch all active sites with their parent connection
    const { data: sites, error: siteError } = await supabase
        .from("gsc_sites")
        .select(`
            id,
            site_url,
            tenant_id,
            gsc_connection_id,
            gsc_connections!inner (
                id,
                access_token_encrypted,
                refresh_token_encrypted,
                token_expires_at,
                is_active
            )
        `)
        .eq("is_active", true);

    if (siteError) {
        console.error("[gsc-sync] Failed to fetch sites:", siteError.message);
        return new Response(JSON.stringify({ error: siteError.message }), { status: 500 });
    }

    // Filter to only sites whose connection is also active
    const activeSites = (sites || []).filter(
        (s: any) => s.gsc_connections?.is_active === true
    );

    if (activeSites.length === 0) {
        console.log("[gsc-sync] No active sites found.");
        return new Response(JSON.stringify({ synced: 0 }));
    }

    console.log(`[gsc-sync] Processing ${activeSites.length} site(s)...`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const dateRange28 = getDateBounds(28);
    const dateRange90 = getDateBounds(90);

    for (let idx = 0; idx < activeSites.length; idx++) {
        const site = activeSites[idx] as any;
        const conn = site.gsc_connections;
        const siteId = site.id;
        const tenantId = site.tenant_id;
        const siteUrl = site.site_url;

        try {
            // ── 1. Decrypt tokens (separate fields) ──
            let tokens: TokenSet = {
                access_token: decryptToken(conn.access_token_encrypted),
                refresh_token: decryptToken(conn.refresh_token_encrypted),
                expiry_at: conn.token_expires_at,
            };

            // ── 2. Refresh if needed ──
            if (needsRefresh(tokens.expiry_at)) {
                tokens = await refreshAccessToken(tokens);
                // Save refreshed tokens back
                await supabase
                    .from("gsc_connections")
                    .update({
                        access_token_encrypted: encryptToken(tokens.access_token),
                        refresh_token_encrypted: encryptToken(tokens.refresh_token),
                        token_expires_at: tokens.expiry_at,
                    })
                    .eq("id", conn.id);
            }

            const now = new Date().toISOString();

            // ── 3. Keywords (page + query, last 28 days) ──
            const keywordRows = await fetchGscAnalytics(
                tokens.access_token, siteUrl,
                ["page", "query"],
                dateRange28.startDate, dateRange28.endDate,
                5000
            );
            if (keywordRows.length > 0) {
                const mapped = keywordRows.map(row => ({
                    site_id: siteId,
                    tenant_id: tenantId,
                    page_url: row.keys[0],
                    query: row.keys[1],
                    date_range: "last_28_days",
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: Math.round(row.ctr * 10000) / 10000,
                    position: Math.round(row.position * 100) / 100,
                    fetched_at: now,
                }));
                await batchUpsert(supabase, "gsc_keywords", mapped, "site_id,page_url,date_range,query");
            }

            // ── 4. Daily stats (date dimension, 90 days) ──
            let dailySynced = 0;
            try {
                const dailyRows = await fetchGscAnalytics(
                    tokens.access_token, siteUrl,
                    ["date"],
                    dateRange90.startDate, dateRange90.endDate,
                    1000
                );
                if (dailyRows.length > 0) {
                    const mapped = dailyRows.map(row => ({
                        site_id: siteId,
                        tenant_id: tenantId,
                        stat_date: row.keys[0],
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: Math.round(row.ctr * 10000) / 10000,
                        position: Math.round(row.position * 100) / 100,
                        fetched_at: now,
                    }));
                    await batchUpsert(supabase, "gsc_daily_stats", mapped, "site_id,stat_date");
                    dailySynced = dailyRows.length;
                }
            } catch (err: any) {
                console.error(`[gsc-sync] Site ${siteId} daily stats error:`, err.message);
            }

            // ── 5. Country stats ──
            let countrySynced = 0;
            try {
                const countryRows = await fetchGscAnalytics(
                    tokens.access_token, siteUrl,
                    ["country"],
                    dateRange28.startDate, dateRange28.endDate,
                    50
                );
                if (countryRows.length > 0) {
                    const mapped = countryRows.map(row => ({
                        site_id: siteId,
                        tenant_id: tenantId,
                        country: row.keys[0],
                        date_range: "last_28_days",
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: Math.round(row.ctr * 10000) / 10000,
                        position: Math.round(row.position * 100) / 100,
                        fetched_at: now,
                    }));
                    await batchUpsert(supabase, "gsc_country_stats", mapped, "site_id,country,date_range");
                    countrySynced = countryRows.length;
                }
            } catch (err: any) {
                console.error(`[gsc-sync] Site ${siteId} country stats error:`, err.message);
            }

            // ── 6. Device stats ──
            let deviceSynced = 0;
            try {
                const deviceRows = await fetchGscAnalytics(
                    tokens.access_token, siteUrl,
                    ["device"],
                    dateRange28.startDate, dateRange28.endDate,
                    10
                );
                if (deviceRows.length > 0) {
                    const mapped = deviceRows.map(row => ({
                        site_id: siteId,
                        tenant_id: tenantId,
                        device: row.keys[0],
                        date_range: "last_28_days",
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: Math.round(row.ctr * 10000) / 10000,
                        position: Math.round(row.position * 100) / 100,
                        fetched_at: now,
                    }));
                    await batchUpsert(supabase, "gsc_device_stats", mapped, "site_id,device,date_range");
                    deviceSynced = deviceRows.length;
                }
            } catch (err: any) {
                console.error(`[gsc-sync] Site ${siteId} device stats error:`, err.message);
            }

            // ── 7. Update last_synced_at on the site ──
            await supabase
                .from("gsc_sites")
                .update({ last_synced_at: now })
                .eq("id", siteId);

            console.log(
                `[gsc-sync] Site ${siteId}: ${keywordRows.length} keywords, ` +
                `${dailySynced} daily, ${countrySynced} countries, ${deviceSynced} devices`
            );
            successCount++;

        } catch (err: any) {
            const msg = `Site ${siteId} (${siteUrl}): ${err.message}`;
            console.error(`[gsc-sync] ${msg}`);
            errors.push(msg);
            failCount++;
        }

        // Rate limit: 600ms delay between sites
        if (idx < activeSites.length - 1) {
            await new Promise(r => setTimeout(r, 600));
        }
    }

    console.log(`[gsc-sync] Done. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
        synced: successCount,
        failed: failCount,
        total: activeSites.length,
        ...(errors.length > 0 && { errors }),
    }));
});

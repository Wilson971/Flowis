/**
 * inspect-batch — Edge Function
 *
 * Processes the next N uninspected URLs for a given site (or all active sites).
 * Designed to be called:
 *   - From the UI (with JWT auth) for immediate manual trigger
 *   - From pg_cron (with service role) for background processing
 *
 * Body params:
 *   - siteId?: string   — process a specific site (UI mode)
 *   - batchSize?: number — URLs per call (default: 20, max: 50)
 *
 * If no siteId, processes all active sites that have uninspected URLs (cron mode).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { scryptSync, createDecipheriv } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GSC_TOKEN_ENCRYPTION_KEY = Deno.env.get("GSC_TOKEN_ENCRYPTION_KEY")!;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
};

// ─── Crypto (mirrors my-app/src/lib/gsc/crypto.ts exactly) ──────────────────

function getKey(): Buffer {
    return scryptSync(GSC_TOKEN_ENCRYPTION_KEY, "flowz-gsc-salt", 32) as Buffer;
}

function decryptToken(encryptedStr: string): string {
    const parts = encryptedStr.split(":");
    if (parts.length !== 4) throw new Error("Invalid token format");
    const [, ivHex, tagHex, ciphertext] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

// ─── Google API ───────────────────────────────────────────────────────────────

async function refreshAccessToken(rt: string): Promise<string> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: rt,
        }),
    });
    if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
}

async function inspectUrl(accessToken: string, inspectionUrl: string, siteUrl: string) {
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "fr" }),
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.inspectionResult || null;
}

function mapVerdict(result: any): string {
    const idx = result?.indexStatusResult;
    if (!idx) return "unknown";
    if (idx.indexingState === "BLOCKED_BY_META_TAG" || idx.indexingState === "BLOCKED_BY_HTTP_HEADER") return "noindex";
    if (idx.robotsTxtState === "DISALLOWED") return "blocked_robots";
    switch (idx.verdict) {
        case "PASS": return "indexed";
        case "FAIL": return "error";
        case "NEUTRAL": {
            const cs = (idx.coverageState || "").toLowerCase();
            if (cs.includes("crawled")) return "crawled_not_indexed";
            if (cs.includes("discovered")) return "discovered_not_indexed";
            return "not_indexed";
        }
        default: return "unknown";
    }
}

// ─── Core: process one site ───────────────────────────────────────────────────

async function processSite(
    supabase: any,
    site: { id: string; site_url: string; tenant_id: string; gsc_connections: any },
    batchSize: number
): Promise<{ inspected: number; remaining: number; site_url: string }> {
    const conn = site.gsc_connections;
    if (!conn?.is_active) return { inspected: 0, remaining: 0, site_url: site.site_url };

    // Decrypt tokens
    let accessToken = decryptToken(conn.access_token_encrypted);
    const expiresAt = new Date(conn.token_expires_at).getTime();
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
        const rt = decryptToken(conn.refresh_token_encrypted);
        accessToken = await refreshAccessToken(rt);
    }

    // Check daily quota
    const today = new Date().toISOString().slice(0, 10);
    const { data: settings } = await supabase
        .from("gsc_indexation_settings")
        .select("daily_inspection_count, quota_reset_date")
        .eq("site_id", site.id)
        .single();

    const inspectionCount = settings?.quota_reset_date === today ? (settings.daily_inspection_count || 0) : 0;
    const DAILY_LIMIT = 2000;
    const quotaRemaining = Math.max(0, DAILY_LIMIT - inspectionCount);
    const toInspect = Math.min(batchSize, quotaRemaining);

    if (toInspect === 0) return { inspected: 0, remaining: 0, site_url: site.site_url };

    // Get already-inspected URL IDs (fix for Supabase JS subquery limitation)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentlyInspected } = await supabase
        .from("gsc_indexation_status")
        .select("sitemap_url_id")
        .eq("site_id", site.id)
        .gte("inspected_at", sevenDaysAgo);

    const inspectedIds = (recentlyInspected || []).map((r: any) => r.sitemap_url_id).filter(Boolean);

    // Fetch next uninspected URLs
    let query = supabase
        .from("gsc_sitemap_urls")
        .select("id, url")
        .eq("site_id", site.id)
        .eq("tenant_id", site.tenant_id)
        .eq("is_active", true)
        .limit(toInspect + inspectedIds.length); // fetch extra to account for exclusions

    const { data: candidates } = await query;

    const urlsToProcess = (candidates || [])
        .filter((u: any) => !inspectedIds.includes(u.id))
        .slice(0, toInspect);

    // Count total remaining (for progress reporting)
    const { count: totalUninspected } = await supabase
        .from("gsc_sitemap_urls")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("is_active", true)
        .not("id", "in", inspectedIds.length > 0 ? `(${inspectedIds.map((id: string) => `"${id}"`).join(",")})` : '("")');

    let inspected = 0;
    for (const item of urlsToProcess) {
        try {
            const result = await inspectUrl(accessToken, item.url, site.site_url);
            if (result) {
                const verdict = mapVerdict(result);
                const idx = result.indexStatusResult || {};
                await supabase.from("gsc_indexation_status").upsert({
                    sitemap_url_id: item.id,
                    site_id: site.id,
                    tenant_id: site.tenant_id,
                    url: item.url,
                    verdict,
                    coverage_state: idx.coverageState || null,
                    last_crawl_time: idx.lastCrawlTime || null,
                    crawled_as: idx.crawledAs || null,
                    robots_txt_state: idx.robotsTxtState || null,
                    indexing_state: idx.indexingState || null,
                    page_fetch_state: idx.pageFetchState || null,
                    google_canonical: idx.googleCanonical || null,
                    inspected_at: new Date().toISOString(),
                }, { onConflict: "site_id,url" });
                inspected++;
            }
        } catch {
            // Non-fatal — continue with next URL
        }

        // Respect Google rate limit (max 600 req/min)
        await new Promise(r => setTimeout(r, 120));
    }

    // Update quota counter
    await supabase.from("gsc_indexation_settings").upsert({
        site_id: site.id,
        tenant_id: site.tenant_id,
        daily_inspection_count: inspectionCount + inspected,
        quota_reset_date: today,
    }, { onConflict: "site_id" });

    // Snapshot history
    try {
        await supabase.rpc("snapshot_gsc_indexation_history", {
            p_tenant_id: site.tenant_id,
            p_site_id: site.id,
        });
    } catch { /* non-fatal */ }

    const remaining = Math.max(0, (totalUninspected || 0) - inspected);
    return { inspected, remaining, site_url: site.site_url };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    // Auth: accept JWT (UI) or service role (cron)
    const authHeader = req.headers.get("Authorization") || "";
    const isCron = authHeader.includes(SERVICE_ROLE_KEY);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let body: { siteId?: string; batchSize?: number } = {};
    try {
        body = await req.json().catch(() => ({}));
    } catch { /* empty body ok */ }

    const batchSize = Math.min(Math.max(1, body.batchSize || 20), 50);

    try {
        // If siteId provided → single site mode (UI trigger)
        if (body.siteId) {
            const { data: site, error } = await supabase
                .from("gsc_sites")
                .select(`id, site_url, tenant_id, gsc_connections!inner(access_token_encrypted, refresh_token_encrypted, token_expires_at, is_active)`)
                .eq("id", body.siteId)
                .eq("is_active", true)
                .single();

            if (error || !site) {
                return new Response(JSON.stringify({ error: "Site not found" }), { status: 404, headers: CORS_HEADERS });
            }

            const result = await processSite(supabase, site as any, batchSize);
            return new Response(JSON.stringify({
                ...result,
                has_more: result.remaining > 0,
            }), { headers: CORS_HEADERS });
        }

        // Cron mode: process ALL active sites with uninspected URLs
        const { data: sites } = await supabase
            .from("gsc_sites")
            .select(`id, site_url, tenant_id, gsc_connections!inner(access_token_encrypted, refresh_token_encrypted, token_expires_at, is_active)`)
            .eq("is_active", true);

        // Filter to sites that actually have uninspected URLs
        const results = [];
        for (const site of sites || []) {
            try {
                const result = await processSite(supabase, site as any, batchSize);
                if (result.inspected > 0 || result.remaining > 0) {
                    results.push(result);
                }
            } catch (err) {
                results.push({ site_url: (site as any).site_url, error: String(err), inspected: 0, remaining: 0 });
            }
        }

        return new Response(JSON.stringify({
            sites_processed: results.length,
            total_inspected: results.reduce((s, r) => s + r.inspected, 0),
            results,
        }), { headers: CORS_HEADERS });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS });
    }
});

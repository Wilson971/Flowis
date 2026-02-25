/**
 * auto-index — Edge Function
 *
 * Automatically inspects URLs based on per-site settings:
 *   - auto_index_new:     URLs in gsc_sitemap_urls with no gsc_indexation_status row yet
 *   - auto_index_updated: URLs where gsc_sitemap_urls.lastmod > gsc_indexation_status.inspected_at
 *
 * Designed to be called:
 *   - From pg_cron (service role) — runs every hour
 *   - From the UI (JWT auth) — manual trigger
 *
 * Body params:
 *   - siteId?: string  — process a specific site (UI mode)
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

const DAILY_LIMIT = 2000;
const BATCH_SIZE = 50;

// ─── Crypto (mirrors inspect-batch exactly) ───────────────────────────────────

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
    settings: { auto_index_new: boolean; auto_index_updated: boolean; daily_inspection_count: number; quota_reset_date: string }
): Promise<{ inspected_new: number; inspected_updated: number; skipped_quota: boolean }> {
    const conn = site.gsc_connections;
    if (!conn?.is_active) return { inspected_new: 0, inspected_updated: 0, skipped_quota: false };

    // Decrypt + optionally refresh access token
    let accessToken = decryptToken(conn.access_token_encrypted);
    const expiresAt = new Date(conn.token_expires_at).getTime();
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
        const rt = decryptToken(conn.refresh_token_encrypted);
        accessToken = await refreshAccessToken(rt);
    }

    // Quota check
    const today = new Date().toISOString().slice(0, 10);
    const usedToday = settings.quota_reset_date === today ? settings.daily_inspection_count : 0;
    let quotaRemaining = Math.max(0, DAILY_LIMIT - usedToday);

    if (quotaRemaining === 0) return { inspected_new: 0, inspected_updated: 0, skipped_quota: true };

    const urlsToInspect: Array<{ id: string; url: string; reason: "new" | "updated" }> = [];

    // ── 1. New URLs (no gsc_indexation_status row) ────────────────────────────
    if (settings.auto_index_new && quotaRemaining > 0) {
        const { data: alreadyInspectedIds } = await supabase
            .from("gsc_indexation_status")
            .select("sitemap_url_id")
            .eq("site_id", site.id)
            .eq("tenant_id", site.tenant_id);

        const inspectedSet = new Set((alreadyInspectedIds || []).map((r: any) => r.sitemap_url_id));

        const { data: newUrls } = await supabase
            .from("gsc_sitemap_urls")
            .select("id, url")
            .eq("site_id", site.id)
            .eq("tenant_id", site.tenant_id)
            .eq("is_active", true)
            .limit(Math.min(BATCH_SIZE, quotaRemaining));

        for (const u of newUrls || []) {
            if (!inspectedSet.has(u.id) && urlsToInspect.length < quotaRemaining) {
                urlsToInspect.push({ ...u, reason: "new" });
            }
        }
    }

    // ── 2. Updated URLs (lastmod > inspected_at) ──────────────────────────────
    if (settings.auto_index_updated && quotaRemaining - urlsToInspect.length > 0) {
        const slots = quotaRemaining - urlsToInspect.length;
        const alreadyQueued = new Set(urlsToInspect.map(u => u.id));

        const { data: updatedUrls } = await supabase
            .from("gsc_sitemap_urls")
            .select(`id, url, lastmod, gsc_indexation_status!inner(inspected_at)`)
            .eq("site_id", site.id)
            .eq("tenant_id", site.tenant_id)
            .eq("is_active", true)
            .not("lastmod", "is", null)
            .limit(slots * 3); // fetch extra, filter in JS

        for (const u of updatedUrls || []) {
            if (alreadyQueued.has(u.id)) continue;
            const inspectedAt = u.gsc_indexation_status?.inspected_at;
            if (!inspectedAt) continue;
            if (new Date(u.lastmod) > new Date(inspectedAt)) {
                urlsToInspect.push({ id: u.id, url: u.url, reason: "updated" });
                if (urlsToInspect.filter(x => x.reason === "updated").length >= slots) break;
            }
        }
    }

    if (urlsToInspect.length === 0) return { inspected_new: 0, inspected_updated: 0, skipped_quota: false };

    // ── Inspect & upsert ──────────────────────────────────────────────────────
    let inspectedNew = 0;
    let inspectedUpdated = 0;

    for (const item of urlsToInspect) {
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

                if (item.reason === "new") inspectedNew++;
                else inspectedUpdated++;
            }
        } catch {
            // Non-fatal — continue with next URL
        }

        // Respect Google rate limit (max 600 req/min)
        await new Promise(r => setTimeout(r, 120));
    }

    const totalInspected = inspectedNew + inspectedUpdated;

    // Update quota
    if (totalInspected > 0) {
        await supabase.from("gsc_indexation_settings").upsert({
            site_id: site.id,
            tenant_id: site.tenant_id,
            daily_inspection_count: usedToday + totalInspected,
            quota_reset_date: today,
        }, { onConflict: "site_id" });

        // Snapshot history
        try {
            await supabase.rpc("snapshot_gsc_indexation_history", {
                p_tenant_id: site.tenant_id,
                p_site_id: site.id,
            });
        } catch { /* non-fatal */ }
    }

    return { inspected_new: inspectedNew, inspected_updated: inspectedUpdated, skipped_quota: false };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    let body: { siteId?: string } = {};
    try {
        body = await req.json().catch(() => ({}));
    } catch { /* empty body ok */ }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    try {
        const today = new Date().toISOString().slice(0, 10);

        // Build query: sites with at least one auto-index setting enabled
        let sitesQuery = supabase
            .from("gsc_sites")
            .select(`
                id, site_url, tenant_id,
                gsc_connections!inner(access_token_encrypted, refresh_token_encrypted, token_expires_at, is_active),
                gsc_indexation_settings!inner(auto_index_new, auto_index_updated, daily_inspection_count, quota_reset_date)
            `)
            .eq("is_active", true)
            .or("auto_index_new.eq.true,auto_index_updated.eq.true", { referencedTable: "gsc_indexation_settings" });

        if (body.siteId) {
            sitesQuery = sitesQuery.eq("id", body.siteId);
        }

        const { data: sites, error } = await sitesQuery;

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS_HEADERS });
        }

        if (!sites || sites.length === 0) {
            return new Response(JSON.stringify({ sites_processed: 0, message: "No sites with auto-indexation enabled" }), { headers: CORS_HEADERS });
        }

        const results = [];
        for (const site of sites) {
            const settings = (site as any).gsc_indexation_settings;
            try {
                const result = await processSite(supabase, site as any, {
                    auto_index_new: settings.auto_index_new,
                    auto_index_updated: settings.auto_index_updated,
                    daily_inspection_count: settings.daily_inspection_count || 0,
                    quota_reset_date: settings.quota_reset_date || today,
                });
                results.push({ site_url: (site as any).site_url, ...result });
            } catch (err) {
                results.push({ site_url: (site as any).site_url, error: String(err), inspected_new: 0, inspected_updated: 0 });
            }
        }

        return new Response(JSON.stringify({
            sites_processed: results.length,
            total_new: results.reduce((s, r) => s + (r.inspected_new || 0), 0),
            total_updated: results.reduce((s, r) => s + (r.inspected_updated || 0), 0),
            results,
        }), { headers: CORS_HEADERS });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS });
    }
});

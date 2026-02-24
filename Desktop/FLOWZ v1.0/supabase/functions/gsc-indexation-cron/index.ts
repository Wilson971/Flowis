/**
 * gsc-indexation-cron — Edge Function
 *
 * Scheduled every 2 hours to:
 *   1. Detect sitemap changes for sites with auto-indexation enabled
 *   2. Auto-submit new/updated URLs to Google Indexing API
 *   3. Process pending queue items
 *   4. Batch-inspect URL indexation statuses
 *   5. Snapshot daily indexation history
 *
 * Deploy: supabase functions deploy gsc-indexation-cron --no-verify-jwt
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GSC_TOKEN_ENCRYPTION_KEY = Deno.env.get("GSC_TOKEN_ENCRYPTION_KEY")!;

// ============================================================================
// Crypto (mirrors gsc-sync/index.ts)
// ============================================================================

async function deriveKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(GSC_TOKEN_ENCRYPTION_KEY),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: encoder.encode("flowz-gsc-salt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
}

async function decryptToken(encryptedStr: string): Promise<string> {
    const parts = encryptedStr.split(":");
    if (parts.length !== 4) throw new Error("Invalid encrypted token format");
    const [_saltHex, ivHex, tagHex, ciphertextHex] = parts;
    const key = await deriveKey();
    const iv = hexToBytes(ivHex);
    const tag = hexToBytes(tagHex);
    const ciphertext = hexToBytes(ciphertextHex);
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
    return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

// ============================================================================
// Google API Helpers
// ============================================================================

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
        }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Token refresh: ${err.error_description || response.status}`);
    }
    return response.json();
}

async function inspectUrl(accessToken: string, inspectionUrl: string, siteUrl: string) {
    const response = await fetch(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "fr" }),
        }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.inspectionResult || null;
}

async function submitUrlForIndexing(accessToken: string, url: string): Promise<boolean> {
    const response = await fetch(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, type: "URL_UPDATED" }),
        }
    );
    return response.ok;
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

// ============================================================================
// Sitemap Parsing
// ============================================================================

async function parseSitemap(siteUrl: string): Promise<Array<{ url: string; lastmod: string | null }>> {
    const baseUrl = siteUrl.replace(/\/$/, "");
    return parseSitemapUrl(`${baseUrl}/sitemap.xml`);
}

async function parseSitemapUrl(url: string): Promise<Array<{ url: string; lastmod: string | null }>> {
    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "FLOWZ-Bot/1.0" },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) return [];
        const text = await response.text();

        if (text.includes("<sitemapindex")) {
            const locs: string[] = [];
            const re = /<sitemap[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
            let m;
            while ((m = re.exec(text)) !== null) locs.push(m[1].trim());
            const results: Array<{ url: string; lastmod: string | null }> = [];
            for (const loc of locs) {
                results.push(...(await parseSitemapUrl(loc)));
            }
            return results;
        }

        const entries: Array<{ url: string; lastmod: string | null }> = [];
        const re = /<url>([\s\S]*?)<\/url>/gi;
        let m;
        while ((m = re.exec(text)) !== null) {
            const locM = /<loc>([^<]+)<\/loc>/i.exec(m[1]);
            if (!locM) continue;
            const lastmodM = /<lastmod>([^<]+)<\/lastmod>/i.exec(m[1]);
            entries.push({
                url: locM[1].trim().replace(/&amp;/g, "&"),
                lastmod: lastmodM ? lastmodM[1].trim() : null,
            });
        }
        return entries;
    } catch {
        return [];
    }
}

// ============================================================================
// MD5 hash (simple for sitemap change detection)
// ============================================================================

async function md5Hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (_req) => {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const logs: string[] = [];

    try {
        // Get all sites with auto-indexation enabled or any pending queue items
        const { data: settings } = await supabase
            .from("gsc_indexation_settings")
            .select("site_id, tenant_id, auto_index_new, auto_index_updated, last_sitemap_hash, daily_submission_count, daily_inspection_count, quota_reset_date");

        // Also get sites with pending queue items
        const { data: pendingQueue } = await supabase
            .from("gsc_indexation_queue")
            .select("site_id, tenant_id")
            .eq("status", "pending")
            .limit(1);

        const siteIds = new Set<string>();
        const siteSettings = new Map<string, any>();

        for (const s of settings || []) {
            siteIds.add(s.site_id);
            siteSettings.set(s.site_id, s);
        }
        for (const q of pendingQueue || []) {
            siteIds.add(q.site_id);
        }

        if (siteIds.size === 0) {
            return new Response(JSON.stringify({ message: "No sites to process" }));
        }

        // Get connection details for each site
        const { data: sites } = await supabase
            .from("gsc_sites")
            .select(`
                id, site_url, tenant_id,
                gsc_connections!inner (
                    access_token_encrypted,
                    refresh_token_encrypted,
                    token_expires_at,
                    is_active
                )
            `)
            .in("id", Array.from(siteIds))
            .eq("is_active", true);

        for (const site of sites || []) {
            const conn = (site as any).gsc_connections;
            if (!conn?.is_active) continue;

            try {
                // Decrypt and refresh tokens
                const accessTokenEnc = conn.access_token_encrypted;
                const refreshTokenEnc = conn.refresh_token_encrypted;
                let accessToken = await decryptToken(accessTokenEnc);
                const refreshToken = await decryptToken(refreshTokenEnc);

                const expiresAt = new Date(conn.token_expires_at).getTime();
                if (Date.now() > expiresAt - 5 * 60 * 1000) {
                    const refreshed = await refreshAccessToken(refreshToken);
                    accessToken = refreshed.access_token;
                }

                const setting = siteSettings.get(site.id) || {};
                const today = new Date().toISOString().slice(0, 10);
                let submissionCount = setting.quota_reset_date === today ? (setting.daily_submission_count || 0) : 0;
                let inspectionCount = setting.quota_reset_date === today ? (setting.daily_inspection_count || 0) : 0;

                // === 1. Sitemap change detection + auto-indexation ===
                if (setting.auto_index_new || setting.auto_index_updated) {
                    const sitemapEntries = await parseSitemap(site.site_url);
                    const urlsStr = sitemapEntries.map(e => e.url).sort().join("\n");
                    const currentHash = await md5Hash(urlsStr);

                    if (currentHash !== setting.last_sitemap_hash) {
                        // Get existing URLs
                        const { data: existing } = await supabase
                            .from("gsc_sitemap_urls")
                            .select("url, lastmod")
                            .eq("site_id", site.id);

                        const existingMap = new Map((existing || []).map(e => [e.url, e.lastmod]));

                        // Detect new URLs
                        const newUrls = sitemapEntries.filter(e => !existingMap.has(e.url));
                        // Detect updated URLs (lastmod changed)
                        const updatedUrls = sitemapEntries.filter(e => {
                            const old = existingMap.get(e.url);
                            return old && e.lastmod && old !== e.lastmod;
                        });

                        // Upsert sitemap URLs
                        const BATCH = 500;
                        for (let i = 0; i < sitemapEntries.length; i += BATCH) {
                            const batch = sitemapEntries.slice(i, i + BATCH).map(e => ({
                                site_id: site.id,
                                tenant_id: site.tenant_id,
                                url: e.url,
                                source: "sitemap",
                                lastmod: e.lastmod ? new Date(e.lastmod).toISOString() : null,
                                last_seen_at: new Date().toISOString(),
                                is_active: true,
                            }));
                            await supabase.from("gsc_sitemap_urls").upsert(batch, { onConflict: "site_id,url" });
                        }

                        // Queue new URLs for indexation
                        if (setting.auto_index_new && newUrls.length > 0) {
                            const queueBatch = newUrls.map(e => ({
                                site_id: site.id,
                                tenant_id: site.tenant_id,
                                url: e.url,
                                action: "URL_UPDATED",
                                status: "pending",
                            }));
                            await supabase.from("gsc_indexation_queue").upsert(queueBatch, { onConflict: "site_id,url,action" });
                            logs.push(`${site.site_url}: ${newUrls.length} new URLs queued`);
                        }

                        // Queue updated URLs
                        if (setting.auto_index_updated && updatedUrls.length > 0) {
                            const queueBatch = updatedUrls.map(e => ({
                                site_id: site.id,
                                tenant_id: site.tenant_id,
                                url: e.url,
                                action: "URL_UPDATED",
                                status: "pending",
                            }));
                            await supabase.from("gsc_indexation_queue").upsert(queueBatch, { onConflict: "site_id,url,action" });
                            logs.push(`${site.site_url}: ${updatedUrls.length} updated URLs queued`);
                        }

                        // Update sitemap hash
                        await supabase.from("gsc_indexation_settings").upsert({
                            site_id: site.id,
                            tenant_id: site.tenant_id,
                            last_sitemap_hash: currentHash,
                            last_sitemap_check_at: new Date().toISOString(),
                        }, { onConflict: "site_id" });
                    }
                }

                // === 2. Process pending queue items ===
                const SUBMISSION_LIMIT = 200;
                const submissionRemaining = Math.max(0, SUBMISSION_LIMIT - submissionCount);

                if (submissionRemaining > 0) {
                    const { data: pendingItems } = await supabase
                        .from("gsc_indexation_queue")
                        .select("id, url")
                        .eq("site_id", site.id)
                        .eq("status", "pending")
                        .order("created_at", { ascending: true })
                        .limit(submissionRemaining);

                    for (const item of pendingItems || []) {
                        const success = await submitUrlForIndexing(accessToken, item.url);
                        await supabase
                            .from("gsc_indexation_queue")
                            .update({
                                status: success ? "submitted" : "failed",
                                submitted_at: success ? new Date().toISOString() : null,
                                attempts: 1,
                                error_message: success ? null : "Submission failed",
                            })
                            .eq("id", item.id);

                        if (success) submissionCount++;
                        await new Promise(r => setTimeout(r, 350));
                    }

                    if ((pendingItems || []).length > 0) {
                        logs.push(`${site.site_url}: ${(pendingItems || []).length} queue items processed`);
                    }
                }

                // === 3. Batch URL Inspection ===
                const INSPECTION_LIMIT = 2000;
                const inspectionRemaining = Math.max(0, INSPECTION_LIMIT - inspectionCount);
                const inspectBatchSize = Math.min(200, inspectionRemaining);

                if (inspectBatchSize > 0) {
                    // Get URLs never inspected or inspected > 7 days ago
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                    const { data: toInspect } = await supabase
                        .from("gsc_sitemap_urls")
                        .select("id, url")
                        .eq("site_id", site.id)
                        .eq("is_active", true)
                        .limit(inspectBatchSize);

                    // Filter to those needing inspection
                    const { data: recentlyInspected } = await supabase
                        .from("gsc_indexation_status")
                        .select("url")
                        .eq("site_id", site.id)
                        .gte("inspected_at", sevenDaysAgo);

                    const recentSet = new Set((recentlyInspected || []).map(r => r.url));
                    const needsInspection = (toInspect || []).filter(u => !recentSet.has(u.url));

                    let inspected = 0;
                    for (const item of needsInspection.slice(0, inspectBatchSize)) {
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
                        inspectionCount++;
                        await new Promise(r => setTimeout(r, 120));
                    }

                    if (inspected > 0) {
                        logs.push(`${site.site_url}: ${inspected} URLs inspected`);
                    }
                }

                // === 4. Snapshot daily history ===
                await supabase.rpc("snapshot_gsc_indexation_history", {
                    p_tenant_id: site.tenant_id,
                    p_site_id: site.id,
                });

                // === 5. Update quota counters ===
                await supabase.from("gsc_indexation_settings").upsert({
                    site_id: site.id,
                    tenant_id: site.tenant_id,
                    daily_submission_count: submissionCount,
                    daily_inspection_count: inspectionCount,
                    quota_reset_date: today,
                }, { onConflict: "site_id" });

            } catch (err) {
                logs.push(`${site.site_url}: ERROR — ${err}`);
            }
        }

        return new Response(JSON.stringify({
            processed: sites?.length || 0,
            logs,
        }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

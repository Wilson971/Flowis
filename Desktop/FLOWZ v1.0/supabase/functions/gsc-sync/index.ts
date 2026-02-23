/**
 * gsc-sync — Edge Function
 *
 * Scheduled every 6 hours to sync GSC keyword data for all active connections.
 * Runs with service_role key → bypasses RLS.
 *
 * For each active gsc_connection:
 *   1. Decrypt tokens
 *   2. Refresh access token if needed
 *   3. Fetch searchAnalytics data (last_28_days)
 *   4. Upsert gsc_keywords rows
 *
 * Deploy: supabase functions deploy gsc-sync --no-verify-jwt
 * Cron: every 6 hours via pg_cron
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GSC_TOKEN_ENCRYPTION_KEY = Deno.env.get("GSC_TOKEN_ENCRYPTION_KEY")!;

// ============================================================================
// Crypto (AES-256-GCM — mirrors lib/gsc/crypto.ts for Deno runtime)
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
        ["decrypt", "encrypt"]
    );
}

interface GscTokens {
    access_token: string;
    refresh_token: string;
    expiry_at: string;
    scope: string;
}

async function decryptTokens(encryptedStr: string): Promise<GscTokens> {
    // Format from Node.js: salt:iv:tag:ciphertext (hex)
    const parts = encryptedStr.split(":");
    if (parts.length !== 4) throw new Error("Invalid encrypted token format");

    const [_saltHex, ivHex, tagHex, ciphertextHex] = parts;

    // For Deno/WebCrypto, we need to derive key differently than Node's scryptSync
    // Use PBKDF2 instead (consistent with deriveKey above)
    const key = await deriveKey();

    const iv = hexToBytes(ivHex);
    const tag = hexToBytes(tagHex);
    const ciphertext = hexToBytes(ciphertextHex);

    // AES-GCM expects ciphertext + tag concatenated
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        combined
    );

    const text = new TextDecoder().decode(decrypted);
    return JSON.parse(text);
}

async function encryptTokens(tokens: GscTokens): Promise<string> {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(tokens));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        data
    );

    // Split ciphertext and tag (last 16 bytes = tag)
    const encryptedBytes = new Uint8Array(encrypted);
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const tag = encryptedBytes.slice(encryptedBytes.length - 16);

    return [
        bytesToHex(salt),
        bytesToHex(iv),
        bytesToHex(tag),
        bytesToHex(ciphertext),
    ].join(":");
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================================
// Google API Helpers
// ============================================================================

async function refreshAccessToken(tokens: GscTokens): Promise<GscTokens> {
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
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expiry_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        scope: data.scope || tokens.scope,
    };
}

function needsRefresh(tokens: GscTokens): boolean {
    return Date.now() > new Date(tokens.expiry_at).getTime() - 5 * 60 * 1000;
}

interface SearchAnalyticsRow {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

async function fetchSearchAnalytics(
    accessToken: string,
    siteUrl: string,
    dateRange: string = "last_28_days"
): Promise<SearchAnalyticsRow[]> {
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data lag
    const start = new Date(end);
    start.setDate(start.getDate() - (dateRange === "last_7_days" ? 7 : 28));

    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            dimensions: ["page", "query"],
            rowLimit: 5000,
            dataState: "all",
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`GSC API error: ${err.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.rows || [];
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (_req: Request) => {
    console.log("[gsc-sync] Starting sync run...");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch all active connections
    const { data: connections, error: connError } = await supabase
        .from("gsc_connections")
        .select("*")
        .eq("active", true);

    if (connError) {
        console.error("[gsc-sync] Failed to fetch connections:", connError.message);
        return new Response(JSON.stringify({ error: connError.message }), { status: 500 });
    }

    if (!connections || connections.length === 0) {
        console.log("[gsc-sync] No active connections found.");
        return new Response(JSON.stringify({ synced: 0 }));
    }

    console.log(`[gsc-sync] Processing ${connections.length} connection(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const conn of connections) {
        try {
            // Mark as syncing
            await supabase
                .from("gsc_connections")
                .update({ sync_status: "syncing", sync_error: null })
                .eq("id", conn.id);

            // Decrypt + refresh tokens
            let tokens = await decryptTokens(conn.tokens_encrypted);

            if (needsRefresh(tokens)) {
                tokens = await refreshAccessToken(tokens);
                // Save refreshed tokens
                const encrypted = await encryptTokens(tokens);
                await supabase
                    .from("gsc_connections")
                    .update({ tokens_encrypted: encrypted })
                    .eq("id", conn.id);
            }

            // Fetch search analytics (last_28_days)
            const rows = await fetchSearchAnalytics(tokens.access_token, conn.site_url, "last_28_days");

            // Upsert keywords
            if (rows.length > 0) {
                const keywordRows = rows.map(row => ({
                    connection_id: conn.id,
                    tenant_id: conn.tenant_id,
                    page_url: row.keys[0],
                    query: row.keys[1],
                    date_range: "last_28_days",
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: Math.round(row.ctr * 10000) / 10000,
                    position: Math.round(row.position * 100) / 100,
                    fetched_at: new Date().toISOString(),
                }));

                // Batch upsert
                const batchSize = 500;
                for (let i = 0; i < keywordRows.length; i += batchSize) {
                    const batch = keywordRows.slice(i, i + batchSize);
                    const { error: upsertError } = await supabase
                        .from("gsc_keywords")
                        .upsert(batch, { onConflict: "connection_id,page_url,date_range,query" });

                    if (upsertError) {
                        console.error(`[gsc-sync] Upsert error for ${conn.id}:`, upsertError.message);
                    }
                }
            }

            // Mark success
            await supabase
                .from("gsc_connections")
                .update({
                    sync_status: "success",
                    last_synced_at: new Date().toISOString(),
                    sync_error: null,
                })
                .eq("id", conn.id);

            console.log(`[gsc-sync] Connection ${conn.id}: synced ${rows.length} keywords`);
            successCount++;

        } catch (err: any) {
            console.error(`[gsc-sync] Connection ${conn.id} failed:`, err.message);
            failCount++;

            await supabase
                .from("gsc_connections")
                .update({
                    sync_status: "error",
                    sync_error: (err.message || "Unknown error").slice(0, 500),
                })
                .eq("id", conn.id);
        }

        // Rate limit: 600ms delay between connections
        if (connections.indexOf(conn) < connections.length - 1) {
            await new Promise(r => setTimeout(r, 600));
        }
    }

    console.log(`[gsc-sync] Done. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
        synced: successCount,
        failed: failCount,
        total: connections.length,
    }));
});

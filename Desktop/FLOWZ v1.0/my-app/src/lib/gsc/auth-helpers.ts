/**
 * Shared helpers for GSC API routes — token decryption, validation, refresh.
 * Avoids duplicating this logic across every route.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GscTokens } from './types';
import { decryptToken, encryptToken } from './crypto';
import { ensureValidTokens } from './client';

/**
 * Fetch and decrypt GSC tokens for a site, refreshing if needed.
 * Returns the valid access token and site URL.
 */
export async function getGscTokensForSite(
    supabase: SupabaseClient,
    userId: string,
    siteId: string
): Promise<{ accessToken: string; siteUrl: string }> {
    const { data: site, error: siteError } = await supabase
        .from('gsc_sites')
        .select(`
            id,
            site_url,
            is_active,
            gsc_connection_id,
            gsc_connections!inner (
                id,
                access_token_encrypted,
                refresh_token_encrypted,
                token_expires_at,
                is_active
            )
        `)
        .eq('id', siteId)
        .eq('tenant_id', userId)
        .single();

    if (siteError || !site) {
        throw new Error('Site GSC non trouve');
    }

    if (!site.is_active) {
        throw new Error('Site GSC desactive');
    }

    const conn = (site as Record<string, unknown>).gsc_connections as {
        id: string;
        is_active: boolean;
        access_token_encrypted: string;
        refresh_token_encrypted: string;
        token_expires_at: string;
    } | undefined;
    if (!conn?.is_active) {
        throw new Error('Connexion GSC desactivee');
    }

    const tokens: GscTokens = {
        access_token: decryptToken(conn.access_token_encrypted),
        refresh_token: decryptToken(conn.refresh_token_encrypted),
        expiry_at: conn.token_expires_at,
    };

    let validTokens: GscTokens;
    let refreshed: boolean;

    try {
        ({ tokens: validTokens, refreshed } = await ensureValidTokens(tokens));
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // 401 from Google = refresh token revoked/expired → mark connection inactive
        if (msg.includes('401') || msg.toLowerCase().includes('token refresh failed')) {
            await supabase
                .from('gsc_connections')
                .update({ is_active: false })
                .eq('id', conn.id);
        }
        throw new Error(`GSC_AUTH_ERROR:${msg}`);
    }

    if (refreshed) {
        await supabase
            .from('gsc_connections')
            .update({
                access_token_encrypted: encryptToken(validTokens.access_token),
                token_expires_at: validTokens.expiry_at,
            })
            .eq('id', conn.id);
    }

    return {
        accessToken: validTokens.access_token,
        siteUrl: site.site_url,
    };
}

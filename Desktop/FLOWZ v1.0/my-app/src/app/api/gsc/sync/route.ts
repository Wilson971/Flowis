/**
 * POST /api/gsc/sync
 *
 * Triggers a manual sync of GSC keyword data for a site.
 * Decrypts tokens from gsc_connections (separate fields), refreshes if needed,
 * fetches searchAnalytics, upserts into gsc_keywords (linked to gsc_sites).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptToken, encryptToken } from '@/lib/gsc/crypto';
import { ensureValidTokens, fetchSearchAnalytics, fetchSearchAnalyticsByDate, fetchSearchAnalyticsByCountry, fetchSearchAnalyticsByDevice } from '@/lib/gsc/client';
import { z } from 'zod';
import type { GscDateRange, GscTokens } from '@/lib/gsc/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
    site_id: z.string().uuid(),
    date_range: z.enum(['last_7_days', 'last_28_days']).optional().default('last_28_days'),
});

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Validate body
    let body: z.infer<typeof requestSchema>;
    try {
        const raw = await request.json();
        body = requestSchema.parse(raw);
    } catch {
        return NextResponse.json({ error: 'Requete invalide' }, { status: 400 });
    }

    const { site_id, date_range } = body;

    // Fetch site with its parent connection
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
        .eq('id', site_id)
        .eq('tenant_id', user.id)
        .single();

    if (siteError || !site) {
        return NextResponse.json({ error: 'Site GSC non trouve' }, { status: 404 });
    }

    if (!site.is_active) {
        return NextResponse.json({ error: 'Site GSC desactive' }, { status: 400 });
    }

    const conn = (site as any).gsc_connections;
    if (!conn?.is_active) {
        return NextResponse.json({ error: 'Connexion GSC desactivee' }, { status: 400 });
    }

    try {
        // Decrypt tokens from separate fields
        const tokens: GscTokens = {
            access_token: decryptToken(conn.access_token_encrypted),
            refresh_token: decryptToken(conn.refresh_token_encrypted),
            expiry_at: conn.token_expires_at,
        };

        const { tokens: validTokens, refreshed } = await ensureValidTokens(tokens);

        // If tokens were refreshed, save them back to gsc_connections
        if (refreshed) {
            await supabase
                .from('gsc_connections')
                .update({
                    access_token_encrypted: encryptToken(validTokens.access_token),
                    refresh_token_encrypted: encryptToken(validTokens.refresh_token),
                    token_expires_at: validTokens.expiry_at,
                })
                .eq('id', conn.id);
        }

        // Fetch search analytics
        const rows = await fetchSearchAnalytics(
            validTokens.access_token,
            site.site_url,
            date_range as GscDateRange
        );

        // Upsert keywords into gsc_keywords (linked to gsc_sites via site_id)
        if (rows.length > 0) {
            const keywordRows = rows.map(row => ({
                site_id,
                tenant_id: user.id,
                page_url: row.keys[0],
                query: row.keys[1],
                date_range,
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: Math.round(row.ctr * 10000) / 10000,
                position: Math.round(row.position * 100) / 100,
                fetched_at: new Date().toISOString(),
            }));

            const batchSize = 500;
            for (let i = 0; i < keywordRows.length; i += batchSize) {
                const batch = keywordRows.slice(i, i + batchSize);
                const { error: upsertError } = await supabase
                    .from('gsc_keywords')
                    .upsert(batch, {
                        onConflict: 'site_id,page_url,date_range,query',
                    });

                if (upsertError) {
                    console.error('[GSC sync] Upsert error:', upsertError.message);
                }
            }
        }

        // ── Sync daily stats (for dashboard time-series) ──
        let dailySynced = 0;
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 3);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 90); // 90 days of history

            const dailyRows = await fetchSearchAnalyticsByDate(
                validTokens.access_token,
                site.site_url,
                startDate.toISOString().slice(0, 10),
                endDate.toISOString().slice(0, 10)
            );

            if (dailyRows.length > 0) {
                const dailyData = dailyRows.map(row => ({
                    site_id,
                    tenant_id: user.id,
                    stat_date: row.keys[0], // "2026-02-15"
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: Math.round(row.ctr * 10000) / 10000,
                    position: Math.round(row.position * 100) / 100,
                    fetched_at: new Date().toISOString(),
                }));

                const batchSize = 500;
                for (let i = 0; i < dailyData.length; i += batchSize) {
                    const batch = dailyData.slice(i, i + batchSize);
                    const { error: dailyError } = await supabase
                        .from('gsc_daily_stats')
                        .upsert(batch, { onConflict: 'site_id,stat_date' });
                    if (dailyError) {
                        console.error('[GSC sync] Daily stats upsert error:', dailyError.message);
                    }
                }
                dailySynced = dailyRows.length;
            }
        } catch (dailyErr: any) {
            console.error('[GSC sync] Daily stats fetch error:', dailyErr.message);
            // Non-fatal — keywords still synced
        }

        // ── Sync country stats ──
        let countrySynced = 0;
        try {
            const countryRows = await fetchSearchAnalyticsByCountry(
                validTokens.access_token,
                site.site_url,
                date_range as GscDateRange
            );
            if (countryRows.length > 0) {
                const countryData = countryRows.map(row => ({
                    site_id,
                    tenant_id: user.id,
                    country: row.keys[0],
                    date_range,
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: Math.round(row.ctr * 10000) / 10000,
                    position: Math.round(row.position * 100) / 100,
                    fetched_at: new Date().toISOString(),
                }));
                const { error: countryError } = await supabase
                    .from('gsc_country_stats')
                    .upsert(countryData, { onConflict: 'site_id,country,date_range' });
                if (countryError) console.error('[GSC sync] Country upsert error:', countryError.message);
                countrySynced = countryRows.length;
            }
        } catch (err: any) {
            console.error('[GSC sync] Country fetch error:', err.message);
        }

        // ── Sync device stats ──
        let deviceSynced = 0;
        try {
            const deviceRows = await fetchSearchAnalyticsByDevice(
                validTokens.access_token,
                site.site_url,
                date_range as GscDateRange
            );
            if (deviceRows.length > 0) {
                const deviceData = deviceRows.map(row => ({
                    site_id,
                    tenant_id: user.id,
                    device: row.keys[0],
                    date_range,
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: Math.round(row.ctr * 10000) / 10000,
                    position: Math.round(row.position * 100) / 100,
                    fetched_at: new Date().toISOString(),
                }));
                const { error: deviceError } = await supabase
                    .from('gsc_device_stats')
                    .upsert(deviceData, { onConflict: 'site_id,device,date_range' });
                if (deviceError) console.error('[GSC sync] Device upsert error:', deviceError.message);
                deviceSynced = deviceRows.length;
            }
        } catch (err: any) {
            console.error('[GSC sync] Device fetch error:', err.message);
        }

        // Update last_synced_at on the site
        await supabase
            .from('gsc_sites')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', site_id);

        return NextResponse.json({
            success: true,
            keywords_synced: rows.length,
            daily_stats_synced: dailySynced,
            countries_synced: countrySynced,
            devices_synced: deviceSynced,
            date_range,
        });

    } catch (err: any) {
        console.error('[GSC sync] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 502 });
    }
}

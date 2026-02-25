/**
 * POST /api/gsc/indexation/inspect
 *
 * Inspects URLs via Google URL Inspection API.
 * Respects 2000/day quota. Prioritizes never-inspected URLs.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGscTokensForSite } from '@/lib/gsc/auth-helpers';
import { inspectUrl, mapInspectionToVerdict } from '@/lib/gsc/client';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120;

const requestSchema = z.object({
    siteId: z.string().uuid(),
    urls: z.array(z.string().url()).optional(),
    limit: z.number().min(1).max(200).optional().default(50),
});

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    let body: z.infer<typeof requestSchema>;
    try {
        const raw = await request.json();
        body = requestSchema.parse(raw);
    } catch {
        return NextResponse.json({ error: 'Requete invalide' }, { status: 400 });
    }

    try {
        const { accessToken, siteUrl } = await getGscTokensForSite(supabase, user.id, body.siteId);

        // Check daily quota
        const { data: settings } = await supabase
            .from('gsc_indexation_settings')
            .select('*')
            .eq('site_id', body.siteId)
            .eq('tenant_id', user.id)
            .single();

        let inspectionCount = settings?.daily_inspection_count || 0;
        const quotaResetDate = settings?.quota_reset_date;
        const today = new Date().toISOString().slice(0, 10);

        // Reset quota if new day
        if (quotaResetDate !== today) {
            inspectionCount = 0;
            await supabase
                .from('gsc_indexation_settings')
                .upsert({
                    site_id: body.siteId,
                    tenant_id: user.id,
                    daily_inspection_count: 0,
                    quota_reset_date: today,
                }, { onConflict: 'site_id' });
        }

        const DAILY_LIMIT = 2000;
        const remaining = Math.max(0, DAILY_LIMIT - inspectionCount);
        const maxToInspect = Math.min(body.limit, remaining);

        if (maxToInspect === 0) {
            return NextResponse.json({
                inspected: 0,
                quota_remaining: 0,
                message: 'Quota journalier atteint (2000 inspections/jour)',
            });
        }

        // Get URLs to inspect
        let urlsToInspect: Array<{ id: string; url: string }>;

        if (body.urls && body.urls.length > 0) {
            // Specific URLs requested
            const { data } = await supabase
                .from('gsc_sitemap_urls')
                .select('id, url')
                .eq('site_id', body.siteId)
                .eq('tenant_id', user.id)
                .in('url', body.urls)
                .limit(maxToInspect);
            urlsToInspect = data || [];
        } else {
            // Auto-select: never inspected first, then oldest inspected
            // Fetch already-inspected sitemap_url_ids first (subquery syntax not supported in Supabase JS)
            const { data: alreadyInspected } = await supabase
                .from('gsc_indexation_status')
                .select('sitemap_url_id')
                .eq('site_id', body.siteId)
                .eq('tenant_id', user.id);

            const inspectedIds = (alreadyInspected || []).map(r => r.sitemap_url_id).filter(Boolean);

            let neverInspectedQuery = supabase
                .from('gsc_sitemap_urls')
                .select('id, url')
                .eq('site_id', body.siteId)
                .eq('tenant_id', user.id)
                .eq('is_active', true)
                .limit(maxToInspect);

            if (inspectedIds.length > 0) {
                neverInspectedQuery = neverInspectedQuery.not('id', 'in', `(${inspectedIds.map(id => `"${id}"`).join(',')})`);
            }

            const { data: neverInspected } = await neverInspectedQuery;
            urlsToInspect = neverInspected || [];

            // If we have room, add oldest inspected URLs
            if (urlsToInspect.length < maxToInspect) {
                const remainingSlots = maxToInspect - urlsToInspect.length;
                const inspectedIds = urlsToInspect.map(u => u.id);
                const { data: oldest } = await supabase
                    .from('gsc_sitemap_urls')
                    .select(`
                        id, url,
                        gsc_indexation_status!inner(inspected_at)
                    `)
                    .eq('site_id', body.siteId)
                    .eq('tenant_id', user.id)
                    .eq('is_active', true)
                    .order('gsc_indexation_status.inspected_at', { ascending: true } as any)
                    .limit(remainingSlots);

                if (oldest) {
                    urlsToInspect.push(...oldest.filter(u => !inspectedIds.includes(u.id)).map(u => ({ id: u.id, url: u.url })));
                }
            }
        }

        // Inspect each URL
        const results: Array<{ url: string; verdict: string; success: boolean }> = [];
        let successCount = 0;

        for (const item of urlsToInspect) {
            try {
                const result = await inspectUrl(accessToken, item.url, siteUrl);
                const verdict = mapInspectionToVerdict(result);
                const idx = result.indexStatusResult;

                await supabase
                    .from('gsc_indexation_status')
                    .upsert({
                        sitemap_url_id: item.id,
                        site_id: body.siteId,
                        tenant_id: user.id,
                        url: item.url,
                        verdict,
                        coverage_state: idx?.coverageState || null,
                        last_crawl_time: idx?.lastCrawlTime || null,
                        crawled_as: idx?.crawledAs || null,
                        robots_txt_state: idx?.robotsTxtState || null,
                        indexing_state: idx?.indexingState || null,
                        page_fetch_state: idx?.pageFetchState || null,
                        google_canonical: idx?.googleCanonical || null,
                        inspected_at: new Date().toISOString(),
                    }, { onConflict: 'site_id,url' });

                results.push({ url: item.url, verdict, success: true });
                successCount++;
            } catch (err) {
                console.warn(`[GSC Inspect] Failed for ${item.url}:`, err);
                results.push({
                    url: item.url,
                    verdict: 'unknown',
                    success: false,
                });
            }

            // Small delay to avoid rate limiting (600/min)
            if (urlsToInspect.indexOf(item) < urlsToInspect.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 120));
            }
        }

        // Update quota counter
        await supabase
            .from('gsc_indexation_settings')
            .upsert({
                site_id: body.siteId,
                tenant_id: user.id,
                daily_inspection_count: inspectionCount + successCount,
                quota_reset_date: today,
            }, { onConflict: 'site_id' });

        return NextResponse.json({
            inspected: successCount,
            total_requested: urlsToInspect.length,
            quota_remaining: remaining - successCount,
            results,
        });
    } catch (err) {
        console.error('[GSC Inspect]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur inspection' },
            { status: 500 }
        );
    }
}

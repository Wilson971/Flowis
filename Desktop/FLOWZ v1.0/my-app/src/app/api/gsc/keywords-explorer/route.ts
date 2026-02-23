/**
 * GET /api/gsc/keywords-explorer?site_id=...&date_range=last_28_days&search=...&page_url=...&page=1&per_page=50&sort_by=clicks&sort_order=desc
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { GscKeywordsExplorerResponse, GscKeywordsAggregates } from '@/lib/gsc/types';

export const runtime = 'nodejs';

const querySchema = z.object({
    site_id: z.string().uuid(),
    date_range: z.enum(['last_7_days', 'last_28_days']).optional().default('last_28_days'),
    search: z.string().optional().default(''),
    page_url: z.string().optional().default(''),
    page: z.coerce.number().int().min(1).optional().default(1),
    per_page: z.coerce.number().int().min(1).max(10000).optional().default(50),
    sort_by: z.enum(['clicks', 'impressions', 'ctr', 'position', 'query']).optional().default('clicks'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let params: z.infer<typeof querySchema>;
    try {
        params = querySchema.parse({
            site_id: searchParams.get('site_id'),
            date_range: searchParams.get('date_range'),
            search: searchParams.get('search') || '',
            page_url: searchParams.get('page_url') || '',
            page: searchParams.get('page'),
            per_page: searchParams.get('per_page'),
            sort_by: searchParams.get('sort_by'),
            sort_order: searchParams.get('sort_order'),
        });
    } catch {
        return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const offset = (params.page - 1) * params.per_page;

    const { data, error } = await supabase.rpc('get_gsc_keywords_explorer', {
        p_tenant_id: user.id,
        p_site_id: params.site_id,
        p_date_range: params.date_range,
        p_search: params.search || null,
        p_page_url: params.page_url || null,
        p_limit: params.per_page,
        p_offset: offset,
        p_sort_by: params.sort_by,
        p_sort_order: params.sort_order,
    });

    if (error) {
        // Fallback: if the RPC doesn't support sort params yet, retry without them
        if (error.message.includes('p_sort_by') || error.message.includes('p_sort_order')) {
            const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_gsc_keywords_explorer', {
                p_tenant_id: user.id,
                p_site_id: params.site_id,
                p_date_range: params.date_range,
                p_search: params.search || null,
                p_page_url: params.page_url || null,
                p_limit: params.per_page,
                p_offset: offset,
            });

            if (fallbackError) {
                console.error('[GSC keywords-explorer] RPC fallback error:', fallbackError.message);
                return NextResponse.json({ error: fallbackError.message }, { status: 500 });
            }

            return NextResponse.json(buildResponse(fallbackData, params));
        }

        console.error('[GSC keywords-explorer] RPC error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(buildResponse(data, params));
}

function buildResponse(data: any, params: z.infer<typeof querySchema>): GscKeywordsExplorerResponse {
    const rows = Array.isArray(data) ? data : [];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    const keywords = rows.map((r: any) => ({
        query: r.kw_query,
        page_url: r.kw_page_url,
        clicks: Number(r.kw_clicks),
        impressions: Number(r.kw_impressions),
        ctr: Number(r.kw_ctr),
        position: Number(r.kw_position),
        product_id: r.kw_product_id || null,
        product_title: r.kw_product_title || null,
    }));

    // Compute aggregates from all returned rows
    const totalClicks = keywords.reduce((s, k) => s + k.clicks, 0);
    const totalImpressions = keywords.reduce((s, k) => s + k.impressions, 0);
    const avgPosition = keywords.length > 0
        ? keywords.reduce((s, k) => s + k.position, 0) / keywords.length
        : 0;
    const quickWins = keywords.filter(k => k.position >= 4 && k.position <= 20 && k.impressions >= 50).length;

    const buckets = [
        { bucket: '1-3', min: 0, max: 3.999 },
        { bucket: '4-10', min: 4, max: 10.999 },
        { bucket: '11-20', min: 11, max: 20.999 },
        { bucket: '21-50', min: 21, max: 50.999 },
        { bucket: '51+', min: 51, max: Infinity },
    ];
    const positionDistribution = buckets.map(b => ({
        bucket: b.bucket,
        count: keywords.filter(k => k.position >= b.min && k.position <= b.max).length,
    }));

    const aggregates: GscKeywordsAggregates = {
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        avg_position: Math.round(avgPosition * 10) / 10,
        quick_wins_count: quickWins,
        position_distribution: positionDistribution,
    };

    return {
        keywords,
        total,
        page: params.page,
        per_page: params.per_page,
        aggregates,
    };
}

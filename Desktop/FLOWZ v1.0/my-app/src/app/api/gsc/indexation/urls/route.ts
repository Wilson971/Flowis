/**
 * GET /api/gsc/indexation/urls
 *
 * Returns paginated list of URLs with indexation status.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const siteId = params.get('siteId');
    if (!siteId) {
        return NextResponse.json({ error: 'siteId requis' }, { status: 400 });
    }

    const page = parseInt(params.get('page') || '1', 10);
    const perPage = Math.min(parseInt(params.get('perPage') || '50', 10), 100);
    const offset = (page - 1) * perPage;

    try {
        const { data, error } = await supabase.rpc('get_gsc_indexation_urls', {
            p_tenant_id: user.id,
            p_site_id: siteId,
            p_verdict: params.get('verdict') || null,
            p_search: params.get('search') || null,
            p_url_filter_rule: params.get('filterRule') || null,
            p_url_filter_value: params.get('filterValue') || null,
            p_source: params.get('source') || null,
            p_limit: perPage,
            p_offset: offset,
        });

        if (error) throw error;

        // RPC returns null when no rows match
        const result = data || { urls: [], total: 0 };
        return NextResponse.json({
            urls: result.urls || [],
            total: result.total || 0,
            page,
            per_page: perPage,
        });
    } catch (err) {
        console.error('[GSC URLs]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur' },
            { status: 500 }
        );
    }
}

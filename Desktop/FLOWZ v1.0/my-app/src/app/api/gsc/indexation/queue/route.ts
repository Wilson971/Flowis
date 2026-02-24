/**
 * GET /api/gsc/indexation/queue
 *
 * Returns queue stats + paginated queue items.
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

    try {
        // Stats via RPC
        const { data: stats, error: statsError } = await supabase.rpc('get_gsc_queue_stats', {
            p_tenant_id: user.id,
            p_site_id: siteId,
        });

        if (statsError) throw statsError;

        // Queue items (paginated)
        const page = parseInt(params.get('page') || '1', 10);
        const perPage = Math.min(parseInt(params.get('perPage') || '50', 10), 100);

        const { data: items, count } = await supabase
            .from('gsc_indexation_queue')
            .select('id, url, action, status, attempts, submitted_at, error_message, created_at', { count: 'exact' })
            .eq('site_id', siteId)
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1);

        return NextResponse.json({
            stats: stats || { total_submitted: 0, pending: 0, submitted: 0, failed: 0, daily_quota_used: 0, daily_quota_limit: 200 },
            items: items || [],
            total: count || 0,
            page,
            per_page: perPage,
        });
    } catch (err) {
        console.error('[GSC Queue]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur' },
            { status: 500 }
        );
    }
}

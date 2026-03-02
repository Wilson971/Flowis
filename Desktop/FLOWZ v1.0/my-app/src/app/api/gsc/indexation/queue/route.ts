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
        const page = parseInt(params.get('page') || '1', 10);
        const perPage = Math.min(parseInt(params.get('perPage') || '50', 10), 100);

        // Stats computed directly (avoids RPC GROUP BY issue)
        const { data: allItems } = await supabase
            .from('gsc_indexation_queue')
            .select('status')
            .eq('site_id', siteId)
            .eq('tenant_id', user.id);

        const rows = allItems || [];
        const submitted = rows.filter(r => r.status === 'submitted').length;
        const pending = rows.filter(r => r.status === 'pending' || r.status === 'quota_exceeded').length;
        const failed = rows.filter(r => r.status === 'failed').length;

        // Daily quota from settings
        const { data: settings } = await supabase
            .from('gsc_indexation_settings')
            .select('daily_submission_count, quota_reset_date')
            .eq('site_id', siteId)
            .eq('tenant_id', user.id)
            .single();

        const today = new Date().toISOString().slice(0, 10);
        const dailyQuotaUsed = settings?.quota_reset_date === today
            ? (settings?.daily_submission_count || 0)
            : 0;

        // Paginated queue items
        const { data: items, count } = await supabase
            .from('gsc_indexation_queue')
            .select('id, url, action, status, attempts, submitted_at, error_message, created_at', { count: 'exact' })
            .eq('site_id', siteId)
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1);

        return NextResponse.json({
            stats: {
                total_submitted: rows.length,
                submitted,
                pending,
                failed,
                daily_quota_used: dailyQuotaUsed,
                daily_quota_limit: 200,
            },
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

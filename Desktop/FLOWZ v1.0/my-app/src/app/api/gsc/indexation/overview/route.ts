/**
 * GET /api/gsc/indexation/overview
 *
 * Returns aggregated indexation stats + 30-day history.
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

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
        return NextResponse.json({ error: 'siteId requis' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase.rpc('get_gsc_indexation_overview', {
            p_tenant_id: user.id,
            p_site_id: siteId,
        });

        if (error) throw error;

        return NextResponse.json(data || {
            total: 0, indexed: 0, not_indexed: 0,
            crawled_not_indexed: 0, discovered_not_indexed: 0,
            noindex: 0, blocked_robots: 0, errors: 0, unknown: 0,
            history: [],
        });
    } catch (err) {
        console.error('[GSC Overview]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur' },
            { status: 500 }
        );
    }
}

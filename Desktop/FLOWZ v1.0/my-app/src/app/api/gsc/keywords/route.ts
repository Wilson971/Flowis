/**
 * GET /api/gsc/keywords
 *
 * Fetches cached GSC keyword data for a specific page URL.
 * Uses the get_top_keywords_for_url RPC (defined in gsc_keywords migration).
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

    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('page_url');
    const dateRange = searchParams.get('date_range') || 'last_28_days';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!pageUrl) {
        return NextResponse.json({ error: 'page_url requis' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_top_keywords_for_url', {
        p_tenant_id: user.id,
        p_page_url: pageUrl,
        p_date_range: dateRange,
        p_limit: limit,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

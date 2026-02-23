/**
 * GET /api/gsc/opportunities?site_id=...&date_range=last_28_days
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { GscOpportunitiesResponse } from '@/lib/gsc/types';

export const runtime = 'nodejs';

const querySchema = z.object({
    site_id: z.string().uuid(),
    date_range: z.enum(['last_7_days', 'last_28_days']).optional().default('last_28_days'),
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
        });
    } catch {
        return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_gsc_opportunities', {
        p_tenant_id: user.id,
        p_site_id: params.site_id,
        p_date_range: params.date_range,
    });

    if (error) {
        console.error('[GSC opportunities] RPC error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parsed: GscOpportunitiesResponse = typeof data === 'string' ? JSON.parse(data) : data;

    return NextResponse.json(parsed);
}

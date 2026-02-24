/**
 * GET /api/gsc/dashboard?site_id=...&days=28
 *
 * Returns dashboard data for a GSC site: KPIs, daily time-series, top keywords, top pages.
 * Uses the RPC get_gsc_dashboard for a single efficient query.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { GscDashboardResponse } from '@/lib/gsc/types';

export const runtime = 'nodejs';

const querySchema = z.object({
    site_id: z.string().uuid(),
    days: z.coerce.number().int().min(7).max(90).optional().default(28),
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
            days: searchParams.get('days'),
        });
    } catch {
        return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_gsc_dashboard', {
        p_tenant_id: user.id,
        p_site_id: params.site_id,
        p_days: params.days,
    });

    if (error) {
        console.error('[GSC dashboard] RPC error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Supabase may return JSON RPC results as a string — parse if needed
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    return NextResponse.json(parsed as GscDashboardResponse);
}

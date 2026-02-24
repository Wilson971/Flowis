/**
 * GET /api/gsc/position-tracking?site_id=...
 * Compares keyword positions between last_7_days and last_28_days
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const querySchema = z.object({
    site_id: z.string().uuid(),
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
        params = querySchema.parse({ site_id: searchParams.get('site_id') });
    } catch {
        return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_gsc_position_changes', {
        p_tenant_id: user.id,
        p_site_id: params.site_id,
    });

    if (error) {
        console.error('[GSC position-tracking] RPC error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return NextResponse.json(parsed);
}

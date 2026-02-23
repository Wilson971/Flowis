/**
 * GET/PUT /api/gsc/indexation/settings
 *
 * Manage auto-indexation settings per site.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

    const { data } = await supabase
        .from('gsc_indexation_settings')
        .select('auto_index_new, auto_index_updated')
        .eq('site_id', siteId)
        .eq('tenant_id', user.id)
        .single();

    return NextResponse.json(data || {
        auto_index_new: false,
        auto_index_updated: false,
    });
}

const updateSchema = z.object({
    siteId: z.string().uuid(),
    auto_index_new: z.boolean(),
    auto_index_updated: z.boolean(),
});

export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    let body: z.infer<typeof updateSchema>;
    try {
        const raw = await request.json();
        body = updateSchema.parse(raw);
    } catch {
        return NextResponse.json({ error: 'Requete invalide' }, { status: 400 });
    }

    const { error } = await supabase
        .from('gsc_indexation_settings')
        .upsert({
            site_id: body.siteId,
            tenant_id: user.id,
            auto_index_new: body.auto_index_new,
            auto_index_updated: body.auto_index_updated,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'site_id' });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        auto_index_new: body.auto_index_new,
        auto_index_updated: body.auto_index_updated,
    });
}

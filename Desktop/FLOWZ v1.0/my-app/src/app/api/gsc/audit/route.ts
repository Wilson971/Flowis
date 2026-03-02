/**
 * GET  /api/gsc/audit?siteId=xxx  — Dernier audit persisté
 * POST /api/gsc/audit              — Lance un nouvel audit (body: { siteId, dateRange? })
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
        return NextResponse.json({ error: 'siteId requis' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase.rpc('get_latest_seo_audit', {
            p_tenant_id: user.id,
            p_site_id: siteId,
        });

        if (error) throw error;

        return NextResponse.json(data ?? null);
    } catch (err) {
        console.error('[GSC Audit GET]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let body: { siteId?: string; dateRange?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const { siteId, dateRange = 'last_28_days' } = body;
    if (!siteId) {
        return NextResponse.json({ error: 'siteId requis' }, { status: 400 });
    }

    const ALLOWED_DATE_RANGES = ['last_7_days', 'last_28_days', 'last_90_days'];
    if (!ALLOWED_DATE_RANGES.includes(dateRange)) {
        return NextResponse.json({ error: 'dateRange invalide' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase.rpc('run_seo_audit', {
            p_tenant_id: user.id,
            p_site_id: siteId,
            p_date_range: dateRange,
        });

        if (error) throw error;

        if (data?.error) {
            return NextResponse.json({ error: data.error }, { status: 404 });
        }

        // Return fresh audit with issues attached
        const { data: full, error: fetchErr } = await supabase.rpc('get_latest_seo_audit', {
            p_tenant_id: user.id,
            p_site_id: siteId,
        });

        if (fetchErr) throw fetchErr;

        return NextResponse.json(full, { status: 201 });
    } catch (err) {
        console.error('[GSC Audit POST]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}

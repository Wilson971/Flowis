/**
 * GET /api/gsc/sites
 *
 * Returns the user's GSC sites with connection info.
 * Queries gsc_sites joined with gsc_connections.
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
    const linkedOnly = searchParams.get('linked_only') === 'true';

    // Fetch sites with their parent connection info
    let query = supabase
        .from('gsc_sites')
        .select(`
            id,
            site_url,
            permission_level,
            store_id,
            is_active,
            last_synced_at,
            created_at,
            gsc_connection_id,
            gsc_connections!inner (
                id,
                email,
                is_active
            )
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

    // Filter to only show sites linked to FLOWZ stores
    if (linkedOnly) {
        query = query.not('store_id', 'is', null);
    }

    const { data: sites, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten to GscConnectionView shape for the UI
    const connections = (sites || []).map((site: any) => ({
        connection_id: site.gsc_connection_id,
        site_id: site.id,
        site_url: site.site_url,
        email: site.gsc_connections?.email ?? null,
        is_active: site.is_active && (site.gsc_connections?.is_active ?? false),
        last_synced_at: site.last_synced_at,
        permission_level: site.permission_level,
        store_id: site.store_id,
        created_at: site.created_at,
    }));

    return NextResponse.json({ connections });
}

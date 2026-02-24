/**
 * DELETE /api/gsc/connections/[id]
 *
 * Revokes Google OAuth token and deletes the GSC connection.
 * gsc_sites cascade delete (and gsc_keywords cascade from sites).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/gsc/crypto';

export const runtime = 'nodejs';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Fetch connection (RLS ensures ownership)
    const { data: connection, error: connError } = await supabase
        .from('gsc_connections')
        .select('id, access_token_encrypted')
        .eq('id', id)
        .eq('tenant_id', user.id)
        .single();

    if (connError || !connection) {
        return NextResponse.json({ error: 'Connexion non trouvee' }, { status: 404 });
    }

    // Try to revoke token at Google (best effort)
    try {
        const accessToken = decryptToken(connection.access_token_encrypted);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    } catch {
        // Revocation failure is non-critical
    }

    // Delete connection (cascade deletes gsc_sites -> gsc_keywords)
    const { error: deleteError } = await supabase
        .from('gsc_connections')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

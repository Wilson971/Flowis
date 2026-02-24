/**
 * GET /api/gsc/oauth/authorize
 *
 * Initiates the Google OAuth2 flow for Search Console access.
 * Stores state in gsc_oauth_states table (DB-based CSRF) instead of HMAC cookie.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Check required env vars
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
    }

    // Generate random state token
    const stateToken = randomBytes(32).toString('hex');

    // Store state in gsc_oauth_states table (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: stateError } = await supabase
        .from('gsc_oauth_states')
        .insert({
            state: stateToken,
            tenant_id: user.id,
            expires_at: expiresAt,
        });

    if (stateError) {
        console.error('[GSC OAuth] Failed to insert state:', stateError.message);
        return NextResponse.json({ error: 'Failed to create OAuth state' }, { status: 500 });
    }

    // Build Google OAuth URL
    const redirectUri = `${getBaseUrl(request)}/api/gsc/oauth/callback`;
    const scopes = [
        'https://www.googleapis.com/auth/webmasters',          // read-write (needed for URL Inspection)
        'https://www.googleapis.com/auth/indexing',             // Google Indexing API
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', stateToken);

    return NextResponse.redirect(authUrl.toString());
}

function getBaseUrl(request: NextRequest): string {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}

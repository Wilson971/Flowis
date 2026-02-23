/**
 * GET /api/gsc/oauth/callback
 *
 * Handles the Google OAuth2 redirect after user authorization.
 * Verifies state from gsc_oauth_states table, exchanges code for tokens,
 * inserts into gsc_connections (separate token fields) and gsc_sites.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/gsc/crypto';
import { fetchVerifiedSites, fetchGoogleEmail } from '@/lib/gsc/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // Base URL for redirects
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Handle Google errors
    if (error) {
        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=error&gsc_error=${encodeURIComponent(error)}`);
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=error&gsc_error=missing_params`);
    }

    // Verify authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=error&gsc_error=auth_required`);
    }

    // Verify state from gsc_oauth_states table
    const { data: stateRow, error: stateError } = await supabase
        .from('gsc_oauth_states')
        .select('id, tenant_id, expires_at')
        .eq('state', stateParam)
        .eq('tenant_id', user.id)
        .single();

    if (stateError || !stateRow) {
        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=error&gsc_error=invalid_state`);
    }

    // Check expiry
    if (new Date(stateRow.expires_at) < new Date()) {
        // Clean up expired state
        await supabase.from('gsc_oauth_states').delete().eq('id', stateRow.id);
        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=error&gsc_error=expired_state`);
    }

    // Delete used state (one-time use)
    await supabase.from('gsc_oauth_states').delete().eq('id', stateRow.id);

    try {
        // Exchange code for tokens
        const clientId = process.env.GOOGLE_CLIENT_ID!;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        const redirectUri = `${baseUrl}/api/gsc/oauth/callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.json().catch(() => ({}));
            throw new Error(err.error_description || err.error || 'Token exchange failed');
        }

        const tokenData = await tokenResponse.json();

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

        // Fetch Google email
        const googleEmail = await fetchGoogleEmail(accessToken);

        // Fetch verified GSC sites
        let sites: Awaited<ReturnType<typeof fetchVerifiedSites>>;
        try {
            sites = await fetchVerifiedSites(accessToken);
        } catch (siteErr: any) {
            console.error('[GSC OAuth callback] Sites fetch error:', siteErr.message);
            // Still save the connection even if sites fetch fails — user can retry
            const accessTokenEncrypted = encryptToken(accessToken);
            const refreshTokenEncrypted = encryptToken(refreshToken);
            await supabase
                .from('gsc_connections')
                .upsert(
                    {
                        tenant_id: user.id,
                        access_token_encrypted: accessTokenEncrypted,
                        refresh_token_encrypted: refreshTokenEncrypted,
                        token_expires_at: tokenExpiresAt,
                        email: googleEmail,
                        is_active: true,
                    },
                    { onConflict: 'tenant_id' }
                );
            return NextResponse.redirect(
                `${baseUrl}/app/overview?gsc_status=connected&gsc_warning=sites_fetch_failed`
            );
        }

        if (sites.length === 0) {
            // Save connection anyway — user may add sites later
            const accessTokenEncrypted = encryptToken(accessToken);
            const refreshTokenEncrypted = encryptToken(refreshToken);
            await supabase
                .from('gsc_connections')
                .upsert(
                    {
                        tenant_id: user.id,
                        access_token_encrypted: accessTokenEncrypted,
                        refresh_token_encrypted: refreshTokenEncrypted,
                        token_expires_at: tokenExpiresAt,
                        email: googleEmail,
                        is_active: true,
                    },
                    { onConflict: 'tenant_id' }
                );
            return NextResponse.redirect(
                `${baseUrl}/app/overview?gsc_status=connected&gsc_warning=no_sites`
            );
        }

        // Encrypt tokens separately
        const accessTokenEncrypted = encryptToken(accessToken);
        const refreshTokenEncrypted = encryptToken(refreshToken);

        // Upsert gsc_connection (one per tenant)
        const { data: connection, error: upsertError } = await supabase
            .from('gsc_connections')
            .upsert(
                {
                    tenant_id: user.id,
                    access_token_encrypted: accessTokenEncrypted,
                    refresh_token_encrypted: refreshTokenEncrypted,
                    token_expires_at: tokenExpiresAt,
                    email: googleEmail,
                    is_active: true,
                },
                { onConflict: 'tenant_id' }
            )
            .select('id')
            .single();

        if (upsertError || !connection) {
            throw new Error(`DB upsert failed: ${upsertError?.message || 'no connection returned'}`);
        }

        // Insert/upsert sites into gsc_sites
        const siteRows = sites.map(site => ({
            gsc_connection_id: connection.id,
            tenant_id: user.id,
            site_url: site.siteUrl,
            permission_level: site.permissionLevel,
            is_active: true,
        }));

        const { error: sitesError } = await supabase
            .from('gsc_sites')
            .upsert(siteRows, { onConflict: 'gsc_connection_id,site_url' });

        if (sitesError) {
            console.error('[GSC OAuth callback] Sites upsert error:', sitesError.message);
        }

        // Auto-link GSC sites to FLOWZ stores by matching domain
        await supabase.rpc('link_gsc_sites_to_stores', { p_tenant_id: user.id }).catch(() => {});

        return NextResponse.redirect(`${baseUrl}/app/overview?gsc_status=connected`);

    } catch (err: any) {
        console.error('[GSC OAuth callback] Error:', err.message);
        return NextResponse.redirect(
            `${baseUrl}/app/overview?gsc_status=error&gsc_error=${encodeURIComponent(err.message || 'unknown')}`
        );
    }
}

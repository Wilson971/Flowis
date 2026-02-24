/**
 * POST /api/gsc/indexation/submit
 *
 * Submits URLs to Google Indexing API for indexation.
 * Respects 200/day quota. Excess URLs go to queue.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGscTokensForSite } from '@/lib/gsc/auth-helpers';
import { submitUrlForIndexing } from '@/lib/gsc/client';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120;

const requestSchema = z.object({
    siteId: z.string().uuid(),
    urls: z.array(z.string().url()).min(1).max(500),
});

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    let body: z.infer<typeof requestSchema>;
    try {
        const raw = await request.json();
        body = requestSchema.parse(raw);
    } catch {
        return NextResponse.json({ error: 'Requete invalide' }, { status: 400 });
    }

    try {
        const { accessToken } = await getGscTokensForSite(supabase, user.id, body.siteId);

        // Check daily quota
        const { data: settings } = await supabase
            .from('gsc_indexation_settings')
            .select('*')
            .eq('site_id', body.siteId)
            .eq('tenant_id', user.id)
            .single();

        let submissionCount = settings?.daily_submission_count || 0;
        const quotaResetDate = settings?.quota_reset_date;
        const today = new Date().toISOString().slice(0, 10);

        if (quotaResetDate !== today) {
            submissionCount = 0;
        }

        const DAILY_LIMIT = 200;
        const remaining = Math.max(0, DAILY_LIMIT - submissionCount);

        // Split: direct submission vs queue
        const directUrls = body.urls.slice(0, remaining);
        const queuedUrls = body.urls.slice(remaining);

        // Submit directly
        let submitted = 0;
        const errors: Array<{ url: string; error: string }> = [];

        for (const url of directUrls) {
            try {
                await submitUrlForIndexing(accessToken, url, 'URL_UPDATED');
                submitted++;

                // Record in queue as submitted
                await supabase
                    .from('gsc_indexation_queue')
                    .upsert({
                        site_id: body.siteId,
                        tenant_id: user.id,
                        url,
                        action: 'URL_UPDATED',
                        status: 'submitted',
                        submitted_at: new Date().toISOString(),
                        attempts: 1,
                    }, { onConflict: 'site_id,url,action' });
            } catch (err) {
                errors.push({
                    url,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
                // Queue failed ones for retry
                await supabase
                    .from('gsc_indexation_queue')
                    .upsert({
                        site_id: body.siteId,
                        tenant_id: user.id,
                        url,
                        action: 'URL_UPDATED',
                        status: 'failed',
                        error_message: err instanceof Error ? err.message : 'Unknown error',
                        attempts: 1,
                    }, { onConflict: 'site_id,url,action' });
            }

            // Rate limit: ~3 per second
            if (directUrls.indexOf(url) < directUrls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 350));
            }
        }

        // Queue excess URLs
        if (queuedUrls.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < queuedUrls.length; i += BATCH_SIZE) {
                const batch = queuedUrls.slice(i, i + BATCH_SIZE).map(url => ({
                    site_id: body.siteId,
                    tenant_id: user.id,
                    url,
                    action: 'URL_UPDATED' as const,
                    status: 'pending' as const,
                }));

                await supabase
                    .from('gsc_indexation_queue')
                    .upsert(batch, { onConflict: 'site_id,url,action' });
            }
        }

        // Update quota counter
        await supabase
            .from('gsc_indexation_settings')
            .upsert({
                site_id: body.siteId,
                tenant_id: user.id,
                daily_submission_count: submissionCount + submitted,
                quota_reset_date: today,
            }, { onConflict: 'site_id' });

        return NextResponse.json({
            submitted,
            queued: queuedUrls.length,
            failed: errors.length,
            quota_remaining: Math.max(0, remaining - submitted),
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        console.error('[GSC Submit]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur soumission' },
            { status: 500 }
        );
    }
}

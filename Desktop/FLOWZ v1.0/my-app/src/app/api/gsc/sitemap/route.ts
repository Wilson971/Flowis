/**
 * GET  /api/gsc/sitemap  - List sitemap URLs from gsc_sitemap_urls (paginated, filtered)
 * POST /api/gsc/sitemap  - Parse sitemap XML + enrich + upsert into gsc_sitemap_urls
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseSitemap } from '@/lib/gsc/client';
import { z } from 'zod';

// ============================================================================
// GET — Read stored sitemap URLs
// ============================================================================

const getSchema = z.object({
    siteId: z.string().uuid(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(200).default(50),
    source: z.enum(['sitemap', 'product', 'blog']).optional(),
    search: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = getSchema.safeParse(params);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    const { siteId, page, perPage, source, search } = parsed.data;

    // Verify ownership
    const { data: site, error: siteError } = await supabase
        .from('gsc_sites')
        .select('id')
        .eq('id', siteId)
        .eq('tenant_id', user.id)
        .single();

    if (siteError || !site) {
        return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
        .from('gsc_sitemap_urls')
        .select('id, url, source, lastmod, is_active, last_seen_at', { count: 'exact' })
        .eq('site_id', siteId)
        .eq('tenant_id', user.id)
        .order('last_seen_at', { ascending: false })
        .range(from, to);

    if (source) query = query.eq('source', source);
    if (search) query = query.ilike('url', `%${search}%`);

    const { data: urls, count, error: urlsError } = await query;
    if (urlsError) {
        return NextResponse.json({ error: urlsError.message }, { status: 500 });
    }

    // Stats per source
    const { data: statsRows } = await supabase
        .from('gsc_sitemap_urls')
        .select('source')
        .eq('site_id', siteId)
        .eq('tenant_id', user.id)
        .eq('is_active', true);

    const stats = { sitemap: 0, product: 0, blog: 0 };
    for (const row of statsRows || []) {
        if (row.source === 'sitemap') stats.sitemap++;
        else if (row.source === 'product') stats.product++;
        else if (row.source === 'blog') stats.blog++;
    }

    return NextResponse.json({ urls: urls || [], total: count ?? 0, stats });
}

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
    siteId: z.string().uuid(),
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

    // Fetch site URL
    const { data: site, error: siteError } = await supabase
        .from('gsc_sites')
        .select('id, site_url, store_id')
        .eq('id', body.siteId)
        .eq('tenant_id', user.id)
        .single();

    if (siteError || !site) {
        return NextResponse.json({ error: 'Site non trouve' }, { status: 404 });
    }

    try {
        // 1. Parse sitemap XML
        const rawEntries = await parseSitemap(site.site_url);

        // Deduplicate by URL (same URL can appear in multiple child sitemaps)
        const seenUrls = new Map<string, typeof rawEntries[0]>();
        for (const entry of rawEntries) {
            if (!seenUrls.has(entry.url)) {
                seenUrls.set(entry.url, entry);
            }
        }
        const sitemapEntries = Array.from(seenUrls.values());

        // 2. Fetch existing URLs for diff
        const { data: existingUrls } = await supabase
            .from('gsc_sitemap_urls')
            .select('id, url')
            .eq('site_id', site.id)
            .eq('tenant_id', user.id);

        const existingSet = new Set((existingUrls || []).map(u => u.url));
        const sitemapSet = new Set(sitemapEntries.map(e => e.url));

        // 3. Upsert sitemap URLs
        if (sitemapEntries.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < sitemapEntries.length; i += BATCH_SIZE) {
                const batch = sitemapEntries.slice(i, i + BATCH_SIZE).map(entry => ({
                    site_id: site.id,
                    tenant_id: user.id,
                    url: entry.url,
                    source: 'sitemap' as const,
                    lastmod: entry.lastmod ? new Date(entry.lastmod).toISOString() : null,
                    last_seen_at: new Date().toISOString(),
                    is_active: true,
                }));

                const { error: upsertError } = await supabase
                    .from('gsc_sitemap_urls')
                    .upsert(batch, { onConflict: 'site_id,url' });
                if (upsertError) {
                    console.error('[GSC Sitemap] Upsert error:', upsertError);
                    throw new Error(`Upsert failed: ${upsertError.message}`);
                }
            }
        }

        // 4. Mark disappeared URLs as inactive
        const disappeared = (existingUrls || [])
            .filter(u => !sitemapSet.has(u.url))
            .map(u => u.id);

        if (disappeared.length > 0) {
            await supabase
                .from('gsc_sitemap_urls')
                .update({ is_active: false })
                .in('id', disappeared);
        }

        // 5. Enrich with FLOWZ products (if store is linked)
        let productCount = 0;
        if (site.store_id) {
            const { data: products } = await supabase
                .from('products')
                .select('id, permalink')
                .eq('store_id', site.store_id)
                .eq('tenant_id', user.id)
                .not('permalink', 'is', null);

            if (products && products.length > 0) {
                const productRows = products
                    .filter(p => p.permalink && !sitemapSet.has(p.permalink))
                    .map(p => ({
                        site_id: site.id,
                        tenant_id: user.id,
                        url: p.permalink!,
                        source: 'product' as const,
                        source_id: p.id,
                        last_seen_at: new Date().toISOString(),
                        is_active: true,
                    }));

                if (productRows.length > 0) {
                    await supabase
                        .from('gsc_sitemap_urls')
                        .upsert(productRows, { onConflict: 'site_id,url' });
                    productCount = productRows.length;
                }
            }
        }

        // 6. Enrich with FLOWZ blog posts
        let blogCount = 0;
        const { data: blogPosts } = await supabase
            .from('blog_posts')
            .select('id, slug, metadata')
            .eq('tenant_id', user.id)
            .eq('status', 'published');

        if (blogPosts && blogPosts.length > 0) {
            const siteBaseUrl = site.site_url.replace(/\/$/, '');
            const blogRows = blogPosts
                .filter(b => b.slug)
                .map(b => {
                    const url = (b.metadata as Record<string, unknown> | null)?.permalink as string || `${siteBaseUrl}/blog/${b.slug}`;
                    return {
                        site_id: site.id,
                        tenant_id: user.id,
                        url,
                        source: 'blog' as const,
                        source_id: b.id,
                        last_seen_at: new Date().toISOString(),
                        is_active: true,
                    };
                })
                .filter(r => !sitemapSet.has(r.url));

            if (blogRows.length > 0) {
                await supabase
                    .from('gsc_sitemap_urls')
                    .upsert(blogRows, { onConflict: 'site_id,url' });
                blogCount = blogRows.length;
            }
        }

        const newCount = sitemapEntries.filter(e => !existingSet.has(e.url)).length;

        return NextResponse.json({
            total: sitemapEntries.length + productCount + blogCount,
            from_sitemap: sitemapEntries.length,
            from_products: productCount,
            from_blog: blogCount,
            new: newCount,
            removed: disappeared.length,
        });
    } catch (err) {
        console.error('[GSC Sitemap]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur lors du parsing du sitemap' },
            { status: 500 }
        );
    }
}

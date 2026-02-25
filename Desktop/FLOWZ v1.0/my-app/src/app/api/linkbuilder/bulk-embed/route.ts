import { GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for batch processing

// ============================================================================
// Rate limit: 2 bulk embed requests per minute
// ============================================================================

const RATE_LIMIT_BULK = { maxRequests: 2, windowMs: 60_000 };

// ============================================================================
// Validation
// ============================================================================

const requestSchema = z.object({
  store_id: z.string().uuid(),
});

// ============================================================================
// Helpers
// ============================================================================

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function buildEmbeddingText(article: {
  title: string;
  excerpt: string | null;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
}): string {
  const parts: string[] = [];
  if (article.title) parts.push(article.title);
  if (article.seo_title && article.seo_title !== article.title) {
    parts.push(article.seo_title);
  }
  if (article.seo_description) parts.push(article.seo_description);
  if (article.excerpt) parts.push(stripHtml(article.excerpt));
  if (article.content) {
    parts.push(stripHtml(article.content).slice(0, 2000));
  }
  return parts.join('\n\n');
}

// ============================================================================
// POST /api/linkbuilder/bulk-embed — Embed all articles for a store
// ============================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(user.id, 'linkbuilder-bulk-embed', RATE_LIMIT_BULK);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Requête invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { store_id } = parsed.data;

  // Fetch articles without embeddings (limit to 50 per batch to stay within timeout)
  const { data: articles, error: fetchError } = await supabase
    .from('blog_articles')
    .select('id, title, excerpt, content, seo_title, seo_description')
    .eq('store_id', store_id)
    .eq('archived', false)
    .is('embedding', null)
    .limit(50);

  if (fetchError) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des articles' },
      { status: 500 }
    );
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({
      success: true,
      total: 0,
      embedded: 0,
      failed: 0,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  let embedded = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process articles sequentially to avoid rate limits
  for (const article of articles) {
    const text = buildEmbeddingText(article);
    if (text.length < 10) {
      failed++;
      errors.push(`${article.title}: contenu trop court`);
      continue;
    }

    try {
      const result = await ai.models.embedContent({
        model: 'text-multilingual-embedding-002',
        contents: text,
      });

      const values = result.embeddings?.[0]?.values;
      if (!values || values.length === 0) {
        failed++;
        errors.push(`${article.title}: embedding vide`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('blog_articles')
        .update({
          embedding: JSON.stringify(values),
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (updateError) {
        failed++;
        errors.push(`${article.title}: erreur DB`);
      } else {
        embedded++;
      }
    } catch (error) {
      failed++;
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`${article.title}: ${msg}`);
    }

    // Small delay between requests to be respectful to the API
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({
    success: true,
    total: articles.length,
    embedded,
    failed,
    ...(errors.length > 0 && { errors: errors.slice(0, 10) }),
  });
}

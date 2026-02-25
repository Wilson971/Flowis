import { GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { RETRY_CONFIG, calculateBackoff, classifyError } from '@/lib/ai/retry';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ============================================================================
// Rate limit: 20 suggest requests per minute
// ============================================================================

const RATE_LIMIT_SUGGEST = { maxRequests: 20, windowMs: 60_000 };

// ============================================================================
// Validation
// ============================================================================

const requestSchema = z.object({
  article_id: z.string().uuid(),
  store_id: z.string().uuid(),
  threshold: z.number().min(0).max(1).default(0.65),
  max_results: z.number().min(1).max(20).default(10),
});

// ============================================================================
// Strip HTML helper
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
// POST /api/linkbuilder/suggest
// ============================================================================

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(user.id, 'linkbuilder-suggest', RATE_LIMIT_SUGGEST);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques secondes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Parse body
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Requête invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { article_id, store_id, threshold, max_results } = parsed.data;

  // Fetch source article
  const { data: article, error: fetchError } = await supabase
    .from('blog_articles')
    .select('id, title, excerpt, content, seo_title, seo_description, tenant_id, embedding')
    .eq('id', article_id)
    .single();

  if (fetchError || !article) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }

  // Get or generate embedding for the source article
  let queryEmbedding: number[];

  if (article.embedding) {
    // Use existing embedding
    queryEmbedding = typeof article.embedding === 'string'
      ? JSON.parse(article.embedding)
      : article.embedding;
  } else {
    // Generate embedding on the fly
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const embeddingText = buildEmbeddingText(article);

    if (embeddingText.length < 10) {
      return NextResponse.json(
        { error: 'Article trop court pour générer des suggestions' },
        { status: 422 }
      );
    }

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const result = await ai.models.embedContent({
          model: 'text-multilingual-embedding-002',
          contents: embeddingText,
        });

        const values = result.embeddings?.[0]?.values;
        if (!values || values.length === 0) {
          throw new Error('Empty embedding returned');
        }

        queryEmbedding = values;

        // Save it for future use (fire-and-forget)
        supabase
          .from('blog_articles')
          .update({
            embedding: JSON.stringify(values),
            embedding_updated_at: new Date().toISOString(),
          })
          .eq('id', article_id)
          .then(() => {});

        break;
      } catch (error) {
        const classified = classifyError(error);
        if (!classified.retryable || attempt === RETRY_CONFIG.maxRetries) {
          const message = error instanceof Error ? error.message : 'Erreur inconnue';
          return NextResponse.json(
            { error: `Erreur d'embedding: ${message}` },
            { status: 500 }
          );
        }
        await new Promise((r) => setTimeout(r, calculateBackoff(attempt)));
      }
    }
  }

  // Call match_articles RPC
  const { data: suggestions, error: matchError } = await supabase.rpc(
    'match_articles',
    {
      query_embedding: JSON.stringify(queryEmbedding!),
      match_tenant_id: article.tenant_id,
      match_store_id: store_id,
      match_threshold: threshold,
      match_count: max_results,
      exclude_article_id: article_id,
    }
  );

  if (matchError) {
    console.error('[linkbuilder/suggest] match_articles error:', matchError.message);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche d\'articles similaires' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    suggestions: suggestions || [],
    source_article: {
      id: article.id,
      title: article.title,
      has_embedding: !!article.embedding,
    },
  });
}

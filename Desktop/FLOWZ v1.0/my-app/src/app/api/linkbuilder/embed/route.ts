import { GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { RETRY_CONFIG, calculateBackoff, classifyError } from '@/lib/ai/retry';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ============================================================================
// Rate limit: 30 embed requests per minute (embeddings are cheap & fast)
// ============================================================================

const RATE_LIMIT_EMBED = { maxRequests: 30, windowMs: 60_000 };

// ============================================================================
// Validation
// ============================================================================

const requestSchema = z.object({
  article_id: z.string().uuid(),
});

// ============================================================================
// Strip HTML for clean text embedding
// ============================================================================

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// Build embedding input from article fields
// ============================================================================

function buildEmbeddingText(article: {
  title: string;
  excerpt: string | null;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
}): string {
  const parts: string[] = [];

  // Title gets double weight by appearing first
  if (article.title) parts.push(article.title);
  if (article.seo_title && article.seo_title !== article.title) {
    parts.push(article.seo_title);
  }
  if (article.seo_description) parts.push(article.seo_description);
  if (article.excerpt) parts.push(stripHtml(article.excerpt));

  // Content: strip HTML and truncate to ~2000 chars to stay within token limits
  if (article.content) {
    const plainContent = stripHtml(article.content);
    parts.push(plainContent.slice(0, 2000));
  }

  return parts.join('\n\n');
}

// ============================================================================
// Generate embedding with retry
// ============================================================================

async function generateEmbedding(
  ai: GoogleGenAI,
  text: string
): Promise<number[]> {
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await ai.models.embedContent({
        model: 'text-multilingual-embedding-002',
        contents: text,
      });

      const values = result.embeddings?.[0]?.values;
      if (!values || values.length === 0) {
        throw new Error('Empty embedding returned from Google API');
      }

      return values;
    } catch (error) {
      const classified = classifyError(error);
      if (!classified.retryable || attempt === RETRY_CONFIG.maxRetries) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, calculateBackoff(attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================================================
// POST /api/linkbuilder/embed
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
  const rl = checkRateLimit(user.id, 'linkbuilder-embed', RATE_LIMIT_EMBED);
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

  const { article_id } = parsed.data;

  // Fetch article (RLS ensures tenant isolation)
  const { data: article, error: fetchError } = await supabase
    .from('blog_articles')
    .select('id, title, excerpt, content, seo_title, seo_description, tenant_id')
    .eq('id', article_id)
    .single();

  if (fetchError || !article) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }

  // Build text for embedding
  const embeddingText = buildEmbeddingText(article);
  if (embeddingText.length < 10) {
    return NextResponse.json(
      { error: 'Article trop court pour générer un embedding' },
      { status: 422 }
    );
  }

  // Generate embedding via Google
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const embedding = await generateEmbedding(ai, embeddingText);

    // Store embedding in blog_articles
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('blog_articles')
      .update({
        embedding: JSON.stringify(embedding),
        embedding_updated_at: now,
      })
      .eq('id', article_id);

    if (updateError) {
      console.error('[linkbuilder/embed] DB update error:', updateError.message);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de l\'embedding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article_id,
      embedding_updated_at: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[linkbuilder/embed] Embedding error:', message);
    return NextResponse.json(
      { error: `Erreur de génération d'embedding: ${message}` },
      { status: 500 }
    );
  }
}

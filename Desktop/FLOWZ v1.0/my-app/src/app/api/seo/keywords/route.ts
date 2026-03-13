import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { keywordResearchRequestSchema } from '@/features/seo/types/keywords';
import { researchKeywords } from '@/lib/services/seo-research';
import { DataForSeoCredentialError } from '@/features/seo/lib/dataforseo-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Non authentifié.' } },
      { status: 401 },
    );
  }

  // Rate limit
  const { rateLimitOrNull, RATE_LIMIT_SEO_KEYWORDS } = await import('@/lib/rate-limit');
  const rlResponse = rateLimitOrNull(user.id, 'seo/keywords', RATE_LIMIT_SEO_KEYWORDS);
  if (rlResponse) return rlResponse;

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Corps invalide.' } },
      { status: 400 },
    );
  }

  const parsed = keywordResearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.', details: parsed.error.issues } },
      { status: 400 },
    );
  }

  // Delegate to service
  try {
    const response = await researchKeywords(supabase, user.id, parsed.data);
    return NextResponse.json(response);
  } catch (err) {
    // Credential config error → 503
    if (err instanceof DataForSeoCredentialError) {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service SEO non configuré.' } },
        { status: 503 },
      );
    }

    // DataForSEO API error → 502
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SEO Keywords] Service error:', message);
    return NextResponse.json(
      { error: { code: 'DATAFORSEO_ERROR', message: 'Échec de la recherche de mots-clés.' } },
      { status: 502 },
    );
  }
}

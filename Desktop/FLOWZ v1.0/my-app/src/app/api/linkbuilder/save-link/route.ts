import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

// ============================================================================
// Validation
// ============================================================================

const requestSchema = z.object({
  source_article_id: z.string().uuid(),
  target_article_id: z.string().uuid(),
  anchor_text: z.string().min(1).max(500),
  context_snippet: z.string().max(1000).optional(),
  similarity_score: z.number().min(0).max(1).optional(),
  status: z.enum(['suggested', 'accepted', 'rejected', 'inserted']),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['suggested', 'accepted', 'rejected', 'inserted']),
  anchor_text: z.string().min(1).max(500).optional(),
});

// ============================================================================
// POST /api/linkbuilder/save-link — Create or upsert a link record
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

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Requête invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { source_article_id, target_article_id, anchor_text, context_snippet, similarity_score, status } = parsed.data;

  const { data, error } = await supabase
    .from('article_internal_links')
    .upsert(
      {
        tenant_id: user.id,
        source_article_id,
        target_article_id,
        anchor_text,
        context_snippet: context_snippet || null,
        similarity_score: similarity_score || null,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source_article_id,target_article_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[linkbuilder/save-link] Error:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du lien' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, link: data });
}

// ============================================================================
// PATCH /api/linkbuilder/save-link — Update link status
// ============================================================================

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Requête invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, status, anchor_text } = parsed.data;

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (anchor_text) updates.anchor_text = anchor_text;

  const { data, error } = await supabase
    .from('article_internal_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[linkbuilder/save-link] Update error:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du lien' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, link: data });
}

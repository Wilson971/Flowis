/**
 * SEO Keyword Research Service
 *
 * Orchestrates: credential validation → cache check → DataForSEO API → cache insert → usage tracking.
 * Designed to be consumed by API routes and future integrations (FloWriter, Copilot).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  validateDataForSeoCredentials,
  getKeywordSuggestions,
  getRelatedKeywords,
} from '@/features/seo/lib/dataforseo-client';
import { trackAiUsage } from '@/lib/api/usage-tracker';
import type { KeywordResearchResponse } from '@/features/seo/types/keywords';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Estimated cost per DataForSEO API call */
const COST_PER_SUGGESTIONS_CALL = 0.004;
const COST_PER_RELATED_CALL = 0.004;

// ============================================================================
// TYPES
// ============================================================================

export interface ResearchKeywordsParams {
  seed: string;
  location_code: number;
  language_code: string;
  include_related: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Research keywords for a given seed.
 * Checks 24h cache first, calls DataForSEO on miss, tracks usage.
 */
export async function researchKeywords(
  supabase: SupabaseClient,
  tenantId: string,
  params: ResearchKeywordsParams,
): Promise<KeywordResearchResponse> {
  const { seed, location_code, language_code, include_related } = params;

  // 1. Validate credentials
  validateDataForSeoCredentials();

  // 2. Check cache (24h TTL)
  const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data: cached } = await supabase
    .from('keyword_research')
    .select('id, results, related_results')
    .eq('tenant_id', tenantId)
    .eq('seed_keyword', seed.toLowerCase())
    .eq('language', language_code)
    .eq('location_code', location_code)
    .gte('created_at', cacheThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    const results = (cached.results ?? []) as KeywordResearchResponse['suggestions'];
    const relatedResults = (cached.related_results ?? []) as KeywordResearchResponse['related'];
    return {
      seed,
      suggestions: results,
      related: relatedResults,
      total_count: results.length + relatedResults.length,
      cached: true,
      research_id: cached.id,
    };
  }

  // 3. Call DataForSEO
  const [suggestions, related] = await Promise.all([
    getKeywordSuggestions(seed, location_code, language_code),
    include_related
      ? getRelatedKeywords(seed, location_code, language_code)
      : Promise.resolve([]),
  ]);

  // 4. Insert cache
  const { data: inserted, error: insertError } = await supabase
    .from('keyword_research')
    .insert({
      tenant_id: tenantId,
      seed_keyword: seed.toLowerCase(),
      results: suggestions,
      related_results: related,
      language: language_code,
      location_code,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[seo-research] Cache insert error:', insertError.message);
  }

  // 5. Track usage (non-blocking)
  const costUsd =
    COST_PER_SUGGESTIONS_CALL +
    (include_related ? COST_PER_RELATED_CALL : 0);

  trackAiUsage(supabase, {
    tenantId,
    feature: 'seo',
    action: 'keyword_research',
    costUsd,
  }).catch((err) => {
    console.error('[seo-research] Usage tracking error:', err);
  });

  // 6. Return
  return {
    seed,
    suggestions,
    related,
    total_count: suggestions.length + related.length,
    cached: false,
    research_id: inserted?.id ?? '',
  };
}

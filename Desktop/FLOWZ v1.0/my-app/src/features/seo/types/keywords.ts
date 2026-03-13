import { z } from 'zod/v4';

// ============================================================================
// TYPES
// ============================================================================

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface KeywordTrend {
  year: number;
  month: number;
  search_volume: number;
}

export interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
  keyword_difficulty: number;
  intent: SearchIntent;
  trends: KeywordTrend[];
}

export interface KeywordResearchRequest {
  seed: string;
  location_code?: number;
  language_code?: string;
  include_related?: boolean;
}

export interface KeywordResearchResponse {
  seed: string;
  suggestions: KeywordSuggestion[];
  related: KeywordSuggestion[];
  total_count: number;
  cached: boolean;
  research_id: string;
}

export interface SavedKeyword {
  id: string;
  tenant_id: string;
  keyword: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  intent: SearchIntent | null;
  source: string | null;
  product_id: string | null;
  article_id: string | null;
  created_at: string;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const keywordResearchRequestSchema = z.object({
  seed: z.string().min(2).max(100).transform(s => s.trim()),
  location_code: z.number().int().positive().optional().default(2250),
  language_code: z.string().min(2).max(5).optional().default('fr'),
  include_related: z.boolean().optional().default(true),
});

export const saveKeywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  search_volume: z.number().int().nonnegative().nullable().optional(),
  keyword_difficulty: z.number().min(0).max(100).nullable().optional(),
  cpc: z.number().nonnegative().nullable().optional(),
  intent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).nullable().optional(),
  source: z.string().max(50).nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  article_id: z.string().uuid().nullable().optional(),
});

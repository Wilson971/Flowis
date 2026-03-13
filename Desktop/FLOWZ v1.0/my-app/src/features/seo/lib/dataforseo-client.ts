/**
 * DataForSEO API Client (server-only)
 *
 * Auth: Basic Base64(login:password)
 * Docs: https://docs.dataforseo.com/v3/
 */

import type { KeywordSuggestion, KeywordTrend, SearchIntent } from '../types/keywords';

// ============================================================================
// CONFIG
// ============================================================================

const BASE_URL = 'https://api.dataforseo.com/v3';
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/** Custom error for missing DataForSEO credentials */
export class DataForSeoCredentialError extends Error {
  constructor() {
    super('DataForSEO non configuré : les variables DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD sont requises dans .env.local');
    this.name = 'DataForSeoCredentialError';
  }
}

/**
 * Validate that DataForSEO credentials are configured.
 * Throws a descriptive error if missing.
 */
export function validateDataForSeoCredentials(): void {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new DataForSeoCredentialError();
  }
}

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

// ============================================================================
// FETCH WITH RETRY
// ============================================================================

async function fetchWithRetry(
  url: string,
  body: unknown,
  retries = MAX_RETRIES,
): Promise<unknown> {
  const auth = getAuthHeader();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`DataForSEO ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message || 'Unknown'}`);
      }

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, INITIAL_DELAY_MS * Math.pow(2, attempt)));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error('DataForSEO request failed');
}

// ============================================================================
// NORMALIZATION
// ============================================================================

function normalizeCompetitionLevel(level: string | undefined): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!level) return 'LOW';
  const upper = level.toUpperCase();
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function normalizeTrends(monthlySearches: Array<Record<string, unknown>> | undefined): KeywordTrend[] {
  if (!Array.isArray(monthlySearches)) return [];
  return monthlySearches.map(m => ({
    year: Number(m.year) || 0,
    month: Number(m.month) || 0,
    search_volume: Number(m.search_volume) || 0,
  }));
}

function normalizeIntent(intent: unknown): SearchIntent {
  if (typeof intent === 'string') {
    const lower = intent.toLowerCase();
    if (['informational', 'navigational', 'commercial', 'transactional'].includes(lower)) {
      return lower as SearchIntent;
    }
  }
  // DataForSEO returns intent_info object sometimes
  if (intent && typeof intent === 'object' && 'main' in intent) {
    return normalizeIntent((intent as Record<string, unknown>).main);
  }
  return 'informational';
}

function normalizeKeyword(raw: Record<string, unknown>): KeywordSuggestion {
  return {
    keyword: String(raw.keyword || ''),
    search_volume: Number(raw.search_volume) || 0,
    cpc: Number(raw.cpc) || 0,
    competition: Number(raw.competition) || 0,
    competition_level: normalizeCompetitionLevel(raw.competition_level as string),
    keyword_difficulty: Number(raw.keyword_difficulty) || 0,
    intent: normalizeIntent(raw.keyword_info?.search_intent ?? raw.search_intent),
    trends: normalizeTrends(raw.monthly_searches as Array<Record<string, unknown>>),
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function getKeywordSuggestions(
  seed: string,
  locationCode: number = 2250,
  languageCode: string = 'fr',
): Promise<KeywordSuggestion[]> {
  const data = await fetchWithRetry(
    `${BASE_URL}/dataforseo_labs/google/keyword_suggestions/live`,
    [{
      keyword: seed,
      location_code: locationCode,
      language_code: languageCode,
      include_seed_keyword: true,
      limit: 50,
    }],
  ) as { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };

  const items = data?.tasks?.[0]?.result?.[0]?.items;
  if (!Array.isArray(items)) return [];

  return items.map(item => normalizeKeyword(item.keyword_data as Record<string, unknown> ?? item));
}

export async function getRelatedKeywords(
  keyword: string,
  locationCode: number = 2250,
  languageCode: string = 'fr',
): Promise<KeywordSuggestion[]> {
  const data = await fetchWithRetry(
    `${BASE_URL}/dataforseo_labs/google/related_keywords/live`,
    [{
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      limit: 30,
    }],
  ) as { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };

  const items = data?.tasks?.[0]?.result?.[0]?.items;
  if (!Array.isArray(items)) return [];

  return items.map(item => normalizeKeyword(item.keyword_data as Record<string, unknown> ?? item));
}

export async function getSearchIntent(
  keywords: string[],
): Promise<Map<string, SearchIntent>> {
  if (keywords.length === 0) return new Map();

  const data = await fetchWithRetry(
    `${BASE_URL}/dataforseo_labs/google/search_intent/live`,
    [{ keywords: keywords.slice(0, 100) }],
  ) as { tasks?: Array<{ result?: Array<{ items?: Array<{ keyword: string; search_intent: unknown }> }> }> };

  const items = data?.tasks?.[0]?.result?.[0]?.items;
  const map = new Map<string, SearchIntent>();
  if (!Array.isArray(items)) return map;

  for (const item of items) {
    map.set(item.keyword, normalizeIntent(item.search_intent));
  }
  return map;
}

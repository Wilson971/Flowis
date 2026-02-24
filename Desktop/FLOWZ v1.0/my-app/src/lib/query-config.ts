/**
 * Standardized TanStack Query staleTime values.
 * Use these instead of hardcoded numbers for consistency.
 */
export const STALE_TIMES = {
  /** 1s — Deduplication for active polling queries */
  POLLING: 1_000,
  /** 5s — Near-realtime data (sync status, active jobs) */
  REALTIME: 5_000,
  /** 30s — Lists that update moderately (products, articles) */
  LIST: 30_000,
  /** 60s — Detail views (single product, single article) */
  DETAIL: 60_000,
  /** 5min — Rarely changing data (stores, categories, templates) */
  STATIC: 5 * 60_000,
  /** 10min — Historical/archive data (sync logs, old reports) */
  ARCHIVE: 10 * 60_000,
} as const;

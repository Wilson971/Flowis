/**
 * useCatalogCoverage — Hook pour la couverture catalogue IA
 *
 * Appelle la RPC Supabase `get_catalog_coverage(p_store_id)` qui retourne:
 *  - total_products: nombre total de produits
 *  - ai_optimized_count: produits avec working_content IS NOT NULL
 *  - coverage_percent: % de couverture IA
 *  - generated_this_month: produits générés/mis à jour ce mois
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface CatalogCoverageData {
  total: number;
  optimized: number;
  coveragePercent: number;
  generatedThisMonth: number;
}

export const catalogCoverageKeys = {
  all: ['catalog-coverage'] as const,
  byStore: (storeId: string | null) => ['catalog-coverage', storeId] as const,
};

export function useCatalogCoverage(storeId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: catalogCoverageKeys.byStore(storeId),
    queryFn: async (): Promise<CatalogCoverageData> => {
      const { data, error } = await supabase.rpc('get_catalog_coverage', {
        p_store_id: storeId,
      });

      if (error) {
        console.error('[useCatalogCoverage] RPC error:', error);
        throw error;
      }

      const row = data && data[0]
        ? data[0]
        : { total_products: 0, ai_optimized_count: 0, coverage_percent: 0, generated_this_month: 0 };

      return {
        total: Number(row.total_products),
        optimized: Number(row.ai_optimized_count),
        coveragePercent: Number(row.coverage_percent),
        generatedThisMonth: Number(row.generated_this_month),
      };
    },
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000,
  });
}

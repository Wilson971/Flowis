import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import type { ProductAnalysisResult } from '../constants/productTaxonomy';

// ============================================================================
// useProductClassification
//
// Calls /api/photo-studio/classify to get AI product classification
// and scene preset recommendations. Cached for 24h per product.
// ============================================================================

interface ClassificationResponse {
  success: true;
  classification: ProductAnalysisResult;
}

interface ClassificationError {
  success: false;
  error: { code: string; message: string };
}

async function classifyProduct(imageUrl: string): Promise<ProductAnalysisResult> {
  const response = await fetch('/api/photo-studio/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  const data: ClassificationResponse | ClassificationError = await response.json();

  if (!data.success) {
    throw new Error((data as ClassificationError).error.message);
  }

  return (data as ClassificationResponse).classification;
}

/**
 * Hook to classify a product image via Gemini Vision.
 *
 * Returns the product classification (category, materials, style, audience)
 * and a list of recommended scene preset IDs sorted by relevance.
 *
 * Results are cached for 24 hours per product (product images rarely change).
 *
 * @param productId - Product UUID (used as cache key)
 * @param imageUrl  - Product image URL to analyze (null disables the query)
 */
export function useProductClassification(
  productId: string | null,
  imageUrl: string | null
) {
  return useQuery({
    queryKey: ['product-classification', productId],
    queryFn: () => classifyProduct(imageUrl!),
    enabled: !!productId && !!imageUrl,
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
    gcTime: 48 * 60 * 60 * 1000,    // 48h garbage collection
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

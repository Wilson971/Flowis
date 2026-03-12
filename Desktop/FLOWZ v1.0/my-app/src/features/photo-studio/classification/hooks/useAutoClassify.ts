import { useQuery } from '@tanstack/react-query'
import { useStudioSettings } from '../../hooks/useStudioSettings'
import type { ProductAnalysisResult } from '../../constants/productTaxonomy'
import type { ScenePreset } from '../../constants/nicheScenePresets'
import { NICHE_SCENE_PRESETS } from '../../constants/nicheScenePresets'

// ============================================================================
// Classification result with resolved preset details
// ============================================================================

export interface ClassificationResult extends ProductAnalysisResult {
  /** Recommended presets with resolved names and scores */
  recommendedPresets: Array<{
    id: string
    name: string
    description: string
    score: number
    preset: ScenePreset
  }>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Auto-classifies a product image via Gemini Vision and returns
 * classification data with scored preset recommendations.
 *
 * - Caches results for 24h (stale) / 7d (gc)
 * - Only fires when autoClassify is enabled in studio settings
 */
export function useAutoClassify(
  productId: string | null,
  imageUrl: string | null
) {
  const { settings } = useStudioSettings()

  return useQuery<ClassificationResult>({
    queryKey: ['product-classification', productId, imageUrl],
    queryFn: async (): Promise<ClassificationResult> => {
      const res = await fetch('/api/photo-studio/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ?? 'Classification failed'
        )
      }

      const json = await res.json()
      const analysis: ProductAnalysisResult = json.classification

      // Build a lookup for scoring — the API returns IDs sorted by score,
      // so the index gives us relative ranking.
      const presetMap = new Map(
        NICHE_SCENE_PRESETS.map((p) => [p.id, p])
      )

      const suggestedIds: string[] = analysis.suggestedSceneIds ?? []
      const recommendedPresets = suggestedIds
        .map((id, index) => {
          const preset = presetMap.get(id)
          if (!preset) return null
          return {
            id,
            name: preset.name,
            description: preset.description,
            score: Math.max(0, 100 - index * 10), // Top = 100, next = 90, etc.
            preset,
          }
        })
        .filter(Boolean) as ClassificationResult['recommendedPresets']

      return {
        ...analysis,
        recommendedPresets,
      }
    },
    enabled: !!productId && !!imageUrl && settings.autoClassify,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

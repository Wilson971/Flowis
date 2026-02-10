/**
 * useSceneGeneration Hook
 *
 * Mutation hook that calls the Photo Studio generation API route.
 * Sends image data (URL or base64) with a prompt and generation
 * parameters, returning the AI-generated image result.
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface SceneGenerationParams {
  /** URL of the source product image (provide this OR imageBase64) */
  imageUrl?: string;
  /** Base64-encoded source product image (provide this OR imageUrl) */
  imageBase64?: string;
  /** The scene/context prompt for generation */
  prompt: string;
  /** Product name for context-aware generation */
  productName?: string;
  /** AI temperature (0.0 - 1.0), controls creativity */
  temperature?: number;
  /** Output quality level */
  quality?: string;
  /** Desired aspect ratio of the generated image */
  aspectRatio?: string;
}

export interface SceneGenerationResult {
  success: true;
  imageBase64: string;
  model: string;
  textResponse?: string;
}

export interface SceneGenerationError {
  success: false;
  error: string | { code: string; message: string; retryable: boolean };
}

type SceneGenerationResponse = SceneGenerationResult | SceneGenerationError;

// ============================================================================
// HOOK
// ============================================================================

export function useSceneGeneration() {
  return useMutation({
    mutationFn: async (
      params: SceneGenerationParams
    ): Promise<SceneGenerationResult> => {
      // Validate that at least one image source is provided
      if (!params.imageUrl && !params.imageBase64) {
        throw new Error(
          'Une image source est requise (URL ou base64).'
        );
      }

      if (!params.prompt.trim()) {
        throw new Error('Le prompt de generation est requis.');
      }

      const response = await fetch('/api/photo-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: params.imageUrl,
          imageBase64: params.imageBase64,
          prompt: params.prompt,
          productName: params.productName,
          temperature: params.temperature,
          quality: params.quality,
          aspectRatio: params.aspectRatio,
        }),
      });

      if (!response.ok) {
        // Attempt to parse error body for a meaningful message
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorBody = (await response.json()) as SceneGenerationError;
          if (errorBody.error) {
            errorMessage = typeof errorBody.error === 'string'
              ? errorBody.error
              : errorBody.error.message;
          }
        } catch {
          // Response body was not JSON; keep the generic message
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as SceneGenerationResponse;

      if (!data.success) {
        const err = (data as SceneGenerationError).error;
        const msg = typeof err === 'string' ? err : err?.message;
        throw new Error(
          msg || 'La generation a echoue sans message d\'erreur.'
        );
      }

      return data as SceneGenerationResult;
    },
    onError: (error: Error) => {
      toast.error('Erreur de generation', {
        description:
          error.message || 'Impossible de generer l\'image. Veuillez reessayer.',
      });
    },
  });
}

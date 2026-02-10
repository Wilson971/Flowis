/**
 * useSaveGeneratedImage - Save a generated image to Supabase Storage
 *
 * Converts a base64 image to a Blob, uploads it to the 'studio-images'
 * bucket under products/{productId}/{timestamp}.png, and returns
 * the public URL and storage path.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface SaveImageParams {
  /** Base64 data URI (e.g. "data:image/png;base64,...") */
  imageBase64: string;
  /** Product this image belongs to */
  productId: string;
  /** Optional custom filename (without extension) */
  fileName?: string;
}

export interface SaveImageResult {
  publicUrl: string;
  storagePath: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const STORAGE_BUCKET = 'studio-images';

/**
 * Convert a base64 data URI to a Blob.
 */
function base64ToBlob(base64DataUri: string): Blob {
  // Strip the data URI prefix (e.g. "data:image/png;base64,")
  const parts = base64DataUri.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? 'image/png';
  const raw = atob(parts[1] ?? '');

  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Mutation to save a generated image (base64) to Supabase Storage.
 *
 * Usage:
 * ```ts
 * const saveImage = useSaveGeneratedImage();
 * saveImage.mutate({ imageBase64: dataUri, productId: 'abc-123' });
 * ```
 */
export function useSaveGeneratedImage() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: SaveImageParams): Promise<SaveImageResult> => {
      const { imageBase64, productId, fileName } = params;

      // 1. Convert base64 to Blob
      const blob = base64ToBlob(imageBase64);

      // 2. Build storage path
      const timestamp = Date.now();
      const safeName = fileName
        ? fileName.replace(/[^a-zA-Z0-9_-]/g, '_')
        : `generated_${timestamp}`;
      const storagePath = `products/${productId}/${safeName}.png`;

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message || 'Storage upload failed');

      // 4. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

      return { publicUrl, storagePath };
    },
    onSuccess: (_result, params) => {
      // Invalidate product-related queries so gallery refreshes
      queryClient.invalidateQueries({
        queryKey: ['studio-jobs', params.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['product', params.productId],
      });

      toast.success('Image sauvegardee');
    },
    onError: (error: Error) => {
      toast.error('Echec de la sauvegarde', {
        description: error.message,
      });
    },
  });
}

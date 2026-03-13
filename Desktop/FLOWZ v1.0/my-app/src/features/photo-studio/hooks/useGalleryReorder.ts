'use client'

import { useState, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────
interface GalleryImage {
  id: string
  url: string
  sort_order: number
}

export function useGalleryReorder() {
  const [orderedImages, setOrderedImages] = useState<GalleryImage[]>([])
  const [originalImages, setOriginalImages] = useState<GalleryImage[]>([])
  const queryClient = useQueryClient()
  const supabase = createClient()

  const isDirty =
    orderedImages.length !== originalImages.length ||
    orderedImages.some((img, i) => img.id !== originalImages[i]?.id)

  const initOrder = useCallback((images: GalleryImage[]) => {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
    setOrderedImages(sorted)
    setOriginalImages(sorted)
  }, [])

  const moveImage = useCallback((oldIndex: number, newIndex: number) => {
    setOrderedImages((prev) => arrayMove(prev, oldIndex, newIndex))
  }, [])

  const resetOrder = useCallback(() => {
    setOrderedImages(originalImages)
  }, [originalImages])

  const { mutate: saveOrder, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const updates = orderedImages.map((img, index) => ({
        id: img.id,
        sort_order: index,
      }))

      // Batch update via individual calls (Supabase doesn't support bulk upsert on arbitrary columns)
      for (const update of updates) {
        const { error } = await supabase
          .from('product_images')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
        if (error) throw error
      }

      return updates
    },
    onSuccess: () => {
      // Sync original to current
      setOriginalImages(
        orderedImages.map((img, index) => ({ ...img, sort_order: index }))
      )
      queryClient.invalidateQueries({ queryKey: ['product-images'] })
    },
  })

  return {
    orderedImages,
    initOrder,
    moveImage,
    isDirty,
    saveOrder,
    resetOrder,
    isSaving,
  }
}

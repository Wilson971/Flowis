"use client"

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface PublishToProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: Array<{ id: string; product_id: string; storage_url: string }>
  onConfirm: () => void
}

export function PublishToProductDialog({
  open,
  onOpenChange,
  images,
  onConfirm,
}: PublishToProductDialogProps) {
  const groupedByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const img of images) {
      map.set(img.product_id, (map.get(img.product_id) ?? 0) + 1)
    }
    return Array.from(map.entries())
  }, [images])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publier les images</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="space-y-2">
                {groupedByProduct.map(([productId, count]) => (
                  <div
                    key={productId}
                    className={cn(
                      'flex items-center justify-between',
                      'rounded-lg bg-muted/50 px-4 py-2 text-sm',
                    )}
                  >
                    <span className="font-medium text-foreground truncate">
                      Produit {productId.slice(0, 8)}...
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {count} image{count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg',
                  'bg-warning/10 px-4 py-3 text-sm text-warning',
                )}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Les images seront ajout\u00e9es au catalogue produit et pourront \u00eatre
                  synchronis\u00e9es vers vos boutiques.
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Publier {images.length} image{images.length > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

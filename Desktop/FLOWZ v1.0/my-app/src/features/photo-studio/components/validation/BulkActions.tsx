"use client"

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { motionTokens } from '@/lib/design-system'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Upload, XCircle, Download, X } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  onAction: (action: 'approve' | 'publish' | 'reject') => void
  onDownload: () => void
  onClear: () => void
}

export function BulkActions({
  selectedCount,
  selectedIds,
  onAction,
  onDownload,
  onClear,
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        variants={motionTokens.variants.slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-3 px-6 py-3 rounded-xl',
          'bg-card/80 backdrop-blur-xl border border-border shadow-xl',
        )}
      >
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {selectedCount} s\u00e9lectionn\u00e9{selectedCount > 1 ? 's' : ''}
        </span>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
            onClick={() => onAction('approve')}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approuver ({selectedCount})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            onClick={() => onAction('publish')}
          >
            <Upload className="h-4 w-4" />
            Publier ({selectedCount})
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
                Rejeter ({selectedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rejeter les images</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous \u00eates sur le point de rejeter {selectedCount} image{selectedCount > 1 ? 's' : ''}.
                  Cette action est irr\u00e9versible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onAction('reject')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Rejeter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator orientation="vertical" className="h-6" />

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            T\u00e9l\u00e9charger ({selectedCount})
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}

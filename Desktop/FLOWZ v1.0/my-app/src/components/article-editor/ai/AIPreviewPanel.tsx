'use client';

/**
 * AIPreviewPanel - Slide-over panel for AI action preview
 *
 * Shows before/after comparison and allows apply/cancel
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AI_ACTION_LABELS, type AIEditorAction } from '@/schemas/article-editor';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface AIPreviewPanelProps {
  isOpen: boolean;
  originalContent: string;
  aiResult: string;
  actionLabel?: AIEditorAction;
  onApply: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIPreviewPanel({
  isOpen,
  originalContent,
  aiResult,
  actionLabel,
  onApply,
  onCancel,
  isLoading,
}: AIPreviewPanelProps) {
  const label = actionLabel ? AI_ACTION_LABELS[actionLabel] : 'Action IA';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{label}</h3>
                  <p className="text-xs text-muted-foreground">Prévisualisation</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Génération en cours...</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Original */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Original
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {originalContent || 'Aucun contenu'}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="h-8 w-px bg-gradient-to-b from-border to-amber-500/50" />
                    </div>

                    {/* AI Result */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Suggestion IA
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm whitespace-pre-wrap">
                          {aiResult || 'Aucun résultat'}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Annuler
              </Button>
              <Button
                onClick={onApply}
                disabled={isLoading || !aiResult}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Appliquer
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

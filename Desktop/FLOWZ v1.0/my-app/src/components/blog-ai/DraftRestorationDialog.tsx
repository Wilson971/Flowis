'use client';

/**
 * DraftRestorationDialog Component
 *
 * Shows when a recent draft is detected, allowing users to restore or discard it
 */

import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileEdit,
  CheckCircle,
  Cloud,
  HardDrive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DraftInfo } from '@/hooks/blog/useFlowriterState';
import { FlowriterStep } from '@/types/blog-ai';

// Extended DraftInfo with backend flag
interface ExtendedDraftInfo extends DraftInfo {
  isBackendDraft?: boolean;
}

// ============================================================================
// STEP LABELS
// ============================================================================

const STEP_LABELS: Record<FlowriterStep, string> = {
  [FlowriterStep.TOPIC]: 'Choix du sujet',
  [FlowriterStep.CONFIG]: 'Configuration',
  [FlowriterStep.OUTLINE]: 'Structure du plan',
  [FlowriterStep.GENERATION]: 'Génération',
  [FlowriterStep.CANVAS]: 'Édition',
  [FlowriterStep.FINALIZE]: 'Finalisation',
};

// ============================================================================
// COMPONENT
// ============================================================================

interface DraftRestorationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftInfo: ExtendedDraftInfo | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestorationDialog({
  open,
  onOpenChange,
  draftInfo,
  onRestore,
  onDiscard,
}: DraftRestorationDialogProps) {
  if (!draftInfo) return null;

  const hasContent = draftInfo.wordCount > 0;
  const stepLabel = STEP_LABELS[draftInfo.currentStep] || 'En cours';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg">Brouillon détecté</DialogTitle>
                {/* Storage type badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    draftInfo.isBackendDraft
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {draftInfo.isBackendDraft ? (
                    <>
                      <Cloud className="w-3 h-3" />
                      Cloud
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3 h-3" />
                      Local
                    </>
                  )}
                </span>
              </div>
              <DialogDescription className="text-xs mt-0.5">
                {draftInfo.ageLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Draft Preview Card */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          {/* Title */}
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Titre</p>
              <p className="font-medium text-sm truncate">
                {draftInfo.title || 'Sans titre'}
              </p>
            </div>
          </div>

          {/* Topic */}
          {draftInfo.topic && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Sujet</p>
                <p className="text-sm text-muted-foreground truncate">
                  {draftInfo.topic}
                </p>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            {/* Step Progress */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{stepLabel}</span>
            </div>

            {/* Word Count */}
            {hasContent && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {draftInfo.wordCount.toLocaleString()} mots
                </span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {draftInfo.lastModified.toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="flex-1 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Recommencer
          </Button>
          <Button
            onClick={onRestore}
            className="flex-1 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reprendre
          </Button>
        </DialogFooter>

        {/* Info Text */}
        <p className="text-[10px] text-muted-foreground text-center -mt-1">
          {draftInfo.isBackendDraft
            ? 'Brouillon synchronisé avec votre compte'
            : 'Les brouillons locaux sont conservés pendant 7 jours'}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default DraftRestorationDialog;

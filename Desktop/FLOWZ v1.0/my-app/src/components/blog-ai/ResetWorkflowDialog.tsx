'use client';

/**
 * ResetWorkflowDialog Component
 *
 * Intelligent workflow reset management with:
 * - Context-aware reset options
 * - Draft saving before reset
 * - Partial reset (go back to specific step)
 * - Session recovery
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RotateCcw,
  Save,
  Trash2,
  History,
  ArrowLeft,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlowriterStep, ArticleData, FlowriterState } from '@/types/blog-ai';

// ============================================================================
// TYPES
// ============================================================================

export type ResetType =
  | 'full'           // Complete reset - start fresh
  | 'keep_topic'     // Reset but keep topic/title
  | 'go_to_step'     // Go back to a specific step
  | 'save_and_reset' // Save as draft then reset
  | 'cancel';        // Cancel the reset

export interface ResetOption {
  type: ResetType;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: boolean;
}

export interface ResetWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FlowriterState;
  onReset: (type: ResetType, targetStep?: FlowriterStep) => void;
  onSaveDraft?: () => Promise<void>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate how much work would be lost on reset
 */
function calculateWorkLoss(state: FlowriterState): {
  level: 'none' | 'low' | 'medium' | 'high';
  description: string;
  hasContent: boolean;
  hasOutline: boolean;
  hasGeneratedContent: boolean;
} {
  const { articleData, currentStep } = state;

  const hasContent = (articleData.content?.length || 0) > 100;
  const hasOutline = articleData.outline.length > 0;
  const hasTopic = articleData.topic.length > 0;
  const hasTitle = articleData.title.length > 0;
  const hasGeneratedContent = currentStep >= FlowriterStep.CANVAS && hasContent;

  // Calculate loss level
  let level: 'none' | 'low' | 'medium' | 'high' = 'none';
  let description = '';

  if (hasGeneratedContent) {
    level = 'high';
    const wordCount = articleData.content?.split(/\s+/).filter(Boolean).length || 0;
    description = `Article de ${wordCount} mots généré`;
  } else if (hasOutline) {
    level = 'medium';
    description = `Structure de ${articleData.outline.length} sections`;
  } else if (hasTopic || hasTitle) {
    level = 'low';
    description = 'Sujet et titre définis';
  } else {
    description = 'Aucun contenu à perdre';
  }

  return {
    level,
    description,
    hasContent,
    hasOutline,
    hasGeneratedContent,
  };
}

/**
 * Get available reset options based on current state
 */
function getResetOptions(
  state: FlowriterState,
  workLoss: ReturnType<typeof calculateWorkLoss>
): ResetOption[] {
  const options: ResetOption[] = [];
  const { currentStep, articleData } = state;

  // Option 1: Save as draft then reset (if there's content to save)
  if (workLoss.hasGeneratedContent) {
    options.push({
      type: 'save_and_reset',
      label: 'Sauvegarder et recommencer',
      description: 'Enregistre l\'article actuel comme brouillon avant de recommencer',
      icon: <Save className="w-5 h-5" />,
      variant: 'default',
    });
  }

  // Option 2: Keep topic/title and config (if past CONFIG step)
  if (articleData.topic && articleData.title && currentStep > FlowriterStep.CONFIG) {
    options.push({
      type: 'keep_topic',
      label: 'Garder sujet + style',
      description: `Retour à l'étape Structure avec "${articleData.title.slice(0, 25)}..."`,
      icon: <History className="w-5 h-5" />,
      variant: 'secondary',
    });
  }

  // Option 3: Go back to generation (if past generation)
  if (currentStep > FlowriterStep.GENERATION && workLoss.hasOutline) {
    options.push({
      type: 'go_to_step',
      label: 'Régénérer l\'article',
      description: 'Garde la structure et relance la génération IA',
      icon: <Sparkles className="w-5 h-5" />,
      variant: 'outline',
    });
  }

  // Option 4: Full reset (always available)
  options.push({
    type: 'full',
    label: 'Tout recommencer',
    description: 'Efface tout et repart de zéro',
    icon: <Trash2 className="w-5 h-5" />,
    variant: workLoss.level === 'high' ? 'destructive' : 'outline',
  });

  return options;
}

// ============================================================================
// STEP SELECTOR
// ============================================================================

interface StepSelectorProps {
  currentStep: FlowriterStep;
  onSelectStep: (step: FlowriterStep) => void;
}

function StepSelector({ currentStep, onSelectStep }: StepSelectorProps) {
  // Order matches new workflow: Topic → Config → Outline → Generation
  const steps = [
    { id: FlowriterStep.TOPIC, label: 'Sujet', icon: <FileText className="w-4 h-4" /> },
    { id: FlowriterStep.CONFIG, label: 'Style', icon: <FileText className="w-4 h-4" /> },
    { id: FlowriterStep.OUTLINE, label: 'Structure', icon: <FileText className="w-4 h-4" /> },
    { id: FlowriterStep.GENERATION, label: 'Génération', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {steps.map((step) => {
        const isDisabled = step.id >= currentStep;
        return (
          <button
            key={step.id}
            onClick={() => !isDisabled && onSelectStep(step.id)}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
              isDisabled
                ? "opacity-50 cursor-not-allowed bg-muted/30"
                : "hover:bg-muted/50 hover:border-primary/50 cursor-pointer"
            )}
          >
            {step.icon}
            <span className="text-sm font-medium">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResetWorkflowDialog({
  open,
  onOpenChange,
  state,
  onReset,
  onSaveDraft,
}: ResetWorkflowDialogProps) {
  const [selectedOption, setSelectedOption] = useState<ResetType | null>(null);
  const [targetStep, setTargetStep] = useState<FlowriterStep | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const workLoss = useMemo(() => calculateWorkLoss(state), [state]);
  const options = useMemo(() => getResetOptions(state, workLoss), [state, workLoss]);

  const handleOptionSelect = (type: ResetType) => {
    setSelectedOption(type);

    if (type === 'go_to_step') {
      // Show step selector
      return;
    }

    // For destructive actions with high work loss, show confirmation
    if (type === 'full' && workLoss.level === 'high') {
      setShowConfirmation(true);
      return;
    }

    // Execute the reset
    handleExecuteReset(type);
  };

  const handleExecuteReset = async (type: ResetType, step?: FlowriterStep) => {
    setIsProcessing(true);

    try {
      if (type === 'save_and_reset' && onSaveDraft) {
        await onSaveDraft();
      }

      onReset(type, step || targetStep || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
      setTargetStep(null);
    }
  };

  const handleStepSelect = (step: FlowriterStep) => {
    setTargetStep(step);
    handleExecuteReset('go_to_step', step);
  };

  // Work loss indicator color
  const lossColor = {
    none: 'text-muted-foreground',
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-destructive',
  }[workLoss.level];

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Recommencer le workflow
            </DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez recommencer.
            </DialogDescription>
          </DialogHeader>

          {/* Work loss indicator */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            workLoss.level === 'high' ? "bg-destructive/5 border-destructive/20" : "bg-muted/30"
          )}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", lossColor)}>
              {workLoss.level === 'none' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", lossColor)}>
                {workLoss.level === 'none'
                  ? 'Aucune perte'
                  : workLoss.level === 'low'
                    ? 'Perte mineure'
                    : workLoss.level === 'medium'
                      ? 'Perte modérée'
                      : 'Perte importante'
                }
              </p>
              <p className="text-xs text-muted-foreground">{workLoss.description}</p>
            </div>
          </div>

          {/* Reset options */}
          <div className="space-y-2 mt-2">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => handleOptionSelect(option.type)}
                disabled={option.disabled || isProcessing}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-lg border transition-all text-left",
                  option.variant === 'destructive'
                    ? "hover:bg-destructive/5 hover:border-destructive/50"
                    : "hover:bg-muted/50 hover:border-primary/50",
                  (option.disabled || isProcessing) && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  option.variant === 'destructive'
                    ? "bg-destructive/10 text-destructive"
                    : option.variant === 'default'
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Step selector for "go to step" option */}
          {selectedOption === 'go_to_step' && (
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-2">Revenir à quelle étape ?</p>
              <StepSelector
                currentStep={state.currentStep}
                onSelectStep={handleStepSelect}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for high-loss resets */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Êtes-vous sûr ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de perdre un article de{' '}
              <strong>{state.articleData.content?.split(/\s+/).filter(Boolean).length || 0} mots</strong>.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmation(false);
              setSelectedOption(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmation(false);
                handleExecuteReset('full');
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui, tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// HOOK FOR EASY INTEGRATION
// ============================================================================

export function useResetWorkflow() {
  const [isOpen, setIsOpen] = useState(false);

  const openResetDialog = () => setIsOpen(true);
  const closeResetDialog = () => setIsOpen(false);

  return {
    isOpen,
    setIsOpen,
    openResetDialog,
    closeResetDialog,
  };
}

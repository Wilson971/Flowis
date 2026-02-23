'use client';

/**
 * WorkflowCompletionDialog Component
 *
 * Post-publication lifecycle management:
 * - Success celebration
 * - Start new article options (fresh, keep config, keep topic)
 * - Track completed article
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Sparkles,
  Copy,
  FileText,
  Settings,
  ArrowRight,
  ExternalLink,
  Rocket,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArticleConfig } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

export type CompletionAction =
  | 'published'
  | 'saved_draft'
  | 'scheduled';

export type NewArticleOption =
  | 'fresh'           // Complete reset - start from scratch
  | 'keep_config'     // Keep tone, style, audience settings
  | 'keep_topic'      // Keep topic for content series
  | 'view_article'    // Just close and view the article
  | 'edit_article';   // Navigate to Editor for further editing

export interface CompletedArticle {
  id: string;
  title: string;
  topic: string;
  wordCount: number;
  action: CompletionAction;
  timestamp: Date;
  config: ArticleConfig;
}

export interface WorkflowCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedArticle: CompletedArticle | null;
  onStartNew: (option: NewArticleOption, preservedData?: Partial<{
    config: ArticleConfig;
    topic: string;
    title: string;
  }>) => void;
  onViewArticle?: (articleId: string) => void;
  /** Navigate to the article editor for further editing */
  onEditArticle?: (articleId: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getActionMessage(action: CompletionAction): {
  title: string;
  description: string;
  icon: React.ReactNode;
} {
  switch (action) {
    case 'published':
      return {
        title: 'Article Publié !',
        description: 'Votre article est maintenant en ligne et visible par vos lecteurs.',
        icon: <Rocket className="w-8 h-8" />,
      };
    case 'saved_draft':
      return {
        title: 'Brouillon Sauvegardé',
        description: 'Votre article a été enregistré. Vous pourrez le reprendre plus tard.',
        icon: <FileText className="w-8 h-8" />,
      };
    case 'scheduled':
      return {
        title: 'Publication Planifiée',
        description: 'Votre article sera publié automatiquement à la date prévue.',
        icon: <CheckCircle className="w-8 h-8" />,
      };
  }
}

// ============================================================================
// NEW ARTICLE OPTIONS
// ============================================================================

interface NewArticleOptionCardProps {
  option: NewArticleOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function NewArticleOptionCard({
  option,
  label,
  description,
  icon,
  recommended,
  disabled,
  onClick,
}: NewArticleOptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full flex items-start gap-4 p-6 rounded-2xl border transition-all text-left",
        recommended
          ? "bg-primary/5 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          : "bg-surface-1 border-border hover:bg-muted/50 hover:border-primary/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {recommended && (
        <span className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider rounded-full">
          Recommandé
        </span>
      )}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        recommended
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className={cn(
        "w-5 h-5 mt-3 shrink-0 transition-transform",
        recommended ? "text-primary" : "text-muted-foreground"
      )} />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WorkflowCompletionDialog({
  open,
  onOpenChange,
  completedArticle,
  onStartNew,
  onViewArticle,
  onEditArticle,
}: WorkflowCompletionDialogProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!completedArticle) return null;

  const actionInfo = getActionMessage(completedArticle.action);

  const handleStartNew = async (option: NewArticleOption) => {
    setIsTransitioning(true);

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));

    let preservedData: Partial<{ config: ArticleConfig; topic: string; title: string }> | undefined;

    if (option === 'keep_config') {
      preservedData = { config: completedArticle.config };
    } else if (option === 'keep_topic') {
      preservedData = {
        config: completedArticle.config,
        topic: completedArticle.topic,
      };
    }

    onStartNew(option, preservedData);
    setIsTransitioning(false);
    onOpenChange(false);
  };

  const handleViewArticle = () => {
    onViewArticle?.(completedArticle.id);
    onOpenChange(false);
  };

  const handleEditArticle = () => {
    onEditArticle?.(completedArticle.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isTransitioning ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Success Header */}
              <div className="relative bg-gradient-to-b from-primary/10 to-transparent p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4"
                >
                  {actionInfo.icon}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <DialogTitle className="text-2xl font-black text-foreground mb-2">
                    {actionInfo.title}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {actionInfo.description}
                  </DialogDescription>
                </motion.div>

                {/* Article Summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-background/80 backdrop-blur rounded-xl border border-border"
                >
                  <p className="font-bold text-foreground truncate" title={completedArticle.title}>
                    {completedArticle.title}
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{completedArticle.wordCount.toLocaleString()} mots</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span>{new Date(completedArticle.timestamp).toLocaleDateString('fr-FR')}</span>
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <div className="p-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Que souhaitez-vous faire ?
                </p>

                {/* Edit Article - Primary action after creation */}
                {onEditArticle && (
                  <NewArticleOptionCard
                    option="edit_article"
                    label="Éditer l'article"
                    description="Ouvrir dans l'éditeur complet pour peaufiner"
                    icon={<Pencil className="w-5 h-5" />}
                    recommended
                    onClick={handleEditArticle}
                  />
                )}

                <NewArticleOptionCard
                  option="fresh"
                  label="Nouvel article"
                  description="Repartir de zéro avec un nouveau sujet"
                  icon={<Sparkles className="w-5 h-5" />}
                  recommended={!onEditArticle}
                  onClick={() => handleStartNew('fresh')}
                />

                <NewArticleOptionCard
                  option="keep_config"
                  label="Garder mes paramètres"
                  description="Nouveau sujet avec le même ton et style"
                  icon={<Settings className="w-5 h-5" />}
                  onClick={() => handleStartNew('keep_config')}
                />

                <NewArticleOptionCard
                  option="keep_topic"
                  label="Série d'articles"
                  description="Continuer sur le même sujet (série)"
                  icon={<Copy className="w-5 h-5" />}
                  onClick={() => handleStartNew('keep_topic')}
                />

                {completedArticle.action === 'published' && onViewArticle && (
                  <div className="pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2"
                      onClick={handleViewArticle}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir l'article publié
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center gap-4"
            >
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Préparation du nouveau workflow...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HOOK FOR WORKFLOW COMPLETION
// ============================================================================

export function useWorkflowCompletion() {
  const [isOpen, setIsOpen] = useState(false);
  const [completedArticle, setCompletedArticle] = useState<CompletedArticle | null>(null);

  const completeWorkflow = (article: CompletedArticle) => {
    setCompletedArticle(article);
    setIsOpen(true);
  };

  const resetCompletion = () => {
    setCompletedArticle(null);
    setIsOpen(false);
  };

  return {
    isOpen,
    setIsOpen,
    completedArticle,
    completeWorkflow,
    resetCompletion,
  };
}

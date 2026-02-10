'use client';

/**
 * FlowriterAssistant Component
 *
 * Main AI-powered article generation wizard
 * Refactored to match "Modernized Flowwriter AI Subject Input" design
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, X, Check, Bell, Sparkles, RotateCcw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowriterState, useBlogAI, useCreateBlogArticle, useFlowriterSync } from '@/hooks/blog';
import { FlowriterStep } from '@/types/blog-ai';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Steps
import { TopicStep } from './steps/TopicStep';
import { OutlineStep } from './steps/OutlineStep';
import { ConfigStep } from './steps/ConfigStep';
import { GenerationStep } from './steps/GenerationStep';
import { CanvasStep } from './steps/CanvasStep';
import { FinalizeStep } from './steps/FinalizeStep';

// Dialogs
import { ResetWorkflowDialog, useResetWorkflow, ResetType } from './ResetWorkflowDialog';
import {
  WorkflowCompletionDialog,
  useWorkflowCompletion,
  CompletedArticle,
  CompletionAction,
  NewArticleOption,
} from './WorkflowCompletionDialog';
import { DraftRestorationDialog } from './DraftRestorationDialog';

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

// Step order: Topic → Config → Outline → Generation
// Config BEFORE Outline so structure adapts to word count/style!
const STEPS = [
  { id: FlowriterStep.TOPIC, label: 'Sujet', description: 'De quoi parler ?' },
  { id: FlowriterStep.CONFIG, label: 'Style', description: 'Ton & Longueur' },
  { id: FlowriterStep.OUTLINE, label: 'Structure', description: 'Plan adapté' },
  { id: FlowriterStep.GENERATION, label: 'Génération', description: 'Magie IA' },
  { id: FlowriterStep.CANVAS, label: 'Édition', description: 'Peaufiner' },
  { id: FlowriterStep.FINALIZE, label: 'Publication', description: 'Prêt !' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface StepIndicatorProps {
  currentStep: FlowriterStep;
  steps: typeof STEPS;
}

interface StepIndicatorProps {
  currentStep: FlowriterStep;
  steps: typeof STEPS;
}

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full px-6 py-5 border-b border-border/60">
      <div className="relative flex items-center justify-between max-w-3xl mx-auto">
        {/* Connection Line */}
        <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-[1px] bg-border -z-0"></div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2.5 relative z-10 group">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                  isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/10"
                    : isCompleted
                      ? "bg-primary text-primary-foreground ring-4 ring-background"
                      : "bg-background text-muted-foreground ring-4 ring-background border border-border"
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FLOWRITER ASSISTANT
// ============================================================================

interface FlowriterAssistantProps {
  storeId: string;
  tenantId: string;
  onClose?: () => void;
  onCancel?: () => void;
  onComplete?: (articleId: string) => void;
}

export function FlowriterAssistant({ storeId, tenantId, onClose, onCancel, onComplete }: FlowriterAssistantProps) {
  const router = useRouter();

  // Core state (v3.0: no localStorage, only backend sync)
  const { state, actions } = useFlowriterState();
  const blogAI = useBlogAI();
  const createArticleMutation = useCreateBlogArticle();
  const { isOpen: isResetOpen, setIsOpen: setResetOpen } = useResetWorkflow();
  const {
    isOpen: isCompletionOpen,
    setIsOpen: setCompletionOpen,
    completedArticle,
    completeWorkflow,
    resetCompletion,
  } = useWorkflowCompletion();

  // Backend sync for auto-drafts (v3.0: single source of truth)
  const backendSync = useFlowriterSync({
    storeId,
    tenantId,
    enabled: true, // Always enabled, hook handles loading state
  });

  // Track previous state for detecting changes
  const prevStateRef = useRef(state);

  // Track if component has initialized (for hydration)
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // ============================================================================
  // AUTO-SAVE TO BACKEND
  // ============================================================================

  // Sync state changes to backend (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    // Don't auto-save if we are currently saving/publishing
    if (createArticleMutation.isPending) return;

    // Don't auto-save if draft prompt is showing (user hasn't decided yet)
    if (backendSync.showDraftPrompt) return;

    // Skip if state hasn't meaningfully changed
    const hasChanged =
      state.currentStep !== prevStateRef.current.currentStep ||
      state.articleData.topic !== prevStateRef.current.articleData.topic ||
      state.articleData.title !== prevStateRef.current.articleData.title ||
      state.articleData.content !== prevStateRef.current.articleData.content ||
      state.articleData.outline.length !== prevStateRef.current.articleData.outline.length;

    if (hasChanged) {
      // Step changes trigger immediate save, content changes are debounced
      if (state.currentStep !== prevStateRef.current.currentStep) {
        backendSync.saveImmediately(state);
      } else {
        backendSync.saveState(state);
      }
    }

    prevStateRef.current = state;
  }, [state, isInitialized, backendSync, createArticleMutation.isPending]);

  const { currentStep, articleData, isLoading, canProceed, error } = state;

  // Navigation handlers
  const canGoBack = currentStep > FlowriterStep.TOPIC && !isLoading;
  const canGoForward = canProceed && currentStep < FlowriterStep.FINALIZE && !isLoading;

  // Workflow completion handler - called after publish/save/schedule
  const handleWorkflowComplete = useCallback((action: CompletionAction, articleId: string) => {
    const summary = actions.getArticleSummary();
    const completed: CompletedArticle = {
      id: articleId,
      title: summary.title,
      topic: summary.topic,
      wordCount: summary.wordCount,
      action,
      timestamp: new Date(),
      config: summary.config,
    };

    // Notify parent
    onComplete?.(articleId);

    // Show completion dialog
    completeWorkflow(completed);
  }, [actions, onComplete, completeWorkflow]);

  // Start new article handler - called from completion dialog
  const handleStartNewArticle = useCallback((
    option: NewArticleOption,
    preservedData?: Partial<{
      config: typeof articleData.config;
      topic: string;
      title: string;
    }>
  ) => {
    if (option === 'view_article') {
      // Just close, parent should handle navigation
      return;
    }

    // Start new with appropriate preserved data
    actions.startNewWithConfig(preservedData);
  }, [actions]);

  // Reset handler - intelligently handles different reset types
  const handleReset = useCallback((type: ResetType, targetStep?: FlowriterStep) => {
    switch (type) {
      case 'full':
        backendSync.discardAutoDraft(); // Also delete backend draft
        actions.reset();
        break;
      case 'keep_topic':
        actions.resetKeepTopic();
        break;
      case 'go_to_step':
        if (targetStep !== undefined) {
          actions.resetToStep(targetStep);
        }
        break;
      case 'save_and_reset':
        // Save as draft then reset
        handleWorkflowComplete('saved_draft', `draft-${Date.now()}`);
        break;
      case 'cancel':
        // Do nothing, dialog will close
        break;
    }
  }, [actions, handleWorkflowComplete, backendSync]);

  // Check if reset button should be shown (has some progress)
  const showResetButton = currentStep > FlowriterStep.TOPIC || articleData.topic.length > 0;

  // Draft restoration handlers (v3.0: backend-only)
  const handleRestoreDraft = useCallback(() => {
    const restoredState = backendSync.restoreDraft();
    if (restoredState) {
      // Reset local state first
      actions.reset();

      // Hydrate with backend state using actions
      if (restoredState.articleData.topic) {
        actions.setTopic(restoredState.articleData.topic);
      }
      if (restoredState.articleData.titleSuggestions?.length > 0) {
        actions.setTitleSuggestions(restoredState.articleData.titleSuggestions);
      }
      if (restoredState.articleData.title) {
        actions.selectTitle(restoredState.articleData.title);
      }
      if (restoredState.articleData.outline?.length > 0) {
        actions.setOutline(restoredState.articleData.outline);
      }
      if (restoredState.articleData.config) {
        actions.updateConfig(restoredState.articleData.config);
      }
      if (restoredState.articleData.content) {
        actions.setContent(restoredState.articleData.content);
      }
      if (restoredState.articleData.metaTitle || restoredState.articleData.metaDescription) {
        actions.setMeta(restoredState.articleData.metaTitle, restoredState.articleData.metaDescription);
      }
      // Navigate to saved step
      actions.goToStep(restoredState.currentStep);
    }
  }, [backendSync, actions]);

  const handleDiscardDraft = useCallback(() => {
    // Delete backend draft (also dismisses the prompt)
    backendSync.discardAutoDraft();
    // Reset local state
    actions.reset();
  }, [backendSync, actions]);

  const handleNext = useCallback(() => {
    if (canGoForward) actions.nextStep();
  }, [canGoForward, actions]);

  const handleBack = useCallback(() => {
    if (canGoBack) actions.prevStep();
  }, [canGoBack, actions]);

  // Current step component rendering
  const CurrentStepComponent = useMemo(() => {
    switch (currentStep) {
      case FlowriterStep.TOPIC:
        return (
          <TopicStep
            topic={articleData.topic}
            titleSuggestions={articleData.titleSuggestions}
            selectedTitle={articleData.title}
            selectedKeywords={articleData.selectedKeywords}
            onTopicChange={actions.setTopic}
            onGenerateTitles={async (topic) => {
              actions.setLoading(true);
              try {
                const suggestions = await blogAI.generateTitles.mutateAsync({ topic });
                actions.setTitleSuggestions(suggestions);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            onSelectTitle={actions.selectTitle}
            onToggleKeyword={actions.toggleKeyword}
            isLoading={blogAI.generateTitles.isPending}
          />
        );

      // CONFIG comes BEFORE OUTLINE now - so structure adapts to style/length
      case FlowriterStep.CONFIG:
        return (
          <ConfigStep
            config={articleData.config}
            keywords={articleData.selectedKeywords}
            onUpdateConfig={actions.updateConfig}
            onToggleKeyword={actions.toggleKeyword}
          />
        );

      // OUTLINE is generated AFTER config - uses word count, style, tone
      case FlowriterStep.OUTLINE:
        return (
          <OutlineStep
            outline={articleData.outline}
            title={articleData.title}
            topic={articleData.topic}
            keywords={articleData.selectedKeywords}
            onGenerateOutline={async () => {
              actions.setLoading(true);
              try {
                // Pass config to generate intelligent structure
                const outline = await blogAI.generateOutline.mutateAsync({
                  topic: articleData.topic,
                  title: articleData.title,
                  keywords: articleData.selectedKeywords,
                  config: {
                    targetWordCount: articleData.config.targetWordCount,
                    tone: articleData.config.tone,
                    style: articleData.config.style,
                    persona: articleData.config.persona,
                    includeTableOfContents: articleData.config.includeTableOfContents,
                    includeFAQ: articleData.config.includeFAQ,
                  },
                });
                actions.setOutline(outline);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            onUpdateOutline={actions.setOutline}
            onAddItem={actions.addOutlineItem}
            onRemoveItem={actions.removeOutlineItem}
            onReorder={actions.reorderOutline}
            isLoading={blogAI.generateOutline.isPending}
          />
        );

      case FlowriterStep.GENERATION:
        return (
          <GenerationStep
            articleData={articleData}
            progress={state.generationProgress}
            onStartGeneration={async () => {
              actions.startGeneration();
              try {
                await blogAI.generateArticle.mutateAsync({
                  request: {
                    topic: articleData.topic,
                    title: articleData.title,
                    outline: articleData.outline,
                    config: articleData.config,
                  },
                  callbacks: {
                    onProgress: (phase, section, title) => {
                      actions.updateProgress({
                        phase: phase as any,
                        currentSection: section,
                        currentSectionTitle: title,
                      });
                    },
                    onChunk: actions.appendContent,
                    onComplete: actions.completeGeneration,
                    onError: actions.setGenerationError,
                  },
                });
              } catch (e) {
                actions.setGenerationError((e as Error).message);
              }
            }}
            isLoading={blogAI.generateArticle.isPending}
          />
        );

      case FlowriterStep.CANVAS:
        return (
          <CanvasStep
            content={articleData.content}
            metaTitle={articleData.metaTitle}
            metaDescription={articleData.metaDescription}
            onContentChange={actions.setContent}
            onMetaChange={actions.setMeta}
            onRewrite={async (text, action) => await blogAI.rewriteText.mutateAsync({ text, action })}
            isRewriting={blogAI.rewriteText.isPending}
          />
        );

      case FlowriterStep.FINALIZE:
        return (
          <FinalizeStep
            articleData={articleData}
            seoAnalysis={state.seoAnalysis}
            onAnalyzeSeo={async () => {
              try {
                const analysis = await blogAI.analyzeSeo.mutateAsync({
                  content: articleData.content,
                  keywords: articleData.selectedKeywords,
                });
                actions.setSeoAnalysis(analysis);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            onSaveDraft={async () => {
              try {
                const wordCount = articleData.content.split(/\s+/).filter(Boolean).length;
                const savedArticle = await createArticleMutation.mutateAsync({
                  tenant_id: tenantId,
                  store_id: storeId,
                  title: articleData.title,
                  status: 'draft',
                  content: articleData.content,
                  ai_generated: true,
                  word_count: wordCount,
                  // Track that this article was created from FloWriter
                  source: 'flowriter',
                  generation_config: {
                    topic: articleData.topic,
                    style: articleData.config.style,
                    tone: articleData.config.tone,
                    persona: articleData.config.persona,
                    targetWordCount: articleData.config.targetWordCount,
                    seo_title: articleData.metaTitle,
                    seo_description: articleData.metaDescription,
                    seo_keywords: articleData.selectedKeywords,
                  },
                });
                // Clean up auto-draft now that we've saved a real version
                await backendSync.discardAutoDraft();
                handleWorkflowComplete('saved_draft', savedArticle.id);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            onSchedule={async (date: Date) => {
              try {
                const wordCount = articleData.content.split(/\s+/).filter(Boolean).length;
                const savedArticle = await createArticleMutation.mutateAsync({
                  tenant_id: tenantId,
                  store_id: storeId,
                  title: articleData.title,
                  status: 'scheduled',
                  content: articleData.content,
                  ai_generated: true,
                  word_count: wordCount,
                  source: 'flowriter',
                  generation_config: {
                    topic: articleData.topic,
                    scheduledDate: date.toISOString(),
                  },
                });
                // Clean up auto-draft now that we've scheduled a real version
                await backendSync.discardAutoDraft();
                handleWorkflowComplete('scheduled', savedArticle.id);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            onPublish={async () => {
              try {
                const wordCount = articleData.content.split(/\s+/).filter(Boolean).length;
                const savedArticle = await createArticleMutation.mutateAsync({
                  tenant_id: tenantId,
                  store_id: storeId,
                  title: articleData.title,
                  status: 'published',
                  content: articleData.content,
                  ai_generated: true,
                  word_count: wordCount,
                  source: 'flowriter',
                  generation_config: {
                    topic: articleData.topic,
                    style: articleData.config.style,
                    tone: articleData.config.tone,
                    persona: articleData.config.persona,
                  },
                });
                // Clean up auto-draft now that we've published a real version
                await backendSync.discardAutoDraft();
                handleWorkflowComplete('published', savedArticle.id);
              } catch (e) {
                actions.setError((e as Error).message);
              }
            }}
            isAnalyzing={blogAI.analyzeSeo.isPending}
            isSaving={createArticleMutation.isPending}
            isPublishing={createArticleMutation.isPending}
          />
        );

      default:
        return null;
    }
  }, [currentStep, articleData, state.generationProgress, state.seoAnalysis, actions, blogAI, handleWorkflowComplete]);

  return (
    <div className="text-foreground h-full flex flex-col font-sans selection:bg-primary/20 selection:text-primary overflow-hidden bg-background rounded-[2.5rem] border border-border">

      {/* Main Content */}
      <main className="flex-1 w-full relative h-full flex flex-col overflow-hidden">

        {/* Step Indicator */}
        <div className="bg-background sticky top-0 z-20">
          <StepIndicator currentStep={currentStep} steps={STEPS} />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-8 md:px-20 py-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {CurrentStepComponent}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-12 py-5 bg-background flex items-center justify-between mt-auto border-t border-border/50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Phase {currentStep} / {STEPS.length}
              </div>

              {/* Sync Status Indicator */}
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[10px] transition-all duration-300",
                  backendSync.isSyncing ? "text-primary" : backendSync.syncError ? "text-destructive" : "text-muted-foreground/40"
                )}
                title={backendSync.syncError || (backendSync.lastSyncTime ? `Dernière sync: ${backendSync.lastSyncTime.toLocaleTimeString('fr-FR')}` : 'Synchronisation automatique')}
              >
                {backendSync.isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : backendSync.syncError ? (
                  <CloudOff className="w-3 h-3" />
                ) : (
                  <Cloud className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">
                  {backendSync.isSyncing ? 'Sync...' : backendSync.syncError ? 'Erreur' : 'Auto-save'}
                </span>
              </div>
            </div>

            <button
              onClick={handleBack}
              disabled={!canGoBack}
              className={cn(
                "h-10 px-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-xs font-bold flex items-center gap-2",
                !canGoBack && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Reset Button */}
            {showResetButton && (
              <button
                onClick={() => setResetOpen(true)}
                disabled={isLoading}
                className={cn(
                  "h-10 px-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-xs font-medium flex items-center gap-2",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                title="Recommencer le workflow"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Recommencer</span>
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canGoForward}
              className={cn(
                "h-12 px-8 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
                canGoForward
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              {currentStep === FlowriterStep.FINALIZE ? 'Complete Generation' : 'Next Step'}
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-destructive text-destructive-foreground rounded-lg max-w-sm flex items-center gap-3"
          >
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => actions.setError(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>

      {/* Reset Workflow Dialog */}
      <ResetWorkflowDialog
        open={isResetOpen}
        onOpenChange={setResetOpen}
        state={state}
        onReset={handleReset}
        onSaveDraft={async () => {
          handleWorkflowComplete('saved_draft', `draft-${Date.now()}`);
        }}
      />

      {/* Workflow Completion Dialog */}
      <WorkflowCompletionDialog
        open={isCompletionOpen}
        onOpenChange={setCompletionOpen}
        completedArticle={completedArticle}
        onStartNew={handleStartNewArticle}
        onViewArticle={(articleId) => {
          // Close completion dialog and notify parent
          setCompletionOpen(false);
          // Parent can handle navigation to the article
        }}
        onEditArticle={(articleId) => {
          // Navigate to the article editor for further editing
          setCompletionOpen(false);
          router.push(`/app/blog/editor/${articleId}`);
        }}
      />

      {/* Draft Restoration Dialog */}
      <DraftRestorationDialog
        open={backendSync.showDraftPrompt}
        onOpenChange={(open) => !open && backendSync.dismissDraftPrompt()}
        draftInfo={backendSync.draftInfo}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
}


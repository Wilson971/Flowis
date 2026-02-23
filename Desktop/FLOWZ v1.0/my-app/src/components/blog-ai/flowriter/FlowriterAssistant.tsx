'use client';

/**
 * FlowriterAssistant Component
 *
 * Main AI-powered article generation wizard (orchestrator).
 * Sub-components split into this directory for maintainability.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FlowriterStep } from '@/types/blog-ai';

// Steps
import { TopicStep } from '../steps/TopicStep';
import { OutlineStep } from '../steps/OutlineStep';
import { ConfigStep } from '../steps/ConfigStep';
import { GenerationStep } from '../steps/GenerationStep';
import { CanvasStep } from '../steps/CanvasStep';
import { FinalizeStep } from '../steps/FinalizeStep';

// Dialogs
import { ResetWorkflowDialog } from '../ResetWorkflowDialog';
import { WorkflowCompletionDialog } from '../WorkflowCompletionDialog';
import { DraftRestorationDialog } from '../DraftRestorationDialog';

// Local sub-components & hook
import { StepIndicator } from './StepIndicator';
import { Footer } from './Footer';
import { useFlowriterNavigation } from './useFlowriterNavigation';
import { STEPS } from './types';
import type { FlowriterAssistantProps } from './types';

export function FlowriterAssistant({ storeId, tenantId, onClose, onCancel, onComplete }: FlowriterAssistantProps) {
  const nav = useFlowriterNavigation({ storeId, tenantId, onComplete });

  const {
    state,
    actions,
    blogAI,
    createArticleMutation,
    backendSync,
    currentStep,
    articleData,
    isLoading,
    error,
    canGoBack,
    canGoForward,
    showResetButton,
    isResetOpen,
    setResetOpen,
    isCompletionOpen,
    setCompletionOpen,
    completedArticle,
    handleNext,
    handleBack,
    handleReset,
    handleWorkflowComplete,
    handleStartNewArticle,
    handleRestoreDraft,
    handleDiscardDraft,
    router,
  } = nav;

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

      case FlowriterStep.CONFIG:
        return (
          <ConfigStep
            config={articleData.config}
            keywords={articleData.selectedKeywords}
            onUpdateConfig={actions.updateConfig}
            onToggleKeyword={actions.toggleKeyword}
          />
        );

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
  }, [currentStep, articleData, state.generationProgress, state.seoAnalysis, actions, blogAI, handleWorkflowComplete, createArticleMutation, tenantId, storeId, backendSync]);

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
        <Footer
          currentStep={currentStep}
          totalSteps={STEPS.length}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          isLoading={isLoading}
          showResetButton={showResetButton}
          isSyncing={backendSync.isSyncing}
          syncError={backendSync.syncError}
          lastSyncTime={backendSync.lastSyncTime}
          onBack={handleBack}
          onNext={handleNext}
          onResetOpen={() => setResetOpen(true)}
        />

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
          setCompletionOpen(false);
        }}
        onEditArticle={(articleId) => {
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

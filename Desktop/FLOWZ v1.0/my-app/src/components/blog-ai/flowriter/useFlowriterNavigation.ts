'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlowriterStep } from '@/types/blog-ai';
import { useFlowriterState, useBlogAI, useCreateBlogArticle, useFlowriterSync } from '@/hooks/blog';
import { useResetWorkflow, ResetType } from '../ResetWorkflowDialog';
import {
  useWorkflowCompletion,
  CompletedArticle,
  CompletionAction,
  NewArticleOption,
} from '../WorkflowCompletionDialog';
import { STEPS } from './types';

interface UseFlowriterNavigationParams {
  storeId: string;
  tenantId: string;
  onComplete?: (articleId: string) => void;
}

export function useFlowriterNavigation({ storeId, tenantId, onComplete }: UseFlowriterNavigationParams) {
  const router = useRouter();

  // Core state
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

  // Backend sync
  const backendSync = useFlowriterSync({
    storeId,
    tenantId,
    enabled: true,
  });

  // Track previous state for detecting changes
  const prevStateRef = useRef(state);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // ============================================================================
  // AUTO-SAVE TO BACKEND
  // ============================================================================

  useEffect(() => {
    if (!isInitialized) return;
    if (createArticleMutation.isPending) return;
    if (backendSync.showDraftPrompt) return;

    const hasChanged =
      state.currentStep !== prevStateRef.current.currentStep ||
      state.articleData.topic !== prevStateRef.current.articleData.topic ||
      state.articleData.title !== prevStateRef.current.articleData.title ||
      state.articleData.content !== prevStateRef.current.articleData.content ||
      state.articleData.outline.length !== prevStateRef.current.articleData.outline.length;

    if (hasChanged) {
      if (state.currentStep !== prevStateRef.current.currentStep) {
        backendSync.saveImmediately(state);
      } else {
        backendSync.saveState(state);
      }
    }

    prevStateRef.current = state;
  }, [state, isInitialized, backendSync, createArticleMutation.isPending]);

  const { currentStep, articleData, isLoading, canProceed, error } = state;

  // Navigation
  const canGoBack = currentStep > FlowriterStep.TOPIC && !isLoading;
  const canGoForward = canProceed && currentStep < FlowriterStep.FINALIZE && !isLoading;

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
    onComplete?.(articleId);
    completeWorkflow(completed);
  }, [actions, onComplete, completeWorkflow]);

  const handleStartNewArticle = useCallback((
    option: NewArticleOption,
    preservedData?: Partial<{
      config: typeof articleData.config;
      topic: string;
      title: string;
    }>
  ) => {
    if (option === 'view_article') return;
    actions.startNewWithConfig(preservedData);
  }, [actions]);

  const handleReset = useCallback((type: ResetType, targetStep?: FlowriterStep) => {
    switch (type) {
      case 'full':
        backendSync.discardAutoDraft();
        actions.reset();
        break;
      case 'keep_topic':
        actions.resetKeepTopic();
        break;
      case 'go_to_step':
        if (targetStep !== undefined) actions.resetToStep(targetStep);
        break;
      case 'save_and_reset':
        handleWorkflowComplete('saved_draft', `draft-${Date.now()}`);
        break;
      case 'cancel':
        break;
    }
  }, [actions, handleWorkflowComplete, backendSync]);

  const showResetButton = currentStep > FlowriterStep.TOPIC || articleData.topic.length > 0;

  const handleRestoreDraft = useCallback(() => {
    const restoredState = backendSync.restoreDraft();
    if (restoredState) {
      actions.reset();
      if (restoredState.articleData.topic) actions.setTopic(restoredState.articleData.topic);
      if (restoredState.articleData.titleSuggestions?.length > 0) actions.setTitleSuggestions(restoredState.articleData.titleSuggestions);
      if (restoredState.articleData.title) actions.selectTitle(restoredState.articleData.title);
      if (restoredState.articleData.outline?.length > 0) actions.setOutline(restoredState.articleData.outline);
      if (restoredState.articleData.config) actions.updateConfig(restoredState.articleData.config);
      if (restoredState.articleData.content) actions.setContent(restoredState.articleData.content);
      if (restoredState.articleData.metaTitle || restoredState.articleData.metaDescription) {
        actions.setMeta(restoredState.articleData.metaTitle, restoredState.articleData.metaDescription);
      }
      actions.goToStep(restoredState.currentStep);
    }
  }, [backendSync, actions]);

  const handleDiscardDraft = useCallback(() => {
    backendSync.discardAutoDraft();
    actions.reset();
  }, [backendSync, actions]);

  const handleNext = useCallback(() => {
    if (canGoForward) actions.nextStep();
  }, [canGoForward, actions]);

  const handleBack = useCallback(() => {
    if (canGoBack) actions.prevStep();
  }, [canGoBack, actions]);

  return {
    // State
    state,
    actions,
    blogAI,
    createArticleMutation,
    backendSync,
    currentStep,
    articleData,
    isLoading,
    canProceed,
    error,
    canGoBack,
    canGoForward,
    showResetButton,

    // Reset dialog
    isResetOpen,
    setResetOpen,

    // Completion dialog
    isCompletionOpen,
    setCompletionOpen,
    completedArticle,

    // Handlers
    handleNext,
    handleBack,
    handleReset,
    handleWorkflowComplete,
    handleStartNewArticle,
    handleRestoreDraft,
    handleDiscardDraft,

    // Router
    router,
  };
}

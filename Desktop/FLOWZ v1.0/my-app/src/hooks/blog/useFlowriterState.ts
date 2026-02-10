/**
 * useFlowriterState Hook
 *
 * State management for the Flowriter AI article generation workflow
 * 
 * v3.0: Backend-first architecture - no localStorage persistence
 * All draft persistence is handled by useFlowriterSync (Supabase)
 */

import React, { useReducer, useCallback, useMemo } from 'react';
import {
  FlowriterState,
  FlowriterAction,
  FlowriterStep,
  DEFAULT_FLOWRITER_STATE,
  OutlineItem,
  TitleSuggestion,
  GenerationProgress,
  SourceReference,
  SeoAnalysisResult,
} from '@/types/blog-ai';
import { ArticleConfig } from '@/types/blog';

// ============================================================================
// REDUCER
// ============================================================================

function flowriterReducer(
  state: FlowriterState,
  action: FlowriterAction
): FlowriterState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
        error: null,
      };

    case 'SET_TOPIC': {
      const isTopicChanged = state.articleData.topic !== action.topic;
      return {
        ...state,
        articleData: {
          ...state.articleData,
          topic: action.topic,
          // If the topic changed significantly, reset dependent data
          ...(isTopicChanged ? {
            title: '',
            outline: [],
            titleSuggestions: [],
            selectedKeywords: [],
          } : {}),
        },
        canProceed: action.topic.trim().length > 0,
      };
    }

    case 'SET_TITLE_SUGGESTIONS':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          titleSuggestions: action.suggestions,
        },
        isLoading: false,
      };

    case 'SELECT_TITLE': {
      const isTitleChanged = state.articleData.title !== action.title;
      const suggestion = state.articleData.titleSuggestions.find(
        (s) => s.title === action.title
      );
      return {
        ...state,
        articleData: {
          ...state.articleData,
          title: action.title,
          selectedKeywords: suggestion?.keywords || [],
          // Reset outline if the title has changed
          outline: isTitleChanged ? [] : state.articleData.outline,
          titleSuggestions: state.articleData.titleSuggestions.map((s) => ({
            ...s,
            selected: s.title === action.title,
          })),
        },
        canProceed: true,
      };
    }

    case 'TOGGLE_KEYWORD': {
      const keywords = state.articleData.selectedKeywords;
      const isSelected = keywords.includes(action.keyword);
      return {
        ...state,
        articleData: {
          ...state.articleData,
          selectedKeywords: isSelected
            ? keywords.filter((k) => k !== action.keyword)
            : [...keywords, action.keyword],
        },
      };
    }

    case 'SET_OUTLINE':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          outline: action.outline,
        },
        canProceed: action.outline.length > 0,
        isLoading: false,
      };

    case 'ADD_OUTLINE_ITEM': {
      const outline = [...state.articleData.outline];
      if (action.afterId) {
        const index = outline.findIndex((item) => item.id === action.afterId);
        if (index !== -1) {
          outline.splice(index + 1, 0, action.item);
        } else {
          outline.push(action.item);
        }
      } else {
        outline.push(action.item);
      }
      return {
        ...state,
        articleData: {
          ...state.articleData,
          outline,
        },
      };
    }

    case 'REMOVE_OUTLINE_ITEM':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          outline: state.articleData.outline.filter(
            (item) => item.id !== action.id
          ),
        },
      };

    case 'REORDER_OUTLINE':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          outline: action.items,
        },
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          config: {
            ...state.articleData.config,
            ...action.config,
          },
        },
        canProceed: true,
      };

    case 'START_GENERATION':
      return {
        ...state,
        isLoading: true,
        generationProgress: {
          phase: 'analyzing',
          currentSection: 0,
          totalSections: state.articleData.outline.length,
          currentSectionTitle: 'Analyse du sujet...',
          streamedContent: '',
          elapsedTime: 0,
        },
        // Save current state to history
        history: [...state.history, state.articleData],
      };

    case 'UPDATE_GENERATION_PROGRESS':
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          ...action.progress,
        },
      };

    case 'APPEND_CONTENT':
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          streamedContent: state.generationProgress.streamedContent + action.content,
        },
      };

    case 'SET_CONTENT':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          content: action.content,
        },
      };

    case 'GENERATION_COMPLETE':
      return {
        ...state,
        isLoading: false,
        articleData: {
          ...state.articleData,
          content: action.content,
          metaTitle: action.meta?.title,
          metaDescription: action.meta?.description,
        },
        generationProgress: {
          ...state.generationProgress,
          phase: 'complete',
          streamedContent: action.content,
        },
        canProceed: true,
      };

    case 'GENERATION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
        generationProgress: {
          ...state.generationProgress,
          phase: 'error',
          error: action.error,
        },
      };

    case 'SET_META':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          metaTitle: action.metaTitle,
          metaDescription: action.metaDescription,
        },
      };

    case 'SET_SOURCES':
      return {
        ...state,
        articleData: {
          ...state.articleData,
          sources: action.sources,
        },
      };

    case 'SET_SEO_ANALYSIS':
      return {
        ...state,
        seoAnalysis: action.analysis,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };

    case 'RESET':
      return DEFAULT_FLOWRITER_STATE;

    case 'RESTORE_FROM_HISTORY':
      if (action.index >= 0 && action.index < state.history.length) {
        return {
          ...state,
          articleData: state.history[action.index],
        };
      }
      return state;

    case 'HYDRATE_STATE':
      return {
        ...action.state,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useFlowriterState() {
  const [state, dispatch] = useReducer(flowriterReducer, DEFAULT_FLOWRITER_STATE);

  // Destructure state for convenience
  const { currentStep, articleData, isLoading, error, generationProgress, canProceed, seoAnalysis } = state;

  // ============================================================================
  // NAVIGATION ACTIONS
  // ============================================================================

  const goToStep = useCallback((step: FlowriterStep) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const nextStep = useCallback(() => {
    const steps = Object.values(FlowriterStep).filter(
      (v) => typeof v === 'number'
    ) as FlowriterStep[];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      dispatch({ type: 'SET_STEP', step: steps[currentIndex + 1] });
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const steps = Object.values(FlowriterStep).filter(
      (v) => typeof v === 'number'
    ) as FlowriterStep[];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', step: steps[currentIndex - 1] });
    }
  }, [currentStep]);

  // ============================================================================
  // TOPIC & TITLE ACTIONS
  // ============================================================================

  const setTopic = useCallback((topic: string) => {
    dispatch({ type: 'SET_TOPIC', topic });
  }, []);

  const setTitleSuggestions = useCallback((suggestions: TitleSuggestion[]) => {
    dispatch({ type: 'SET_TITLE_SUGGESTIONS', suggestions });
  }, []);

  const selectTitle = useCallback((title: string) => {
    dispatch({ type: 'SELECT_TITLE', title });
  }, []);

  const toggleKeyword = useCallback((keyword: string) => {
    dispatch({ type: 'TOGGLE_KEYWORD', keyword });
  }, []);

  // ============================================================================
  // OUTLINE ACTIONS
  // ============================================================================

  const setOutline = useCallback((outline: OutlineItem[]) => {
    dispatch({ type: 'SET_OUTLINE', outline });
  }, []);

  const addOutlineItem = useCallback((item: OutlineItem, afterId?: string) => {
    dispatch({ type: 'ADD_OUTLINE_ITEM', item, afterId });
  }, []);

  const removeOutlineItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_OUTLINE_ITEM', id });
  }, []);

  const reorderOutline = useCallback((items: OutlineItem[]) => {
    dispatch({ type: 'REORDER_OUTLINE', items });
  }, []);

  // ============================================================================
  // CONFIG ACTIONS
  // ============================================================================

  const updateConfig = useCallback((config: Partial<ArticleConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', config });
  }, []);

  // ============================================================================
  // GENERATION ACTIONS
  // ============================================================================

  const startGeneration = useCallback(() => {
    dispatch({ type: 'START_GENERATION' });
  }, []);

  const updateProgress = useCallback((progress: Partial<GenerationProgress>) => {
    dispatch({ type: 'UPDATE_GENERATION_PROGRESS', progress });
  }, []);

  const appendContent = useCallback((content: string) => {
    dispatch({ type: 'APPEND_CONTENT', content });
  }, []);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', content });
  }, []);

  const completeGeneration = useCallback(
    (content: string, meta?: { title: string; description: string }) => {
      dispatch({ type: 'GENERATION_COMPLETE', content, meta });
    },
    []
  );

  const setGenerationError = useCallback((error: string) => {
    dispatch({ type: 'GENERATION_ERROR', error });
  }, []);

  // ============================================================================
  // META & SEO ACTIONS
  // ============================================================================

  const setMeta = useCallback((metaTitle?: string, metaDescription?: string) => {
    dispatch({ type: 'SET_META', metaTitle, metaDescription });
  }, []);

  const setSources = useCallback((sources: SourceReference[]) => {
    dispatch({ type: 'SET_SOURCES', sources });
  }, []);

  const setSeoAnalysis = useCallback((analysis: SeoAnalysisResult | null) => {
    dispatch({ type: 'SET_SEO_ANALYSIS', analysis });
  }, []);

  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const restoreFromHistory = useCallback((index: number) => {
    dispatch({ type: 'RESTORE_FROM_HISTORY', index });
  }, []);

  // ============================================================================
  // INTELLIGENT RESET METHODS
  // ============================================================================

  /**
   * Reset but keep the topic and title
   * Goes back to OUTLINE step with topic/title preserved
   */
  const resetKeepTopic = useCallback(() => {
    const { topic, title, titleSuggestions } = state.articleData;

    dispatch({ type: 'RESET' });

    // Re-apply topic data
    if (topic) {
      dispatch({ type: 'SET_TOPIC', topic });
    }
    if (titleSuggestions.length > 0) {
      dispatch({ type: 'SET_TITLE_SUGGESTIONS', suggestions: titleSuggestions });
    }
    if (title) {
      dispatch({ type: 'SELECT_TITLE', title });
    }
    // Go to outline step
    dispatch({ type: 'SET_STEP', step: FlowriterStep.OUTLINE });
  }, [state.articleData]);

  /**
   * Go back to a specific step while preserving data up to that step
   * Useful for regenerating content without losing structure
   */
  const resetToStep = useCallback((targetStep: FlowriterStep) => {
    // Clear generation progress if going before generation
    if (targetStep < FlowriterStep.GENERATION) {
      dispatch({
        type: 'UPDATE_GENERATION_PROGRESS',
        progress: {
          phase: 'idle',
          currentSection: 0,
          streamedContent: '',
          error: undefined,
        },
      });
    }

    // Clear content if going before canvas
    if (targetStep < FlowriterStep.CANVAS) {
      dispatch({ type: 'SET_CONTENT', content: '' });
      dispatch({ type: 'SET_META', metaTitle: undefined, metaDescription: undefined });
    }

    // Clear SEO analysis if going before finalize
    if (targetStep < FlowriterStep.FINALIZE) {
      dispatch({ type: 'SET_SEO_ANALYSIS', analysis: null });
    }

    // Clear outline if going back to topic
    if (targetStep === FlowriterStep.TOPIC) {
      dispatch({ type: 'SET_OUTLINE', outline: [] });
    }

    // Navigate to target step
    dispatch({ type: 'SET_STEP', step: targetStep });
    dispatch({ type: 'SET_ERROR', error: null });
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }, []);

  /**
   * Check if there's significant work that would be lost on reset
   */
  const hasSignificantWork = useCallback((): boolean => {
    const { articleData, currentStep } = state;
    const hasContent = (articleData.content?.length || 0) > 100;
    const hasOutline = articleData.outline.length > 0;
    const hasGeneratedContent = currentStep >= FlowriterStep.CANVAS && hasContent;

    return hasGeneratedContent || (hasOutline && currentStep >= FlowriterStep.CONFIG);
  }, [state]);

  /**
   * Get a summary of what would be lost on reset
   */
  const getWorkLossSummary = useCallback((): {
    level: 'none' | 'low' | 'medium' | 'high';
    wordCount: number;
    sectionsCount: number;
  } => {
    const { articleData, currentStep } = state;
    const wordCount = articleData.content?.split(/\s+/).filter(Boolean).length || 0;
    const sectionsCount = articleData.outline.length;
    const hasContent = wordCount > 50;
    const hasOutline = sectionsCount > 0;
    const hasGeneratedContent = currentStep >= FlowriterStep.CANVAS && hasContent;

    let level: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (hasGeneratedContent) {
      level = 'high';
    } else if (hasOutline) {
      level = 'medium';
    } else if (articleData.topic || articleData.title) {
      level = 'low';
    }

    return { level, wordCount, sectionsCount };
  }, [state]);

  /**
   * Start a new article with optional preserved data
   * Used after completing/publishing an article
   */
  const startNewWithConfig = useCallback((preservedData?: Partial<{
    config: ArticleConfig;
    topic: string;
    title: string;
  }>) => {
    dispatch({ type: 'RESET' });

    if (preservedData) {
      // Apply preserved config
      if (preservedData.config) {
        dispatch({ type: 'UPDATE_CONFIG', config: preservedData.config });
      }

      // Apply preserved topic
      if (preservedData.topic) {
        dispatch({ type: 'SET_TOPIC', topic: preservedData.topic });
      }
    }

    // Always start at TOPIC step for new articles
    dispatch({ type: 'SET_STEP', step: FlowriterStep.TOPIC });
  }, []);

  /**
   * Get current article summary for completion tracking
   */
  const getArticleSummary = useCallback(() => {
    const { articleData, currentStep } = state;
    return {
      title: articleData.title,
      topic: articleData.topic,
      wordCount: articleData.content?.split(/\s+/).filter(Boolean).length || 0,
      config: articleData.config,
      currentStep,
    };
  }, [state]);

  // ============================================================================
  // MEMOIZED ACTIONS OBJECT
  // ============================================================================

  const actions = useMemo(
    () => ({
      // Navigation
      goToStep,
      nextStep,
      prevStep,
      // Topic
      setTopic,
      // Titles
      setTitleSuggestions,
      selectTitle,
      toggleKeyword,
      // Outline
      setOutline,
      addOutlineItem,
      removeOutlineItem,
      reorderOutline,
      // Config
      updateConfig,
      // Generation
      startGeneration,
      updateProgress,
      appendContent,
      setContent,
      completeGeneration,
      setGenerationError,
      // Meta
      setMeta,
      setSources,
      // SEO
      setSeoAnalysis,
      // Utility
      setLoading,
      setError,
      reset,
      restoreFromHistory,
      // Intelligent Reset
      resetKeepTopic,
      resetToStep,
      hasSignificantWork,
      getWorkLossSummary,
      // Workflow Lifecycle
      startNewWithConfig,
      getArticleSummary,
    }),
    [
      goToStep,
      nextStep,
      prevStep,
      setTopic,
      setTitleSuggestions,
      selectTitle,
      toggleKeyword,
      setOutline,
      addOutlineItem,
      removeOutlineItem,
      reorderOutline,
      updateConfig,
      startGeneration,
      updateProgress,
      appendContent,
      setContent,
      completeGeneration,
      setGenerationError,
      setMeta,
      setSources,
      setSeoAnalysis,
      setLoading,
      setError,
      reset,
      restoreFromHistory,
      resetKeepTopic,
      resetToStep,
      hasSignificantWork,
      getWorkLossSummary,
      startNewWithConfig,
      getArticleSummary,
    ]
  );

  return {
    state,
    dispatch,
    actions,
  };
}

export type FlowriterActions = ReturnType<typeof useFlowriterState>['actions'];

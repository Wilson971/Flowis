/**
 * useAIEditorActions Hook
 *
 * Manages AI-powered editing actions in the article editor
 * Includes action execution, preview, and undo history
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAIRateLimit, AI_DAILY_LIMIT } from './useAIRateLimit';

import { rewriteTextAction, generateMetaAction } from '@/actions/flowriter';
import {
  type AIEditorAction,
  type AIActionRequest,
  type AIActionResult,
  type EditorTone,
  type EditorLanguage,
  AI_ACTION_LABELS,
} from '@/schemas/article-editor';

// ============================================================================
// TYPES
// ============================================================================

interface AIActionHistoryItem {
  id: string;
  action: AIEditorAction;
  originalContent: string;
  newContent: string;
  timestamp: Date;
  selection?: { from: number; to: number };
}

interface UseAIEditorActionsReturn {
  // Execute actions
  executeAction: (request: AIActionRequest) => Promise<string | null>;
  previewAction: (request: AIActionRequest) => Promise<string | null>;

  // State
  isProcessing: boolean;
  currentAction: AIEditorAction | null;
  previewResult: string | null;
  previewOriginal: string | null;

  // Preview controls
  applyPreview: () => string | null;
  cancelPreview: () => void;
  hasPreview: boolean;

  // History for undo
  history: AIActionHistoryItem[];
  undo: () => AIActionHistoryItem | null;
  canUndo: boolean;
  clearHistory: () => void;

  // Specific generators
  generateIntro: (content: string) => Promise<string | null>;
  generateConclusion: (content: string) => Promise<string | null>;
  suggestTitles: (content: string) => Promise<string[] | null>;
  generateMetaDescription: (title: string, content: string) => Promise<string | null>;
  generateExcerpt: (content: string) => Promise<string | null>;

  // Rate limiting
  remainingActions: number;
  dailyLimit: number;
  isLimitReached: boolean;
}

// ============================================================================
// ACTION MAPPING
// ============================================================================

/**
 * Maps our actions to the rewriteTextAction format
 */
function mapActionToRewriteAction(
  action: AIEditorAction
): 'rewrite' | 'improve' | 'expand' | 'shorten' | 'translate' | 'simplify' | 'formalize' | 'continue' | 'factcheck' | 'change_tone' | 'correct' {
  const mapping: Record<AIEditorAction, string> = {
    // Global actions
    improve_style: 'improve',
    simplify: 'simplify',
    expand: 'expand',
    correct: 'correct',
    change_tone: 'change_tone',
    translate: 'translate',
    // Selection actions
    rewrite: 'rewrite',
    expand_selection: 'expand',
    shorten: 'shorten',
    clarify: 'simplify',
    add_examples: 'expand',
    to_list: 'rewrite',
    to_paragraph: 'rewrite',
    // Generate actions (handled separately)
    generate_intro: 'continue',
    generate_conclusion: 'continue',
    generate_cta: 'continue',
    suggest_titles: 'rewrite',
    generate_meta_description: 'rewrite',
    generate_excerpt: 'shorten',
  };

  return mapping[action] as any;
}

/**
 * Build context for the AI based on action
 */
function buildContext(action: AIEditorAction, options?: { tone?: EditorTone; language?: EditorLanguage }): string {
  const contexts: Record<string, string> = {
    improve_style: 'Améliore le style de ce texte pour le rendre plus engageant et professionnel, tout en conservant le sens.',
    simplify: 'Simplifie ce texte pour le rendre plus accessible et facile à comprendre.',
    expand: 'Développe ce texte avec plus de détails, exemples et explications.',
    correct: 'Corrige les fautes d\'orthographe et de grammaire de ce texte.',
    change_tone: options?.tone
      ? `Réécris ce texte avec un ton ${options.tone}.`
      : 'Réécris ce texte avec un ton plus professionnel.',
    translate: options?.language
      ? `Traduis ce texte en ${options.language === 'en' ? 'anglais' : options.language === 'es' ? 'espagnol' : options.language === 'de' ? 'allemand' : 'français'}.`
      : 'Traduis ce texte en anglais.',
    rewrite: 'Réécris ce passage différemment tout en conservant le sens.',
    expand_selection: 'Développe ce passage avec plus de détails.',
    shorten: 'Raccourcis ce texte tout en conservant les informations essentielles.',
    clarify: 'Clarifie ce passage pour le rendre plus clair et précis.',
    add_examples: 'Ajoute des exemples concrets et pertinents à ce passage.',
    to_list: 'Transforme ce texte en une liste à puces claire et structurée.',
    to_paragraph: 'Transforme cette liste en un paragraphe fluide et naturel.',
    generate_intro: 'Génère une introduction accrocheuse pour cet article.',
    generate_conclusion: 'Génère une conclusion qui résume les points clés.',
    generate_cta: 'Génère un appel à l\'action engageant.',
    suggest_titles: 'Suggère 5 titres alternatifs accrocheurs pour ce contenu.',
    generate_meta_description: 'Génère une méta-description SEO optimisée (max 160 caractères).',
    generate_excerpt: 'Génère un extrait/résumé de 2-3 phrases.',
  };

  return contexts[action] || 'Améliore ce texte.';
}

// ============================================================================
// HOOK
// ============================================================================

const MAX_HISTORY_SIZE = 20;

export function useAIEditorActions(): UseAIEditorActionsReturn {
  // Rate limiting
  const rateLimit = useAIRateLimit();

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIEditorAction | null>(null);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [previewOriginal, setPreviewOriginal] = useState<string | null>(null);
  const [history, setHistory] = useState<AIActionHistoryItem[]>([]);

  // Refs
  const pendingApplyRef = useRef<{ action: AIEditorAction; original: string } | null>(null);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const rewriteMutation = useMutation({
    mutationFn: async ({
      text,
      action,
      context,
      language,
    }: {
      text: string;
      action: string;
      context: string;
      language?: string;
    }) => {
      return await rewriteTextAction(text, action as any, context, language);
    },
    onError: (error: Error) => {
      toast.error('Erreur IA', {
        description: error.message || 'Impossible de traiter le texte.',
      });
    },
  });

  const metaMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      keywords,
    }: {
      title: string;
      content: string;
      keywords?: string[];
    }) => {
      return await generateMetaAction(title, content, keywords || []);
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de générer les méta-données.',
      });
    },
  });

  // ============================================================================
  // CORE ACTIONS
  // ============================================================================

  const executeAction = useCallback(
    async (request: AIActionRequest): Promise<string | null> => {
      // Check rate limit before executing
      if (!rateLimit.checkAndIncrement()) {
        return null;
      }

      setIsProcessing(true);
      setCurrentAction(request.action);

      try {
        const mappedAction = mapActionToRewriteAction(request.action);
        const context = buildContext(request.action, request.options);

        const result = await rewriteMutation.mutateAsync({
          text: request.content,
          action: mappedAction,
          context,
          language: request.options?.language,
        });

        if (result) {
          // Add to history
          const historyItem: AIActionHistoryItem = {
            id: crypto.randomUUID(),
            action: request.action,
            originalContent: request.content,
            newContent: result,
            timestamp: new Date(),
            selection: request.selection ? { from: request.selection.from, to: request.selection.to } : undefined,
          };

          setHistory((prev) => {
            const newHistory = [historyItem, ...prev];
            return newHistory.slice(0, MAX_HISTORY_SIZE);
          });

          toast.success(AI_ACTION_LABELS[request.action], {
            description: 'Modification appliquée',
          });

          return result;
        }

        return null;
      } catch (error) {
        return null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  const previewAction = useCallback(
    async (request: AIActionRequest): Promise<string | null> => {
      // Check rate limit before executing
      if (!rateLimit.checkAndIncrement()) {
        return null;
      }

      setIsProcessing(true);
      setCurrentAction(request.action);
      setPreviewOriginal(request.content);

      try {
        const mappedAction = mapActionToRewriteAction(request.action);
        const context = buildContext(request.action, request.options);

        const result = await rewriteMutation.mutateAsync({
          text: request.content,
          action: mappedAction,
          context,
          language: request.options?.language,
        });

        if (result) {
          setPreviewResult(result);
          pendingApplyRef.current = {
            action: request.action,
            original: request.content,
          };
          return result;
        }

        return null;
      } catch (error) {
        setPreviewResult(null);
        return null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  // ============================================================================
  // PREVIEW CONTROLS
  // ============================================================================

  const applyPreview = useCallback((): string | null => {
    if (!previewResult || !pendingApplyRef.current) return null;

    const { action, original } = pendingApplyRef.current;

    // Add to history
    const historyItem: AIActionHistoryItem = {
      id: crypto.randomUUID(),
      action,
      originalContent: original,
      newContent: previewResult,
      timestamp: new Date(),
    };

    setHistory((prev) => {
      const newHistory = [historyItem, ...prev];
      return newHistory.slice(0, MAX_HISTORY_SIZE);
    });

    const result = previewResult;

    // Clear preview state
    setPreviewResult(null);
    setPreviewOriginal(null);
    pendingApplyRef.current = null;

    toast.success('Modification appliquée');

    return result;
  }, [previewResult]);

  const cancelPreview = useCallback(() => {
    setPreviewResult(null);
    setPreviewOriginal(null);
    pendingApplyRef.current = null;
  }, []);

  // ============================================================================
  // UNDO
  // ============================================================================

  const undo = useCallback((): AIActionHistoryItem | null => {
    if (history.length === 0) return null;

    const [lastItem, ...rest] = history;
    setHistory(rest);

    toast.info('Modification annulée', {
      description: `Retour avant "${AI_ACTION_LABELS[lastItem.action]}"`,
    });

    return lastItem;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // ============================================================================
  // SPECIFIC GENERATORS
  // ============================================================================

  const generateIntro = useCallback(
    async (content: string): Promise<string | null> => {
      setIsProcessing(true);
      setCurrentAction('generate_intro');

      try {
        const result = await rewriteMutation.mutateAsync({
          text: content,
          action: 'continue',
          context: 'Génère une introduction captivante pour cet article. L\'introduction doit accrocher le lecteur, présenter le sujet et donner envie de lire la suite. Retourne uniquement l\'introduction.',
        });

        return result || null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  const generateConclusion = useCallback(
    async (content: string): Promise<string | null> => {
      setIsProcessing(true);
      setCurrentAction('generate_conclusion');

      try {
        const result = await rewriteMutation.mutateAsync({
          text: content,
          action: 'continue',
          context: 'Génère une conclusion pour cet article. La conclusion doit résumer les points clés et terminer sur une note engageante. Retourne uniquement la conclusion.',
        });

        return result || null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  const suggestTitles = useCallback(
    async (content: string): Promise<string[] | null> => {
      setIsProcessing(true);
      setCurrentAction('suggest_titles');

      try {
        const result = await rewriteMutation.mutateAsync({
          text: content,
          action: 'rewrite',
          context: 'Suggère 5 titres alternatifs accrocheurs et optimisés SEO pour ce contenu. Retourne uniquement les 5 titres, un par ligne, numérotés de 1 à 5.',
        });

        if (result) {
          // Parse the numbered titles
          const titles = result
            .split('\n')
            .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter((line) => line.length > 0)
            .slice(0, 5);

          return titles;
        }

        return null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  const generateMetaDescription = useCallback(
    async (title: string, content: string): Promise<string | null> => {
      setIsProcessing(true);
      setCurrentAction('generate_meta_description');

      try {
        const result = await metaMutation.mutateAsync({
          title,
          content,
        });

        return result?.description || null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [metaMutation]
  );

  const generateExcerpt = useCallback(
    async (content: string): Promise<string | null> => {
      setIsProcessing(true);
      setCurrentAction('generate_excerpt');

      try {
        const result = await rewriteMutation.mutateAsync({
          text: content,
          action: 'shorten',
          context: 'Génère un extrait/résumé de 2-3 phrases qui capture l\'essence de cet article. L\'extrait doit être accrocheur et donner envie de lire l\'article complet. Maximum 300 caractères.',
        });

        return result || null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
      }
    },
    [rewriteMutation]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    executeAction,
    previewAction,

    isProcessing: isProcessing || rewriteMutation.isPending || metaMutation.isPending,
    currentAction,
    previewResult,
    previewOriginal,

    applyPreview,
    cancelPreview,
    hasPreview: !!previewResult,

    history,
    undo,
    canUndo: history.length > 0,
    clearHistory,

    generateIntro,
    generateConclusion,
    suggestTitles,
    generateMetaDescription,
    generateExcerpt,

    // Rate limiting
    remainingActions: rateLimit.remainingActions,
    dailyLimit: AI_DAILY_LIMIT,
    isLimitReached: rateLimit.isLimitReached,
  };
}

'use client';

/**
 * useArticleEditProvider Hook
 *
 * Provides the context value for ArticleEditProvider
 * Manages state, draft actions, and field tracking
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import type { ArticleForm } from '@/schemas/article-editor';
import type { BlogArticle } from '@/types/blog';
import type { SyncStatus } from '@/schemas/article-editor';
import {
  ArticleEditContextType,
  ArticleContentBuffer,
  ArticleDirtyFieldsData,
  ArticleDraftActions,
  defaultArticleDraftActions,
} from './ArticleEditContext';

// ============================================================================
// TYPES
// ============================================================================

interface UseArticleEditProviderOptions {
  articleId?: string;
  article: BlogArticle | null | undefined;
  isLoading: boolean;
  isNew: boolean;
  form: UseFormReturn<ArticleForm>;
  lastSavedAt: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isSaving: boolean;
  saveDraft: () => Promise<BlogArticle | null>;
  saveAndPublish: () => Promise<BlogArticle | null>;
  generateSlugFromTitle: () => void;
  // AI Actions
  aiActions?: {
    generateIntro: (content: string) => Promise<string | null>;
    generateConclusion: (content: string) => Promise<string | null>;
    suggestTitles: (content: string) => Promise<string[] | null>;
    generateMetaDescription: (title: string, content: string) => Promise<string | null>;
    generateExcerpt: (content: string) => Promise<string | null>;
    isProcessing: boolean;
  };
  // Sync
  syncHook?: {
    syncStatus: SyncStatus;
    isPublished: boolean;
    isScheduled: boolean;
    scheduledAt: string | null;
    connectedPlatforms?: Array<{ platform: string; connected?: boolean }>;
    publishNow: (platforms: string[]) => Promise<boolean>;
    schedulePublish: (options: any) => Promise<boolean>;
    retrySync?: (platform: string) => Promise<boolean | void>;
    isPublishing: boolean;
    isScheduling: boolean;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useArticleEditProvider(
  options: UseArticleEditProviderOptions
): ArticleEditContextType {
  const {
    articleId,
    article,
    isLoading,
    isNew,
    form,
    lastSavedAt,
    autoSaveStatus,
    isSaving,
    saveDraft,
    saveAndPublish,
    generateSlugFromTitle,
    aiActions,
    syncHook,
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  // Content buffer for managing different versions
  const [contentBuffer, setContentBuffer] = useState<ArticleContentBuffer>(() => ({
    original_content: {},
    working_content: form.getValues(),
    draft_generated_content: {},
  }));

  // Fields with AI suggestions
  const [remainingProposals, setRemainingProposals] = useState<string[]>([]);

  // Preview state
  const [previewField, setPreviewField] = useState<string | null>(null);

  // Action states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Saved snapshot for dirty tracking
  const [savedSnapshot, setSavedSnapshot] = useState<ArticleForm | null>(null);

  // Track original content from platform sync
  const originalContentRef = useRef<Partial<ArticleForm>>({});

  // ============================================================================
  // DIRTY FIELDS TRACKING
  // ============================================================================

  const dirtyFieldsData = useMemo((): ArticleDirtyFieldsData => {
    const dirtyFields = Object.keys(form.formState.dirtyFields);
    return {
      dirtyFieldsContent: dirtyFields,
      contentStatus: dirtyFields.length > 0 ? 'modified' : 'synced',
      hasConflict: false, // TODO: Implement conflict detection
    };
  }, [form.formState.dirtyFields]);

  // ============================================================================
  // SEO ANALYSIS
  // ============================================================================

  const seoAnalysis = useMemo(() => {
    const title = form.watch('title') || '';
    const seoTitle = form.watch('seo_title') || title;
    const seoDescription = form.watch('seo_description') || '';
    const content = form.watch('content') || '';
    const slug = form.watch('slug') || '';

    const checks: Array<{ label: string; passed: boolean; severity: 'critical' | 'warning' | 'info' }> = [];

    // Title length (50-60 chars optimal)
    const titleLen = seoTitle.length;
    checks.push({
      label: `Titre SEO (${titleLen}/60 car.)`,
      passed: titleLen >= 30 && titleLen <= 60,
      severity: titleLen < 10 || titleLen > 70 ? 'critical' : 'warning',
    });

    // Meta description (120-160 chars optimal)
    const descLen = seoDescription.length;
    checks.push({
      label: `Meta description (${descLen}/160 car.)`,
      passed: descLen >= 120 && descLen <= 160,
      severity: descLen < 50 ? 'critical' : 'warning',
    });

    // Content length (minimum 300 words)
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    checks.push({
      label: `Contenu (${wordCount} mots)`,
      passed: wordCount >= 300,
      severity: wordCount < 100 ? 'critical' : 'warning',
    });

    // Slug exists and is clean
    const cleanSlug = slug && /^[a-z0-9-]+$/.test(slug);
    checks.push({
      label: 'URL optimisée',
      passed: !!cleanSlug,
      severity: 'warning',
    });

    // Has headings in content
    const hasHeadings = /<h[2-4]/i.test(content);
    checks.push({
      label: 'Structure (titres H2/H3)',
      passed: hasHeadings,
      severity: 'info',
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return { score, checks };
  }, [form]);

  // ============================================================================
  // DRAFT ACTIONS
  // ============================================================================

  const handleAcceptField = useCallback(
    async (field: string) => {
      if (!contentBuffer.draft_generated_content[field]) return;

      setIsAccepting(true);

      try {
        // Get the suggestion
        const suggestion = contentBuffer.draft_generated_content[field];

        // Apply to form
        form.setValue(field as keyof ArticleForm, suggestion as any, {
          shouldDirty: true,
        });

        // Remove from proposals
        setRemainingProposals((prev) => prev.filter((f) => f !== field));

        // Clear from buffer
        setContentBuffer((prev) => {
          const newDraft = { ...prev.draft_generated_content };
          delete newDraft[field];
          return { ...prev, draft_generated_content: newDraft };
        });

        toast.success('Suggestion acceptée', {
          description: `Le champ "${field}" a été mis à jour.`,
        });
      } catch (error) {
        toast.error('Erreur', {
          description: 'Impossible d\'accepter la suggestion.',
        });
      } finally {
        setIsAccepting(false);
      }
    },
    [contentBuffer, form]
  );

  const handleRejectField = useCallback(
    async (field: string) => {
      setIsRejecting(true);

      try {
        // Remove from proposals
        setRemainingProposals((prev) => prev.filter((f) => f !== field));

        // Clear from buffer
        setContentBuffer((prev) => {
          const newDraft = { ...prev.draft_generated_content };
          delete newDraft[field];
          return { ...prev, draft_generated_content: newDraft };
        });

        toast.info('Suggestion rejetée');
      } finally {
        setIsRejecting(false);
      }
    },
    []
  );

  const handleRegenerateField = useCallback(
    async (field: string) => {
      if (!aiActions) return;

      setIsRegenerating(true);

      try {
        const content = form.getValues('content');
        const title = form.getValues('title');
        let suggestion: string | null = null;

        // Generate based on field
        switch (field) {
          case 'title':
            const titles = await aiActions.suggestTitles(content);
            suggestion = titles?.[0] || null;
            break;
          case 'excerpt':
            suggestion = await aiActions.generateExcerpt(content);
            break;
          case 'seo_title':
            const seoTitles = await aiActions.suggestTitles(content);
            suggestion = seoTitles?.[0] || null;
            break;
          case 'seo_description':
            suggestion = await aiActions.generateMetaDescription(title, content);
            break;
          default:
            break;
        }

        if (suggestion) {
          // Add to buffer
          setContentBuffer((prev) => ({
            ...prev,
            draft_generated_content: {
              ...prev.draft_generated_content,
              [field]: suggestion,
            },
          }));

          // Add to proposals if not already there
          setRemainingProposals((prev) =>
            prev.includes(field) ? prev : [...prev, field]
          );

          toast.success('Suggestion générée', {
            description: 'Vous pouvez l\'accepter ou la rejeter.',
          });
        }
      } catch (error) {
        toast.error('Erreur', {
          description: 'Impossible de générer une nouvelle suggestion.',
        });
      } finally {
        setIsRegenerating(false);
      }
    },
    [aiActions, form]
  );

  const draftActions: ArticleDraftActions = useMemo(
    () => ({
      handleAcceptField,
      handleRejectField,
      handleRegenerateField,
      isAccepting,
      isRejecting,
      isRegenerating,
      previewField,
      setPreviewField,
    }),
    [
      handleAcceptField,
      handleRejectField,
      handleRegenerateField,
      isAccepting,
      isRejecting,
      isRegenerating,
      previewField,
    ]
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  const isFieldModified = useCallback(
    (fieldName: string): boolean => {
      return dirtyFieldsData.dirtyFieldsContent?.includes(fieldName) || false;
    },
    [dirtyFieldsData]
  );

  const isFieldWithDraft = useCallback(
    (fieldName: string): boolean => {
      return remainingProposals.includes(fieldName);
    },
    [remainingProposals]
  );

  const handleSave = useCallback(
    async (data: ArticleForm) => {
      await saveDraft();
    },
    [saveDraft]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: ArticleEditContextType = useMemo(
    () => ({
      // Identifier
      articleId,

      // Article data
      article,
      isLoading,
      isNew,

      // Form
      form,
      savedSnapshot,
      setSavedSnapshot,

      // Triple-buffer content
      contentBuffer,

      // Dirty fields tracking
      dirtyFieldsData,

      // SEO Analysis
      seoScore: seoAnalysis.score,
      seoChecks: seoAnalysis.checks,

      // AI Proposals
      remainingProposals,
      draftActions,

      // Save & Sync
      isSaving,
      handleSave,
      articleSync: syncHook
        ? {
            syncStatus: syncHook.syncStatus,
            isPublished: syncHook.isPublished,
            isScheduled: syncHook.isScheduled,
            scheduledAt: syncHook.scheduledAt,
            connectedPlatforms: syncHook.connectedPlatforms,
            publishNow: syncHook.publishNow,
            schedulePublish: syncHook.schedulePublish,
            retrySync: syncHook.retrySync,
            isPublishing: syncHook.isPublishing,
            isScheduling: syncHook.isScheduling,
          }
        : undefined,

      // Auto-save
      lastSavedAt,
      autoSaveStatus,

      // Helpers
      isFieldModified,
      isFieldWithDraft,
      generateSlugFromTitle,

      // Platform context
      connectedPlatforms: syncHook?.connectedPlatforms,
    }),
    [
      articleId,
      article,
      isLoading,
      isNew,
      form,
      savedSnapshot,
      contentBuffer,
      dirtyFieldsData,
      seoAnalysis,
      remainingProposals,
      draftActions,
      isSaving,
      handleSave,
      syncHook,
      lastSavedAt,
      autoSaveStatus,
      isFieldModified,
      isFieldWithDraft,
      generateSlugFromTitle,
    ]
  );

  return contextValue;
}

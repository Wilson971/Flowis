/**
 * useArticleAutoSave Hook
 *
 * Handles debounced auto-save of article form changes.
 * Extracted from useArticleEditorForm.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

import { useUpdateBlogArticle } from './useBlogArticle';
import { useCreateArticleVersion } from './useArticleVersions';
import type { ArticleForm } from '@/schemas/article-editor';
import type { BlogArticle, BlogFormData } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

interface UseArticleAutoSaveOptions {
  form: UseFormReturn<ArticleForm>;
  articleId?: string;
  article: BlogArticle | null | undefined;
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
  isNew: boolean;
}

interface UseArticleAutoSaveReturn {
  lastSavedAt: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setLastSavedAt: (date: Date) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useArticleAutoSave(options: UseArticleAutoSaveOptions): UseArticleAutoSaveReturn {
  const {
    form,
    articleId,
    article,
    autoSaveEnabled = true,
    autoSaveIntervalMs = 30000,
    isNew,
  } = options;

  const updateMutation = useUpdateBlogArticle();
  const createVersionMutation = useCreateArticleVersion();

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const pendingChangesRef = useRef<Partial<ArticleForm> | null>(null);
  const articleIdRef = useRef<string | undefined>(articleId);

  // Update articleId ref
  useEffect(() => {
    articleIdRef.current = articleId;
  }, [articleId]);

  const performAutoSave = useCallback(async () => {
    if (!pendingChangesRef.current || !articleIdRef.current) return;

    const changes = pendingChangesRef.current;
    pendingChangesRef.current = null;

    setAutoSaveStatus('saving');

    try {
      await updateMutation.mutateAsync({
        id: articleIdRef.current,
        updates: changes as Partial<BlogFormData>,
      });

      // Create auto-save version (silently, non-blocking — table may not exist yet)
      try {
        const title = changes.title || article?.title || 'Sans titre';
        const content = changes.content || article?.content || '';
        const excerpt = changes.excerpt || article?.excerpt || '';

        await createVersionMutation.mutateAsync({
          article_id: articleIdRef.current,
          title,
          content,
          excerpt,
          trigger_type: 'auto_save',
        });
      } catch {
        // Version tracking is optional — don't fail the auto-save
      }

      setLastSavedAt(new Date());
      setAutoSaveStatus('saved');
    } catch {
      setAutoSaveStatus('error');
      // Restore pending changes on error
      pendingChangesRef.current = changes;
    }
  }, [updateMutation, createVersionMutation, article]);

  const debouncedAutoSave = useDebouncedCallback(performAutoSave, autoSaveIntervalMs);

  // Watch form changes for auto-save
  useEffect(() => {
    if (!autoSaveEnabled || isNew) return;

    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          ...value,
        } as Partial<ArticleForm>;
        debouncedAutoSave();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, autoSaveEnabled, isNew, debouncedAutoSave]);

  // Reset auto-save status after 3 seconds
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const timeout = setTimeout(() => setAutoSaveStatus('idle'), 3000);
      return () => clearTimeout(timeout);
    }
  }, [autoSaveStatus]);

  return {
    lastSavedAt,
    autoSaveStatus,
    setLastSavedAt,
  };
}

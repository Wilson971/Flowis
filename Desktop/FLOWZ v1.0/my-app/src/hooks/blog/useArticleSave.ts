/**
 * useArticleSave Hook
 *
 * Handles save draft and publish operations for articles.
 * Extracted from useArticleEditorForm.
 */

import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useUpdateBlogArticle, StaleArticleError } from './useBlogArticle';
import { useCreateBlogArticle } from './useBlogArticles';
import { useCreateArticleVersion } from './useArticleVersions';
import { useAutoSync } from '@/hooks/sync/usePushToStore';
import { generateSlug, type ArticleForm } from '@/schemas/article-editor';
import type { BlogArticle, BlogFormData } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

interface UseArticleSaveOptions {
  form: UseFormReturn<ArticleForm>;
  isNew: boolean;
  articleId?: string;
  article?: BlogArticle | null;
  storeId?: string;
  tenantId?: string;
  autoSyncEnabled?: boolean;
  setLastSavedAt: (date: Date) => void;
}

interface UseArticleSaveReturn {
  saveDraft: () => Promise<BlogArticle | null>;
  saveAndPublish: () => Promise<BlogArticle | null>;
  isSaving: boolean;
  isAutoSyncing: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useArticleSave(options: UseArticleSaveOptions): UseArticleSaveReturn {
  const {
    form,
    isNew,
    articleId,
    article,
    storeId,
    tenantId,
    autoSyncEnabled = true,
    setLastSavedAt,
  } = options;

  const { triggerAutoSync, isAutoSyncing } = useAutoSync('article');
  const updateMutation = useUpdateBlogArticle();
  const createMutation = useCreateBlogArticle();
  const createVersionMutation = useCreateArticleVersion();

  const saveDraft = useCallback(async (): Promise<BlogArticle | null> => {
    const values = form.getValues();

    // Generate slug if empty
    if (!values.slug && values.title) {
      values.slug = generateSlug(values.title);
    }

    try {
      if (isNew) {
        if (!storeId || !tenantId) {
          toast.error('Store et tenant requis pour créer un article');
          return null;
        }
        const result = await createMutation.mutateAsync({
          tenant_id: tenantId,
          store_id: storeId,
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || undefined,
          status: 'draft',
        });

        // Update form with new article data
        if (result) {
          await updateMutation.mutateAsync({
            id: result.id,
            updates: {
              ...values,
              status: 'draft',
            } as Partial<BlogFormData>,
          });
        }

        toast.success('Brouillon créé');

        // Auto-sync to WordPress if enabled and article has platform_post_id
        if (autoSyncEnabled && result) {
          triggerAutoSync(result.id);
        }

        return result;
      } else if (articleId) {
        const result = await updateMutation.mutateAsync({
          id: articleId,
          updates: {
            ...values,
            status: 'draft',
          } as Partial<BlogFormData>,
          expectedUpdatedAt: article?.updated_at,
        });

        // Create manual save version
        await createVersionMutation.mutateAsync({
          article_id: articleId,
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || undefined,
          trigger_type: 'manual_save',
        });

        setLastSavedAt(new Date());
        toast.success('Brouillon sauvegardé', {
          description: autoSyncEnabled ? 'Synchronisation en cours...' : undefined,
        });

        // Auto-sync to WordPress if enabled
        if (autoSyncEnabled) {
          triggerAutoSync(articleId);
        }

        return result;
      }
    } catch (error) {
      if (error instanceof StaleArticleError) {
        toast.warning('Conflit de modification', {
          description: error.message,
          duration: 8000,
        });
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    }

    return null;
  }, [form, isNew, articleId, article, storeId, tenantId, autoSyncEnabled, createMutation, updateMutation, createVersionMutation, triggerAutoSync, setLastSavedAt]);

  const saveAndPublish = useCallback(async (): Promise<BlogArticle | null> => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Veuillez corriger les erreurs avant de publier');
      return null;
    }

    const values = form.getValues();

    // Generate slug if empty
    if (!values.slug && values.title) {
      values.slug = generateSlug(values.title);
    }

    try {
      if (isNew) {
        if (!storeId || !tenantId) {
          toast.error('Store et tenant requis pour créer un article');
          return null;
        }
        const result = await createMutation.mutateAsync({
          tenant_id: tenantId,
          store_id: storeId,
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || undefined,
          status: 'published',
        });

        if (result) {
          await updateMutation.mutateAsync({
            id: result.id,
            updates: {
              ...values,
              status: 'published',
            } as Partial<BlogFormData>,
          });
        }

        toast.success('Article publié', {
          description: autoSyncEnabled ? 'Synchronisation vers WordPress...' : undefined,
        });

        // Auto-sync to WordPress if enabled
        if (autoSyncEnabled && result) {
          triggerAutoSync(result.id);
        }

        return result;
      } else if (articleId) {
        const result = await updateMutation.mutateAsync({
          id: articleId,
          updates: {
            ...values,
            status: 'published',
          } as Partial<BlogFormData>,
          expectedUpdatedAt: article?.updated_at,
        });

        // Create publish version (major version)
        await createVersionMutation.mutateAsync({
          article_id: articleId,
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || undefined,
          trigger_type: 'publish',
        });

        setLastSavedAt(new Date());
        toast.success('Article publié', {
          description: autoSyncEnabled ? 'Synchronisation vers WordPress...' : undefined,
        });

        // Auto-sync to WordPress if enabled
        if (autoSyncEnabled) {
          triggerAutoSync(articleId);
        }

        return result;
      }
    } catch (error) {
      if (error instanceof StaleArticleError) {
        toast.warning('Conflit de modification', {
          description: error.message,
          duration: 8000,
        });
      } else {
        toast.error('Erreur lors de la publication');
      }
    }

    return null;
  }, [form, isNew, articleId, article, storeId, tenantId, autoSyncEnabled, createMutation, updateMutation, createVersionMutation, triggerAutoSync, setLastSavedAt]);

  return {
    saveDraft,
    saveAndPublish,
    isSaving: updateMutation.isPending || createMutation.isPending || isAutoSyncing,
    isAutoSyncing,
  };
}

/**
 * useArticleEditorForm Hook
 *
 * Manages the article editor form state with React Hook Form + Zod validation
 * Includes auto-save functionality and auto-sync to WordPress
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';

import { useBlogArticle, useUpdateBlogArticle } from './useBlogArticle';
import { useCreateBlogArticle } from './useBlogArticles';
import { useCreateArticleVersion } from './useArticleVersions';
import { useAutoSync } from '@/hooks/sync/usePushToStore';
import {
  articleFormSchema,
  generateSlug,
  type ArticleForm,
} from '@/schemas/article-editor';
import type { BlogArticle } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

interface UseArticleEditorFormOptions {
  articleId?: string;
  storeId?: string;
  tenantId?: string;
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
  autoSyncEnabled?: boolean; // Auto-push to WordPress after save
}

interface UseArticleEditorFormReturn {
  // Form
  form: UseFormReturn<ArticleForm>;
  isNew: boolean;
  isDirty: boolean;

  // Article data
  article: BlogArticle | null | undefined;
  isLoading: boolean;
  isError: boolean;

  // Save operations
  saveDraft: () => Promise<BlogArticle | null>;
  saveAndPublish: () => Promise<BlogArticle | null>;
  isSaving: boolean;
  isAutoSyncing: boolean;

  // Auto-save
  lastSavedAt: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Helpers
  generateSlugFromTitle: () => void;
  resetForm: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const getDefaultValues = (article?: BlogArticle | null): ArticleForm => {
  // Extract data from custom_fields (metadata from WordPress sync)
  const customFields = (article as any)?.custom_fields || {};
  const seoData = (article as any)?.seo_data || {};
  const taxonomies = (article as any)?.taxonomies || {};
  const author = (article as any)?.author || {};

  return {
    // === CONTENU ===
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',

    // === MÉDIAS ===
    featured_image_url: article?.featured_image_url || (article as any)?.featured_image || '',
    featured_image_alt: (article as any)?.featured_image_alt || customFields?._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '',

    // === ORGANISATION ===
    category: article?.category || taxonomies?.categories?.[0]?.name || '',
    tags: article?.tags || taxonomies?.tags?.map((t: any) => t.name) || [],

    // === SEO ===
    seo_title: article?.seo_title || seoData?.title || '',
    seo_description: article?.seo_description || seoData?.description || '',
    seo_og_image: article?.seo_og_image || seoData?.og_image || '',
    seo_canonical_url: article?.seo_canonical_url || seoData?.canonical || '',
    no_index: seoData?.robots?.index === 'noindex' || false,

    // === PUBLICATION ===
    status: (article?.status as ArticleForm['status']) || 'draft',
    author_id: article?.author_id || null,
    publish_mode: article?.status === 'scheduled' ? 'scheduled' : 'draft',
    scheduled_at: null,
    platforms: ['flowz'],

    // === PARAMÈTRES WORDPRESS (from sync) ===
    comment_status: customFields?.comment_status || 'open',
    ping_status: customFields?.ping_status || 'closed',
    sticky: customFields?.sticky || false,
    format: customFields?.format || 'standard',
    template: customFields?.template || '',

    // === DONNÉES DE SYNC (readonly) ===
    platform_post_id: (article as any)?.platform_post_id || customFields?.id?.toString() || null,
    link: customFields?.link || null,

    // === AUTEUR WORDPRESS ===
    wp_author_id: author?.id || customFields?._embedded?.author?.[0]?.id || null,
    wp_author_name: author?.name || customFields?._embedded?.author?.[0]?.name || null,
  };
};

// ============================================================================
// HOOK
// ============================================================================

export function useArticleEditorForm(
  options: UseArticleEditorFormOptions = {}
): UseArticleEditorFormReturn {
  const {
    articleId,
    storeId,
    tenantId,
    autoSaveEnabled = true,
    autoSaveIntervalMs = 30000, // 30 seconds
    autoSyncEnabled = true, // Auto-push to WordPress
  } = options;

  // Auto-sync hook
  const { triggerAutoSync, isAutoSyncing } = useAutoSync('article');

  const isNew = !articleId;

  // Queries & Mutations
  const { data: article, isLoading, isError } = useBlogArticle(articleId, {
    enabled: !!articleId,
  });
  const updateMutation = useUpdateBlogArticle();
  const createMutation = useCreateBlogArticle();
  const createVersionMutation = useCreateArticleVersion();

  // Form
  const form = useForm<ArticleForm>({
    resolver: zodResolver(articleFormSchema) as any,
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  // Auto-save state
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const pendingChangesRef = useRef<Partial<ArticleForm> | null>(null);
  const articleIdRef = useRef<string | undefined>(articleId);

  // Track if form has been initialized with article data
  const initializedRef = useRef(false);

  // Initialize form when article loads
  useEffect(() => {
    if (article && !initializedRef.current) {
      form.reset(getDefaultValues(article));
      initializedRef.current = true;
    }
  }, [article, form]);

  // Update articleId ref
  useEffect(() => {
    articleIdRef.current = articleId;
  }, [articleId]);

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  const performAutoSave = useCallback(async () => {
    if (!pendingChangesRef.current || !articleIdRef.current) return;

    const changes = pendingChangesRef.current;
    pendingChangesRef.current = null;

    setAutoSaveStatus('saving');

    try {
      await updateMutation.mutateAsync({
        id: articleIdRef.current,
        updates: changes as any,
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
    } catch (error) {
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

  // ============================================================================
  // SAVE OPERATIONS
  // ============================================================================

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
            } as any,
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
          } as any,
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
      toast.error('Erreur lors de la sauvegarde');
    }

    return null;
  }, [form, isNew, articleId, storeId, tenantId, autoSyncEnabled, createMutation, updateMutation, createVersionMutation, triggerAutoSync]);

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
            } as any,
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
          } as any,
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
      toast.error('Erreur lors de la publication');
    }

    return null;
  }, [form, isNew, articleId, storeId, tenantId, autoSyncEnabled, createMutation, updateMutation, createVersionMutation, triggerAutoSync]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const generateSlugFromTitle = useCallback(() => {
    const title = form.getValues('title');
    if (title) {
      form.setValue('slug', generateSlug(title), { shouldDirty: true });
    }
  }, [form]);

  const resetForm = useCallback(() => {
    if (article) {
      form.reset(getDefaultValues(article));
    } else {
      form.reset(getDefaultValues());
    }
    initializedRef.current = !!article;
  }, [form, article]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    form,
    isNew,
    isDirty: form.formState.isDirty,

    article,
    isLoading,
    isError,

    saveDraft,
    saveAndPublish,
    isSaving: updateMutation.isPending || createMutation.isPending || isAutoSyncing,
    isAutoSyncing,

    lastSavedAt,
    autoSaveStatus,

    generateSlugFromTitle,
    resetForm,
  };
}

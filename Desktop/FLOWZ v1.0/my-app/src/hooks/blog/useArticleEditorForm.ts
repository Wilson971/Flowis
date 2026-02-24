/**
 * useArticleEditorForm Hook
 *
 * Manages the article editor form state with React Hook Form + Zod validation.
 * Composes useArticleAutoSave and useArticleSave for auto-save and save operations.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useBlogArticle } from './useBlogArticle';
import { useArticleAutoSave } from './useArticleAutoSave';
import { useArticleSave } from './useArticleSave';
import {
  articleFormSchema,
  generateSlug,
  type ArticleForm,
} from '@/schemas/article-editor';
import type { BlogArticle } from '@/types/blog';
import type {
  BlogArticleSyncFields,
  ArticleCustomFields,
  ArticleSeoData,
  ArticleTaxonomies,
  ArticleAuthor,
} from '@/types/product-content';

/** BlogArticle with optional WordPress sync fields */
type ArticleWithSync = BlogArticle & Partial<BlogArticleSyncFields>;

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
  const a = article as ArticleWithSync | null | undefined;
  const customFields: ArticleCustomFields = a?.custom_fields || {};
  const seoData: ArticleSeoData = a?.seo_data || {};
  const taxonomies: ArticleTaxonomies = a?.taxonomies || {};
  const author: ArticleAuthor = a?.author || {};

  return {
    // === CONTENU ===
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',

    // === MÉDIAS ===
    featured_image_url: article?.featured_image_url || a?.featured_image || '',
    featured_image_alt: a?.featured_image_alt || customFields?._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '',

    // === ORGANISATION ===
    category: article?.category || taxonomies?.categories?.[0]?.name || '',
    tags: article?.tags || taxonomies?.tags?.map((t) => t.name) || [],

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
    platform_post_id: a?.platform_post_id || customFields?.id?.toString() || null,
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
    autoSaveIntervalMs = 30000,
    autoSyncEnabled = true,
  } = options;

  const isNew = !articleId;

  // Queries
  const { data: article, isLoading, isError } = useBlogArticle(articleId, {
    enabled: !!articleId,
  });

  // Form
  const form = useForm<ArticleForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type mismatch between zod v4 and react-hook-form resolver types
    resolver: zodResolver(articleFormSchema) as any,
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  // Track if form has been initialized with article data
  const initializedRef = useRef(false);

  // Initialize form when article loads
  useEffect(() => {
    if (article && !initializedRef.current) {
      form.reset(getDefaultValues(article));
      initializedRef.current = true;
    }
  }, [article, form]);

  // ============================================================================
  // COMPOSED HOOKS
  // ============================================================================

  const { lastSavedAt, autoSaveStatus, setLastSavedAt } = useArticleAutoSave({
    form,
    articleId,
    article,
    autoSaveEnabled,
    autoSaveIntervalMs,
    isNew,
  });

  const { saveDraft, saveAndPublish, isSaving, isAutoSyncing } = useArticleSave({
    form,
    isNew,
    articleId,
    article,
    storeId,
    tenantId,
    autoSyncEnabled,
    setLastSavedAt,
  });

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
    isSaving,
    isAutoSyncing,

    lastSavedAt,
    autoSaveStatus,

    generateSlugFromTitle,
    resetForm,
  };
}

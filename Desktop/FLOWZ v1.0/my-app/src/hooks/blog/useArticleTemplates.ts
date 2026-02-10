/**
 * useArticleTemplates Hook
 *
 * Manage article templates:
 * - CRUD operations for templates
 * - Apply template to article
 * - Save article as template
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'callout';
  placeholder?: string;
  required?: boolean;
}

export interface TemplateStructure {
  sections: TemplateSection[];
}

export interface SeoTemplate {
  title_pattern?: string;
  description_pattern?: string;
  keywords?: string[];
}

export interface ArticleTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  structure: TemplateStructure;
  content_template: string | null;
  seo_template: SeoTemplate | null;
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  category?: string;
  structure?: TemplateStructure;
  content_template?: string;
  seo_template?: SeoTemplate;
}

export interface UpdateTemplateParams {
  id: string;
  updates: Partial<Omit<ArticleTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const articleTemplatesKeys = {
  all: ['article-templates'] as const,
  list: () => [...articleTemplatesKeys.all, 'list'] as const,
  detail: (id: string) => [...articleTemplatesKeys.all, 'detail', id] as const,
  favorites: () => [...articleTemplatesKeys.all, 'favorites'] as const,
  byCategory: (category: string) => [...articleTemplatesKeys.all, 'category', category] as const,
};

// ============================================================================
// FETCH TEMPLATES
// ============================================================================

interface UseArticleTemplatesOptions {
  category?: string;
  favoritesOnly?: boolean;
  enabled?: boolean;
}

export function useArticleTemplates(options: UseArticleTemplatesOptions = {}) {
  const { category, favoritesOnly = false, enabled = true } = options;
  const supabase = createClient();

  return useQuery({
    queryKey: favoritesOnly
      ? articleTemplatesKeys.favorites()
      : category
        ? articleTemplatesKeys.byCategory(category)
        : articleTemplatesKeys.list(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      let query = supabase
        .from('article_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false });

      if (favoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ArticleTemplate[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// FETCH SINGLE TEMPLATE
// ============================================================================

export function useArticleTemplate(templateId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: articleTemplatesKeys.detail(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data as ArticleTemplate;
    },
    enabled: enabled && !!templateId,
  });
}

// ============================================================================
// CREATE TEMPLATE
// ============================================================================

export function useCreateArticleTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      const { data, error } = await supabase
        .from('article_templates')
        .insert({
          user_id: user.id,
          name: params.name,
          description: params.description || null,
          category: params.category || null,
          structure: params.structure || { sections: [] },
          content_template: params.content_template || null,
          seo_template: params.seo_template || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ArticleTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success('Template cree', {
        description: `"${data.name}" a ete cree avec succes.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de creer le template.',
      });
    },
  });
}

// ============================================================================
// UPDATE TEMPLATE
// ============================================================================

export function useUpdateArticleTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTemplateParams) => {
      const { data, error } = await supabase
        .from('article_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArticleTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success('Template mis a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre a jour le template.',
      });
    },
  });
}

// ============================================================================
// DELETE TEMPLATE
// ============================================================================

export function useDeleteArticleTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('article_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success('Template supprime');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le template.',
      });
    },
  });
}

// ============================================================================
// TOGGLE FAVORITE
// ============================================================================

export function useToggleTemplateFavorite() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from('article_templates')
        .update({ is_favorite: isFavorite })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArticleTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success(data.is_favorite ? 'Ajoute aux favoris' : 'Retire des favoris');
    },
  });
}

// ============================================================================
// SAVE ARTICLE AS TEMPLATE
// ============================================================================

interface SaveAsTemplateParams {
  articleId: string;
  name: string;
  description?: string;
  category?: string;
}

export function useSaveArticleAsTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: SaveAsTemplateParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      // Fetch article content
      const { data: article, error: articleError } = await supabase
        .from('blog_articles')
        .select('title, content, excerpt, seo_title, seo_description, tags, category')
        .eq('id', params.articleId)
        .single();

      if (articleError || !article) {
        throw new Error('Article introuvable');
      }

      // Create template from article
      const { data, error } = await supabase
        .from('article_templates')
        .insert({
          user_id: user.id,
          name: params.name,
          description: params.description || `Template cree depuis "${article.title}"`,
          category: params.category || article.category,
          content_template: article.content,
          seo_template: {
            title_pattern: article.seo_title,
            description_pattern: article.seo_description,
            keywords: article.tags || [],
          },
          structure: { sections: [] },
        })
        .select()
        .single();

      if (error) throw error;
      return data as ArticleTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success('Template cree depuis l\'article', {
        description: `"${data.name}" est pret a etre utilise.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de creer le template.',
      });
    },
  });
}

// ============================================================================
// APPLY TEMPLATE TO ARTICLE
// ============================================================================

interface ApplyTemplateParams {
  templateId: string;
  articleId: string;
}

export function useApplyTemplateToArticle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ templateId, articleId }: ApplyTemplateParams) => {
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('article_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        throw new Error('Template introuvable');
      }

      // Update article with template content
      const updates: Record<string, unknown> = {
        template_id: templateId,
        updated_at: new Date().toISOString(),
      };

      if (template.content_template) {
        updates.content = template.content_template;
      }

      if (template.seo_template) {
        const seoTemplate = template.seo_template as SeoTemplate;
        if (seoTemplate.title_pattern) {
          updates.seo_title = seoTemplate.title_pattern;
        }
        if (seoTemplate.description_pattern) {
          updates.seo_description = seoTemplate.description_pattern;
        }
        if (seoTemplate.keywords?.length) {
          updates.tags = seoTemplate.keywords;
        }
      }

      const { data, error } = await supabase
        .from('blog_articles')
        .update(updates)
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      // Increment usage count
      await supabase
        .from('article_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      return { article: data, template: template as ArticleTemplate };
    },
    onSuccess: ({ template }) => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      queryClient.invalidateQueries({ queryKey: articleTemplatesKeys.all });
      toast.success('Template applique', {
        description: `Le contenu de "${template.name}" a ete applique.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'appliquer le template.',
      });
    },
  });
}

// ============================================================================
// GET TEMPLATE CATEGORIES
// ============================================================================

export function useTemplateCategories() {
  const supabase = createClient();

  return useQuery({
    queryKey: [...articleTemplatesKeys.all, 'categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('article_templates')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (error) return [];

      // Extract unique categories
      const categories = [...new Set(data?.map((t) => t.category).filter(Boolean))] as string[];
      return categories.sort();
    },
    staleTime: 5 * 60 * 1000,
  });
}

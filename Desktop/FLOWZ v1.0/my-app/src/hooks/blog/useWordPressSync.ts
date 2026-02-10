/**
 * useWordPressSync Hook
 *
 * Manage WordPress blog sync using STORE configuration:
 * - Uses active store's shop_url as WordPress URL
 * - WordPress REST API credentials stored in store metadata
 * - Push articles to WordPress
 * - Track sync status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useActiveStore, useUpdateStore } from '@/hooks/stores/useStores';
import type { Store, StoreMetadata } from '@/types/store';

// ============================================================================
// TYPES
// ============================================================================

export type WordPressSyncStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'conflict';

export interface WordPressBlogConfig {
  wp_username: string;
  wp_app_password: string;
  default_status: 'draft' | 'publish' | 'pending';
  default_category_id: number | null;
  sync_featured_images: boolean;
  sync_categories: boolean;
  sync_tags: boolean;
  last_sync_at: string | null;
  last_error: string | null;
}

export interface WordPressSyncResult {
  success: boolean;
  wordpress_post_id?: string;
  wordpress_url?: string;
  error?: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// Extend StoreMetadata to include WordPress blog config
declare module '@/types/store' {
  interface StoreMetadata {
    wordpress_blog?: WordPressBlogConfig;
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const wordPressSyncKeys = {
  all: ['wordpress-sync'] as const,
  config: (storeId?: string) => [...wordPressSyncKeys.all, 'config', storeId] as const,
  categories: (storeId?: string) => [...wordPressSyncKeys.all, 'categories', storeId] as const,
  tags: (storeId?: string) => [...wordPressSyncKeys.all, 'tags', storeId] as const,
  status: (articleId: string) => [...wordPressSyncKeys.all, 'status', articleId] as const,
};

// ============================================================================
// HELPER: Extract WordPress config from store
// ============================================================================

function getWordPressConfigFromStore(store: Store | null): {
  siteUrl: string | null;
  siteName: string | null;
  config: WordPressBlogConfig | null;
  isConfigured: boolean;
} {
  if (!store) {
    return { siteUrl: null, siteName: null, config: null, isConfigured: false };
  }

  const siteUrl = store.platform_connections?.shop_url || null;
  const siteName = store.name;
  const config = (store.metadata?.wordpress_blog as WordPressBlogConfig) || null;
  const isConfigured = !!(siteUrl && config?.wp_username && config?.wp_app_password);

  return { siteUrl, siteName, config, isConfigured };
}

// ============================================================================
// FETCH WORDPRESS CONFIG FROM ACTIVE STORE
// ============================================================================

export function useWordPressConfig() {
  const { data: activeStore, isLoading: isLoadingStore } = useActiveStore();

  const { siteUrl, siteName, config, isConfigured } = getWordPressConfigFromStore(activeStore || null);

  return {
    data: config ? {
      ...config,
      wp_site_url: siteUrl,
      site_name: siteName,
      is_active: isConfigured,
    } : null,
    isLoading: isLoadingStore,
    store: activeStore,
    siteUrl,
    siteName,
    isConfigured,
  };
}

// ============================================================================
// SAVE WORDPRESS CONFIG TO STORE METADATA
// ============================================================================

interface SaveConfigParams {
  wp_username: string;
  wp_app_password: string;
  default_status?: 'draft' | 'publish' | 'pending';
  default_category_id?: number | null;
  sync_featured_images?: boolean;
  sync_categories?: boolean;
  sync_tags?: boolean;
}

export function useSaveWordPressConfig() {
  const queryClient = useQueryClient();
  const { data: activeStore } = useActiveStore();
  const updateStore = useUpdateStore();

  return useMutation({
    mutationFn: async (params: SaveConfigParams) => {
      if (!activeStore) {
        throw new Error('Aucun store actif');
      }

      const wordpressConfig: WordPressBlogConfig = {
        wp_username: params.wp_username,
        wp_app_password: params.wp_app_password,
        default_status: params.default_status || 'draft',
        default_category_id: params.default_category_id || null,
        sync_featured_images: params.sync_featured_images ?? true,
        sync_categories: params.sync_categories ?? true,
        sync_tags: params.sync_tags ?? true,
        last_sync_at: null,
        last_error: null,
      };

      // Update store metadata with WordPress config
      const updatedMetadata: StoreMetadata = {
        ...activeStore.metadata,
        wordpress_blog: wordpressConfig,
      };

      await updateStore.mutateAsync({
        id: activeStore.id,
        metadata: updatedMetadata,
      });

      return wordpressConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordPressSyncKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Configuration WordPress sauvegardee');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de sauvegarder la configuration.',
      });
    },
  });
}

// ============================================================================
// TEST WORDPRESS CONNECTION
// ============================================================================

export function useTestWordPressConnection() {
  const { siteUrl } = useWordPressConfig();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (credentials: { wp_username: string; wp_app_password: string }) => {
      if (!siteUrl) {
        throw new Error('URL du site non configuree dans le store');
      }

      // Call edge function to test connection
      const { data, error } = await supabase.functions.invoke('wordpress-connection-test', {
        body: {
          site_url: siteUrl,
          username: credentials.wp_username,
          app_password: credentials.wp_app_password,
        },
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Connection echouee');
      }

      return {
        success: true,
        site_name: data.site_name,
        categories: data.categories as WordPressCategory[],
        tags: data.tags as WordPressTag[],
      };
    },
    onSuccess: () => {
      toast.success('Connection WordPress reussie');
    },
    onError: (error: Error) => {
      toast.error('Echec de connexion', {
        description: error.message || 'Verifiez vos identifiants WordPress.',
      });
    },
  });
}

// ============================================================================
// PUSH ARTICLE TO WORDPRESS
// ============================================================================

interface PushToWordPressParams {
  articleId: string;
  status?: 'draft' | 'publish' | 'pending';
  categoryId?: number;
  tags?: string[];
}

export function usePushToWordPress() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: activeStore } = useActiveStore();

  return useMutation({
    mutationFn: async (params: PushToWordPressParams) => {
      if (!activeStore) {
        throw new Error('Aucun store actif');
      }

      // Update article sync status to pending
      await supabase
        .from('blog_articles')
        .update({ wordpress_sync_status: 'pending' })
        .eq('id', params.articleId);

      // Call edge function to push article
      const { data, error } = await supabase.functions.invoke('push-article-to-wordpress', {
        body: {
          article_id: params.articleId,
          store_id: activeStore.id,
          status: params.status || 'draft',
          category_id: params.categoryId,
          tags: params.tags,
        },
      });

      if (error) throw error;
      if (!data.success) {
        // Update sync status to failed
        await supabase
          .from('blog_articles')
          .update({
            wordpress_sync_status: 'failed',
          })
          .eq('id', params.articleId);

        throw new Error(data.error || 'Sync WordPress echoue');
      }

      // Update article with WordPress post ID and status
      await supabase
        .from('blog_articles')
        .update({
          wordpress_post_id: data.wordpress_post_id,
          wordpress_sync_status: 'synced',
          wordpress_last_synced_at: new Date().toISOString(),
        })
        .eq('id', params.articleId);

      return {
        success: true,
        wordpress_post_id: data.wordpress_post_id,
        wordpress_url: data.wordpress_url,
      } as WordPressSyncResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success('Article pousse vers WordPress', {
        description: 'L\'article a ete synchronise avec succes.',
        action: result.wordpress_url
          ? {
              label: 'Voir',
              onClick: () => window.open(result.wordpress_url, '_blank'),
            }
          : undefined,
      });
    },
    onError: (error: Error) => {
      toast.error('Echec de la synchronisation', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// FETCH WORDPRESS CATEGORIES
// ============================================================================

export function useWordPressCategories() {
  const { isConfigured, store } = useWordPressConfig();
  const supabase = createClient();

  return useQuery({
    queryKey: wordPressSyncKeys.categories(store?.id),
    queryFn: async () => {
      if (!store) return [];

      const { data, error } = await supabase.functions.invoke('wordpress-fetch-taxonomies', {
        body: {
          store_id: store.id,
          type: 'categories',
        },
      });

      if (error) throw error;
      return (data.categories || []) as WordPressCategory[];
    },
    enabled: isConfigured,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// FETCH WORDPRESS TAGS
// ============================================================================

export function useWordPressTags() {
  const { isConfigured, store } = useWordPressConfig();
  const supabase = createClient();

  return useQuery({
    queryKey: wordPressSyncKeys.tags(store?.id),
    queryFn: async () => {
      if (!store) return [];

      const { data, error } = await supabase.functions.invoke('wordpress-fetch-taxonomies', {
        body: {
          store_id: store.id,
          type: 'tags',
        },
      });

      if (error) throw error;
      return (data.tags || []) as WordPressTag[];
    },
    enabled: isConfigured,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// COMBINED HOOK FOR ARTICLE EDITOR
// ============================================================================

interface UseWordPressSyncOptions {
  articleId?: string;
}

export function useWordPressSync(options: UseWordPressSyncOptions = {}) {
  const { articleId } = options;

  const wpConfig = useWordPressConfig();
  const saveConfig = useSaveWordPressConfig();
  const testConnection = useTestWordPressConnection();
  const pushToWordPress = usePushToWordPress();
  const categories = useWordPressCategories();
  const tags = useWordPressTags();

  // Get article sync status
  const supabase = createClient();
  const articleStatus = useQuery({
    queryKey: wordPressSyncKeys.status(articleId || ''),
    queryFn: async () => {
      if (!articleId) return null;

      const { data, error } = await supabase
        .from('blog_articles')
        .select('wordpress_post_id, wordpress_sync_status, wordpress_last_synced_at')
        .eq('id', articleId)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!articleId,
  });

  return {
    // Config from store
    config: wpConfig.data,
    store: wpConfig.store,
    siteUrl: wpConfig.siteUrl,
    siteName: wpConfig.siteName,
    isConfigured: wpConfig.isConfigured,
    isLoadingConfig: wpConfig.isLoading,
    saveConfig: saveConfig.mutateAsync,
    isSavingConfig: saveConfig.isPending,

    // Connection test
    testConnection: testConnection.mutateAsync,
    isTestingConnection: testConnection.isPending,

    // Push to WordPress
    pushToWordPress: pushToWordPress.mutateAsync,
    isPushing: pushToWordPress.isPending,

    // Taxonomies
    categories: categories.data || [],
    tags: tags.data || [],
    isLoadingTaxonomies: categories.isLoading || tags.isLoading,

    // Article status
    articleSyncStatus: articleStatus.data?.wordpress_sync_status as WordPressSyncStatus | null,
    wordpressPostId: articleStatus.data?.wordpress_post_id,
    lastSyncedAt: articleStatus.data?.wordpress_last_synced_at,
    isSynced: articleStatus.data?.wordpress_sync_status === 'synced',
  };
}

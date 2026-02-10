/**
 * useArticleSync Hook
 *
 * Manages article synchronization and publication
 * Supports immediate publishing and scheduled publishing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { blogArticlesKeys } from './useBlogArticles';
import {
  type PublishPlatform,
  type SyncStatus,
  type SyncLog,
  type PublishOptions,
  PLATFORM_LABELS,
  SYNC_STATUS_LABELS,
} from '@/schemas/article-editor';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of automatic retry attempts for failed syncs (CDC R-13) */
const MAX_RETRY_ATTEMPTS = 3;
/** Base delay between retries in milliseconds (exponential backoff) */
const RETRY_BASE_DELAY_MS = 1000;

// ============================================================================
// TYPES
// ============================================================================

interface PlatformConnection {
  platform: PublishPlatform;
  connected: boolean;
  lastSynced?: string;
}

interface UseArticleSyncOptions {
  articleId: string;
  enabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param baseDelay - Base delay in ms (doubles each attempt)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = RETRY_BASE_DELAY_MS
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

interface UseArticleSyncReturn {
  // Status
  syncStatus: SyncStatus;
  isPublished: boolean;
  isScheduled: boolean;
  scheduledAt: string | null;

  // Platform connections
  connectedPlatforms: PlatformConnection[];

  // Sync logs
  syncLogs: SyncLog[];
  isLoadingLogs: boolean;

  // Actions
  publishNow: (platforms: PublishPlatform[]) => Promise<boolean>;
  schedulePublish: (options: PublishOptions) => Promise<boolean>;
  cancelSchedule: () => Promise<boolean>;
  retrySync: (platform: PublishPlatform) => Promise<boolean>;
  unpublish: () => Promise<boolean>;

  // State
  isPublishing: boolean;
  isScheduling: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const articleSyncKeys = {
  all: ['article-sync'] as const,
  logs: (articleId: string) => [...articleSyncKeys.all, 'logs', articleId] as const,
  status: (articleId: string) => [...articleSyncKeys.all, 'status', articleId] as const,
  platforms: () => [...articleSyncKeys.all, 'platforms'] as const,
};

// ============================================================================
// HOOK
// ============================================================================

export function useArticleSync(options: UseArticleSyncOptions): UseArticleSyncReturn {
  const { articleId, enabled = true } = options;
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Local state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Fetch article sync status
  const { data: articleData } = useQuery({
    queryKey: articleSyncKeys.status(articleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('status, published_at, metadata')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!articleId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch sync logs
  const { data: syncLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: articleSyncKeys.logs(articleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_sync_logs')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Table might not exist yet
        console.warn('Sync logs table not found:', error.message);
        return [];
      }
      return data as SyncLog[];
    },
    enabled: enabled && !!articleId,
    staleTime: 60000, // 1 minute
  });

  // Fetch connected platforms (from store settings)
  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: articleSyncKeys.platforms(),
    queryFn: async (): Promise<PlatformConnection[]> => {
      // For now, return static platforms
      // In a real implementation, this would check store connections
      const { data: storeData } = await supabase
        .from('stores')
        .select('woo_url, woo_connected')
        .limit(1)
        .single();

      const platforms: PlatformConnection[] = [
        {
          platform: 'flowz',
          connected: true, // Always connected locally
        },
        {
          platform: 'woocommerce',
          connected: !!storeData?.woo_connected,
        },
        {
          platform: 'wordpress',
          connected: false, // Not implemented yet
        },
      ];

      return platforms;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const syncStatus: SyncStatus = (() => {
    if (!articleData) return 'draft';

    const status = articleData.status;
    const metadata = articleData.metadata as Record<string, unknown> | null;

    if (status === 'published' || status === 'publish') {
      const hasFailedSync = syncLogs.some((log) => log.status === 'failed');
      const hasPartialSync = syncLogs.some((log) => log.status === 'synced') && hasFailedSync;

      if (hasPartialSync) return 'partial';
      if (hasFailedSync) return 'failed';
      return 'synced';
    }

    if (status === 'scheduled') return 'pending';
    if (metadata?.sync_status === 'syncing') return 'syncing';

    return 'draft';
  })();

  const isPublished = articleData?.status === 'published' || articleData?.status === 'publish';
  const isScheduled = articleData?.status === 'scheduled';
  const scheduledAt = (articleData?.metadata as Record<string, string> | null)?.scheduled_at || null;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const publishMutation = useMutation({
    mutationFn: async (platforms: PublishPlatform[]) => {
      // Update article status
      const { error: updateError } = await supabase
        .from('blog_articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Create sync logs for each platform
      const syncPromises = platforms.map(async (platform) => {
        // Log the sync attempt
        await supabase.from('article_sync_logs').insert({
          article_id: articleId,
          platform,
          status: 'syncing',
          created_at: new Date().toISOString(),
        }).select().single().catch(() => null); // Ignore if table doesn't exist

        // Perform platform-specific sync
        try {
          if (platform === 'woocommerce') {
            // Call WooCommerce sync API with auto-retry (CDC R-13: 3 retries)
            const result = await retryWithBackoff(async () => {
              const response = await fetch('/api/sync/woocommerce/article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId }),
              });

              if (!response.ok) {
                throw new Error('WooCommerce sync failed');
              }

              return response.json();
            });

            // Update sync log
            await supabase.from('article_sync_logs').update({
              status: 'synced',
              external_id: result.externalId,
              external_url: result.url,
              synced_at: new Date().toISOString(),
            }).eq('article_id', articleId).eq('platform', platform);

            return { platform, success: true, result };
          }

          // FLOWZ local - already published via status update
          if (platform === 'flowz') {
            await supabase.from('article_sync_logs').update({
              status: 'synced',
              synced_at: new Date().toISOString(),
            }).eq('article_id', articleId).eq('platform', platform).catch(() => null);

            return { platform, success: true };
          }

          return { platform, success: false, error: 'Platform not supported' };
        } catch (error) {
          // Update sync log with error
          await supabase.from('article_sync_logs').update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          }).eq('article_id', articleId).eq('platform', platform).catch(() => null);

          return { platform, success: false, error };
        }
      });

      return Promise.all(syncPromises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.status(articleId) });
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.logs(articleId) });
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success('Article publié', {
          description: `Synchronisé sur ${successCount} plateforme(s)`,
        });
      } else if (successCount > 0) {
        toast.warning('Publication partielle', {
          description: `${successCount} réussi(s), ${failCount} échec(s)`,
        });
      } else {
        toast.error('Échec de la publication', {
          description: 'Aucune plateforme synchronisée',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur de publication', {
        description: error.message,
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (options: PublishOptions) => {
      if (!options.scheduledAt) {
        throw new Error('Date de planification requise');
      }

      // Update article status
      const { error } = await supabase
        .from('blog_articles')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
          metadata: {
            scheduled_at: options.scheduledAt,
            scheduled_platforms: options.platforms,
            timezone: options.timezone,
          },
        })
        .eq('id', articleId);

      if (error) throw error;

      // Create scheduled publication entry
      await supabase.from('scheduled_publications').insert({
        article_id: articleId,
        scheduled_at: options.scheduledAt,
        platforms: options.platforms,
        status: 'pending',
        created_at: new Date().toISOString(),
      }).catch(() => null); // Ignore if table doesn't exist

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.status(articleId) });
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });

      toast.success('Publication planifiée');
    },
    onError: (error: Error) => {
      toast.error('Erreur de planification', {
        description: error.message,
      });
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('blog_articles')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
          metadata: null,
        })
        .eq('id', articleId);

      if (error) throw error;

      // Cancel scheduled publication
      await supabase
        .from('scheduled_publications')
        .update({ status: 'cancelled' })
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .catch(() => null);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.status(articleId) });
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });

      toast.success('Publication annulée');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message,
      });
    },
  });

  const retrySyncMutation = useMutation({
    mutationFn: async (platform: PublishPlatform) => {
      // Similar to publish but only for specific platform
      if (platform === 'woocommerce') {
        const response = await fetch('/api/sync/woocommerce/article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId }),
        });

        if (!response.ok) {
          throw new Error('WooCommerce sync failed');
        }

        const result = await response.json();

        await supabase.from('article_sync_logs').insert({
          article_id: articleId,
          platform,
          status: 'synced',
          external_id: result.externalId,
          external_url: result.url,
          synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }).catch(() => null);

        return { success: true };
      }

      throw new Error(`Retry not supported for ${platform}`);
    },
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.logs(articleId) });
      toast.success(`Synchronisation ${PLATFORM_LABELS[platform]} réussie`);
    },
    onError: (error: Error, platform) => {
      toast.error(`Échec ${PLATFORM_LABELS[platform]}`, {
        description: error.message,
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('blog_articles')
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleSyncKeys.status(articleId) });
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });

      toast.success('Article dépublié');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const publishNow = useCallback(
    async (platforms: PublishPlatform[]): Promise<boolean> => {
      if (platforms.length === 0) {
        toast.error('Sélectionnez au moins une plateforme');
        return false;
      }

      setIsPublishing(true);
      try {
        await publishMutation.mutateAsync(platforms);
        return true;
      } catch {
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [publishMutation]
  );

  const schedulePublish = useCallback(
    async (options: PublishOptions): Promise<boolean> => {
      setIsScheduling(true);
      try {
        await scheduleMutation.mutateAsync(options);
        return true;
      } catch {
        return false;
      } finally {
        setIsScheduling(false);
      }
    },
    [scheduleMutation]
  );

  const cancelSchedule = useCallback(async (): Promise<boolean> => {
    try {
      await cancelScheduleMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [cancelScheduleMutation]);

  const retrySync = useCallback(
    async (platform: PublishPlatform): Promise<boolean> => {
      try {
        await retrySyncMutation.mutateAsync(platform);
        return true;
      } catch {
        return false;
      }
    },
    [retrySyncMutation]
  );

  const unpublish = useCallback(async (): Promise<boolean> => {
    try {
      await unpublishMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [unpublishMutation]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    syncStatus,
    isPublished,
    isScheduled,
    scheduledAt,

    connectedPlatforms,

    syncLogs,
    isLoadingLogs,

    publishNow,
    schedulePublish,
    cancelSchedule,
    retrySync,
    unpublish,

    isPublishing: isPublishing || publishMutation.isPending,
    isScheduling: isScheduling || scheduleMutation.isPending,
  };
}

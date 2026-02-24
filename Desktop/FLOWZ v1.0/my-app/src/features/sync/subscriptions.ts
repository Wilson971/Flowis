/**
 * Sync Subscriptions Manager
 *
 * Gestionnaire centralisé des souscriptions Supabase Realtime.
 * Résout les problèmes de:
 * - Souscriptions multiples non coordonnées
 * - Memory leaks
 * - Race conditions
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { SyncJob } from '@/types/sync';
import type {
    SyncProgressData,
    SyncResult,
    SubscriptionConfig,
    UnsubscribeFn,
} from './types';

// ============================================================================
// SUBSCRIPTION MANAGER
// ============================================================================

interface ChannelInfo {
    channel: RealtimeChannel;
    storeId: string;
    type: 'progress' | 'jobs' | 'logs';
    createdAt: number;
}

class SyncSubscriptionManager {
    private channels: Map<string, ChannelInfo> = new Map();
    private supabase: SupabaseClient | null = null;

    /**
     * Initialise le manager avec le client Supabase
     */
    init(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Génère une clé unique pour un channel
     */
    private getChannelKey(storeId: string, type: string, jobId?: string): string {
        return jobId ? `${type}:${storeId}:${jobId}` : `${type}:${storeId}`;
    }

    /**
     * Souscrit aux mises à jour de progression broadcast
     */
    subscribeToProgress(
        storeId: string,
        onProgress: (progress: SyncProgressData) => void
    ): UnsubscribeFn {
        if (!this.supabase) {
            console.error('[SyncSubscriptions] Supabase not initialized');
            return () => {};
        }

        const key = this.getChannelKey(storeId, 'progress');

        // Réutiliser le channel existant si disponible
        if (this.channels.has(key)) {

            return () => this.unsubscribe(key);
        }

        const channel = this.supabase.channel(`sync_progress:${storeId}`);

        channel
            .on('broadcast', { event: 'progress' }, ({ payload }) => {
                const p = payload as SyncProgressData & { timestamp?: number };
                onProgress({
                    phase: p.phase,
                    current: p.current,
                    total: p.total,
                    message: p.message,
                    percent: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
                    timestamp: p.timestamp,
                });
            })
            .subscribe();

        this.channels.set(key, {
            channel,
            storeId,
            type: 'progress',
            createdAt: Date.now(),
        });

        return () => this.unsubscribe(key);
    }

    /**
     * Souscrit aux mises à jour de jobs (postgres changes)
     */
    subscribeToJobs(
        storeId: string,
        onJobUpdate: (job: SyncJob) => void,
        onComplete?: (job: SyncJob) => void,
        onFail?: (job: SyncJob, error: string) => void
    ): UnsubscribeFn {
        if (!this.supabase) {
            console.error('[SyncSubscriptions] Supabase not initialized');
            return () => {};
        }

        const key = this.getChannelKey(storeId, 'jobs');

        if (this.channels.has(key)) {

            return () => this.unsubscribe(key);
        }

        const channel = this.supabase.channel(`sync_jobs:${storeId}`);

        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sync_jobs',
                    filter: `store_id=eq.${storeId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const job = payload.new as SyncJob;
                        onJobUpdate(job);

                        // Détecter completion/failure
                        if (job.status === 'completed' && onComplete) {
                            onComplete(job);
                        } else if (
                            (job.status === 'failed' || job.status === 'error') &&
                            onFail
                        ) {
                            onFail(job, job.error_message || 'Unknown error');
                        }
                    }
                }
            )
            .subscribe();

        this.channels.set(key, {
            channel,
            storeId,
            type: 'jobs',
            createdAt: Date.now(),
        });

        return () => this.unsubscribe(key);
    }

    /**
     * Souscrit aux logs d'un job spécifique
     */
    subscribeToLogs(
        jobId: string,
        storeId: string,
        onLog: (log: { message: string; type: string }) => void
    ): UnsubscribeFn {
        if (!this.supabase) {
            console.error('[SyncSubscriptions] Supabase not initialized');
            return () => {};
        }

        const key = this.getChannelKey(storeId, 'logs', jobId);

        if (this.channels.has(key)) {
            return () => this.unsubscribe(key);
        }

        const channel = this.supabase.channel(`sync_logs:${jobId}`);

        channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sync_logs',
                    filter: `job_id=eq.${jobId}`,
                },
                (payload) => {
                    const log = payload.new as { message: string; type: string };
                    onLog(log);
                }
            )
            .subscribe();

        this.channels.set(key, {
            channel,
            storeId,
            type: 'logs',
            createdAt: Date.now(),
        });

        return () => this.unsubscribe(key);
    }

    /**
     * Souscription unifiée pour un store
     */
    subscribeToStore(config: SubscriptionConfig): UnsubscribeFn {
        const unsubscribers: UnsubscribeFn[] = [];

        // Progress broadcast
        if (config.onProgress) {
            unsubscribers.push(
                this.subscribeToProgress(config.storeId, config.onProgress)
            );
        }

        // Jobs postgres changes
        unsubscribers.push(
            this.subscribeToJobs(
                config.storeId,
                (job) => config.onJobUpdate?.(job),
                (job) => {
                    if (config.onComplete) {
                        config.onComplete({
                            success: true,
                            productsImported: job.synced_products,
                            variationsImported: job.synced_variations,
                            categoriesImported: job.synced_categories,
                            postsImported: job.synced_posts ?? 0,
                            errors: [],
                            durationSeconds: job.completed_at
                                ? Math.round(
                                      (new Date(job.completed_at).getTime() -
                                          new Date(job.started_at).getTime()) /
                                          1000
                                  )
                                : 0,
                            completedAt: job.completed_at ?? new Date().toISOString(),
                        });
                    }
                },
                (job, error) => config.onError?.(error)
            )
        );

        // Logs si job spécifié
        if (config.jobId) {
            unsubscribers.push(
                this.subscribeToLogs(config.jobId, config.storeId, (log) => {
                    // Les logs peuvent être traités ici si nécessaire
                    // Log received — could be forwarded to UI if needed
                })
            );
        }

        // Retourner une fonction de cleanup combinée
        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }

    /**
     * Désinscrit un channel spécifique
     */
    private unsubscribe(key: string) {
        const info = this.channels.get(key);
        if (info && this.supabase) {

            this.supabase.removeChannel(info.channel);
            this.channels.delete(key);
        }
    }

    /**
     * Désinscrit tous les channels d'un store
     */
    unsubscribeFromStore(storeId: string) {
        const keysToRemove: string[] = [];

        this.channels.forEach((info, key) => {
            if (info.storeId === storeId) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach((key) => this.unsubscribe(key));
    }

    /**
     * Nettoie tous les channels
     */
    cleanup() {



        this.channels.forEach((info, key) => {
            if (this.supabase) {
                this.supabase.removeChannel(info.channel);
            }
        });

        this.channels.clear();
    }

    /**
     * Retourne le nombre de channels actifs
     */
    getActiveChannelCount(): number {
        return this.channels.size;
    }

    /**
     * Debug: liste les channels actifs
     */
    listChannels(): { key: string; type: string; storeId: string; age: number }[] {
        const now = Date.now();
        return Array.from(this.channels.entries()).map(([key, info]) => ({
            key,
            type: info.type,
            storeId: info.storeId,
            age: Math.round((now - info.createdAt) / 1000),
        }));
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const syncSubscriptions = new SyncSubscriptionManager();

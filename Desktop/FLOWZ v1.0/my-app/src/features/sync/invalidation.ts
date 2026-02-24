/**
 * Query Invalidation Manager
 *
 * Gère l'invalidation des queries React Query de manière optimisée:
 * - Debouncing pour éviter les cascades de refetch
 * - Batching des invalidations
 * - Priorisation des queries critiques
 */

import type { QueryClient } from '@tanstack/react-query';
import type { InvalidationConfig, QueryKeyPattern } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DEBOUNCE_MS = 500;
const MAX_BATCH_SIZE = 10;

// ============================================================================
// INVALIDATION PATTERNS
// ============================================================================

/**
 * Patterns de queries à invalider par événement
 */
export const invalidationPatterns = {
    // Après sync complète
    syncComplete: (storeId: string): QueryKeyPattern[] => [
        ['products', storeId],
        ['categories', storeId],
        ['store-stats', storeId],
        ['sync-jobs', storeId],
        ['stores'],
    ],

    // Pendant la sync (minimal)
    syncProgress: (storeId: string): QueryKeyPattern[] => [
        ['sync-jobs', storeId],
    ],

    // Après erreur
    syncError: (storeId: string): QueryKeyPattern[] => [
        ['sync-jobs', storeId],
        ['store-stats', storeId],
    ],

    // Refresh complet (rare)
    fullRefresh: (storeId: string): QueryKeyPattern[] => [
        ['products', storeId],
        ['products'],
        ['categories', storeId],
        ['categories'],
        ['stores'],
        ['store', storeId],
        ['store-stats', storeId],
        ['sync-jobs', storeId],
        ['sync-jobs'],
        ['product-stats'],
    ],
};

// ============================================================================
// INVALIDATION MANAGER
// ============================================================================

interface PendingInvalidation {
    queryKey: QueryKeyPattern;
    priority: number;
    addedAt: number;
}

class QueryInvalidationManager {
    private queryClient: QueryClient | null = null;
    private pendingInvalidations: Map<string, PendingInvalidation> = new Map();
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private debounceMs: number = DEFAULT_DEBOUNCE_MS;

    /**
     * Initialise le manager avec le QueryClient
     */
    init(queryClient: QueryClient, debounceMs = DEFAULT_DEBOUNCE_MS) {
        this.queryClient = queryClient;
        this.debounceMs = debounceMs;
    }

    /**
     * Convertit un QueryKeyPattern en string pour déduplication
     */
    private keyToString(key: QueryKeyPattern): string {
        return JSON.stringify(key);
    }

    /**
     * Ajoute une query à invalider (avec debounce)
     */
    scheduleInvalidation(queryKey: QueryKeyPattern, priority = 0) {
        const keyStr = this.keyToString(queryKey);

        // Déduplication: garder la plus haute priorité
        const existing = this.pendingInvalidations.get(keyStr);
        if (!existing || existing.priority < priority) {
            this.pendingInvalidations.set(keyStr, {
                queryKey,
                priority,
                addedAt: Date.now(),
            });
        }

        this.scheduleBatch();
    }

    /**
     * Ajoute plusieurs queries à invalider
     */
    scheduleMultiple(queryKeys: QueryKeyPattern[], priority = 0) {
        queryKeys.forEach((key) => this.scheduleInvalidation(key, priority));
    }

    /**
     * Planifie l'exécution du batch
     */
    private scheduleBatch() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.executeBatch();
        }, this.debounceMs);
    }

    /**
     * Exécute le batch d'invalidations
     */
    private async executeBatch() {
        if (!this.queryClient || this.pendingInvalidations.size === 0) {
            return;
        }

        // Trier par priorité (haute en premier)
        const sorted = Array.from(this.pendingInvalidations.values()).sort(
            (a, b) => b.priority - a.priority
        );

        // Limiter la taille du batch
        const toInvalidate = sorted.slice(0, MAX_BATCH_SIZE);
        const remaining = sorted.slice(MAX_BATCH_SIZE);

        // Exécuter les invalidations en parallèle
        await Promise.allSettled(
            toInvalidate.map((item) =>
                this.queryClient!.invalidateQueries({ queryKey: item.queryKey })
            )
        );

        // Nettoyer les invalidations exécutées
        toInvalidate.forEach((item) => {
            this.pendingInvalidations.delete(this.keyToString(item.queryKey));
        });

        // Si il reste des invalidations, programmer un autre batch
        if (remaining.length > 0) {
            this.scheduleBatch();
        }
    }

    /**
     * Invalide immédiatement (bypass debounce)
     */
    async invalidateNow(queryKeys: QueryKeyPattern[]) {
        if (!this.queryClient) {
            console.error('[QueryInvalidation] QueryClient not initialized');
            return;
        }

        await Promise.allSettled(
            queryKeys.map((key) =>
                this.queryClient!.invalidateQueries({ queryKey: key })
            )
        );
    }

    /**
     * Invalide les queries après une sync complète
     */
    onSyncComplete(storeId: string, immediate = false) {
        const patterns = invalidationPatterns.syncComplete(storeId);

        if (immediate) {
            return this.invalidateNow(patterns);
        }

        this.scheduleMultiple(patterns, 10); // Haute priorité
    }

    /**
     * Invalide les queries après une erreur de sync
     */
    onSyncError(storeId: string) {
        this.scheduleMultiple(invalidationPatterns.syncError(storeId), 5);
    }

    /**
     * Invalide les queries pendant la progression
     */
    onSyncProgress(storeId: string) {
        this.scheduleMultiple(invalidationPatterns.syncProgress(storeId), 1);
    }

    /**
     * Refresh complet (utilisé rarement)
     */
    async fullRefresh(storeId: string) {
        return this.invalidateNow(invalidationPatterns.fullRefresh(storeId));
    }

    /**
     * Annule les invalidations pendantes
     */
    cancel() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.pendingInvalidations.clear();
    }

    /**
     * Retourne le nombre d'invalidations pendantes
     */
    getPendingCount(): number {
        return this.pendingInvalidations.size;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const queryInvalidation = new QueryInvalidationManager();

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SyncManagerParams } from '@/types/sync';
import { toast } from 'sonner';

interface SyncResponse {
    success: boolean;
    status?: 'in_progress' | 'completed' | 'failed';
    can_resume?: boolean;
    products_synced?: number;
    categories_synced?: number;
    job_id?: string;
    message?: string;
    error?: string;
}

export function useSyncManager() {
    const [isLoading, setIsLoading] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const abortRef = useRef(false);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 50; // Increased for large catalogs
    const RETRY_DELAY_MS = 3000; // 3 seconds between retries

    const invokeSync = useCallback(async (params: SyncManagerParams): Promise<SyncResponse> => {
        const supabase = createClient();

        try {
            const { data, error } = await supabase.functions.invoke('sync-manager', {
                body: params
            });

            if (error) {
                // Check if it's a timeout (504) - these are retryable
                if (error.message?.includes('504') || error.message?.includes('timeout')) {


                    return {
                        success: true,
                        status: 'in_progress',
                        can_resume: true,
                        message: 'Timeout occurred, resuming...'
                    };
                }
                console.error('Supabase function error:', error);
                throw new Error(error.message || 'Edge function call failed');
            }

            return data as SyncResponse;
        } catch (err: any) {
            // Handle network timeouts as resumable
            if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('504')) {


                return {
                    success: true,
                    status: 'in_progress',
                    can_resume: true,
                    message: 'Request timeout, will retry...'
                };
            }
            throw err;
        }
    }, []);

    const startSync = useCallback(async (params: SyncManagerParams) => {
        setIsLoading(true);
        abortRef.current = false;
        retryCountRef.current = 0;

        try {
            let response = await invokeSync(params);

            // Auto-resume loop for chunked syncs
            while (
                response.can_resume &&
                response.status === 'in_progress' &&
                !abortRef.current &&
                retryCountRef.current < MAX_RETRIES
            ) {
                retryCountRef.current++;



                // Delay before resume - increases with each retry to avoid hammering
                const delay = Math.min(RETRY_DELAY_MS * Math.pow(1.2, retryCountRef.current - 1), 10000);
                await new Promise(r => setTimeout(r, delay));

                try {
                    response = await invokeSync(params);
                } catch (err: any) {
                    // If retry fails, wait longer and try again


                    await new Promise(r => setTimeout(r, 5000));
                    response = { success: true, status: 'in_progress', can_resume: true };
                }
            }

            if (response.success && response.status !== 'in_progress') {
                toast.success("Synchronisation terminée", {
                    description: `${response.products_synced || 0} produits, ${response.categories_synced || 0} catégories`,
                });
            } else if (response.can_resume && retryCountRef.current >= MAX_RETRIES) {
                toast.info("Synchronisation en cours", {
                    description: "La sync continue en arrière-plan. Relancez si nécessaire.",
                });
            }

            return response;
        } catch (error: any) {
            console.error('Sync failed:', error);
            toast.error("Erreur de synchronisation", {
                description: error.message || "Impossible de synchroniser",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [invokeSync]);

    const cancelSync = useCallback(() => {
        abortRef.current = true;
    }, []);

    // Stopper une sync en cours (met à jour le job en BDD)
    const stopSync = useCallback(async (jobId: string) => {
        setIsStopping(true);
        abortRef.current = true;

        try {
            const supabase = createClient();

            // Marquer le job comme annulé
            const { error } = await supabase
                .from('sync_jobs')
                .update({
                    status: 'cancelled',
                    error_message: 'Synchronisation annulée par l\'utilisateur',
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) throw error;

            toast.info('Synchronisation arrêtée', {
                description: 'La synchronisation a été annulée.'
            });

            return true;
        } catch (error: any) {
            console.error('Failed to stop sync:', error);
            toast.error('Erreur', {
                description: 'Impossible d\'arrêter la synchronisation'
            });
            return false;
        } finally {
            setIsStopping(false);
        }
    }, []);

    // Forcer le redémarrage d'une sync (réinitialise le job)
    const forceRestartSync = useCallback(async (storeId: string) => {
        setIsLoading(true);
        abortRef.current = false;
        retryCountRef.current = 0;

        try {
            const supabase = createClient();

            // Annuler tous les jobs actifs pour ce store
            await supabase
                .from('sync_jobs')
                .update({
                    status: 'cancelled',
                    error_message: 'Remplacé par une nouvelle synchronisation',
                    completed_at: new Date().toISOString()
                })
                .eq('store_id', storeId)
                .in('status', ['pending', 'discovering', 'syncing', 'products', 'variations', 'categories']);

            // Petit délai pour laisser la BDD se mettre à jour
            await new Promise(r => setTimeout(r, 500));

            // Démarrer une nouvelle sync
            const response = await invokeSync({
                storeId,
                types: 'all',
                sync_type: 'full'
            });

            // Auto-resume loop for chunked syncs
            let currentResponse = response;
            while (
                currentResponse.can_resume &&
                currentResponse.status === 'in_progress' &&
                !abortRef.current &&
                retryCountRef.current < MAX_RETRIES
            ) {
                retryCountRef.current++;


                await new Promise(r => setTimeout(r, 1000));
                currentResponse = await invokeSync({ storeId, types: 'all', sync_type: 'full' });
            }

            if (currentResponse.success && currentResponse.status !== 'in_progress') {
                toast.success("Synchronisation terminée", {
                    description: `${currentResponse.products_synced || 0} produits, ${currentResponse.categories_synced || 0} catégories`,
                });
            }

            return currentResponse;
        } catch (error: any) {
            console.error('Force restart sync failed:', error);
            toast.error("Erreur de synchronisation", {
                description: error.message || "Impossible de synchroniser",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [invokeSync]);

    return { startSync, cancelSync, stopSync, forceRestartSync, isLoading, isStopping };
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-log';
import type {
    ModularBatchRequest,
    ModularBatchResponse,
} from '@/types/imageGeneration';

// ============================================================================
// SSE EVENT TYPES
// ============================================================================

export interface BatchSSEEvent {
    type:
        | 'connected'
        | 'heartbeat'
        | 'product_start'
        | 'field_start'
        | 'field_complete'
        | 'product_complete'
        | 'product_error'
        | 'batch_complete'
        | 'error';
    batch_job_id?: string;
    product_id?: string;
    field?: string;
    index?: number;
    total?: number;
    preview?: string;
    successful?: number;
    failed?: number;
    error?: string;
    message?: string;
    status?: string;
    timestamp?: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBatchGeneration() {
    const queryClient = useQueryClient();
    const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    // Merged into a single state object → one setState per SSE event instead of two
    const [batchState, setBatchState] = useState<{
        lastEvent: BatchSSEEvent | null;
        progress: { current: number; total: number; field: string };
    }>({ lastEvent: null, progress: { current: 0, total: 0, field: '' } });
    const abortRef = useRef<AbortController | null>(null);

    const startGeneration = useCallback(async (params: ModularBatchRequest): Promise<ModularBatchResponse | null> => {



        // Abort any existing generation
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        // Client-side timeout: abort if no data received within 60s
        const SSE_TIMEOUT_MS = 60_000;
        let lastDataAt = Date.now();
        const timeoutInterval = setInterval(() => {
            if (Date.now() - lastDataAt > SSE_TIMEOUT_MS) {
                abortRef.current?.abort();
                clearInterval(timeoutInterval);
            }
        }, 5_000);

        setIsGenerating(true);
        setBatchState({ lastEvent: null, progress: { current: 0, total: params.product_ids.length, field: '' } });

        let batchJobId = '';
        let total = params.product_ids.length;

        try {


            const response = await fetch('/api/batch-generation/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: abortRef.current.signal,
            });




            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                lastDataAt = Date.now();
                buffer += decoder.decode(value, { stream: true });
                const blocks = buffer.split('\n\n');
                buffer = blocks.pop() || '';

                for (const block of blocks) {
                    const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
                    if (!dataLine) continue;

                    try {
                        const event: BatchSSEEvent = JSON.parse(dataLine.slice(6));

                        switch (event.type) {
                            case 'connected':
                                batchJobId = event.batch_job_id || '';
                                total = event.total || params.product_ids.length;
                                setActiveBatchId(batchJobId);
                                setBatchState((s) => ({ lastEvent: event, progress: { ...s.progress, total } }));
                                break;

                            case 'product_start':
                                setBatchState((s) => ({
                                    lastEvent: event,
                                    progress: { ...s.progress, current: (event.index || 1) - 1, field: '' },
                                }));
                                break;

                            case 'field_start':
                                setBatchState((s) => ({
                                    lastEvent: event,
                                    progress: { ...s.progress, field: event.field || '' },
                                }));
                                break;

                            case 'product_complete':
                                setBatchState((s) => ({
                                    lastEvent: event,
                                    progress: { ...s.progress, current: event.index || s.progress.current + 1, field: '' },
                                }));
                                // Invalidate per-product content so draft appears immediately
                                if (event.product_id) {
                                    queryClient.invalidateQueries({ queryKey: ['product-content', event.product_id] });
                                    queryClient.invalidateQueries({ queryKey: ['product', event.product_id] });
                                }
                                break;

                            case 'product_error':
                                setBatchState((s) => ({
                                    lastEvent: event,
                                    progress: { ...s.progress, current: event.index || s.progress.current + 1, field: '' },
                                }));
                                break;

                            case 'batch_complete': {
                                setBatchState((s) => ({ ...s, lastEvent: event }));
                                queryClient.invalidateQueries({ queryKey: ['products'] });
                                queryClient.invalidateQueries({ queryKey: ['product-content'] });
                                queryClient.invalidateQueries({ queryKey: ['product'] });
                                queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
                                queryClient.invalidateQueries({ queryKey: ['active-batch-jobs'] });

                                const failCount = event.failed || 0;
                                const successCount = event.successful || 0;

                                if (failCount === 0) {
                                    toast.success(`Génération terminée`, {
                                        description: `${successCount} produit(s) traité(s) avec succès`,
                                    });
                                } else if (successCount > 0) {
                                    toast.warning(`Génération partielle`, {
                                        description: `${successCount} réussi(s), ${failCount} échoué(s)`,
                                    });
                                } else {
                                    toast.error(`Génération échouée`, {
                                        description: `${failCount} produit(s) en erreur`,
                                    });
                                }

                                logActivity({
                                    type: 'generation',
                                    title: 'Génération IA batch terminée',
                                    description: `${successCount} réussi(s), ${failCount} échoué(s)`,
                                    status: failCount === 0 ? 'success' : successCount > 0 ? 'warning' : 'error',
                                    metadata: { successCount, failCount },
                                });
                                break;
                            }

                            case 'error':
                                setBatchState((s) => ({ ...s, lastEvent: event }));
                                toast.error('Erreur de génération', {
                                    description: event.message || 'Erreur inconnue',
                                });
                                break;
                        }
                    } catch {
                        // Skip malformed SSE events
                    }
                }
            }

            } finally {
                reader.releaseLock();
            }

            return { batch_job_id: batchJobId, total };
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.info('Génération annulée');
                return null;
            }

            toast.error('Erreur lors du lancement de la génération', {
                description: error.message || 'Erreur inconnue',
            });
            return null;
        } finally {
            clearInterval(timeoutInterval);
            setIsGenerating(false);
            abortRef.current = null;
        }
    }, [queryClient]);

    const cancel = useCallback(() => {
        abortRef.current?.abort();
        setIsGenerating(false);
        setActiveBatchId(null);
    }, []);

    return {
        startGeneration,
        cancel,
        activeBatchId,
        isGenerating,
        lastEvent: batchState.lastEvent,
        progress: batchState.progress,
    };
}

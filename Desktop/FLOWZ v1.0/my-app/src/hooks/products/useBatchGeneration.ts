'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    const [lastEvent, setLastEvent] = useState<BatchSSEEvent | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, field: '' });
    const abortRef = useRef<AbortController | null>(null);

    const startGeneration = useCallback(async (params: ModularBatchRequest): Promise<ModularBatchResponse | null> => {
        console.log('[useBatchGeneration] startGeneration called with:', params);

        // Abort any existing generation
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setIsGenerating(true);
        setLastEvent(null);
        setProgress({ current: 0, total: params.product_ids.length, field: '' });

        let batchJobId = '';
        let total = params.product_ids.length;

        try {
            console.log('[useBatchGeneration] Fetching /api/batch-generation/stream...');
            const response = await fetch('/api/batch-generation/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: abortRef.current.signal,
            });

            console.log('[useBatchGeneration] Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                console.error('[useBatchGeneration] HTTP Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const blocks = buffer.split('\n\n');
                buffer = blocks.pop() || '';

                for (const block of blocks) {
                    const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
                    if (!dataLine) continue;

                    try {
                        const event: BatchSSEEvent = JSON.parse(dataLine.slice(6));
                        setLastEvent(event);

                        switch (event.type) {
                            case 'connected':
                                batchJobId = event.batch_job_id || '';
                                total = event.total || params.product_ids.length;
                                setActiveBatchId(batchJobId);
                                break;

                            case 'product_start':
                                setProgress((p) => ({
                                    ...p,
                                    current: (event.index || 1) - 1,
                                    field: '',
                                }));
                                break;

                            case 'field_start':
                                setProgress((p) => ({
                                    ...p,
                                    field: event.field || '',
                                }));
                                break;

                            case 'product_complete':
                                setProgress((p) => ({
                                    ...p,
                                    current: event.index || p.current + 1,
                                    field: '',
                                }));
                                // Invalidate per-product content so draft appears immediately
                                if (event.product_id) {
                                    queryClient.invalidateQueries({ queryKey: ['product-content', event.product_id] });
                                    queryClient.invalidateQueries({ queryKey: ['product', event.product_id] });
                                }
                                break;

                            case 'product_error':
                                setProgress((p) => ({
                                    ...p,
                                    current: event.index || p.current + 1,
                                    field: '',
                                }));
                                break;

                            case 'batch_complete':
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
                                break;

                            case 'error':
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

            return { batch_job_id: batchJobId, total };
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled
                toast.info('Génération annulée');
                return null;
            }

            toast.error('Erreur lors du lancement de la génération', {
                description: error.message || 'Erreur inconnue',
            });
            return null;
        } finally {
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
        lastEvent,
        progress,
    };
}

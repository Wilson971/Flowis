/**
 * WooSyncModalV2 - Version simplifiée et fiable du modal de sync
 *
 * Remplacement drop-in pour WooSyncModal avec:
 * - UI épurée et claire
 * - Gestion d'état robuste
 * - Pas de dépendance au SyncProvider (standalone)
 * - Console réduite par défaut
 */

'use client';

import { useEffect, useState, useCallback, useRef, useReducer } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Store,
    Package,
    Layers,
    FolderTree,
    Pause,
    Play,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SyncJob, SyncProgress } from '@/types/sync';

// ============================================================================
// TYPES
// ============================================================================

interface WooSyncModalV2Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    storeName: string;
    autoStart?: boolean;
}

type SyncState = 'idle' | 'starting' | 'syncing' | 'paused' | 'completed' | 'failed';

interface State {
    syncState: SyncState;
    progress: SyncProgress | null;
    job: SyncJob | null;
    error: string | null;
    logs: LogEntry[];
}

interface LogEntry {
    id: string;
    time: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

type Action =
    | { type: 'START' }
    | { type: 'PROGRESS'; progress: SyncProgress }
    | { type: 'JOB_UPDATE'; job: SyncJob }
    | { type: 'COMPLETE' }
    | { type: 'ERROR'; error: string }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'RESET' }
    | { type: 'ADD_LOG'; log: LogEntry };

// ============================================================================
// REDUCER
// ============================================================================

const initialState: State = {
    syncState: 'idle',
    progress: null,
    job: null,
    error: null,
    logs: [],
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'START':
            return {
                ...initialState,
                syncState: 'starting',
                logs: [{
                    id: 'start',
                    time: new Date().toLocaleTimeString('fr-FR'),
                    message: 'Démarrage de la synchronisation...',
                    type: 'info',
                }],
            };

        case 'PROGRESS': {
            const newState = state.syncState === 'starting' ? 'syncing' : state.syncState;
            const newLog: LogEntry = {
                id: `${Date.now()}`,
                time: new Date().toLocaleTimeString('fr-FR'),
                message: action.progress.message,
                type: 'info',
            };
            // Éviter les doublons
            const lastLog = state.logs[state.logs.length - 1];
            const logs = lastLog?.message === newLog.message
                ? state.logs
                : [...state.logs.slice(-29), newLog];

            return {
                ...state,
                syncState: newState,
                progress: action.progress,
                logs,
            };
        }

        case 'JOB_UPDATE': {
            const job = action.job;
            let syncState = state.syncState;

            if (job.status === 'completed') syncState = 'completed';
            else if (job.status === 'failed' || job.status === 'error') syncState = 'failed';
            else if (job.status === 'paused') syncState = 'paused';
            else if (['pending', 'discovering', 'fetching', 'saving'].includes(job.status)) {
                syncState = 'syncing';
            }

            return {
                ...state,
                syncState,
                job,
                error: job.error_message || state.error,
            };
        }

        case 'COMPLETE':
            return {
                ...state,
                syncState: 'completed',
                logs: [...state.logs, {
                    id: 'complete',
                    time: new Date().toLocaleTimeString('fr-FR'),
                    message: 'Synchronisation terminée avec succès',
                    type: 'success',
                }],
            };

        case 'ERROR':
            return {
                ...state,
                syncState: 'failed',
                error: action.error,
                logs: [...state.logs, {
                    id: 'error',
                    time: new Date().toLocaleTimeString('fr-FR'),
                    message: action.error,
                    type: 'error',
                }],
            };

        case 'PAUSE':
            return { ...state, syncState: 'paused' };

        case 'RESUME':
            return { ...state, syncState: 'syncing' };

        case 'RESET':
            return initialState;

        case 'ADD_LOG':
            return {
                ...state,
                logs: [...state.logs.slice(-29), action.log],
            };

        default:
            return state;
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WooSyncModalV2({
    open,
    onOpenChange,
    storeId,
    storeName,
    autoStart = true,
}: WooSyncModalV2Props) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const [state, dispatch] = useReducer(reducer, initialState);
    const [showConsole, setShowConsole] = useState(false);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const hasAutoStarted = useRef(false);
    const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { syncState, progress, job, error, logs } = state;

    // ========================================================================
    // SYNC MUTATION
    // ========================================================================

    const syncMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('sync-manager', {
                body: {
                    storeId,
                    store_id: storeId,
                    sync_type: 'full',
                    types: 'all',
                    include_categories: true,
                    include_variations: true,
                },
            });

            if (error) throw new Error(error.message || 'Sync failed');
            return data;
        },
        onError: (err: Error) => {
            dispatch({ type: 'ERROR', error: err.message });
            toast.error('Erreur de synchronisation', { description: err.message });
        },
    });

    // ========================================================================
    // START SYNC
    // ========================================================================

    const handleStart = useCallback(() => {
        dispatch({ type: 'START' });
        syncMutation.mutate();
    }, [syncMutation]);

    // Auto-start
    useEffect(() => {
        if (open && autoStart && syncState === 'idle' && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            handleStart();
        }
    }, [open, autoStart, syncState, handleStart]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            hasAutoStarted.current = false;
            // Don't reset state immediately to allow seeing completion
        }
    }, [open]);

    // ========================================================================
    // REALTIME SUBSCRIPTIONS
    // ========================================================================

    useEffect(() => {
        if (!open || syncState === 'idle' || syncState === 'completed' || syncState === 'failed') {
            return;
        }

        // Channel for broadcast progress
        const progressChannel = supabase.channel(`sync_progress:${storeId}`);

        progressChannel
            .on('broadcast', { event: 'progress' }, ({ payload }) => {
                const p = payload as SyncProgress & { timestamp?: number };
                dispatch({
                    type: 'PROGRESS',
                    progress: {
                        phase: p.phase,
                        current: p.current,
                        total: p.total,
                        message: p.message,
                        percent: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
                    },
                });

                if (p.phase === 'completed') {
                    dispatch({ type: 'COMPLETE' });
                } else if (p.phase === 'failed') {
                    dispatch({ type: 'ERROR', error: p.message });
                }
            })
            .subscribe();

        // Channel for job updates
        const jobChannel = supabase.channel(`sync_jobs:${storeId}`);

        jobChannel
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
                        const syncJob = payload.new as SyncJob;
                        dispatch({ type: 'JOB_UPDATE', job: syncJob });

                        if (syncJob.status === 'completed') {
                            dispatch({ type: 'COMPLETE' });
                            invalidateQueries();
                            toast.success('Synchronisation terminée', {
                                description: `${syncJob.synced_products} produits, ${syncJob.synced_categories} catégories`,
                            });
                        }
                    }
                }
            )
            .subscribe();

        channelRef.current = progressChannel;

        return () => {
            supabase.removeChannel(progressChannel);
            supabase.removeChannel(jobChannel);
        };
    }, [open, storeId, syncState, supabase]);

    // ========================================================================
    // INVALIDATE QUERIES
    // ========================================================================

    const invalidateQueries = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['products', storeId] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
        queryClient.invalidateQueries({ queryKey: ['stores'] });
        queryClient.invalidateQueries({ queryKey: ['store-stats', storeId] });
        queryClient.invalidateQueries({ queryKey: ['sync-jobs', storeId] });
    }, [queryClient, storeId]);

    // ========================================================================
    // CLEANUP
    // ========================================================================

    useEffect(() => {
        return () => {
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
        };
    }, []);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const isSyncing = syncState === 'starting' || syncState === 'syncing';
    const percent = progress?.percent ?? 0;

    const getStatusInfo = () => {
        switch (syncState) {
            case 'starting':
                return { badge: 'Démarrage...', color: 'bg-blue-500/10 text-blue-500' };
            case 'syncing':
                return { badge: 'En cours', color: 'bg-primary/10 text-primary animate-pulse' };
            case 'paused':
                return { badge: 'En pause', color: 'bg-yellow-500/10 text-yellow-500' };
            case 'completed':
                return { badge: 'Terminé', color: 'bg-emerald-500/10 text-emerald-500' };
            case 'failed':
                return { badge: 'Échec', color: 'bg-destructive/10 text-destructive' };
            default:
                return null;
        }
    };

    const statusInfo = getStatusInfo();

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-base">
                                Synchronisation
                            </DialogTitle>
                            <DialogDescription className="truncate text-sm">
                                {storeName}
                            </DialogDescription>
                        </div>
                        {statusInfo && (
                            <Badge className={cn('shrink-0', statusInfo.color)} variant="secondary">
                                {statusInfo.badge}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate pr-4">
                                {progress?.message || 'Préparation...'}
                            </span>
                            <span className="font-mono font-medium tabular-nums shrink-0">
                                {percent}%
                            </span>
                        </div>
                        <Progress
                            value={percent}
                            className={cn(
                                'h-2 transition-all',
                                syncState === 'completed' && '[&>div]:bg-emerald-500',
                                syncState === 'failed' && '[&>div]:bg-destructive'
                            )}
                        />
                    </div>

                    {/* Status Display */}
                    {syncState === 'completed' && (
                        <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            </div>
                            {job && (
                                <p className="text-sm text-muted-foreground">
                                    {job.synced_products} produits • {job.synced_variations} variations • {job.synced_categories} catégories
                                </p>
                            )}
                        </div>
                    )}

                    {syncState === 'failed' && (
                        <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                                <XCircle className="w-7 h-7 text-destructive" />
                            </div>
                            {error && (
                                <p className="text-sm text-destructive text-center">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Phase Indicators */}
                    {isSyncing && (
                        <div className="grid grid-cols-3 gap-2">
                            <PhaseIndicator
                                icon={<Package className="w-3.5 h-3.5" />}
                                label="Produits"
                                active={progress?.phase === 'products'}
                                done={job ? job.synced_products >= job.total_products && job.total_products > 0 : false}
                            />
                            <PhaseIndicator
                                icon={<Layers className="w-3.5 h-3.5" />}
                                label="Variations"
                                active={progress?.phase === 'variations'}
                                done={job ? job.synced_variations >= job.total_variations && job.total_variations > 0 : false}
                            />
                            <PhaseIndicator
                                icon={<FolderTree className="w-3.5 h-3.5" />}
                                label="Catégories"
                                active={progress?.phase === 'categories'}
                                done={job ? job.synced_categories >= job.total_categories && job.total_categories > 0 : false}
                            />
                        </div>
                    )}

                    {/* Console (Collapsible) */}
                    <Collapsible open={showConsole} onOpenChange={setShowConsole}>
                        <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border-t">
                                <span>Console ({logs.length})</span>
                                <ChevronDown className={cn(
                                    'w-4 h-4 transition-transform',
                                    showConsole && 'rotate-180'
                                )} />
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <ScrollArea className="h-32 rounded-lg bg-muted/50 p-3 font-mono text-[11px]">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-2 py-0.5">
                                        <span className="text-muted-foreground/60 shrink-0">
                                            {log.time}
                                        </span>
                                        <span className={cn(
                                            log.type === 'error' && 'text-red-400',
                                            log.type === 'success' && 'text-emerald-400',
                                            log.type === 'info' && 'text-muted-foreground'
                                        )}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>

                    {syncState === 'completed' && (
                        <Button onClick={() => onOpenChange(false)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Terminé
                        </Button>
                    )}

                    {syncState === 'failed' && (
                        <Button onClick={handleStart}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Réessayer
                        </Button>
                    )}

                    {isSyncing && (
                        <Button disabled>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Synchronisation...
                        </Button>
                    )}

                    {syncState === 'idle' && (
                        <Button onClick={handleStart}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Synchroniser
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// PHASE INDICATOR
// ============================================================================

interface PhaseIndicatorProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    done?: boolean;
}

function PhaseIndicator({ icon, label, active, done }: PhaseIndicatorProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all',
                done
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/50 text-muted-foreground'
            )}
        >
            {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : icon}
            <span className="truncate">{label}</span>
            {active && !done && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-auto" />
            )}
        </div>
    );
}

export default WooSyncModalV2;

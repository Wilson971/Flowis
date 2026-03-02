'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSyncManager } from '@/hooks/sync/useSyncManager';
import { useSyncProgress } from '@/hooks/sync/useSyncProgress';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Package,
    FolderTree,
    FileText,
    Square,
    RotateCcw,
    ChevronDown,
    ArrowRight,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/design-system';

// ============================================================================
// TYPES
// ============================================================================

interface WooSyncModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    storeName: string;
}

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

function CircularProgress({
    value,
    size = 120,
    strokeWidth = 6,
    state,
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    state: 'idle' | 'syncing' | 'completed' | 'failed';
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const strokeColor =
        state === 'completed'
            ? 'stroke-emerald-500'
            : state === 'failed'
              ? 'stroke-destructive'
              : 'stroke-primary';

    const glowColor =
        state === 'completed'
            ? 'drop-shadow(0 0 8px rgba(16,185,129,0.4))'
            : state === 'failed'
              ? 'drop-shadow(0 0 8px rgba(239,68,68,0.4))'
              : 'drop-shadow(0 0 8px rgba(59,130,246,0.3))';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="-rotate-90"
                style={{ filter: value > 0 ? glowColor : 'none' }}
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-muted/40"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={cn(strokeColor, 'transition-all duration-500 ease-out')}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {state === 'completed' ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={motionTokens.transitions.spring}
                        >
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                    ) : state === 'failed' ? (
                        <motion.div
                            key="fail"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={motionTokens.transitions.spring}
                        >
                            <XCircle className="w-10 h-10 text-destructive" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="percent"
                            className="flex flex-col items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span className="text-2xl font-bold tabular-nums tracking-tight">
                                {value}
                                <span className="text-sm font-normal text-muted-foreground">%</span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================================================
// PHASE STEP
// ============================================================================

type PhaseStatus = 'pending' | 'active' | 'done' | 'error';

function PhaseStep({
    icon,
    label,
    current,
    total,
    status,
}: {
    icon: React.ReactNode;
    label: string;
    current: number;
    total: number;
    status: PhaseStatus;
}) {
    return (
        <motion.div
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                status === 'active' && 'bg-primary/8 ring-1 ring-primary/20',
                status === 'done' && 'bg-emerald-500/8',
                status === 'error' && 'bg-destructive/8',
                status === 'pending' && 'opacity-50',
            )}
            layout
        >
            {/* Icon */}
            <div
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300',
                    status === 'active' && 'bg-primary/15 text-primary',
                    status === 'done' && 'bg-emerald-500/15 text-emerald-500',
                    status === 'error' && 'bg-destructive/15 text-destructive',
                    status === 'pending' && 'bg-muted text-muted-foreground',
                )}
            >
                {status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4" />
                ) : status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    icon
                )}
            </div>

            {/* Label + count */}
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        'text-sm font-medium truncate',
                        status === 'active' && 'text-foreground',
                        status === 'done' && 'text-emerald-600 dark:text-emerald-400',
                        status === 'pending' && 'text-muted-foreground',
                    )}
                >
                    {label}
                </p>
            </div>

            {/* Counter */}
            <div className="text-right shrink-0">
                <span
                    className={cn(
                        'text-sm font-mono tabular-nums font-semibold',
                        status === 'done' && 'text-emerald-600 dark:text-emerald-400',
                        status === 'active' && 'text-foreground',
                        status === 'pending' && 'text-muted-foreground',
                    )}
                >
                    {current}
                </span>
                <span className="text-xs text-muted-foreground font-normal">/{total}</span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WooSyncModal({ open, onOpenChange, storeId, storeName }: WooSyncModalProps) {
    const {
        startSync,
        stopSync,
        forceRestartSync,
        isLoading: isStarting,
        isStopping,
    } = useSyncManager();
    const { activeJob, logs } = useSyncProgress(open ? storeId : null);
    const [isRestarting, setIsRestarting] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const hasAutoStarted = useRef(false);
    const autoStartAbort = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Determine sync state
    const syncState = useMemo(() => {
        if (!activeJob) return 'idle' as const;
        if (activeJob.status === 'completed') return 'completed' as const;
        if (activeJob.status === 'failed' || activeJob.status === 'cancelled')
            return 'failed' as const;
        return 'syncing' as const;
    }, [activeJob?.status]);

    const isRunning = syncState === 'syncing';

    // Calculate overall progress
    const progress = useMemo(() => {
        if (!activeJob) return 0;
        const total =
            (activeJob.total_products || 0) +
            (activeJob.total_categories || 0) +
            (activeJob.total_posts || 0);
        const synced =
            (activeJob.synced_products || 0) +
            (activeJob.synced_categories || 0) +
            (activeJob.synced_posts || 0);
        if (total === 0) return syncState === 'completed' ? 100 : 0;
        return Math.round((synced / total) * 100);
    }, [activeJob, syncState]);

    // Phase label
    const phaseLabel = useMemo(() => {
        if (!activeJob) return 'En attente...';
        switch (activeJob.current_phase) {
            case 'discovery':
                return 'Analyse de la boutique...';
            case 'products':
                return 'Synchronisation des produits';
            case 'variations':
                return 'Traitement des variantes';
            case 'categories':
                return 'Synchronisation des catégories';
            case 'posts':
                return 'Synchronisation des articles';
            case 'completed':
                return activeJob.status === 'failed'
                    ? 'Synchronisation échouée'
                    : 'Synchronisation terminée !';
            default:
                return 'Synchronisation en cours...';
        }
    }, [activeJob]);

    // Phase statuses
    const getPhaseStatus = (phase: string): PhaseStatus => {
        if (!activeJob) return 'pending';
        const phaseOrder = ['products', 'variations', 'categories', 'posts'];
        const currentIndex = phaseOrder.indexOf(activeJob.current_phase || '');
        const targetIndex = phaseOrder.indexOf(phase);

        if (syncState === 'completed') return 'done';
        if (syncState === 'failed' && activeJob.current_phase === phase) return 'error';
        if (targetIndex < currentIndex) return 'done';
        if (targetIndex === currentIndex) return 'active';
        return 'pending';
    };

    const handleStartSync = () => {
        startSync({ storeId, types: 'all', sync_type: 'full' });
    };

    const handleStopSync = async () => {
        if (activeJob?.id) {
            await stopSync(activeJob.id);
        }
    };

    const handleForceRestart = async () => {
        setIsRestarting(true);
        try {
            await forceRestartSync(storeId);
        } finally {
            setIsRestarting(false);
        }
    };

    // Auto-start sync when modal opens (only once per open)
    useEffect(() => {
        if (open && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            autoStartAbort.current = setTimeout(() => {
                autoStartAbort.current = null;
                if (!isRunning && !isStarting) {
                    handleStartSync();
                }
            }, 600);
        }
        if (!open) {
            // Cancel pending auto-start if modal closes before timer fires
            if (autoStartAbort.current) {
                clearTimeout(autoStartAbort.current);
                autoStartAbort.current = null;
            }
            hasAutoStarted.current = false;
            setShowLogs(false);
        }
        return () => {
            if (autoStartAbort.current) {
                clearTimeout(autoStartAbort.current);
                autoStartAbort.current = null;
            }
        };
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-border/50">
                {/* ── Header ── */}
                <div className="relative px-6 pt-6 pb-4">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300',
                                    syncState === 'completed'
                                        ? 'bg-emerald-500/15 text-emerald-500'
                                        : syncState === 'failed'
                                          ? 'bg-destructive/15 text-destructive'
                                          : 'bg-primary/10 text-primary',
                                )}
                            >
                                {syncState === 'completed' ? (
                                    <CheckCircle2 className="w-[18px] h-[18px]" />
                                ) : syncState === 'failed' ? (
                                    <XCircle className="w-[18px] h-[18px]" />
                                ) : isRunning ? (
                                    <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                                ) : (
                                    <Zap className="w-[18px] h-[18px]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base font-semibold tracking-tight">
                                    Synchronisation
                                </DialogTitle>
                                <DialogDescription className="text-xs truncate">
                                    {storeName}
                                </DialogDescription>
                            </div>
                            {/* Status pill */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={syncState}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={motionTokens.transitions.fast}
                                >
                                    {isRunning && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                                            </span>
                                            En cours
                                        </span>
                                    )}
                                    {syncState === 'completed' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Terminé
                                        </span>
                                    )}
                                    {syncState === 'failed' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                                            <XCircle className="w-3 h-3" />
                                            {activeJob?.status === 'cancelled' ? 'Annulé' : 'Erreur'}
                                        </span>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </DialogHeader>
                </div>

                {/* ── Body ── */}
                <div className="px-6 pb-2">
                    {/* Circular Progress */}
                    <div className="flex flex-col items-center py-4">
                        <CircularProgress value={progress} state={syncState} />
                        <motion.p
                            className="mt-3 text-sm text-muted-foreground text-center"
                            key={phaseLabel}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={motionTokens.transitions.fast}
                        >
                            {phaseLabel}
                        </motion.p>
                    </div>

                    {/* Phase Steps */}
                    <div className="space-y-1.5 pb-4">
                        <PhaseStep
                            icon={<Package className="w-4 h-4" />}
                            label="Produits"
                            current={activeJob?.synced_products || 0}
                            total={activeJob?.total_products || 0}
                            status={getPhaseStatus('products')}
                        />
                        <PhaseStep
                            icon={<FolderTree className="w-4 h-4" />}
                            label="Catégories"
                            current={activeJob?.synced_categories || 0}
                            total={activeJob?.total_categories || 0}
                            status={getPhaseStatus('categories')}
                        />
                        <PhaseStep
                            icon={<FileText className="w-4 h-4" />}
                            label="Articles"
                            current={activeJob?.synced_posts || 0}
                            total={activeJob?.total_posts || 0}
                            status={getPhaseStatus('posts')}
                        />
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                        {syncState === 'failed' && activeJob?.error_message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={motionTokens.transitions.fast}
                                className="overflow-hidden"
                            >
                                <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/15 mb-4">
                                    <p className="text-xs text-destructive/90 leading-relaxed line-clamp-3">
                                        {activeJob.error_message.split(';')[0]}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapsible Logs */}
                    {logs.length > 0 && (
                        <div className="border-t border-border/50 pt-3 pb-2">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                            >
                                <span className="font-medium">
                                    Activité récente
                                    <span className="ml-1.5 text-muted-foreground/60">
                                        ({logs.length})
                                    </span>
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'w-3.5 h-3.5 transition-transform duration-200',
                                        showLogs && 'rotate-180',
                                    )}
                                />
                            </button>

                            <AnimatePresence>
                                {showLogs && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2.5 max-h-28 overflow-y-auto space-y-1 text-[11px] font-mono text-muted-foreground rounded-lg bg-muted/30 p-2.5">
                                            {logs.slice(-8).map((log, i) => (
                                                <div
                                                    key={log.id || i}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span
                                                        className={cn(
                                                            'w-1.5 h-1.5 rounded-full mt-1 shrink-0',
                                                            log.type === 'error' && 'bg-destructive',
                                                            log.type === 'success' && 'bg-emerald-500',
                                                            log.type === 'info' && 'bg-primary',
                                                            log.type === 'warning' && 'bg-amber-500',
                                                        )}
                                                    />
                                                    <span className="line-clamp-1 leading-relaxed">
                                                        {log.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
                    <div className="flex items-center justify-end gap-2">
                        {/* Running state */}
                        {isRunning && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleStopSync}
                                    disabled={isStopping}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    {isStopping ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                        <Square className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Stopper
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleForceRestart}
                                    disabled={isRestarting || isStopping}
                                >
                                    {isRestarting ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Relancer
                                </Button>
                            </>
                        )}

                        {/* Completed/Failed/Idle state */}
                        {!isRunning && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="text-muted-foreground"
                                >
                                    Fermer
                                </Button>
                                {syncState === 'completed' && (
                                    <Button
                                        size="sm"
                                        onClick={() => onOpenChange(false)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                        Terminé
                                    </Button>
                                )}
                                {(syncState === 'failed' || syncState === 'idle') && (
                                    <Button
                                        size="sm"
                                        onClick={handleStartSync}
                                        disabled={isStarting}
                                    >
                                        {isStarting ? (
                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                        )}
                                        {syncState === 'idle' ? 'Synchroniser' : 'Relancer'}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

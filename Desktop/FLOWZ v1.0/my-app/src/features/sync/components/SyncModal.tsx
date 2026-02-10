/**
 * SyncModal - Modal de synchronisation simplifié et fiable
 *
 * Design épuré avec:
 * - Progression globale claire
 * - État visuel immédiat
 * - Console optionnelle (réduite par défaut)
 * - Intégration avec le nouveau SyncEngine
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Pause,
    Play,
    X,
    Store,
    Package,
    Layers,
    FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useSyncForStore } from '../SyncProvider';
import type { SyncOptions, SyncProgressData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface SyncModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    storeName: string;
    autoStart?: boolean;
    options?: SyncOptions;
}

interface LogEntry {
    id: string;
    time: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SyncModal({
    open,
    onOpenChange,
    storeId,
    storeName,
    autoStart = true,
    options,
}: SyncModalProps) {
    // Sync state from context
    const {
        isActive,
        isSyncing,
        isPaused,
        isCompleted,
        isFailed,
        progress,
        error,
        start,
        pause,
        resume,
        cancel,
        canStart,
        canPause,
        canResume,
        canCancel,
    } = useSyncForStore(storeId);

    // Local state
    const [showConsole, setShowConsole] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const hasAutoStarted = useRef(false);

    // ========================================================================
    // AUTO-START
    // ========================================================================

    useEffect(() => {
        if (open && autoStart && canStart && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            start(options);
        }
    }, [open, autoStart, canStart, start, options]);

    // Reset auto-start flag when modal closes
    useEffect(() => {
        if (!open) {
            hasAutoStarted.current = false;
        }
    }, [open]);

    // ========================================================================
    // LOGS (from progress messages)
    // ========================================================================

    useEffect(() => {
        if (progress?.message && isActive) {
            const newLog: LogEntry = {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                message: progress.message,
                type: progress.phase === 'completed' ? 'success' :
                    progress.phase === 'failed' ? 'error' : 'info',
            };

            setLogs((prev) => {
                // Éviter les doublons consécutifs
                if (prev.length > 0 && prev[prev.length - 1].message === newLog.message) {
                    return prev;
                }
                return [...prev.slice(-49), newLog]; // Garder les 50 derniers
            });
        }
    }, [progress?.message, progress?.phase, isActive]);

    // Clear logs when starting new sync
    useEffect(() => {
        if (isSyncing && !isPaused && logs.length === 0) {
            setLogs([{
                id: 'start',
                time: new Date().toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                message: 'Démarrage de la synchronisation...',
                type: 'info',
            }]);
        }
    }, [isSyncing, isPaused]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClose = useCallback(() => {
        if (isSyncing && !isCompleted && !isFailed) {
            // La sync continue en arrière-plan
        }
        onOpenChange(false);
    }, [isSyncing, isCompleted, isFailed, onOpenChange]);

    const handleRetry = useCallback(() => {
        setLogs([]);
        hasAutoStarted.current = false;
        start(options);
    }, [start, options]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const getStatusBadge = () => {
        if (isFailed) return { text: 'Échec', variant: 'destructive' as const };
        if (isCompleted) return { text: 'Terminé', variant: 'default' as const };
        if (isPaused) return { text: 'En pause', variant: 'secondary' as const };
        if (isSyncing) return { text: 'En cours...', variant: 'default' as const };
        return null;
    };

    const statusBadge = getStatusBadge();
    const percent = progress?.percent ?? 0;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg">
                                Synchronisation
                            </DialogTitle>
                            <DialogDescription className="truncate">
                                {storeName}
                            </DialogDescription>
                        </div>
                        {statusBadge && (
                            <Badge
                                variant={statusBadge.variant}
                                className={cn(
                                    isSyncing && !isPaused && 'animate-pulse'
                                )}
                            >
                                {statusBadge.text}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Progress Section */}
                    <div className="space-y-3">
                        {/* Main Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {progress?.message || 'Préparation...'}
                                </span>
                                <span className="font-mono font-medium tabular-nums">
                                    {percent}%
                                </span>
                            </div>
                            <Progress
                                value={percent}
                                className={cn(
                                    'h-2',
                                    isCompleted && 'bg-emerald-500/20',
                                    isFailed && 'bg-destructive/20'
                                )}
                            />
                        </div>

                        {/* Status Icon */}
                        <AnimatePresence mode="wait">
                            {isCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center justify-center py-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                </motion.div>
                            )}
                            {isFailed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-4 gap-2"
                                >
                                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <XCircle className="w-8 h-8 text-destructive" />
                                    </div>
                                    {error && (
                                        <p className="text-sm text-destructive text-center max-w-xs">
                                            {error}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick Stats (during sync) */}
                        {isSyncing && !isPaused && (
                            <div className="grid grid-cols-3 gap-2">
                                <QuickStat
                                    icon={<Package className="w-3.5 h-3.5" />}
                                    label="Produits"
                                    active={progress?.phase === 'products'}
                                />
                                <QuickStat
                                    icon={<Layers className="w-3.5 h-3.5" />}
                                    label="Variations"
                                    active={progress?.phase === 'variations'}
                                />
                                <QuickStat
                                    icon={<FolderTree className="w-3.5 h-3.5" />}
                                    label="Catégories"
                                    active={progress?.phase === 'categories'}
                                />
                            </div>
                        )}
                    </div>

                    {/* Console Toggle */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => setShowConsole(!showConsole)}
                            className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span>Console ({logs.length} événements)</span>
                            {showConsole ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showConsole && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <ScrollArea className="h-40 mt-3 rounded-lg bg-muted/50 p-3 font-mono text-xs">
                                        {logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex gap-2 py-0.5"
                                            >
                                                <span className="text-muted-foreground shrink-0">
                                                    {log.time}
                                                </span>
                                                <span
                                                    className={cn(
                                                        log.type === 'error' && 'text-red-400',
                                                        log.type === 'warning' && 'text-yellow-400',
                                                        log.type === 'success' && 'text-emerald-400',
                                                        log.type === 'info' && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {log.message}
                                                </span>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    {/* Cancel Button (during sync) */}
                    {canCancel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancel()}
                            className="text-muted-foreground"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Annuler
                        </Button>
                    )}

                    {/* Pause/Resume Button */}
                    {canPause && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pause()}
                        >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                        </Button>
                    )}
                    {canResume && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resume()}
                        >
                            <Play className="w-4 h-4 mr-1" />
                            Reprendre
                        </Button>
                    )}

                    {/* Main Action Button */}
                    {isCompleted && (
                        <Button onClick={handleClose}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Terminé
                        </Button>
                    )}
                    {isFailed && (
                        <Button onClick={handleRetry}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Réessayer
                        </Button>
                    )}
                    {isSyncing && !isPaused && (
                        <Button disabled className="min-w-[140px]">
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Synchronisation...
                        </Button>
                    )}
                    {!isSyncing && !isCompleted && !isFailed && canStart && (
                        <Button onClick={() => start(options)}>
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
// QUICK STAT COMPONENT
// ============================================================================

interface QuickStatProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}

function QuickStat({ icon, label, active }: QuickStatProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors',
                active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-muted-foreground'
            )}
        >
            {icon}
            <span className="truncate">{label}</span>
            {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-auto" />
            )}
        </div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SyncModal;

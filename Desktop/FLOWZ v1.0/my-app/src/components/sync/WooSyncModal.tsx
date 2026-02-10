import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSyncManager } from "@/hooks/sync/useSyncManager";
import { useSyncProgress } from "@/hooks/sync/useSyncProgress";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Package, FolderTree, FileText, Square, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface WooSyncModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    storeName: string;
}

export function WooSyncModal({ open, onOpenChange, storeId, storeName }: WooSyncModalProps) {
    const { startSync, stopSync, forceRestartSync, isLoading: isStarting, isStopping } = useSyncManager();
    const { activeJob, logs } = useSyncProgress(open ? storeId : null);
    const [isRestarting, setIsRestarting] = useState(false);

    // Determine sync state
    const syncState = useMemo(() => {
        if (!activeJob) return 'idle';
        if (activeJob.status === 'completed') return 'completed';
        if (activeJob.status === 'failed' || activeJob.status === 'cancelled') return 'failed';
        return 'syncing';
    }, [activeJob?.status]);

    const isRunning = syncState === 'syncing';

    // Calculate overall progress (Products + Categories + Blog Posts only)
    const progress = useMemo(() => {
        if (!activeJob) return 0;
        const total = (activeJob.total_products || 0) + (activeJob.total_categories || 0) + (activeJob.total_posts || 0);
        const synced = (activeJob.synced_products || 0) + (activeJob.synced_categories || 0) + (activeJob.synced_posts || 0);
        if (total === 0) return syncState === 'completed' ? 100 : 0;
        return Math.round((synced / total) * 100);
    }, [activeJob, syncState]);

    // Current phase label
    const phaseLabel = useMemo(() => {
        if (!activeJob) return 'En attente...';
        switch (activeJob.current_phase) {
            case 'discovery': return 'Analyse de la boutique...';
            case 'products': return 'Synchronisation des produits...';
            case 'variations': return 'Traitement des variantes...';
            case 'categories': return 'Synchronisation des catégories...';
            case 'posts': return 'Synchronisation des articles...';
            case 'completed': return activeJob.status === 'failed' ? 'Synchronisation échouée' : 'Synchronisation terminée';
            default: return 'Synchronisation en cours...';
        }
    }, [activeJob?.current_phase, activeJob?.status]);

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

    // Auto-start sync when modal opens and no active job
    useEffect(() => {
        if (open && syncState === 'idle' && !isStarting) {
            // Small delay to let the modal render
            const timer = setTimeout(() => handleStartSync(), 500);
            return () => clearTimeout(timer);
        }
    }, [open, syncState, isStarting]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Synchronisation
                        {isRunning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                En cours
                            </span>
                        )}
                        {syncState === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Terminé
                            </span>
                        )}
                        {syncState === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                                <XCircle className="w-3 h-3" />
                                {activeJob?.status === 'cancelled' ? 'Annulé' : 'Erreur'}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {storeName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Main Progress */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{phaseLabel}</span>
                            <span className="font-mono font-medium">{progress}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className={cn(
                                "h-2",
                                syncState === 'failed' && "[&>div]:bg-destructive"
                            )}
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard
                            icon={<Package className="w-4 h-4" />}
                            label="Produits"
                            current={activeJob?.synced_products || 0}
                            total={activeJob?.total_products || 0}
                            isActive={activeJob?.current_phase === 'products' || activeJob?.current_phase === 'variations'}
                        />
                        <StatCard
                            icon={<FolderTree className="w-4 h-4" />}
                            label="Catégories"
                            current={activeJob?.synced_categories || 0}
                            total={activeJob?.total_categories || 0}
                            isActive={activeJob?.current_phase === 'categories'}
                        />
                        <StatCard
                            icon={<FileText className="w-4 h-4" />}
                            label="Articles"
                            current={activeJob?.synced_posts || 0}
                            total={activeJob?.total_posts || 0}
                            isActive={activeJob?.current_phase === 'posts'}
                        />
                    </div>

                    {/* Error message if failed */}
                    {syncState === 'failed' && activeJob?.error_message && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-xs text-destructive line-clamp-3">
                                {activeJob.error_message.split(';')[0]}
                            </p>
                        </div>
                    )}

                    {/* Recent Logs (compact) */}
                    {logs.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Activité récente</p>
                            <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-muted-foreground">
                                {logs.slice(-5).map((log, i) => (
                                    <div key={log.id || i} className="flex items-start gap-2">
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                            log.type === 'error' && "bg-destructive",
                                            log.type === 'success' && "bg-emerald-500",
                                            log.type === 'info' && "bg-primary",
                                            log.type === 'warning' && "bg-amber-500"
                                        )} />
                                        <span className="line-clamp-1">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {/* Boutons pour sync en cours */}
                    {isRunning && (
                        <>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleStopSync}
                                disabled={isStopping}
                                className="sm:order-1"
                            >
                                {isStopping ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Square className="w-4 h-4 mr-2" />
                                )}
                                Stopper
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleForceRestart}
                                disabled={isRestarting || isStopping}
                                className="sm:order-2"
                            >
                                {isRestarting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                )}
                                Relancer
                            </Button>
                        </>
                    )}

                    {/* Bouton Relancer pour sync terminée ou échouée */}
                    {(syncState === 'completed' || syncState === 'failed' || syncState === 'idle') && !isRunning && (
                        <Button onClick={handleStartSync} disabled={isStarting}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", isStarting && "animate-spin")} />
                            {syncState === 'idle' ? 'Synchroniser' : 'Relancer'}
                        </Button>
                    )}

                    <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:order-3">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Compact stat card component
function StatCard({
    icon,
    label,
    current,
    total,
    isActive
}: {
    icon: React.ReactNode;
    label: string;
    current: number;
    total: number;
    isActive: boolean;
}) {
    const isDone = total > 0 && current >= total;

    return (
        <div className={cn(
            "p-3 rounded-lg border transition-colors",
            isActive && "border-primary bg-primary/5",
            isDone && "border-emerald-500/30 bg-emerald-500/5",
            !isActive && !isDone && "border-border bg-muted/30"
        )}>
            <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                    "text-muted-foreground",
                    isActive && "text-primary",
                    isDone && "text-emerald-600"
                )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : icon}
                </span>
                <span className="text-xs font-medium truncate">{label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">
                {current}<span className="text-muted-foreground font-normal text-sm">/{total}</span>
            </p>
        </div>
    );
}

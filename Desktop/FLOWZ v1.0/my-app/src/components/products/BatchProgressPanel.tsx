/**
 * BatchProgressPanel - Panneau de progression pour les jobs batch
 */
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Pause,
    Play,
    X,
    RefreshCw,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useBatchProgress,
    useCancelBatchJob,
    useRetryBatchJob,
    useBatchJobRealtime,
    type BatchJob,
} from '@/hooks/products/useBatchProgress';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface BatchProgressPanelProps {
    jobId: string;
    onClose?: () => void;
    onComplete?: (job: BatchJob) => void;
    minimal?: boolean;
}

// ============================================================================
// Status Config
// ============================================================================

const statusConfig = {
    pending: {
        icon: Clock,
        label: 'En attente',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        badgeVariant: 'secondary' as const,
    },
    processing: {
        icon: Loader2,
        label: 'En cours',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        badgeVariant: 'default' as const,
    },
    completed: {
        icon: CheckCircle2,
        label: 'Terminé',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        badgeVariant: 'default' as const,
    },
    failed: {
        icon: XCircle,
        label: 'Échoué',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        badgeVariant: 'destructive' as const,
    },
    cancelled: {
        icon: AlertTriangle,
        label: 'Annulé',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        badgeVariant: 'secondary' as const,
    },
};

// ============================================================================
// Component
// ============================================================================

export function BatchProgressPanel({
    jobId,
    onClose,
    onComplete,
    minimal = false,
}: BatchProgressPanelProps) {
    const {
        job,
        progress,
        processedItems,
        totalItems,
        failedItems,
        status,
        isComplete,
        isProcessing,
        isLoading,
        error,
    } = useBatchProgress(jobId);

    const cancelJob = useCancelBatchJob();
    const retryJob = useRetryBatchJob();

    // Subscribe to realtime updates
    useBatchJobRealtime(jobId);

    // Callback on completion
    useEffect(() => {
        if (isComplete && job && onComplete) {
            onComplete(job);
        }
    }, [isComplete, job, onComplete]);

    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full border-destructive">
                <CardContent className="flex items-center gap-3 py-4">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive">
                        Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}
                    </span>
                </CardContent>
            </Card>
        );
    }

    // Minimal version (inline progress)
    if (minimal) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <StatusIcon
                    className={`h-5 w-5 ${config.color} ${isProcessing ? 'animate-spin' : ''}`}
                />
                <div className="flex-1 min-w-0">
                    <Progress value={progress} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {processedItems}/{totalItems}
                </span>
                {isProcessing && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cancelJob.mutate({ jobId })}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    // Full version
    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <StatusIcon
                                className={`h-5 w-5 ${config.color} ${isProcessing ? 'animate-spin' : ''}`}
                            />
                        </div>
                        <div>
                            <CardTitle className="text-base">Génération en cours</CardTitle>
                            {job?.created_at && (
                                <p className="text-xs text-muted-foreground">
                                    Démarré{' '}
                                    {formatDistanceToNow(new Date(job.created_at), {
                                        addSuffix: true,
                                        locale: fr,
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{processedItems}</p>
                        <p className="text-xs text-muted-foreground">Traités</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{totalItems}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className={`text-2xl font-bold ${failedItems > 0 ? 'text-destructive' : ''}`}>
                            {failedItems}
                        </p>
                        <p className="text-xs text-muted-foreground">Échecs</p>
                    </div>
                </div>

                {/* Error message */}
                {job?.error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{job.error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    {isProcessing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelJob.mutate({ jobId })}
                            disabled={cancelJob.isPending}
                        >
                            {cancelJob.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <X className="h-4 w-4 mr-2" />
                            )}
                            Annuler
                        </Button>
                    )}

                    {status === 'failed' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryJob.mutate({ jobId })}
                            disabled={retryJob.isPending}
                        >
                            {retryJob.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Réessayer
                        </Button>
                    )}

                    {isComplete && onClose && (
                        <Button variant="default" size="sm" onClick={onClose}>
                            Fermer
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Compact Progress Indicator
// ============================================================================

export function BatchProgressIndicator({ jobId }: { jobId: string }) {
    const { progress, status, isProcessing } = useBatchProgress(jobId);
    useBatchJobRealtime(jobId);

    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
        <div className="flex items-center gap-2">
            <StatusIcon
                className={`h-4 w-4 ${config.color} ${isProcessing ? 'animate-spin' : ''}`}
            />
            <Progress value={progress} className="h-1.5 w-20" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
    );
}

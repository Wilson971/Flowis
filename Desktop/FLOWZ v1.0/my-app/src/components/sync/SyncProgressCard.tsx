/**
 * SyncProgressCard - Carte affichant la progression d'une synchronisation
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
    Play,
    Pause,
    StopCircle,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowDownToLine,
} from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { SyncJob, SyncActionsState } from '@/types/sync';

interface SyncProgressCardProps {
    job: SyncJob | null;
    storeName?: string;
    actions: SyncActionsState;
    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    isLoading?: boolean;
    className?: string;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function SyncProgressCard({
    job,
    storeName,
    actions,
    onStart,
    onPause,
    onResume,
    onCancel,
    isLoading = false,
    className,
}: SyncProgressCardProps) {
    // Calculate progress percentage
    const totalItems = (job?.total_products || 0) + (job?.total_variations || 0) + (job?.total_categories || 0);
    const syncedItems = (job?.synced_products || 0) + (job?.synced_variations || 0) + (job?.synced_categories || 0);
    const progressPercent = totalItems > 0 ? Math.round((syncedItems / totalItems) * 100) : 0;

    // Calculate duration
    let durationSeconds = 0;
    if (job?.started_at) {
        const start = new Date(job.started_at).getTime();
        const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();
        durationSeconds = Math.round((end - start) / 1000);
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="pb-4 border-b border-border/10 mb-4 px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                            <ArrowDownToLine className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                                Synchronisation {storeName && <span className="text-primary opacity-70">• {storeName}</span>}
                            </p>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">
                                {job ? job.current_phase : "Configuration"}
                            </h3>
                        </div>
                    </div>
                    {job && <SyncStatusBadge status={job.status} className="shadow-sm" />}
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 pt-0 space-y-5">
                {/* Progress Bar */}
                {job && actions.isRunning && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                            <span className="text-muted-foreground">Progression Globale</span>
                            <span className="text-foreground tabular-nums">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2 bg-muted/50" />
                        <p className="text-[10px] font-bold text-muted-foreground text-center pt-1 uppercase tracking-wider">
                            {syncedItems} / {totalItems} éléments synchronisés
                        </p>
                    </div>
                )}

                {/* Stats Grid */}
                {job && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{job.synced_products}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Produits</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-2xl font-bold text-blue-500 tabular-nums tracking-tight">{job.synced_variations}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Variations</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-2xl font-bold text-emerald-500 tabular-nums tracking-tight">{job.synced_categories}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Catégories</span>
                        </div>
                    </div>
                )}

                {/* Time Info */}
                {job && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Durée: {formatDuration(durationSeconds)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {job.started_at && (
                                <span>Début: {formatTime(job.started_at)}</span>
                            )}
                            {job.completed_at && (
                                <span>Fin: {formatTime(job.completed_at)}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {job?.error_message && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{job.error_message}</p>
                    </div>
                )}

                {/* Success Message */}
                {actions.isCompleted && !job?.error_message && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <p>Synchronisation terminée avec succès !</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    {actions.canStart && (
                        <Button
                            onClick={onStart}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Démarrer
                        </Button>
                    )}

                    {actions.canPause && (
                        <Button
                            variant="outline"
                            onClick={onPause}
                            disabled={isLoading}
                        >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                        </Button>
                    )}

                    {actions.canResume && (
                        <Button
                            onClick={onResume}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Reprendre
                        </Button>
                    )}

                    {actions.canCancel && (
                        <Button
                            variant="destructive"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Annuler
                        </Button>
                    )}
                </div>

                {/* No job state */}
                {!job && (
                    <div className="text-center py-6 text-muted-foreground">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune synchronisation en cours</p>
                        <Button
                            onClick={onStart}
                            disabled={isLoading}
                            className="mt-4"
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Lancer une synchronisation
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

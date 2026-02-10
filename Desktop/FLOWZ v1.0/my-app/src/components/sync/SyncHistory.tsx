/**
 * SyncHistory - Historique des synchronisations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronRight,
    RefreshCw,
    Package,
    Layers,
    FolderTree,
} from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { SyncReport } from '@/hooks/sync/useSyncReports';
import type { SyncJob } from '@/types/sync';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SyncHistoryProps {
    reports?: SyncReport[];
    isLoading?: boolean;
    onViewDetails?: (jobId: string) => void;
    className?: string;
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
}

export function SyncHistory({
    reports = [],
    isLoading = false,
    onViewDetails,
    className,
}: SyncHistoryProps) {
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5" />
                        Historique des synchronisations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5" />
                    Historique des synchronisations
                </CardTitle>
            </CardHeader>
            <CardContent>
                {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune synchronisation récente</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {reports.map((report) => (
                                <SyncHistoryItem
                                    key={report.job.id}
                                    job={report.job}
                                    summary={report.summary}
                                    onViewDetails={onViewDetails}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

interface SyncHistoryItemProps {
    job: SyncJob;
    summary: SyncReport['summary'];
    onViewDetails?: (jobId: string) => void;
}

function SyncHistoryItem({ job, summary, onViewDetails }: SyncHistoryItemProps) {
    const isSuccess = job.status === 'completed';
    const isFailed = job.status === 'failed' || job.status === 'error';

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                'hover:bg-muted/50 cursor-pointer',
                isSuccess && 'border-green-200 dark:border-green-900/50',
                isFailed && 'border-red-200 dark:border-red-900/50'
            )}
            onClick={() => onViewDetails?.(job.id)}
        >
            {/* Status Icon */}
            <div
                className={cn(
                    'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    isSuccess && 'bg-green-100 dark:bg-green-900/30',
                    isFailed && 'bg-red-100 dark:bg-red-900/30',
                    !isSuccess && !isFailed && 'bg-muted'
                )}
            >
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
                {isFailed && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                {!isSuccess && !isFailed && <Clock className="w-5 h-5 text-muted-foreground" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                        {job.job_type === 'import_products' ? 'Import produits' : job.job_type}
                    </span>
                    <SyncStatusBadge status={job.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {summary.successProducts} produits
                    </span>
                    <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {summary.successVariations} variations
                    </span>
                    <span className="flex items-center gap-1">
                        <FolderTree className="w-3 h-3" />
                        {summary.successCategories} catégories
                    </span>
                </div>
            </div>

            {/* Meta */}
            <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>{formatDate(job.completed_at || job.started_at)}</p>
                <p>{formatDuration(summary.durationSeconds)}</p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
    );
}

/**
 * SyncStats - Statistiques de synchronisation
 */
interface SyncStatsProps {
    stats: {
        totalSyncs: number;
        successfulSyncs: number;
        failedSyncs: number;
        successRate: number;
        totalProductsSynced: number;
        avgDurationSeconds: number;
        lastSyncAt: string | null;
    } | null;
    isLoading?: boolean;
    className?: string;
}

export function SyncStats({ stats, isLoading, className }: SyncStatsProps) {
    if (isLoading || !stats) {
        return (
            <div className={cn('grid grid-cols-4 gap-4', className)}>
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="animate-pulse">
                                <div className="h-8 bg-muted rounded w-16 mb-2" />
                                <div className="h-4 bg-muted rounded w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Total syncs</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalSyncs}</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Taux succès</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Produits importés</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalProductsSynced}</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Durée moyenne</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{formatDuration(stats.avgDurationSeconds)}</p>
                </CardContent>
            </Card>
        </div>
    );
}

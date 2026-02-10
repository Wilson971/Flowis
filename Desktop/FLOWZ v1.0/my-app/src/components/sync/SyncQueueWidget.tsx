'use client';

/**
 * SyncQueueWidget - Compact sync queue status display
 *
 * Shows the current state of the sync queue with real-time updates.
 * Can be used in dashboard, sidebar, or as a floating widget.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  useSyncQueueStats,
  useSyncQueueRealtime,
  useSyncQueueJobs,
} from '@/hooks/sync';

// ============================================================================
// TYPES
// ============================================================================

interface SyncQueueWidgetProps {
  storeId?: string;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SyncQueueWidget({
  storeId,
  className,
  compact = false,
}: SyncQueueWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: stats, isLoading, refetch } = useSyncQueueStats(storeId);
  const { data: jobs } = useSyncQueueJobs(storeId, ['pending', 'processing']);

  // Enable real-time updates
  useSyncQueueRealtime(storeId);

  const hasActiveSync = (stats?.pending || 0) + (stats?.processing || 0) > 0;
  const hasErrors = (stats?.failed || 0) + (stats?.deadLetter || 0) > 0;

  // Calculate progress percentage
  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  // Status icon and color
  const getStatusDisplay = () => {
    if (isLoading) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-muted-foreground',
        label: 'Chargement...',
      };
    }
    if (stats?.processing && stats.processing > 0) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-blue-500',
        label: `${stats.processing} en cours`,
      };
    }
    if (hasErrors) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-destructive',
        label: `${(stats?.failed || 0) + (stats?.deadLetter || 0)} erreur(s)`,
      };
    }
    if (stats?.pending && stats.pending > 0) {
      return {
        icon: <Cloud className="h-4 w-4" />,
        color: 'text-yellow-500',
        label: `${stats.pending} en attente`,
      };
    }
    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-green-500',
      label: 'Synchronisé',
    };
  };

  const status = getStatusDisplay();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={status.color}>{status.icon}</span>
        {hasActiveSync && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {(stats?.pending || 0) + (stats?.processing || 0)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          className
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className={status.color}>{status.icon}</span>
              <div className="text-left">
                <p className="text-sm font-medium">File de synchronisation</p>
                <p className={cn('text-xs', status.color)}>{status.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveSync && (
                <Badge variant="secondary">
                  {(stats?.pending || 0) + (stats?.processing || 0)}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="border-t px-3 pb-3 pt-2 space-y-3">
            {/* Progress Bar */}
            {hasActiveSync && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progression</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold text-yellow-500">
                  {stats?.pending || 0}
                </p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold text-blue-500">
                  {stats?.processing || 0}
                </p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold text-green-500">
                  {stats?.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">Terminé</p>
              </div>
            </div>

            {/* Error indicator */}
            {hasErrors && (
              <div className="flex items-center justify-between rounded-md bg-destructive/10 p-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">
                    {(stats?.failed || 0) + (stats?.deadLetter || 0)} erreur(s)
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Voir
                </Button>
              </div>
            )}

            {/* Active Jobs */}
            {jobs && jobs.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Jobs actifs
                </p>
                <AnimatePresence>
                  {jobs.slice(0, 3).map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-xs"
                    >
                      <span className="truncate max-w-[120px]">
                        {job.product_id.slice(0, 8)}...
                      </span>
                      <Badge
                        variant={
                          job.status === 'processing' ? 'default' : 'secondary'
                        }
                        className="h-4 text-[10px]"
                      >
                        {job.status === 'processing' ? 'En cours' : 'Attente'}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {jobs.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{jobs.length - 3} autres
                  </p>
                )}
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Actualiser
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// FLOATING WIDGET VARIANT
// ============================================================================

export function SyncQueueFloatingWidget({ storeId }: { storeId?: string }) {
  const { data: stats } = useSyncQueueStats(storeId);
  useSyncQueueRealtime(storeId);

  const pendingCount = (stats?.pending || 0) + (stats?.processing || 0);

  if (pendingCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">
          Synchronisation: {pendingCount} en cours
        </span>
      </div>
    </motion.div>
  );
}

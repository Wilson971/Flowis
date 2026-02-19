'use client';

/**
 * SyncStatusBadge - Visual indicator for WooCommerce sync status
 *
 * Displays sync state as a compact badge with retry action on failure.
 * Uses CSS variables for colors (FLOWZ DS compliant).
 */

import { Loader2, Check, AlertCircle, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { WCSyncStatus } from '@/types/blog';

interface SyncStatusBadgeProps {
  status: WCSyncStatus;
  lastSyncedAt?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<WCSyncStatus, {
  icon: React.ElementType;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  animate?: boolean;
}> = {
  synced: {
    icon: Check,
    label: 'Synchronise',
    variant: 'secondary',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15',
  },
  pending: {
    icon: Loader2,
    label: 'En cours...',
    variant: 'secondary',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15',
    animate: true,
  },
  failed: {
    icon: AlertCircle,
    label: 'Echec sync',
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15',
  },
  not_synced: {
    icon: CloudOff,
    label: 'Non sync',
    variant: 'outline',
    className: 'text-muted-foreground',
  },
};

export function SyncStatusBadge({
  status,
  lastSyncedAt,
  onRetry,
  isRetrying,
  className,
}: SyncStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const tooltipText = lastSyncedAt
    ? `Derniere sync: ${new Date(lastSyncedAt).toLocaleString('fr-FR')}`
    : status === 'not_synced'
      ? 'Pas encore synchronise avec WooCommerce'
      : config.label;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center gap-1.5', className)}>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-[10px] font-bold uppercase tracking-widest cursor-default',
                config.className
              )}
            >
              <Icon className={cn('h-3 w-3', config.animate && 'animate-spin')} />
              {config.label}
            </Badge>

            {status === 'failed' && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-6 w-6 rounded-md"
              >
                {isRetrying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

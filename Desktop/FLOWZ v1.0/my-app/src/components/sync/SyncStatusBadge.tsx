/**
 * SyncStatusBadge - Badge affichant le status d'une synchronisation
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    XCircle,
    Pause,
    Loader2,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import type { SyncStatus } from '@/types/sync';

interface SyncStatusBadgeProps {
    status: SyncStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const statusConfig: Record<SyncStatus, {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
    className: string;
}> = {
    idle: {
        label: 'Inactif',
        variant: 'secondary',
        icon: Clock,
        className: 'bg-muted text-muted-foreground',
    },
    pending: {
        label: 'En attente',
        variant: 'secondary',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-amber-400',
    },
    running: {
        label: 'En cours',
        variant: 'default',
        icon: Loader2,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    discovering: {
        label: 'Découverte',
        variant: 'default',
        icon: Loader2,
        className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    fetching: {
        label: 'Récupération',
        variant: 'default',
        icon: Loader2,
        className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
    saving: {
        label: 'Sauvegarde',
        variant: 'default',
        icon: Loader2,
        className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    },
    syncing: {
        label: 'Synchronisation',
        variant: 'default',
        icon: Loader2,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    importing: {
        label: 'Import',
        variant: 'default',
        icon: Loader2,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    paused: {
        label: 'En pause',
        variant: 'secondary',
        icon: Pause,
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
    completed: {
        label: 'Terminé',
        variant: 'outline',
        icon: CheckCircle2,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-green-900/30 dark:text-emerald-400 border-emerald-300',
    },
    failed: {
        label: 'Échec',
        variant: 'destructive',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-destructive',
    },
    cancelled: {
        label: 'Annulé',
        variant: 'secondary',
        icon: XCircle,
        className: 'bg-muted text-gray-800 dark:bg-gray-900/30 dark:text-muted-foreground',
    },
    error: {
        label: 'Erreur',
        variant: 'destructive',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-destructive',
    },
};

const sizeConfig = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-0.5 gap-1.5',
    lg: 'text-base px-3 py-1 gap-2',
};

const iconSizeConfig = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
};

export function SyncStatusBadge({
    status,
    size = 'md',
    showIcon = true,
    className,
}: SyncStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.idle;
    const Icon = config.icon;
    const isAnimated = ['running', 'discovering', 'fetching', 'saving', 'syncing', 'importing', 'pending'].includes(status);

    return (
        <Badge
            variant={config.variant}
            className={cn(
                'inline-flex items-center font-medium',
                config.className,
                sizeConfig[size],
                className
            )}
        >
            {showIcon && (
                <Icon
                    className={cn(
                        iconSizeConfig[size],
                        isAnimated && 'animate-spin'
                    )}
                />
            )}
            {config.label}
        </Badge>
    );
}

/**
 * Compact version for tables
 */
export function SyncStatusDot({
    status,
    className,
}: {
    status: SyncStatus;
    className?: string;
}) {
    const isActive = ['running', 'discovering', 'fetching', 'saving', 'syncing', 'importing', 'pending'].includes(status);
    const isSuccess = status === 'completed';
    const isError = status === 'failed' || status === 'error';
    const isPaused = status === 'paused' || status === 'cancelled';

    return (
        <span
            className={cn(
                'inline-block w-2 h-2 rounded-full',
                isActive && 'bg-primary animate-pulse',
                isSuccess && 'bg-emerald-500',
                isError && 'bg-destructive',
                isPaused && 'bg-orange-500',
                !isActive && !isSuccess && !isError && !isPaused && 'bg-gray-400',
                className
            )}
            title={statusConfig[status]?.label}
        />
    );
}

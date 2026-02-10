/**
 * SyncButton - Bouton de synchronisation avec état
 *
 * Exemple d'utilisation du nouveau système de sync.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    RefreshCw,
    Pause,
    Play,
    X,
    Check,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useSyncForStore } from '../SyncProvider';
import type { SyncOptions } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface SyncButtonProps {
    storeId: string;
    options?: SyncOptions;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showProgress?: boolean;
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SyncButton({
    storeId,
    options,
    variant = 'default',
    size = 'default',
    showProgress = true,
    className,
}: SyncButtonProps) {
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

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClick = () => {
        if (canStart && !isActive) {
            start(options);
        } else if (canPause) {
            pause();
        } else if (canResume) {
            resume();
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canCancel) {
            cancel();
        }
    };

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const getIcon = () => {
        if (isSyncing && !isPaused) {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }
        if (isPaused) {
            return <Play className="h-4 w-4" />;
        }
        if (isCompleted) {
            return <Check className="h-4 w-4" />;
        }
        if (isFailed) {
            return <AlertCircle className="h-4 w-4" />;
        }
        return <RefreshCw className="h-4 w-4" />;
    };

    const getLabel = () => {
        if (isSyncing && !isPaused) {
            return progress?.message || 'Synchronisation...';
        }
        if (isPaused) {
            return 'Reprendre';
        }
        if (isCompleted) {
            return 'Terminé';
        }
        if (isFailed) {
            return 'Réessayer';
        }
        return 'Synchroniser';
    };

    const getVariant = () => {
        if (isCompleted) return 'outline';
        if (isFailed) return 'destructive';
        return variant;
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-center gap-2">
                <Button
                    variant={getVariant() as 'default' | 'outline' | 'ghost' | 'destructive'}
                    size={size}
                    onClick={handleClick}
                    disabled={!canStart && !canPause && !canResume}
                    className="flex-1"
                >
                    {getIcon()}
                    {size !== 'icon' && (
                        <span className="ml-2">{getLabel()}</span>
                    )}
                </Button>

                {/* Bouton Pause (affiché pendant la sync) */}
                {canPause && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => pause()}
                        title="Mettre en pause"
                    >
                        <Pause className="h-4 w-4" />
                    </Button>
                )}

                {/* Bouton Cancel */}
                {canCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        title="Annuler"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Progress Bar */}
            {showProgress && isActive && progress && (
                <div className="space-y-1">
                    <Progress value={progress.percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        {progress.message} ({progress.percent}%)
                    </p>
                </div>
            )}

            {/* Error Message */}
            {isFailed && error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface SyncIconButtonProps {
    storeId: string;
    options?: SyncOptions;
    className?: string;
}

export function SyncIconButton({
    storeId,
    options,
    className,
}: SyncIconButtonProps) {
    const { isSyncing, progress, start, canStart } = useSyncForStore(storeId);

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => canStart && start(options)}
            disabled={!canStart}
            className={cn('relative', className)}
            title={isSyncing ? `${progress?.percent ?? 0}%` : 'Synchroniser'}
        >
            <RefreshCw
                className={cn(
                    'h-4 w-4 transition-transform',
                    isSyncing && 'animate-spin'
                )}
            />
            {isSyncing && progress && (
                <span className="absolute -bottom-1 -right-1 text-[10px] font-medium">
                    {progress.percent}%
                </span>
            )}
        </Button>
    );
}

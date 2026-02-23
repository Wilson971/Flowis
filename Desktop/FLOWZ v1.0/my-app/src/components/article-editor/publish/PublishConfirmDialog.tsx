'use client';

/**
 * PublishConfirmDialog - Confirmation dialog before publishing an article
 * 
 * Ensures users confirm their intent before making content public
 */

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Globe, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PublishPlatform } from '@/schemas/article-editor';

// ============================================================================
// TYPES
// ============================================================================

interface PublishConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title?: string;
    platforms: PublishPlatform[];
    publishMode: 'now' | 'scheduled';
    scheduledAt?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PLATFORM_LABELS: Record<PublishPlatform, string> = {
    flowz: 'FLOWZ Blog',
    woocommerce: 'WooCommerce',
    wordpress: 'WordPress',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PublishConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    title,
    platforms,
    publishMode,
    scheduledAt,
}: PublishConfirmDialogProps) {
    const isScheduled = publishMode === 'scheduled' && scheduledAt;

    const formatScheduledDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {isScheduled ? (
                            <>
                                <Calendar className="h-5 w-5 text-primary" />
                                Confirmer la planification
                            </>
                        ) : (
                            <>
                                <Globe className="h-5 w-5 text-emerald-500" />
                                Confirmer la publication
                            </>
                        )}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <p>
                                {isScheduled
                                    ? 'Êtes-vous sûr de vouloir planifier la publication de cet article ?'
                                    : 'Êtes-vous sûr de vouloir publier cet article maintenant ?'}
                            </p>

                            {title && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="font-medium text-sm text-foreground">« {title} »</p>
                                </div>
                            )}

                            {isScheduled && scheduledAt && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Prévu pour le {formatScheduledDate(scheduledAt)}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-muted-foreground">Plateformes :</span>
                                {platforms.map((platform) => (
                                    <Badge key={platform} variant="secondary">
                                        {PLATFORM_LABELS[platform]}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    {isScheduled
                                        ? 'L\'article sera automatiquement publié à la date prévue sur les plateformes sélectionnées.'
                                        : 'Cette action rendra l\'article visible au public sur les plateformes sélectionnées.'}
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={isScheduled ? 'bg-primary hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isScheduled ? 'Planification...' : 'Publication...'}
                            </>
                        ) : (
                            isScheduled ? 'Planifier' : 'Publier'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default PublishConfirmDialog;

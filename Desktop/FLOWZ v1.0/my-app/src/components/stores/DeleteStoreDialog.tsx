/**
 * DeleteStoreDialog - Dialog de confirmation de suppression d'une boutique
 */

'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Store } from '@/types/store';

interface DeleteStoreDialogProps {
    store: Store | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScheduleDeletion: (storeId: string, confirmation: string) => void;
    onPermanentDelete?: (storeId: string) => void;
    isPending?: boolean;
    gracePeriodDays?: number;
}

export function DeleteStoreDialog({
    store,
    open,
    onOpenChange,
    onScheduleDeletion,
    onPermanentDelete,
    isPending = false,
    gracePeriodDays = 7,
}: DeleteStoreDialogProps) {
    const [confirmation, setConfirmation] = useState('');
    const [mode, setMode] = useState<'schedule' | 'permanent'>('schedule');

    const isConfirmed = confirmation === 'SUPPRIMER';

    const handleClose = () => {
        setConfirmation('');
        setMode('schedule');
        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (!store || !isConfirmed) return;

        if (mode === 'permanent' && onPermanentDelete) {
            onPermanentDelete(store.id);
        } else {
            onScheduleDeletion(store.id, confirmation);
        }

        handleClose();
    };

    if (!store) return null;

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 text-destructive">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <AlertDialogTitle>Supprimer la boutique</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2">
                        Vous êtes sur le point de supprimer <strong>"{store.name}"</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mode selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setMode('schedule')}
                            className={cn(
                                'p-3 rounded-lg border text-left transition-all',
                                mode === 'schedule'
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                            )}
                        >
                            <Calendar className="w-4 h-4 mb-2 text-primary" />
                            <p className="text-sm font-medium">Planifier</p>
                            <p className="text-xs text-muted-foreground">
                                Suppression dans {gracePeriodDays} jours
                            </p>
                        </button>

                        {onPermanentDelete && (
                            <button
                                type="button"
                                onClick={() => setMode('permanent')}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-all',
                                    mode === 'permanent'
                                        ? 'border-destructive bg-destructive/5 ring-2 ring-destructive/20'
                                        : 'border-border hover:border-destructive/50'
                                )}
                            >
                                <Trash2 className="w-4 h-4 mb-2 text-destructive" />
                                <p className="text-sm font-medium">Immédiate</p>
                                <p className="text-xs text-muted-foreground">
                                    Suppression définitive
                                </p>
                            </button>
                        )}
                    </div>

                    {/* Warning */}
                    <div
                        className={cn(
                            'p-3 rounded-lg text-sm',
                            mode === 'permanent'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        )}
                    >
                        {mode === 'permanent' ? (
                            <>
                                <strong>⚠️ Attention :</strong> Cette action est irréversible.
                                Toutes les données (produits, catégories, historique de sync)
                                seront définitivement supprimées.
                            </>
                        ) : (
                            <>
                                La boutique sera supprimée dans <strong>{gracePeriodDays} jours</strong>.
                                Vous pourrez annuler cette action pendant ce délai.
                            </>
                        )}
                    </div>

                    {/* Confirmation input */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmation" className="text-sm">
                            Tapez <strong className="text-destructive">SUPPRIMER</strong> pour confirmer
                        </Label>
                        <Input
                            id="confirmation"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder="SUPPRIMER"
                            className={cn(
                                isConfirmed && 'border-green-500 focus-visible:ring-green-500'
                            )}
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!isConfirmed || isPending}
                    >
                        {isPending ? (
                            'Suppression...'
                        ) : mode === 'permanent' ? (
                            'Supprimer maintenant'
                        ) : (
                            'Planifier la suppression'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

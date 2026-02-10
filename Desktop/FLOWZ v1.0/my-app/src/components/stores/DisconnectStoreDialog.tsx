/**
 * DisconnectStoreDialog - Dialog de confirmation de déconnexion d'une boutique
 */

'use client';

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
import { Button } from '@/components/ui/button';
import { Unplug, AlertTriangle } from 'lucide-react';
import type { Store } from '@/types/store';

interface DisconnectStoreDialogProps {
    store: Store | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (storeId: string, force?: boolean) => void;
    isPending?: boolean;
    hasSyncInProgress?: boolean;
}

export function DisconnectStoreDialog({
    store,
    open,
    onOpenChange,
    onConfirm,
    isPending = false,
    hasSyncInProgress = false,
}: DisconnectStoreDialogProps) {
    if (!store) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 text-amber-500">
                        <div className="p-2 rounded-full bg-amber-500/10">
                            <Unplug className="w-5 h-5" />
                        </div>
                        <AlertDialogTitle>Déconnecter la boutique</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2 space-y-2">
                        <p>
                            Vous êtes sur le point de déconnecter <strong>"{store.name}"</strong>.
                        </p>
                        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                            <li>Les synchronisations automatiques seront désactivées</li>
                            <li>Les données locales seront conservées</li>
                            <li>Vous pourrez reconnecter la boutique à tout moment</li>
                        </ul>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {hasSyncInProgress && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>
                            Une synchronisation est en cours. Elle sera annulée si vous continuez.
                        </p>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" disabled={isPending}>
                            Annuler
                        </Button>
                    </AlertDialogCancel>
                    <Button
                        variant="default"
                        onClick={() => onConfirm(store.id, hasSyncInProgress)}
                        disabled={isPending}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {isPending ? 'Déconnexion...' : 'Déconnecter'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

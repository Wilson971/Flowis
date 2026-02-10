"use client"

/**
 * Stores Management Page
 *
 * Manage connected e-commerce stores (WooCommerce, Shopify, etc.)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, Plus, ExternalLink, Settings, Trash2, RefreshCw } from 'lucide-react';
import { WooSyncModal } from '@/components/sync/WooSyncModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { StoreSettingsModal } from '@/components/stores/StoreSettingsModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSelectedStore, type Store } from '@/contexts/StoreContext';

/**
 * Store Card Component
 */
interface StoreCardProps {
    store: Store;
    isSelected: boolean;
    onSelect: () => void;
}

function StoreCard({ store, isSelected, onSelect }: StoreCardProps) {
    const platformBadgeVariant = {
        woocommerce: 'default' as const,
        shopify: 'info' as const,
        custom: 'neutral' as const,
    };

    const statusBadgeVariant = {
        active: 'success' as const,
        inactive: 'neutral' as const,
        error: 'danger' as const,
    };

    const [showSync, setShowSync] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const queryClient = useQueryClient();
    const supabase = createClient();

    // Delete Mutation
    const deleteStoreMutation = useMutation({
        mutationFn: async () => {
            // 1. Delete connection first (FK constraint usually handles this or explicit)
            // But schema usually has FK on stores -> platform_connections.
            // Actually stores has connection_id.
            // We should delete store first if cascade is set, or connection first if not.
            // Safest is to delete store row.

            // Check if we need to delete connection row manually.
            const connectionId = store.platform_connections?.id; // Assuming we have this from select(*)

            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', store.id);

            if (error) throw error;

            // Optional: If no cascade, delete connection.
            if (connectionId) {
                await supabase.from('platform_connections').delete().eq('id', connectionId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success("Store deleted successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to delete store", {
                description: error.message
            });
        },
    });

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''
                }`}
            onClick={onSelect}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <StoreIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{store.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={platformBadgeVariant[store.platform]} size="sm">
                                    {store.platform}
                                </Badge>
                                <Badge variant={statusBadgeVariant[store.status || 'active']} size="sm">
                                    {store.status || 'active'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {isSelected && (
                        <Badge variant="success" size="sm">
                            Sélectionnée
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Connection Info */}
                    {store.platform_connections?.shop_url && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ExternalLink className="h-4 w-4" />
                            <span className="truncate">{store.platform_connections.shop_url}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSync(true);
                            }}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.stopPropagation();
                                setShowSettings(true);
                            }}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.stopPropagation();
                                setShowDeleteAlert(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardContent>
            <WooSyncModal
                open={showSync}
                onOpenChange={setShowSync}
                storeId={store.id}
                storeName={store.name}
            />

            <StoreSettingsModal
                open={showSettings}
                onOpenChange={setShowSettings}
                store={store}
            />

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the store
                            "{store.name}" and remove all associated data (products, logs, etc.) from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteStoreMutation.mutate()}
                        >
                            {deleteStoreMutation.isPending ? "Deleting..." : "Delete Store"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

export default function StoresPage() {
    const { stores, isLoading, selectedStore, setSelectedStore, refetch } = useSelectedStore();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Chargement des boutiques...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Boutiques</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos boutiques en ligne connectées
                    </p>
                </div>
                <Button onClick={() => router.push('/app/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une boutique
                </Button>
            </div>

            {/* Stores Grid */}
            {stores.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <StoreIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucune boutique configurée</h3>
                        <p className="text-muted-foreground mb-4">
                            Connectez votre première boutique pour commencer
                        </p>
                        <Button onClick={() => router.push('/app/onboarding')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une boutique
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => (
                        <StoreCard
                            key={store.id}
                            store={store}
                            isSelected={selectedStore?.id === store.id}
                            onSelect={() => setSelectedStore(store)}
                        />
                    ))}
                </div>
            )}


        </div>
    );
}

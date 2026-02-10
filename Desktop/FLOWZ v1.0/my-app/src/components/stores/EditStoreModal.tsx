/**
 * EditStoreModal - Modal d'édition des paramètres d'une boutique
 */

'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Settings,
    RefreshCw,
    Bell,
    Save,
    Store,
} from 'lucide-react';
import type { Store as StoreType, StoreSyncSettings } from '@/types/store';

interface EditStoreModalProps {
    store: StoreType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    syncSettings?: StoreSyncSettings;
    onSave: (storeId: string, updates: { name?: string; description?: string }) => void;
    onSaveSyncSettings?: (storeId: string, settings: Partial<StoreSyncSettings>) => void;
    isSaving?: boolean;
}

const SYNC_INTERVALS = [
    { value: '1', label: 'Toutes les heures' },
    { value: '6', label: 'Toutes les 6 heures' },
    { value: '12', label: 'Toutes les 12 heures' },
    { value: '24', label: 'Tous les jours' },
    { value: '48', label: 'Tous les 2 jours' },
    { value: '168', label: 'Toutes les semaines' },
];

export function EditStoreModal({
    store,
    open,
    onOpenChange,
    syncSettings,
    onSave,
    onSaveSyncSettings,
    isSaving = false,
}: EditStoreModalProps) {
    const [activeTab, setActiveTab] = useState('general');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Sync settings state
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [syncInterval, setSyncInterval] = useState('24');
    const [syncProducts, setSyncProducts] = useState(true);
    const [syncCategories, setSyncCategories] = useState(true);
    const [syncVariations, setSyncVariations] = useState(true);
    const [notifyOnComplete, setNotifyOnComplete] = useState(true);
    const [notifyOnError, setNotifyOnError] = useState(true);

    // Initialize form when store changes
    useEffect(() => {
        if (store) {
            setName(store.name);
            setDescription(store.description || '');
        }
    }, [store]);

    // Initialize sync settings
    useEffect(() => {
        if (syncSettings) {
            setAutoSyncEnabled(syncSettings.auto_sync_enabled);
            setSyncInterval(String(syncSettings.sync_interval_hours));
            setSyncProducts(syncSettings.sync_products);
            setSyncCategories(syncSettings.sync_categories);
            setSyncVariations(syncSettings.sync_variations);
            setNotifyOnComplete(syncSettings.notify_on_complete);
            setNotifyOnError(syncSettings.notify_on_error);
        }
    }, [syncSettings]);

    const handleSaveGeneral = () => {
        if (!store) return;
        onSave(store.id, { name, description: description || undefined });
    };

    const handleSaveSyncSettings = () => {
        if (!store || !onSaveSyncSettings) return;
        onSaveSyncSettings(store.id, {
            auto_sync_enabled: autoSyncEnabled,
            sync_interval_hours: Number(syncInterval),
            sync_products: syncProducts,
            sync_categories: syncCategories,
            sync_variations: syncVariations,
            notify_on_complete: notifyOnComplete,
            notify_on_error: notifyOnError,
        });
    };

    if (!store) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        Paramètres de la boutique
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general" className="gap-1.5">
                            <Settings className="w-4 h-4" />
                            Général
                        </TabsTrigger>
                        <TabsTrigger value="sync" className="gap-1.5">
                            <RefreshCw className="w-4 h-4" />
                            Sync
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-1.5">
                            <Bell className="w-4 h-4" />
                            Notifs
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="store-name">Nom de la boutique</Label>
                            <Input
                                id="store-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ma Boutique"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="store-description">Description</Label>
                            <Textarea
                                id="store-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description optionnelle..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveGeneral} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Sync Tab */}
                    <TabsContent value="sync" className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Synchronisation automatique</p>
                                <p className="text-sm text-muted-foreground">
                                    Synchroniser automatiquement les données
                                </p>
                            </div>
                            <Switch
                                checked={autoSyncEnabled}
                                onCheckedChange={setAutoSyncEnabled}
                            />
                        </div>

                        {autoSyncEnabled && (
                            <>
                                <Separator />

                                <div className="space-y-2">
                                    <Label>Fréquence de synchronisation</Label>
                                    <Select value={syncInterval} onValueChange={setSyncInterval}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SYNC_INTERVALS.map((interval) => (
                                                <SelectItem key={interval.value} value={interval.value}>
                                                    {interval.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>Données à synchroniser</Label>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Produits</span>
                                        <Switch
                                            checked={syncProducts}
                                            onCheckedChange={setSyncProducts}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Catégories</span>
                                        <Switch
                                            checked={syncCategories}
                                            onCheckedChange={setSyncCategories}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Variations</span>
                                        <Switch
                                            checked={syncVariations}
                                            onCheckedChange={setSyncVariations}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveSyncSettings} disabled={isSaving || !onSaveSyncSettings}>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4 pt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Sync terminée</p>
                                    <p className="text-sm text-muted-foreground">
                                        Notifier quand une sync est terminée
                                    </p>
                                </div>
                                <Switch
                                    checked={notifyOnComplete}
                                    onCheckedChange={setNotifyOnComplete}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Erreurs</p>
                                    <p className="text-sm text-muted-foreground">
                                        Notifier en cas d'erreur
                                    </p>
                                </div>
                                <Switch
                                    checked={notifyOnError}
                                    onCheckedChange={setNotifyOnError}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveSyncSettings} disabled={isSaving || !onSaveSyncSettings}>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

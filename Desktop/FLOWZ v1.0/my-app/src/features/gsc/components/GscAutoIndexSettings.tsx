"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGscIndexationSettings } from "@/hooks/integrations/useGscIndexationSettings";

interface GscAutoIndexSettingsProps {
    siteId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GscAutoIndexSettings({ siteId, open, onOpenChange }: GscAutoIndexSettingsProps) {
    const { settings, updateSettings, isUpdating } = useGscIndexationSettings(siteId);
    const [autoNew, setAutoNew] = useState(false);
    const [autoUpdated, setAutoUpdated] = useState(false);

    useEffect(() => {
        setAutoNew(settings.auto_index_new);
        setAutoUpdated(settings.auto_index_updated);
    }, [settings]);

    const handleSave = () => {
        updateSettings(
            { auto_index_new: autoNew, auto_index_updated: autoUpdated },
            { onSuccess: () => onOpenChange(false) }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm">Parametres d&apos;indexation automatique</DialogTitle>
                    <DialogDescription className="text-xs">
                        Configurez l&apos;indexation automatique des pages de votre site.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-3">
                        <Switch
                            checked={autoNew}
                            onCheckedChange={setAutoNew}
                            id="auto-new"
                        />
                        <div className="space-y-0.5">
                            <label htmlFor="auto-new" className="text-xs font-medium cursor-pointer">
                                Indexer les nouvelles pages automatiquement
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Les nouvelles pages detectees dans le sitemap seront automatiquement
                                soumises a Google pour indexation.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Switch
                            checked={autoUpdated}
                            onCheckedChange={setAutoUpdated}
                            id="auto-updated"
                        />
                        <div className="space-y-0.5">
                            <label htmlFor="auto-updated" className="text-xs font-medium cursor-pointer">
                                Indexer les pages mises a jour
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Quand une page est modifiee (changement de lastmod dans le sitemap),
                                elle sera re-soumise a Google pour forcer un re-crawl.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onOpenChange(false)}
                    >
                        Fermer
                    </Button>
                    <Button
                        size="sm"
                        className="text-xs"
                        onClick={handleSave}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

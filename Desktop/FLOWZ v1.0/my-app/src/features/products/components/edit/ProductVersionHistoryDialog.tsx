'use client';

/**
 * ProductVersionHistoryDialog
 *
 * Full dialog for browsing and restoring product versions.
 * Shows all versions with filtering by trigger type,
 * preview of key fields, and restore action.
 */

import { useState } from 'react';
import {
    History,
    Clock,
    Save,
    Sparkles,
    RotateCcw,
    Loader2,
    Filter,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    useProductVersionManager,
    type ProductVersion,
    type ProductVersionTrigger,
} from '@/hooks/products/useProductVersions';

// ============================================================================
// TYPES
// ============================================================================

interface ProductVersionHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string;
    onVersionRestored?: (formData: ProductVersion['form_data']) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const TRIGGER_CONFIG: Record<ProductVersionTrigger, {
    icon: typeof Clock;
    label: string;
    color: string;
    bgColor: string;
}> = {
    auto_save: { icon: Clock, label: 'Auto-save', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    manual_save: { icon: Save, label: 'Sauvegarde', color: 'text-primary', bgColor: 'bg-primary/10' },
    ai_approval: { icon: Sparkles, label: 'IA', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    restore: { icon: RotateCcw, label: 'Restauration', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
};

const FILTER_OPTIONS: { value: ProductVersionTrigger | 'all'; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'manual_save', label: 'Sauvegardes' },
    { value: 'auto_save', label: 'Auto-save' },
    { value: 'ai_approval', label: 'IA' },
    { value: 'restore', label: 'Restaurations' },
];

function formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncate(text: string | undefined | null, maxLength: number): string {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductVersionHistoryDialog({
    open,
    onOpenChange,
    productId,
    onVersionRestored,
}: ProductVersionHistoryDialogProps) {
    const [filter, setFilter] = useState<ProductVersionTrigger | 'all'>('all');
    const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<ProductVersion | null>(null);

    const {
        versions,
        isLoading,
        versionCount,
        restoreVersion,
    } = useProductVersionManager({ productId, enabled: open });

    const filteredVersions = filter === 'all'
        ? versions
        : versions.filter(v => v.trigger_type === filter);

    const handleRestore = async (version: ProductVersion) => {
        setRestoringVersionId(version.id);
        try {
            await restoreVersion({ versionId: version.id, productId });
            onVersionRestored?.(version.form_data);
            onOpenChange(false);
        } finally {
            setRestoringVersionId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                <History className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">
                                    Historique des versions
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {versionCount} version{versionCount > 1 ? 's' : ''} enregistree{versionCount > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter chips */}
                    <div className="flex items-center gap-2 mt-4">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {FILTER_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFilter(opt.value)}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                                    filter === opt.value
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    {/* Version list */}
                    <ScrollArea className="flex-1 border-r border-border/20">
                        <div className="p-4 space-y-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredVersions.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Aucune version trouvee
                                    </p>
                                </div>
                            ) : (
                                filteredVersions.map((version, index) => {
                                    const config = TRIGGER_CONFIG[version.trigger_type];
                                    const Icon = config.icon;
                                    const isSelected = selectedVersion?.id === version.id;
                                    const isLatest = index === 0 && filter === 'all';

                                    return (
                                        <button
                                            key={version.id}
                                            type="button"
                                            onClick={() => setSelectedVersion(version)}
                                            className={cn(
                                                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                                                isSelected
                                                    ? 'bg-primary/5 border border-primary/20'
                                                    : 'hover:bg-muted/50 border border-transparent',
                                            )}
                                        >
                                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bgColor)}>
                                                <Icon className={cn('w-3.5 h-3.5', config.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">v{version.version_number}</span>
                                                    {isLatest && (
                                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                                                            Actuelle
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {config.label} &bull; {formatDateTime(version.created_at)}
                                                </p>
                                                {version.title && (
                                                    <p className="text-[11px] text-foreground/70 truncate mt-0.5">
                                                        {truncate(version.title, 40)}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {/* Preview panel */}
                    <div className="w-72 p-4 flex flex-col">
                        {selectedVersion ? (
                            <>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                            Apercu - v{selectedVersion.version_number}
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        <PreviewField
                                            label="Titre"
                                            value={selectedVersion.form_data?.title}
                                        />
                                        <PreviewField
                                            label="Description courte"
                                            value={truncate(selectedVersion.form_data?.short_description, 80)}
                                        />
                                        <PreviewField
                                            label="Prix"
                                            value={selectedVersion.form_data?.regular_price != null
                                                ? `${selectedVersion.form_data.regular_price} EUR`
                                                : undefined}
                                        />
                                        <PreviewField
                                            label="Statut"
                                            value={selectedVersion.form_data?.status}
                                        />
                                        <PreviewField
                                            label="SKU"
                                            value={selectedVersion.form_data?.sku}
                                        />
                                        <PreviewField
                                            label="Champs remplis"
                                            value={`${selectedVersion.field_count} champs`}
                                        />
                                    </div>
                                </div>

                                {/* Restore button */}
                                <Button
                                    onClick={() => handleRestore(selectedVersion)}
                                    disabled={restoringVersionId === selectedVersion.id}
                                    className="w-full mt-4"
                                >
                                    {restoringVersionId === selectedVersion.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Restauration...
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Restaurer cette version
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center justify-center flex-1 text-center">
                                <div>
                                    <History className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Selectionnez une version pour voir l'apercu
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// PREVIEW FIELD
// ============================================================================

function PreviewField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                {label}
            </p>
            <p className="text-xs text-foreground">
                {value || <span className="text-muted-foreground/50">—</span>}
            </p>
        </div>
    );
}

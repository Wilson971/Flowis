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
    ArrowRight,
    Maximize2,
    Minimize2,
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
    demoVersions?: ProductVersion[];
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

function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductVersionHistoryDialog({
    open,
    onOpenChange,
    productId,
    onVersionRestored,
    demoVersions,
}: ProductVersionHistoryDialogProps) {
    const [filter, setFilter] = useState<ProductVersionTrigger | 'all'>('all');
    const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<ProductVersion | null>(null);
    const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    const hookResult = useProductVersionManager({ productId, enabled: open && !demoVersions });

    // Use mock data or real hook data
    const isLoading = demoVersions ? false : hookResult.isLoading;
    const versions = demoVersions || hookResult.versions;
    const versionCount = demoVersions ? demoVersions.length : hookResult.versionCount;
    const restoreVersion = demoVersions
        ? async (v: { versionId: string; productId: string }) => {
            return new Promise<{ restoredVersion: ProductVersion }>(resolve => {
                setTimeout(() => resolve({ restoredVersion: versions.find(ver => ver.id === v.versionId)! }), 1000);
            });
        }
        : hookResult.restoreVersion;

    const filteredVersions = filter === 'all'
        ? versions
        : versions.filter(v => v.trigger_type === filter);

    const handleRestore = async (version: ProductVersion) => {
        if (!isConfirmingRestore) {
            setIsConfirmingRestore(true);
            return;
        }

        setRestoringVersionId(version.id);
        try {
            await restoreVersion({ versionId: version.id, productId });
            onVersionRestored?.(version.form_data);
            onOpenChange(false);
        } finally {
            setRestoringVersionId(null);
            setIsConfirmingRestore(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!filteredVersions.length) return;

        const currentIndex = selectedVersion
            ? filteredVersions.findIndex(v => v.id === selectedVersion.id)
            : -1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < filteredVersions.length - 1 ? currentIndex + 1 : 0;
            setSelectedVersion(filteredVersions[nextIndex]);
            setIsConfirmingRestore(false);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredVersions.length - 1;
            setSelectedVersion(filteredVersions[prevIndex]);
            setIsConfirmingRestore(false);
        }
    };

    // Reset confirmation when selection changes
    const selectVersion = (v: ProductVersion) => {
        setSelectedVersion(v);
        setIsConfirmingRestore(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
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

                    <div
                        className="flex flex-[1_0_50vh] min-h-0 focus:outline-none bg-background"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        {/* Version list */}
                        <ScrollArea className="w-80 shrink-0 border-r border-border/20">
                            <div className="p-4 space-y-0.5 relative">
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
                                        const authorName = version.metadata?.author_name as string | undefined;
                                        const isPublished = version.metadata?.published === true;

                                        return (
                                            <div key={version.id} className="relative group">
                                                {/* Timeline continuous line */}
                                                {index !== filteredVersions.length - 1 && (
                                                    <div className="absolute left-7 top-10 bottom-[-10px] w-px bg-border/40 group-hover:bg-border transition-colors z-0" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => selectVersion(version)}
                                                    className={cn(
                                                        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors relative z-10',
                                                        isSelected
                                                            ? 'bg-primary/5 border border-primary/20'
                                                            : 'hover:bg-muted/50 border border-transparent',
                                                    )}
                                                >
                                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bgColor)}>
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
                                                            {isPublished && (
                                                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                                    Publié
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground truncate">
                                                            {config.label} &bull; {formatDateTime(version.created_at)}
                                                        </p>
                                                        {authorName && (
                                                            <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate italic">
                                                                Sauvegarde par {authorName}
                                                            </p>
                                                        )}
                                                        {version.title && (
                                                            <p className="text-[11px] text-foreground/70 truncate mt-0.5">
                                                                {truncate(version.title, 40)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {/* Preview panel */}
                        <div className="flex-1 p-0 flex flex-col border-l border-border/10 bg-muted/10">
                            {selectedVersion ? (
                                <ScrollArea className="flex-1">
                                    <div className="p-8 space-y-8">
                                        <div className="flex items-center justify-between border-b border-border/10 pb-4">
                                            <div>
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 mb-2">Aperçu</Badge>
                                                <h4 className="text-sm font-bold text-foreground">Version {selectedVersion.version_number}</h4>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Informations Générales</h4>
                                            <PreviewField
                                                label="Titre"
                                                value={selectedVersion.form_data?.title}
                                                isModified={filteredVersions[0]?.form_data?.title !== selectedVersion.form_data?.title}
                                            />
                                            <PreviewField
                                                label="Description courte"
                                                value={truncate(stripHtml(selectedVersion.form_data?.short_description), 120)}
                                                isModified={stripHtml(filteredVersions[0]?.form_data?.short_description) !== stripHtml(selectedVersion.form_data?.short_description)}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 mt-6">Commerce & Stocks</h4>
                                            <PreviewField
                                                label="Prix"
                                                value={
                                                    selectedVersion.form_data?.regular_price && !isNaN(parseFloat(String(selectedVersion.form_data?.regular_price)))
                                                        ? `${selectedVersion.form_data?.regular_price} EUR`
                                                        : '0.00 EUR'
                                                }
                                                isModified={
                                                    (filteredVersions[0]?.form_data?.regular_price || '') !== (selectedVersion.form_data?.regular_price || '')
                                                }
                                            />
                                            <PreviewField
                                                label="Statut"
                                                value={selectedVersion.form_data?.status}
                                                isModified={filteredVersions[0]?.form_data?.status !== selectedVersion.form_data?.status}
                                            />
                                            <PreviewField
                                                label="SKU"
                                                value={selectedVersion.form_data?.sku}
                                                isModified={filteredVersions[0]?.form_data?.sku !== selectedVersion.form_data?.sku}
                                            />
                                        </div>
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="flex items-center justify-center flex-1 text-center p-4">
                                    <div>
                                        <History className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            Selectionnez une version pour voir l'apercu
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Dock */}
                            {selectedVersion && selectedVersion.id !== filteredVersions[0]?.id && (
                                <div className="p-4 bg-background border-t border-border/20 z-10 mt-auto">
                                    {isConfirmingRestore ? (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-center text-foreground">
                                                Restaurer la v{selectedVersion.version_number} ?
                                            </p>
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => setIsConfirmingRestore(false)}
                                                    disabled={restoringVersionId !== null}
                                                >
                                                    Annuler
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    className="flex-1"
                                                    onClick={() => handleRestore(selectedVersion)}
                                                    disabled={restoringVersionId === selectedVersion.id}
                                                >
                                                    {restoringVersionId === selectedVersion.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Confirmer'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <Button
                                                variant="secondary"
                                                onClick={() => setIsCompareModalOpen(true)}
                                                className="whitespace-nowrap bg-muted/50 hover:bg-muted"
                                            >
                                                <Maximize2 className="w-4 h-4 mr-2" />
                                                Comparer en détail
                                            </Button>
                                            <Button
                                                onClick={() => handleRestore(selectedVersion)}
                                                className="flex-1"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Restaurer cette version
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal plein écran pour la comparaison détaillée */}
            {selectedVersion && filteredVersions[0] && (
                <FullScreenComparisonModal
                    open={isCompareModalOpen}
                    onOpenChange={setIsCompareModalOpen}
                    currentVersion={filteredVersions[0]}
                    selectedVersion={selectedVersion}
                />
            )}
        </>
    );
}

// ============================================================================
// FULLSCREEN COMPARISON MODAL
// ============================================================================

function FullScreenComparisonModal({
    open,
    onOpenChange,
    currentVersion,
    selectedVersion
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentVersion: ProductVersion;
    selectedVersion: ProductVersion;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen rounded-none border-0 p-0 flex flex-col gap-0 bg-background">
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/20 flex-shrink-0 bg-background z-10 shadow-sm relative">
                    <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Maximize2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    Comparaison Détaillée
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Comparaison entre la version actuelle (v{currentVersion.version_number}) et la version sélectionnée (v{selectedVersion.version_number})
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
                            <Minimize2 className="w-4 h-4" />
                            Fermer
                        </Button>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full bg-muted/10">
                    <div className="max-w-7xl mx-auto p-8 py-12 space-y-12">
                        {/* Headers */}
                        <div className="flex items-center justify-between border-b border-border/10 pb-6 mb-8 sticky top-0 bg-muted/10 backdrop-blur-md z-10 pt-4 -mt-4">
                            <div className="w-1/2 pr-8 text-center">
                                <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/5 text-primary border-primary/20 mb-3 shadow-sm">Version Actuelle</Badge>
                                <h4 className="text-xl font-bold text-foreground">v{currentVersion.version_number}</h4>
                            </div>
                            <div className="w-px h-16 bg-border/40"></div>
                            <div className="w-1/2 pl-8 text-center">
                                <Badge variant="outline" className="text-xs px-3 py-1 bg-muted text-muted-foreground mb-3 shadow-sm">Version Sélectionnée</Badge>
                                <h4 className="text-xl font-bold text-foreground">v{selectedVersion.version_number}</h4>
                            </div>
                        </div>

                        {/* General Info */}
                        <div className="space-y-4 bg-background p-8 rounded-2xl border border-border/20 shadow-sm">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 pb-2 border-b border-border/10">Informations Générales</h4>
                            <DiffField
                                label="Titre"
                                currentValue={currentVersion.form_data?.title}
                                selectedValue={selectedVersion.form_data?.title}
                                isFullScreen={true}
                            />
                            <DiffField
                                label="Description courte"
                                currentValue={stripHtml(currentVersion.form_data?.short_description)}
                                selectedValue={stripHtml(selectedVersion.form_data?.short_description)}
                                isFullScreen={true}
                            />
                            {(currentVersion.form_data?.description || selectedVersion.form_data?.description) && (
                                <DiffField
                                    label="Description longue (Contenu Intégral)"
                                    currentValue={stripHtml(currentVersion.form_data?.description)}
                                    selectedValue={stripHtml(selectedVersion.form_data?.description)}
                                    isFullScreen={true}
                                />
                            )}
                        </div>

                        {/* Commerce */}
                        <div className="space-y-4 bg-background p-8 rounded-2xl border border-border/20 shadow-sm">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 pb-2 border-b border-border/10">Commerce & Stocks</h4>
                            <DiffField
                                label="Prix"
                                currentValue={
                                    currentVersion.form_data?.regular_price && !isNaN(parseFloat(String(currentVersion.form_data?.regular_price)))
                                        ? `${currentVersion.form_data?.regular_price} EUR`
                                        : '0.00 EUR'
                                }
                                selectedValue={
                                    selectedVersion.form_data?.regular_price && !isNaN(parseFloat(String(selectedVersion.form_data?.regular_price)))
                                        ? `${selectedVersion.form_data?.regular_price} EUR`
                                        : '0.00 EUR'
                                }
                                isFullScreen={true}
                            />
                            <DiffField
                                label="Statut"
                                currentValue={currentVersion.form_data?.status}
                                selectedValue={selectedVersion.form_data?.status}
                                isFullScreen={true}
                            />
                            <DiffField
                                label="SKU"
                                currentValue={currentVersion.form_data?.sku}
                                selectedValue={selectedVersion.form_data?.sku}
                                isFullScreen={true}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// COMPACT PREVIEW FIELD
// ============================================================================

function PreviewField({ label, value, isModified }: { label: string, value?: string | null, isModified: boolean }) {
    return (
        <div className="py-2 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </p>
                {isModified && (
                    <Badge variant="outline" className="text-[8px] py-0 px-1.5 h-4 bg-amber-500/10 text-amber-500 border-amber-500/20 leading-tight">
                        Modifié
                    </Badge>
                )}
            </div>
            <p className="text-sm text-foreground/90 font-medium">
                {value || <span className="text-muted-foreground/40">—</span>}
            </p>
        </div>
    );
}

// ============================================================================
// DIFF FIELD (FULL SCREEN)
// ============================================================================

function DiffField({
    label,
    currentValue,
    selectedValue,
    isFullScreen = false,
}: {
    label: string;
    currentValue?: string | null;
    selectedValue?: string | null;
    isFullScreen?: boolean;
}) {
    // Avoid marking as different if both are falsy
    const normalizedCurrent = currentValue || '';
    const normalizedSelected = selectedValue || '';
    const isDifferent = normalizedCurrent !== normalizedSelected;

    return (
        <div className="grid grid-cols-2 gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/10">
            {/* Actuel */}
            <div className="pr-4 border-r border-border/10 flex flex-col justify-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {label}
                </p>
                <div className={cn("text-xs leading-relaxed", isDifferent ? "text-muted-foreground/60 line-through" : "text-foreground/80", !isFullScreen ? "line-clamp-4" : "")} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {currentValue || <span className="text-muted-foreground/40">—</span>}
                </div>
            </div>

            {/* Selected */}
            <div className="pl-4 flex flex-col justify-center relative">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-0">
                        {label}
                    </p>
                    {isDifferent && (
                        <Badge variant="outline" className="text-[8px] py-0 px-1 bg-amber-500/10 text-amber-500 border-amber-500/20 leading-tight absolute right-0 top-1">
                            Modifié
                        </Badge>
                    )}
                </div>
                <div className={cn("text-xs pr-12 leading-relaxed", isDifferent ? "text-foreground font-semibold" : "text-foreground/80", !isFullScreen ? "line-clamp-4" : "")} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {selectedValue || <span className="text-muted-foreground/40">—</span>}
                </div>
            </div>
        </div>
    );
}

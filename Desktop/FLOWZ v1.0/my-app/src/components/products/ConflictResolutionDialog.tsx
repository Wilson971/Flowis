/**
 * ConflictResolutionDialog - Dialogue pour résoudre les conflits de contenu
 */
'use client';

import { useState } from 'react';
import {
    AlertTriangle,
    Check,
    X,
    ChevronRight,
    ArrowRight,
    Merge,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    useConflictDetection,
    useResolveConflicts,
    useForceStoreContent,
    type ContentConflict,
    type ConflictResolution,
} from '@/hooks/products/useConflictDetection';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface ConflictResolutionDialogProps {
    productId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolved?: () => void;
}

interface FieldResolutionState {
    resolution: 'keep_local' | 'use_store' | 'merge';
    mergedValue?: string;
}

// ============================================================================
// Field Label Mapping
// ============================================================================

const fieldLabels: Record<string, string> = {
    title: 'Titre',
    description: 'Description',
    short_description: 'Description courte',
    sku: 'SKU',
    slug: 'Slug',
    price: 'Prix',
    regular_price: 'Prix régulier',
    sale_price: 'Prix promotionnel',
    stock: 'Stock',
    'seo.title': 'Titre SEO',
    'seo.description': 'Meta description',
};

// ============================================================================
// Components
// ============================================================================

function ConflictItem({
    conflict,
    resolution,
    onResolutionChange,
}: {
    conflict: ContentConflict;
    resolution: FieldResolutionState;
    onResolutionChange: (resolution: FieldResolutionState) => void;
}) {
    const [showMerge, setShowMerge] = useState(false);

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return '(vide)';
        if (typeof value === 'string') return value.slice(0, 100) + (value.length > 100 ? '...' : '');
        if (typeof value === 'number') return String(value);
        return JSON.stringify(value).slice(0, 100);
    };

    return (
        <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    {fieldLabels[conflict.field] || conflict.field}
                </Badge>
            </div>

            {/* Values comparison */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Valeur locale</p>
                    <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm">
                        {formatValue(conflict.localValue)}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Valeur boutique</p>
                    <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm">
                        {formatValue(conflict.storeValue)}
                    </div>
                </div>
            </div>

            {/* Resolution options */}
            <RadioGroup
                value={resolution.resolution}
                onValueChange={(value) => {
                    const res = value as 'keep_local' | 'use_store' | 'merge';
                    onResolutionChange({ resolution: res });
                    setShowMerge(res === 'merge');
                }}
                className="space-y-2"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="keep_local" id={`${conflict.field}-local`} />
                    <Label htmlFor={`${conflict.field}-local`} className="text-sm cursor-pointer">
                        Garder ma version locale
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="use_store" id={`${conflict.field}-store`} />
                    <Label htmlFor={`${conflict.field}-store`} className="text-sm cursor-pointer">
                        Utiliser la version boutique
                    </Label>
                </div>
                {typeof conflict.localValue === 'string' && typeof conflict.storeValue === 'string' && (
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id={`${conflict.field}-merge`} />
                        <Label htmlFor={`${conflict.field}-merge`} className="text-sm cursor-pointer">
                            Fusionner manuellement
                        </Label>
                    </div>
                )}
            </RadioGroup>

            {/* Merge textarea */}
            {showMerge && (
                <Textarea
                    placeholder="Saisissez la valeur fusionnée..."
                    value={resolution.mergedValue || ''}
                    onChange={(e) =>
                        onResolutionChange({
                            ...resolution,
                            mergedValue: e.target.value,
                        })
                    }
                    rows={3}
                />
            )}
        </div>
    );
}

// ============================================================================
// Main Dialog
// ============================================================================

export function ConflictResolutionDialog({
    productId,
    open,
    onOpenChange,
    onResolved,
}: ConflictResolutionDialogProps) {
    const { data: conflictData, isLoading } = useConflictDetection(productId);
    const resolveConflicts = useResolveConflicts();
    const forceStore = useForceStoreContent();

    const [resolutions, setResolutions] = useState<Record<string, FieldResolutionState>>({});

    const conflicts = conflictData?.conflicts || [];
    const hasConflicts = conflicts.length > 0;

    const handleResolutionChange = (field: string, resolution: FieldResolutionState) => {
        setResolutions((prev) => ({
            ...prev,
            [field]: resolution,
        }));
    };

    const handleResolve = async () => {
        const resolvedFields: ConflictResolution[] = conflicts.map((conflict) => {
            const res = resolutions[conflict.field] || { resolution: 'keep_local' };
            return {
                field: conflict.field,
                resolution: res.resolution,
                mergedValue: res.resolution === 'merge' ? res.mergedValue : undefined,
            };
        });

        await resolveConflicts.mutateAsync({ productId, resolutions: resolvedFields });
        onResolved?.();
        onOpenChange(false);
    };

    const handleForceStore = async () => {
        await forceStore.mutateAsync({ productId });
        onResolved?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Conflits détectés
                    </DialogTitle>
                    <DialogDescription>
                        {hasConflicts
                            ? `${conflicts.length} champ(s) ont été modifiés à la fois localement et sur la boutique.`
                            : 'Aucun conflit détecté.'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : hasConflicts ? (
                    <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4">
                            {conflicts.map((conflict) => (
                                <ConflictItem
                                    key={conflict.field}
                                    conflict={conflict}
                                    resolution={resolutions[conflict.field] || { resolution: 'keep_local' }}
                                    onResolutionChange={(res) => handleResolutionChange(conflict.field, res)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Check className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-lg font-medium">Aucun conflit</p>
                        <p className="text-sm text-muted-foreground">
                            Le contenu local et la boutique sont synchronisés.
                        </p>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {hasConflicts && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleForceStore}
                                disabled={forceStore.isPending}
                            >
                                {forceStore.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Tout remplacer par la boutique
                            </Button>
                            <Button
                                onClick={handleResolve}
                                disabled={resolveConflicts.isPending}
                            >
                                {resolveConflicts.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Appliquer les résolutions
                            </Button>
                        </>
                    )}
                    {!hasConflicts && (
                        <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

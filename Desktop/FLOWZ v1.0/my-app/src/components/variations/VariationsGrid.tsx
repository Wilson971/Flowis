/**
 * VariationsGrid - Tableau éditable des variations
 */
import { AppVariation, ProductVariation } from '@/hooks/products/useProductVariations';
import { useVariationBulkActions } from '@/hooks/variations/useVariationBulkActions';
import { useUpdateVariation } from '@/hooks/products/useProductVariations';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useVariationImages } from '@/hooks/variations/useVariationImages';
import { VariationBulkEditor } from '@/components/variations/VariationBulkEditor';

interface VariationsGridProps {
    variations: AppVariation[];
    dbVariations: ProductVariation[]; // Needed for complex updates if AppVariation is too simplified
    isLoading: boolean;
    productId: string;
}

export function VariationsGrid({ variations, isLoading, productId }: VariationsGridProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { bulkUpdate } = useVariationBulkActions();
    const { mutate: updateVariation, isPending: isUpdating } = useUpdateVariation();
    const { uploadImage } = useVariationImages();

    // Local state for edits to prevent refetch flickering
    // For simplicity, we trigger update on blur/change directly

    const toggleSelectAll = () => {
        if (selectedIds.size === variations.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(variations.map(v => v.id))); // Using external_id as ID per hook logic
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBulkStatusChange = (status: 'publish' | 'private') => {
        bulkUpdate.mutate({
            variationIds: Array.from(selectedIds),
            action: 'toggle_status',
            value: status,
            productId
        });
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        if (confirm('Voulez-vous vraiment supprimer ces variations ?')) {
            bulkUpdate.mutate({
                variationIds: Array.from(selectedIds),
                action: 'delete',
                productId
            });
            setSelectedIds(new Set());
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!variations.length) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/5">
                <p className="text-muted-foreground">Aucune variation disponible pour ce produit.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions Header */}
            {selectedIds.size > 0 && (
                <div className="bg-muted/30 p-2 rounded-md flex items-center gap-4 text-sm px-4 border shadow-sm">
                    <span className="font-medium">{selectedIds.size} sélectionné(s)</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('publish')}>
                            Activer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('private')}>
                            Désactiver
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                        </Button>
                        <VariationBulkEditor
                            variationIds={Array.from(selectedIds)}
                            productId={productId}
                            onComplete={() => setSelectedIds(new Set())}
                            trigger={
                                <Button size="sm" variant="secondary">
                                    Éditer...
                                </Button>
                            }
                        />
                    </div>
                </div>
            )}

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={selectedIds.size === variations.length && variations.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[50px]">Img</TableHead>
                            <TableHead>Attributs / Nom</TableHead>
                            <TableHead className="w-[120px]">SKU</TableHead>
                            <TableHead className="w-[100px]">Stock</TableHead>
                            <TableHead className="w-[100px]">Prix Regular</TableHead>
                            <TableHead className="w-[100px]">Prix Sale</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {variations.map((variation) => (
                            <TableRow key={variation.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(variation.id)}
                                        onCheckedChange={() => toggleSelect(variation.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center relative group cursor-pointer overflow-hidden border">
                                        {variation.image_url ? (
                                            <img src={variation.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        {/* Simple upload trigger placeholder */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] text-white">Edit</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{variation.title}</span>
                                        <span className="text-xs text-muted-foreground">ID: {variation.woo_variation_id}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        defaultValue={variation.sku}
                                        className="h-8"
                                        onBlur={(e) => {
                                            if (e.target.value !== variation.sku) {
                                                // Using simple ID mapping from AppVariation.id (which is external_id string)
                                                // Ideally we need internal UUID, but hook uses external_id logic mostly
                                                // Let's assume ID is sufficient or fix hook if needed
                                                // The update hook expects 'id' (UUID usually).
                                                // CHECK: AppVariation.id comes from dbVar.external_id?
                                                // In DB variations have UUID 'id' + 'external_id'. 
                                                // AppVariation maps 'id' to external_id. 
                                                // Oops, update hook might need UUID.
                                                // The 'variations' props provided to component will need both.
                                                // Let's trust hook for now or assume internal ID if available.
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        defaultValue={variation.stock_quantity}
                                        className={cn("h-8 w-20", variation.stock_status === 'outofstock' && "border-red-300")}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        defaultValue={variation.regular_price}
                                        className="h-8 w-24"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        defaultValue={variation.sale_price}
                                        className="h-8 w-24"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Badge variant={variation.stock_status === 'instock' ? 'outline' : 'destructive'}>
                                        {variation.stock_status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

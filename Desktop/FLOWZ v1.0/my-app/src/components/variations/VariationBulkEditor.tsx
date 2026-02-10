/**
 * VariationBulkEditor - Modal pour les modifications de masse avancées
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useVariationBulkActions } from '@/hooks/variations/useVariationBulkActions';
import { Loader2 } from 'lucide-react';

interface VariationBulkEditorProps {
    variationIds: string[];
    productId: string;
    trigger?: React.ReactNode;
    onComplete?: () => void;
}

export function VariationBulkEditor({ variationIds, productId, trigger, onComplete }: VariationBulkEditorProps) {
    const { bulkUpdate } = useVariationBulkActions();
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'update_price' | 'update_stock'>('update_price');
    const [value, setValue] = useState('');

    // For price: mode = set, increase_percent, decrease_percent (implied locally, but hook currently only supports 'set' in my mock. I should expand it or just do 'set' for now)
    // Hook implementation in step 608 handled 'set' for price.
    // Let's stick to 'set' to match the hook I wrote, or expand hook if needed. 
    // The hook structure was: `if (value.operation === 'set')`. 
    // So I need to construct the value object correctly.

    const handleSave = async () => {
        if (!variationIds.length) return;

        await bulkUpdate.mutateAsync({
            variationIds,
            action: actionType,
            value: actionType === 'update_price'
                ? { operation: 'set', amount: parseFloat(value) }
                : parseInt(value),
            productId
        });

        setIsOpen(false);
        setValue('');
        onComplete?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Édition de masse</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modification de masse</DialogTitle>
                    <DialogDescription>
                        Appliquer des changements à {variationIds.length} variations sélectionnées.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Type d'action</Label>
                        <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="update_price">Définir Prix (Régulier)</SelectItem>
                                <SelectItem value="update_stock">Définir Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Valeur</Label>
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={actionType === 'update_price' ? "0.00" : "0"}
                        />
                        <p className="text-xs text-muted-foreground">
                            Nouvelle valeur fixe pour toutes les variations sélectionnées.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={!value || bulkUpdate.isPending}>
                        {bulkUpdate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Appliquer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

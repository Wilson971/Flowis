"use client"

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store } from '@/contexts/StoreContext';

interface StoreSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    store: Store;
}

export function StoreSettingsModal({ open, onOpenChange, store }: StoreSettingsModalProps) {
    const [name, setName] = useState(store.name);
    const queryClient = useQueryClient();
    const supabase = createClient();

    const updateStoreMutation = useMutation({
        mutationFn: async (newName: string) => {
            const { error } = await supabase
                .from('stores')
                .update({ name: newName })
                .eq('id', store.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success("Store updated successfully");
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error("Failed to update store", {
                description: error.message
            });
        },
    });

    const handleSave = () => {
        if (!name.trim()) return;
        updateStoreMutation.mutate(name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Store Settings</DialogTitle>
                    <DialogDescription>
                        Make changes to your store profile here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateStoreMutation.isPending}>
                        {updateStoreMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

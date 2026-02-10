import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function SerpEnrichmentSheet({ open, onOpenChange }: any) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <h2>SERP Enrichment</h2>
                <p>Coming soon...</p>
            </SheetContent>
        </Sheet>
    );
}

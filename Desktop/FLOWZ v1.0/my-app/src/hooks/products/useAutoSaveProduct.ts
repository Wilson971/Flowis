/**
 * useAutoSaveProduct - Hook pour sauvegarde automatique (debounced)
 * Version 2.1 - Fix memory leak avec useRef et useEffect cleanup
 *
 * Extracted from useProductSave.ts for single-responsibility.
 */

import React from 'react';
import { useProductSave, type ProductSavePayload } from './useProductSave';

export function useAutoSaveProduct() {
    const saveProduct = useProductSave({ autoSync: false }); // Pas d'auto-sync pour auto-save
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = React.useRef(true);

    // FIX B2: Stabilize mutate/mutateAsync via refs so useCallback deps don't change
    // every render. Without this, debouncedSave is recreated every cycle, breaking debounce.
    const mutateRef = React.useRef(saveProduct.mutate);
    const mutateAsyncRef = React.useRef(saveProduct.mutateAsync);
    React.useEffect(() => {
        mutateRef.current = saveProduct.mutate;
        mutateAsyncRef.current = saveProduct.mutateAsync;
    });

    // Cleanup on unmount
    React.useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const debouncedSave = React.useCallback((productId: string, data: ProductSavePayload, delay = 2000) => {
        // Cancel previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Only save if component is still mounted and no save is already in-flight
            if (isMountedRef.current && !saveProduct.isPending) {
                mutateRef.current({ productId, data });
            }
            timeoutRef.current = null;
        }, delay);
    }, [saveProduct.isPending]); // Re-create when isPending changes

    const cancelAutoSave = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const flushAutoSave = React.useCallback(async (productId: string, data: ProductSavePayload) => {
        // Cancel pending auto-save and save immediately
        cancelAutoSave();
        if (isMountedRef.current) {
            return mutateAsyncRef.current({ productId, data });
        }
    }, [cancelAutoSave]); // Stable: cancelAutoSave has no deps

    return {
        ...saveProduct,
        debouncedSave,
        cancelAutoSave,
        flushAutoSave,
        hasPendingAutoSave: timeoutRef.current !== null,
    };
}

"use client";

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

// ============================================================================
// TYPES
// ============================================================================

interface UseFormStabilizationOptions {
    product: any;
    isLoading: boolean;
    isFetching: boolean;
    methods: UseFormReturn<any>;
    history: { markAsSaved: () => void };
}

interface UseFormStabilizationReturn {
    formStableRef: React.MutableRefObject<boolean>;
    postSaveGuardRef: React.MutableRefObject<boolean>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useFormStabilization
 *
 * Manages the form stabilization guard that prevents false dirty state
 * during initial form setup and post-save query invalidation cycles.
 *
 * Extracted from ProductEditorContainer (lines 191-265) for reusability
 * and to reduce component complexity.
 */
export function useFormStabilization({
    product,
    isLoading,
    isFetching,
    methods,
    history,
}: UseFormStabilizationOptions): UseFormStabilizationReturn {
    const formStableRef = useRef(false);
    const formStableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const quickStabilizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const postSaveGuardRef = useRef<boolean>(false);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (formStableTimerRef.current) clearTimeout(formStableTimerRef.current);
            if (quickStabilizeTimerRef.current) clearTimeout(quickStabilizeTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!product || isLoading || isFetching) {
            // FIX: Do NOT destabilize the form when isFetching toggles due to post-save
            // query invalidation. The save already reset the form — re-running the
            // stabilization flow would cause TipTap normalization to create false isDirty
            // state that surfaces as "Non sauvegardé" + disabled Publish button.
            if (!postSaveGuardRef.current) {
                formStableRef.current = false;
            }
            if (formStableTimerRef.current) {
                clearTimeout(formStableTimerRef.current);
                formStableTimerRef.current = null;
            }
            return;
        }

        // If we just saved, the form is already stable — skip the 700ms stabilization.
        // Just clear the guard and apply a quick normalization reset if needed.
        if (postSaveGuardRef.current) {
            postSaveGuardRef.current = false;
            // Quick normalization: if TipTap normalization made formState dirty
            // despite no user interaction, re-reset to absorb the normalized values.
            if (quickStabilizeTimerRef.current) {
                clearTimeout(quickStabilizeTimerRef.current);
            }
            quickStabilizeTimerRef.current = setTimeout(() => {
                quickStabilizeTimerRef.current = null;
                const { isDirty: formIsDirty, touchedFields } = methods.formState;
                if (formIsDirty && Object.keys(touchedFields).length === 0) {
                    const currentValues = methods.getValues();
                    methods.reset(currentValues, { keepDefaultValues: false });
                    history.markAsSaved();
                }
            }, 200);
            return () => {
                if (quickStabilizeTimerRef.current) {
                    clearTimeout(quickStabilizeTimerRef.current);
                    quickStabilizeTimerRef.current = null;
                }
            };
        }

        // Data arrived and query is idle — wait for form reset + TipTap stabilization.
        // useProductForm does a re-reset at 500ms to absorb TipTap HTML normalization,
        // so we wait 700ms before marking the form as stable and saved.
        formStableTimerRef.current = setTimeout(() => {
            formStableRef.current = true;
            // Mark history as saved once form is stable — prevents false "NON SAUVEGARDÉ"
            // caused by form reset creating spurious history entries during initialization
            history.markAsSaved();

            // FIX: After re-stabilization (e.g. post-save refetch), the form may have
            // transient isDirty from component normalization (TipTap HTML, zodResolver
            // async overwrite). If no user interaction happened since the last reset,
            // re-reset with current (normalized) values to clear the false dirty state.
            const { isDirty: formIsDirty, touchedFields } = methods.formState;
            if (formIsDirty && Object.keys(touchedFields).length === 0) {
                const currentValues = methods.getValues();
                methods.reset(currentValues, { keepDefaultValues: false });
                history.markAsSaved();
            }
        }, 700);

        return () => {
            if (formStableTimerRef.current) clearTimeout(formStableTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, product?.last_synced_at, isLoading, isFetching]);

    return { formStableRef, postSaveGuardRef };
}

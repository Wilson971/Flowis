"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { ProductFormValues } from "../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface FormSnapshot {
    values: ProductFormValues;
    timestamp: number;
    label?: string;
}

interface UseFormHistoryOptions {
    methods: UseFormReturn<ProductFormValues>;
    maxSnapshots?: number;
    debounceMs?: number;
    enabled?: boolean;
    /** External ref to coordinate with useProductForm's sync guard */
    isRestoringRef?: React.MutableRefObject<boolean>;
}

export interface UseFormHistoryReturn {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    historyIndex: number;
    historyLength: number;
    captureSnapshot: (label?: string) => void;
    markAsSaved: () => void;
    isAtSavedState: boolean;
    isRestoringRef: React.RefObject<boolean>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_SNAPSHOTS = 50;
const DEFAULT_DEBOUNCE_MS = 500;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Shallow JSON comparison of two form value objects.
 * Compares stringified versions for equality detection.
 * Uses a cache to avoid repeated serialization of the same object.
 */
function areValuesEqual(a: ProductFormValues, b: ProductFormValues): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useFormHistory
 *
 * In-memory undo/redo system for react-hook-form with circular buffer.
 * Captures form snapshots on debounced changes, supports undo/redo via
 * methods.reset(), and tracks saved state for dirty indicators.
 *
 * Key design decisions:
 * - Internal state via useRef to avoid re-renders on every snapshot
 * - Single useState counter (`version`) to drive UI updates
 * - isRestoringRef flag to prevent useProductForm's useEffect from
 *   re-syncing during undo/redo operations
 */
export const useFormHistory = ({
    methods,
    maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enabled = true,
    isRestoringRef: externalRestoringRef,
}: UseFormHistoryOptions): UseFormHistoryReturn => {
    // -------------------------------------------------------------------------
    // Internal refs (no re-renders)
    // -------------------------------------------------------------------------
    const historyRef = useRef<FormSnapshot[]>([]);
    const currentIndexRef = useRef<number>(-1);
    const savedIndexRef = useRef<number>(-1);
    const internalRestoringRef = useRef<boolean>(false);
    const isRestoringRef = externalRestoringRef || internalRestoringRef;
    const isInitializedRef = useRef<boolean>(false);

    // Single state counter to trigger UI updates when history changes
    const [version, setVersion] = useState(0);
    const forceUpdate = useCallback(() => setVersion((v) => v + 1), []);

    // -------------------------------------------------------------------------
    // Snapshot management
    // -------------------------------------------------------------------------

    /**
     * Push a new snapshot to the history buffer.
     * Truncates any forward history (redo stack) when pushing after an undo.
     * Enforces maxSnapshots limit by removing oldest entries.
     */
    const pushSnapshot = useCallback(
        (values: ProductFormValues, label?: string) => {
            const history = historyRef.current;
            const currentIndex = currentIndexRef.current;

            // Don't push if identical to current snapshot
            if (currentIndex >= 0 && currentIndex < history.length) {
                if (areValuesEqual(history[currentIndex].values, values)) {
                    return;
                }
            }

            // Truncate forward history (discard redo stack)
            const newHistory = history.slice(0, currentIndex + 1);

            // Push new snapshot
            newHistory.push({
                values: structuredClone(values),
                timestamp: Date.now(),
                label,
            });

            // Enforce max size by removing oldest
            if (newHistory.length > maxSnapshots) {
                const overflow = newHistory.length - maxSnapshots;
                newHistory.splice(0, overflow);

                // Adjust saved index
                if (savedIndexRef.current !== -1) {
                    savedIndexRef.current = Math.max(-1, savedIndexRef.current - overflow);
                }
            }

            historyRef.current = newHistory;
            currentIndexRef.current = newHistory.length - 1;
            forceUpdate();
        },
        [maxSnapshots, forceUpdate]
    );

    // -------------------------------------------------------------------------
    // Initialize with current form values
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!enabled || isInitializedRef.current) return;

        const currentValues = methods.getValues();
        // Only initialize when we have meaningful data (not default empty form)
        if (currentValues.title || currentValues.description) {
            pushSnapshot(currentValues, "Initial");
            savedIndexRef.current = 0;
            isInitializedRef.current = true;
        }
    }, [enabled, methods, pushSnapshot]);

    // Also capture when product data loads (form gets reset by useProductForm)
    useEffect(() => {
        if (!enabled) return;

        // Subscribe to form reset events by watching formState.isSubmitSuccessful
        // or by detecting when the form values change significantly after a reset
        const subscription = methods.watch(() => {
            if (!isInitializedRef.current) {
                const currentValues = methods.getValues();
                if (currentValues.title || currentValues.description) {
                    pushSnapshot(currentValues, "Initial");
                    savedIndexRef.current = 0;
                    isInitializedRef.current = true;
                }
            }
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    // -------------------------------------------------------------------------
    // Debounced capture on form changes
    // -------------------------------------------------------------------------

    const debouncedCapture = useDebouncedCallback(() => {
        if (!enabled || isRestoringRef.current || !isInitializedRef.current) return;
        const currentValues = methods.getValues();
        pushSnapshot(currentValues);
    }, debounceMs);

    useEffect(() => {
        if (!enabled) return;

        const subscription = methods.watch(() => {
            // Don't capture during restore operations
            if (isRestoringRef.current) return;
            if (!isInitializedRef.current) return;
            debouncedCapture();
        });

        return () => subscription.unsubscribe();
    }, [enabled, methods, debouncedCapture]);

    // -------------------------------------------------------------------------
    // Undo / Redo
    // -------------------------------------------------------------------------

    const undo = useCallback(() => {
        const currentIndex = currentIndexRef.current;
        if (currentIndex <= 0) return;

        // Before first undo, capture current state if it differs from last snapshot
        const currentValues = methods.getValues();
        const history = historyRef.current;
        if (
            currentIndex === history.length - 1 &&
            !areValuesEqual(history[currentIndex].values, currentValues)
        ) {
            pushSnapshot(currentValues, "Pre-undo");
            // Now currentIndex is at the newly pushed snapshot
            // We want to go back one more
            currentIndexRef.current = historyRef.current.length - 2;
        } else {
            currentIndexRef.current = currentIndex - 1;
        }

        const targetSnapshot = historyRef.current[currentIndexRef.current];
        if (!targetSnapshot) return;

        // Set restoring flag to prevent useProductForm sync
        isRestoringRef.current = true;

        methods.reset(structuredClone(targetSnapshot.values), {
            keepDefaultValues: false,
        });

        // Clear restoring flag after React processes the update
        requestAnimationFrame(() => {
            isRestoringRef.current = false;
        });

        forceUpdate();
    }, [methods, pushSnapshot, forceUpdate]);

    const redo = useCallback(() => {
        const currentIndex = currentIndexRef.current;
        const history = historyRef.current;
        if (currentIndex >= history.length - 1) return;

        currentIndexRef.current = currentIndex + 1;
        const targetSnapshot = history[currentIndexRef.current];
        if (!targetSnapshot) return;

        // Set restoring flag
        isRestoringRef.current = true;

        methods.reset(structuredClone(targetSnapshot.values), {
            keepDefaultValues: false,
        });

        requestAnimationFrame(() => {
            isRestoringRef.current = false;
        });

        forceUpdate();
    }, [methods, forceUpdate]);

    // -------------------------------------------------------------------------
    // Manual capture & saved state tracking
    // -------------------------------------------------------------------------

    const captureSnapshot = useCallback(
        (label?: string) => {
            if (!enabled) return;
            debouncedCapture.cancel();
            const currentValues = methods.getValues();
            pushSnapshot(currentValues, label);
        },
        [enabled, methods, pushSnapshot, debouncedCapture]
    );

    const markAsSaved = useCallback(() => {
        savedIndexRef.current = currentIndexRef.current;
        forceUpdate();
    }, [forceUpdate]);

    // -------------------------------------------------------------------------
    // Derived state (uses version counter to stay fresh)
    // -------------------------------------------------------------------------

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _v = version; // Force re-evaluation when version changes

    const historyLength = historyRef.current.length;
    const historyIndex = currentIndexRef.current;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < historyLength - 1;
    const isAtSavedState = historyIndex === savedIndexRef.current;

    return {
        undo,
        redo,
        canUndo,
        canRedo,
        historyIndex,
        historyLength,
        captureSnapshot,
        markAsSaved,
        isAtSavedState,
        isRestoringRef,
    };
};

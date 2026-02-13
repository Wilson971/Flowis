"use client";

import { useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface UseFormHistoryKeyboardOptions {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onSave?: () => void;
    enabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if the currently focused element is inside a TipTap/ProseMirror editor.
 * When inside TipTap, Ctrl+Z/Y should be handled by TipTap natively,
 * not by the form-level undo/redo system.
 */
function isInsideTipTapEditor(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    return !!(
        activeElement.closest(".ProseMirror") ||
        activeElement.closest("[data-tiptap-editor]") ||
        activeElement.closest(".tiptap")
    );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useFormHistoryKeyboard
 *
 * Registers keyboard shortcuts for form-level undo/redo:
 * - Ctrl+Z / Cmd+Z → undo
 * - Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z → redo
 * - Ctrl+S / Cmd+S → manual save (optional)
 *
 * Avoids conflicts with TipTap's internal undo/redo by checking
 * if the active element is inside a ProseMirror editor.
 */
export const useFormHistoryKeyboard = ({
    undo,
    redo,
    canUndo,
    canRedo,
    onSave,
    enabled = true,
}: UseFormHistoryKeyboardOptions): void => {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (!isCtrlOrCmd) return;

            const key = e.key.toLowerCase();

            // Ctrl+S → Save
            if (key === "s" && !e.shiftKey) {
                e.preventDefault();
                onSave?.();
                return;
            }

            // Skip form-level undo/redo when inside TipTap editor
            if (isInsideTipTapEditor()) return;

            // Ctrl+Z → Undo (without Shift)
            if (key === "z" && !e.shiftKey) {
                if (canUndo) {
                    e.preventDefault();
                    undo();
                }
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z → Redo
            if (key === "y" || (key === "z" && e.shiftKey)) {
                if (canRedo) {
                    e.preventDefault();
                    redo();
                }
                return;
            }
        },
        [enabled, undo, redo, canUndo, canRedo, onSave]
    );

    useEffect(() => {
        if (!enabled) return;

        // Use capture phase to intercept before TipTap if needed
        document.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            document.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [enabled, handleKeyDown]);
};

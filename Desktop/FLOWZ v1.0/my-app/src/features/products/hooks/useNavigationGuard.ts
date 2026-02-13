"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface UseNavigationGuardOptions {
    /** Whether the form has unsaved changes */
    isDirty: boolean;
    /** Enable/disable the guard */
    enabled?: boolean;
    /** Custom message for the confirmation dialog */
    message?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MESSAGE =
    "Vous avez des modifications non sauvegardees. Voulez-vous vraiment quitter ?";

// ============================================================================
// HOOK
// ============================================================================

/**
 * useNavigationGuard
 *
 * Prevents accidental navigation away from the page when the form has
 * unsaved changes. Uses three strategies:
 *
 * 1. `beforeunload` event — catches tab close, refresh, external navigation
 * 2. `history.pushState` / `replaceState` patching — catches programmatic
 *    navigation (Next.js router.push, Link clicks)
 * 3. `popstate` event — catches browser back/forward buttons
 */
export const useNavigationGuard = ({
    isDirty,
    enabled = true,
    message = DEFAULT_MESSAGE,
}: UseNavigationGuardOptions): void => {
    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const messageRef = useRef(message);
    messageRef.current = message;

    // -------------------------------------------------------------------------
    // Strategy 1: beforeunload (tab close, refresh)
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!enabled || !isDirty) return;

        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current || !enabledRef.current) return;
            e.preventDefault();
            // Modern browsers ignore custom messages but still need returnValue
            e.returnValue = messageRef.current;
            return messageRef.current;
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [enabled, isDirty]);

    // -------------------------------------------------------------------------
    // Strategy 2 & 3: history.pushState/replaceState patching + popstate
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!enabled || !isDirty) return;
        if (typeof window === "undefined") return;

        // Patch pushState to intercept programmatic navigation
        const originalPushState = window.history.pushState.bind(window.history);
        const originalReplaceState = window.history.replaceState.bind(window.history);

        const guardedPushState = (
            data: any,
            unused: string,
            url?: string | URL | null
        ) => {
            if (isDirtyRef.current && enabledRef.current) {
                const confirmed = window.confirm(messageRef.current);
                if (!confirmed) return;
            }
            return originalPushState(data, unused, url);
        };

        const guardedReplaceState = (
            data: any,
            unused: string,
            url?: string | URL | null
        ) => {
            if (isDirtyRef.current && enabledRef.current) {
                const confirmed = window.confirm(messageRef.current);
                if (!confirmed) return;
            }
            return originalReplaceState(data, unused, url);
        };

        window.history.pushState = guardedPushState;
        window.history.replaceState = guardedReplaceState;

        // Handle browser back/forward
        const handlePopState = () => {
            if (isDirtyRef.current && enabledRef.current) {
                const confirmed = window.confirm(messageRef.current);
                if (!confirmed) {
                    // Push current state back to cancel the navigation
                    window.history.pushState(null, "", window.location.href);
                }
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
            window.removeEventListener("popstate", handlePopState);
        };
    }, [enabled, isDirty]);
};

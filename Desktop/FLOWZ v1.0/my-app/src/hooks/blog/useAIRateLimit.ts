/**
 * useAIRateLimit Hook
 * 
 * Manages rate limiting for AI actions
 * Implements 50 actions/day/user limit as per CDC R-04
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const DAILY_LIMIT = 50;
const STORAGE_KEY = 'flowz_ai_usage';

// ============================================================================
// TYPES
// ============================================================================

interface AIUsageData {
    count: number;
    date: string; // YYYY-MM-DD
}

interface UseAIRateLimitReturn {
    /** Current usage count for today */
    usageCount: number;
    /** Remaining actions for today */
    remainingActions: number;
    /** Whether the limit has been reached */
    isLimitReached: boolean;
    /** Check and increment usage. Returns true if action is allowed */
    checkAndIncrement: () => boolean;
    /** Get current usage without incrementing */
    getCurrentUsage: () => number;
    /** Reset usage (for testing) */
    resetUsage: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

function getStoredUsage(): AIUsageData {
    if (typeof window === 'undefined') {
        return { count: 0, date: getTodayDate() };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { count: 0, date: getTodayDate() };
        }

        const data = JSON.parse(stored) as AIUsageData;

        // Reset if it's a new day
        if (data.date !== getTodayDate()) {
            return { count: 0, date: getTodayDate() };
        }

        return data;
    } catch {
        return { count: 0, date: getTodayDate() };
    }
}

function setStoredUsage(data: AIUsageData): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Ignore storage errors
    }
}

// ============================================================================
// HOOK
// ============================================================================

export function useAIRateLimit(): UseAIRateLimitReturn {
    const [usageCount, setUsageCount] = useState<number>(0);

    // Initialize from storage on mount
    useEffect(() => {
        const stored = getStoredUsage();
        setUsageCount(stored.count);
    }, []);

    const getCurrentUsage = useCallback((): number => {
        const stored = getStoredUsage();
        return stored.count;
    }, []);

    const checkAndIncrement = useCallback((): boolean => {
        const stored = getStoredUsage();

        // Check if limit reached
        if (stored.count >= DAILY_LIMIT) {
            toast.error('Limite quotidienne atteinte', {
                description: `Vous avez utilisé vos ${DAILY_LIMIT} actions IA pour aujourd'hui. Revenez demain !`,
            });
            return false;
        }

        // Increment usage
        const newData: AIUsageData = {
            count: stored.count + 1,
            date: getTodayDate(),
        };

        setStoredUsage(newData);
        setUsageCount(newData.count);

        // Warn when approaching limit
        const remaining = DAILY_LIMIT - newData.count;
        if (remaining === 10) {
            toast.warning('Limite approchante', {
                description: `Il vous reste ${remaining} actions IA pour aujourd'hui.`,
            });
        } else if (remaining === 5) {
            toast.warning('Attention', {
                description: `Plus que ${remaining} actions IA pour aujourd'hui !`,
            });
        }

        return true;
    }, []);

    const resetUsage = useCallback((): void => {
        const newData: AIUsageData = {
            count: 0,
            date: getTodayDate(),
        };
        setStoredUsage(newData);
        setUsageCount(0);
    }, []);

    const remainingActions = Math.max(0, DAILY_LIMIT - usageCount);
    const isLimitReached = usageCount >= DAILY_LIMIT;

    return {
        usageCount,
        remainingActions,
        isLimitReached,
        checkAndIncrement,
        getCurrentUsage,
        resetUsage,
    };
}

// Export constants for use elsewhere
export { DAILY_LIMIT as AI_DAILY_LIMIT };

/**
 * Centralized configuration for the product editor.
 * All timing values in milliseconds.
 */
export const EDITOR_CONFIG = {
    /** Max undo/redo snapshots kept in memory */
    MAX_SNAPSHOTS: 30,
    /** Debounce delay for form history captures (ms) */
    HISTORY_DEBOUNCE_MS: 500,
    /** Delay before save status resets to idle after success (ms) */
    SAVE_STATUS_RESET_MS: 3000,
    /** Delay before save status resets to idle after error (ms) */
    SAVE_STATUS_ERROR_RESET_MS: 5000,
    /** Conflict detection polling interval (ms) */
    CONFLICT_POLL_INTERVAL_MS: 15_000,
} as const;

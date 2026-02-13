import { useState, useEffect } from "react";

export const STORAGE_KEYS = {
    BATCH_GENERATION_SELECTED_TYPES: "batch_generation_selected_types",
    BATCH_GENERATION_FORCE_REGENERATE: "batch_generation_force_regenerate",
    BATCH_GENERATION_COLLAPSED: "batch_generation_collapsed",
    STUDIO_BATCH_SELECTED_ACTION: "studio_batch_selected_action",
    STUDIO_BATCH_COLLAPSED: "studio_batch_collapsed",
};

export function useLocalStorage<T>(key: string, options: { defaultValue: T }) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return options.defaultValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : options.defaultValue;
        } catch (error) {
            console.error(error);
            return options.defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    }, [key, value]);

    return [value, setValue] as const;
}

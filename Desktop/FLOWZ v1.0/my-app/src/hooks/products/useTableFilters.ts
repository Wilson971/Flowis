import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { STORAGE_KEYS } from '@/hooks/useLocalStorage';

// --- Persistance localStorage ---

type PersistedFilters = {
    search?: string;
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    category?: string;
    ai_status?: string;
    sync_status?: string;
    stock?: string;
    price_range?: string;
    price_min?: string;
    price_max?: string;
    sales?: string;
    seo_score?: string;
};

const ALL_FILTER_KEYS: Array<keyof PersistedFilters> = [
    'search', 'page', 'pageSize', 'status', 'type',
    'category', 'ai_status', 'sync_status', 'stock',
    'price_range', 'price_min', 'price_max', 'sales', 'seo_score',
];

function saveFiltersToStorage(params: URLSearchParams): void {
    try {
        const filters: PersistedFilters = {
            search:       params.get('search')      ?? undefined,
            status:       params.get('status')      ?? undefined,
            type:         params.get('type')        ?? undefined,
            category:     params.get('category')    ?? undefined,
            ai_status:    params.get('ai_status')   ?? undefined,
            sync_status:  params.get('sync_status') ?? undefined,
            stock:        params.get('stock')       ?? undefined,
            price_range:  params.get('price_range') ?? undefined,
            price_min:    params.get('price_min')   ?? undefined,
            price_max:    params.get('price_max')   ?? undefined,
            sales:        params.get('sales')       ?? undefined,
            seo_score:    params.get('seo_score')   ?? undefined,
            page:         params.has('page')     ? Number(params.get('page'))     : undefined,
            pageSize:     params.has('pageSize') ? Number(params.get('pageSize')) : undefined,
        };
        // Strip undefined keys before serializing
        (Object.keys(filters) as Array<keyof PersistedFilters>).forEach((k) => {
            if (filters[k] === undefined) delete filters[k];
        });
        window.localStorage.setItem(STORAGE_KEYS.PRODUCTS_TABLE_FILTERS, JSON.stringify(filters));
    } catch {}
}

function loadFiltersFromStorage(): PersistedFilters | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.PRODUCTS_TABLE_FILTERS);
        return raw ? (JSON.parse(raw) as PersistedFilters) : null;
    } catch {
        return null;
    }
}

function clearFiltersFromStorage(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEYS.PRODUCTS_TABLE_FILTERS);
    } catch {}
}

// --- Hook ---

type UseTableFiltersOptions = {
    defaultPageSize?: number;
    defaultPage?: number;
};

type UseTableFiltersReturn = {
    search: string;
    page: number;
    pageSize: number;
    setSearch: (value: string) => void;
    setPage: (value: number) => void;
    setPageSize: (value: number) => void;
    setFilter: (key: string, value: string | null) => void;
    resetFilters: () => void;
    resetAll: () => void;
    [key: string]: any;
};

export const useTableFilters = (options: UseTableFiltersOptions = {}): UseTableFiltersReturn => {
    const { defaultPageSize = 25, defaultPage = 1 } = options;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Ref: garantit que la restauration ne s'exécute qu'une seule fois au mount
    const hasRestoredRef = useRef(false);

    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page')) || defaultPage;
    const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize;

    // Effect 1 — Sync URL params → localStorage (se déclenche à chaque changement d'URL)
    useEffect(() => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        const hasAny = ALL_FILTER_KEYS.some((k) => current.has(k));
        if (hasAny) {
            saveFiltersToStorage(current);
        }
    }, [searchParams]);

    // Effect 2 — Restore localStorage → URL (une seule fois au mount, si URL vide)
    useEffect(() => {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        const hasUrlParams = ALL_FILTER_KEYS.some((k) => searchParams.has(k));
        if (hasUrlParams) return; // URL params prioritaires : ne pas écraser

        const saved = loadFiltersFromStorage();
        if (!saved) return;

        const restored = new URLSearchParams();
        (Object.keys(saved) as Array<keyof PersistedFilters>).forEach((key) => {
            const val = saved[key];
            if (val !== undefined && val !== null && val !== '') {
                restored.set(key, String(val));
            }
        });

        const query = restored.toString();
        if (query) {
            router.replace(`${pathname}?${query}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionnellement vide — exécuté une seule fois au mount

    // Use a ref to always have fresh searchParams without causing callback identity changes
    const searchParamsRef = useRef(searchParams);
    searchParamsRef.current = searchParams;

    const updateParams = useCallback((updates: Record<string, any>) => {
        const current = new URLSearchParams(Array.from(searchParamsRef.current.entries()));

        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                current.delete(key);
            } else {
                current.set(key, String(value));
            }
        });

        saveFiltersToStorage(current);

        const searchString = current.toString();
        const query = searchString ? `?${searchString}` : '';
        router.replace(`${pathname}${query}`);
    }, [router, pathname]);

    const setSearch = useCallback((value: string) => {
        updateParams({ search: value || undefined, page: 1 });
    }, [updateParams]);

    const setPage = useCallback((value: number) => {
        updateParams({ page: value });
    }, [updateParams]);

    const setPageSize = useCallback((value: number) => {
        updateParams({ pageSize: value, page: 1 });
    }, [updateParams]);

    const setFilter = useCallback((key: string, value: string | null) => {
        updateParams({ [key]: value || undefined, page: 1 });
    }, [updateParams]);

    const resetFilters = useCallback(() => {
        clearFiltersFromStorage();
        const current = new URLSearchParams();
        current.set('page', '1');
        current.set('pageSize', String(pageSize));
        const query = current.toString();
        router.replace(`${pathname}?${query}`);
    }, [router, pathname, pageSize]);

    const resetAll = useCallback(() => {
        resetFilters();
    }, [resetFilters]);

    const result = useMemo(() => {
        const paramsObject = Object.fromEntries(searchParams.entries());

        const base = {
            search,
            page,
            pageSize,
            setSearch,
            setPage,
            setPageSize,
            setFilter,
            resetFilters,
            resetAll,
        };

        return { ...paramsObject, ...base };
    }, [search, page, pageSize, setSearch, setPage, setPageSize, setFilter, resetFilters, resetAll, searchParams]);

    return result as UseTableFiltersReturn;
};

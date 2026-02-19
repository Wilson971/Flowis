import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

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

    // Helper to read params
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || defaultPage;
    const pageSize = Number(searchParams.get("pageSize")) || defaultPageSize;

    const updateParams = useCallback((updates: Record<string, any>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                current.delete(key);
            } else {
                current.set(key, String(value));
            }
        });

        const searchString = current.toString();
        const query = searchString ? `?${searchString}` : "";

        router.replace(`${pathname}${query}`);
    }, [router, pathname, searchParams]);

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
        updateParams({
            search: undefined,
            page: 1,
            // pageSize: defaultPageSize // Optional: reset page size too
        });
    }, [updateParams]);

    const resetAll = useCallback(() => {
        resetFilters();
    }, [resetFilters]);

    // Build result
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

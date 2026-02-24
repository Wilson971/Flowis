"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query-config";
import type { GscKeywordsExplorerResponse, GscKeywordsSortBy, GscSortOrder } from "@/lib/gsc/types";

interface Params {
    siteId: string | null;
    dateRange: string;
    search?: string;
    pageUrl?: string;
    page?: number;
    perPage?: number;
    sortBy?: GscKeywordsSortBy;
    sortOrder?: GscSortOrder;
}

export function useGscKeywordsExplorer({
    siteId,
    dateRange,
    search = '',
    pageUrl = '',
    page = 1,
    perPage = 50,
    sortBy = 'clicks',
    sortOrder = 'desc',
}: Params) {
    return useQuery<GscKeywordsExplorerResponse>({
        queryKey: ['gsc-keywords-explorer', siteId, dateRange, search, pageUrl, page, perPage, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({
                site_id: siteId!,
                date_range: dateRange,
                page: String(page),
                per_page: String(perPage),
                sort_by: sortBy,
                sort_order: sortOrder,
            });
            if (search) params.set('search', search);
            if (pageUrl) params.set('page_url', pageUrl);
            const res = await fetch(`/api/gsc/keywords-explorer?${params}`);
            if (!res.ok) throw new Error("Failed to fetch keywords explorer");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.STATIC,
        placeholderData: keepPreviousData,
    });
}

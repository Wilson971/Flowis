"use client";

import { useQuery } from "@tanstack/react-query";
import type { GscKeywordData, GscDateRange } from "@/lib/gsc/types";

/**
 * Hook to fetch cached GSC keyword data for a specific page URL.
 */
export function useGscKeywords(
    pageUrl: string | null | undefined,
    dateRange: GscDateRange = "last_28_days"
) {
    return useQuery<GscKeywordData[]>({
        queryKey: ["gsc-keywords", pageUrl, dateRange],
        queryFn: async () => {
            if (!pageUrl) return [];
            const params = new URLSearchParams({
                page_url: pageUrl,
                date_range: dateRange,
            });
            const res = await fetch(`/api/gsc/keywords?${params}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!pageUrl,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query-config";
import type { GscOpportunitiesResponse } from "@/lib/gsc/types";

export function useGscOpportunities(siteId: string | null, dateRange: string) {
    return useQuery<GscOpportunitiesResponse>({
        queryKey: ['gsc-opportunities', siteId, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                site_id: siteId!,
                date_range: dateRange,
            });
            const res = await fetch(`/api/gsc/opportunities?${params}`);
            if (!res.ok) throw new Error("Failed to fetch opportunities");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.ARCHIVE,
    });
}

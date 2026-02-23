"use client";

import { useQuery } from "@tanstack/react-query";
import type { GscDashboardResponse } from "@/lib/gsc/types";

/**
 * Hook to fetch GSC dashboard data (KPIs, daily stats, top keywords, top pages).
 */
export function useGscDashboard(siteId: string | null, days = 28) {
    return useQuery<GscDashboardResponse>({
        queryKey: ["gsc-dashboard", siteId, days],
        queryFn: async () => {
            const params = new URLSearchParams({
                site_id: siteId!,
                days: String(days),
            });
            const res = await fetch(`/api/gsc/dashboard?${params}`);
            if (!res.ok) throw new Error("Failed to fetch GSC dashboard");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: 5 * 60_000,
    });
}

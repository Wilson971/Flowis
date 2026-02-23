"use client";

import { useQuery } from "@tanstack/react-query";
import { useGscDashboard } from "./useGscDashboard";
import type { GscPositionChange } from "@/lib/gsc/types";

interface PositionTrackingResponse {
    has_7d_data: boolean;
    changes: GscPositionChange[];
}

export function useGscPositionTracking(siteId: string | null) {
    // Dedicated RPC for position comparison (7d vs 28d from gsc_keywords)
    const { data: posData, isLoading: posLoading } = useQuery<PositionTrackingResponse>({
        queryKey: ['gsc-position-tracking', siteId],
        queryFn: async () => {
            const res = await fetch(`/api/gsc/position-tracking?site_id=${siteId}`);
            if (!res.ok) throw new Error("Failed to fetch position tracking");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: 5 * 60_000,
    });

    // Dashboard data for the daily position chart
    const { data: dashboard, isLoading: dashLoading } = useGscDashboard(siteId, 28);

    // Coerce numeric strings to numbers for Recharts
    const daily = (dashboard?.daily || []).map(d => ({
        ...d,
        clicks: Number(d.clicks),
        impressions: Number(d.impressions),
        ctr: Number(d.ctr),
        position: Number(d.position),
    }));

    return {
        positions: posData?.changes || [],
        daily,
        isLoading: posLoading || dashLoading,
        has7dData: posData?.has_7d_data ?? false,
    };
}

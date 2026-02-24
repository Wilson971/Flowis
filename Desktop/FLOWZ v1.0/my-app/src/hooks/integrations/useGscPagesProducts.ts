"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query-config";
import type { GscPageWithProduct } from "@/lib/gsc/types";

export function useGscPagesProducts(siteId: string | null, dateRange: string) {
    return useQuery<{ pages: GscPageWithProduct[] }>({
        queryKey: ['gsc-pages-products', siteId, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                site_id: siteId!,
                date_range: dateRange,
            });
            const res = await fetch(`/api/gsc/pages-products?${params}`);
            if (!res.ok) throw new Error("Failed to fetch pages products");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.STATIC,
    });
}

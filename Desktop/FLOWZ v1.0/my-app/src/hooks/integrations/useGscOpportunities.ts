"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { STALE_TIMES } from "@/lib/query-config";
import type { GscOpportunitiesResponse } from "@/lib/gsc/types";
import {
    scoreOpportunities,
    detectNewKeywords,
    type ScoredOpportunity,
} from "@/lib/gsc/scoring";

// ============================================
// Base fetch hook (single date range)
// ============================================

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

// ============================================
// Category type
// ============================================

export type OpportunityCategory = 'quick_wins' | 'low_ctr' | 'no_clicks';

export interface ScoredOpportunitiesData {
    quick_wins: ScoredOpportunity[];
    low_ctr: ScoredOpportunity[];
    no_clicks: ScoredOpportunity[];
    newKeywords: Set<string>;
    totalCount: number;
}

// ============================================
// Enhanced hook with scoring + trends
// ============================================

/**
 * Fetches both 28d and 7d opportunity data, computes scores,
 * trends, and detects new keywords.
 */
export function useGscScoredOpportunities(siteId: string | null) {
    const {
        data: data28d,
        isLoading: loading28d,
    } = useGscOpportunities(siteId, 'last_28_days');

    const {
        data: data7d,
        isLoading: loading7d,
    } = useGscOpportunities(siteId, 'last_7_days');

    const isLoading = loading28d || loading7d;

    const scored = useMemo<ScoredOpportunitiesData | null>(() => {
        if (!data28d) return null;

        const quickWins = scoreOpportunities(
            data28d.quick_wins || [],
            data7d?.quick_wins
        );
        const lowCtr = scoreOpportunities(
            data28d.low_ctr || [],
            data7d?.low_ctr
        );
        const noClicks = scoreOpportunities(
            data28d.no_clicks || [],
            data7d?.no_clicks
        );

        // Detect new keywords across all categories
        const allNew = new Set<string>();
        const categories: OpportunityCategory[] = ['quick_wins', 'low_ctr', 'no_clicks'];
        for (const cat of categories) {
            if (data7d?.[cat] && data28d[cat]) {
                const newInCat = detectNewKeywords(data28d[cat], data7d[cat]);
                for (const q of newInCat) allNew.add(q);
            }
        }

        // Mark new keywords in scored results
        const markNew = (items: ScoredOpportunity[]) =>
            items.map((item) =>
                allNew.has(item.query.toLowerCase())
                    ? { ...item, trend: 'new' as const }
                    : item
            );

        return {
            quick_wins: markNew(quickWins),
            low_ctr: markNew(lowCtr),
            no_clicks: markNew(noClicks),
            newKeywords: allNew,
            totalCount: quickWins.length + lowCtr.length + noClicks.length,
        };
    }, [data28d, data7d]);

    return { data: scored, isLoading };
}

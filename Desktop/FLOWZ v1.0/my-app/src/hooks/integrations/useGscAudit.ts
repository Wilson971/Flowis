"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query-config";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditSeverity = "critical" | "warning" | "ok";
export type AuditCategory = "technical" | "on_page" | "quick_wins" | "performance";

export interface SeoAuditIssue {
    id: string;
    category: AuditCategory;
    severity: AuditSeverity;
    title: string;
    description: string;
    affected_count: number;
    metadata: Record<string, unknown>;
}

export interface SeoAuditSummary {
    total_urls: number;
    indexed_urls: number;
    not_indexed_urls: number;
    error_urls: number;
    sitemap_count: number;
    quick_wins_count: number;
    low_ctr_count: number;
    no_clicks_count: number;
    total_clicks: number;
    avg_ctr: number;
    avg_position: number;
    date_range: string;
}

export interface SeoAudit {
    audit_id: string;
    score: number;
    score_technical: number;
    score_on_page: number;
    score_quick_wins: number;
    score_performance: number;
    summary: SeoAuditSummary;
    created_at: string;
    issues: SeoAuditIssue[];
}

// ── Query key ─────────────────────────────────────────────────────────────────

export const gscAuditKeys = {
    latest: (siteId: string) => ["gsc-audit", siteId] as const,
};

// ── Fetch latest audit ────────────────────────────────────────────────────────

export function useGscAudit(siteId: string | null) {
    return useQuery<SeoAudit | null>({
        queryKey: gscAuditKeys.latest(siteId ?? ""),
        queryFn: async () => {
            const res = await fetch(`/api/gsc/audit?siteId=${siteId}`);
            if (!res.ok) throw new Error("Impossible de récupérer l'audit");
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.ARCHIVE,
    });
}

// ── Run new audit ─────────────────────────────────────────────────────────────

export function useRunSeoAudit(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation<SeoAudit, Error, { dateRange?: string }>({
        mutationFn: async ({ dateRange = "last_28_days" }) => {
            const res = await fetch("/api/gsc/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ siteId, dateRange }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Erreur lors du lancement de l'audit");
            }
            return res.json();
        },
        onSuccess: (data) => {
            if (siteId) {
                queryClient.setQueryData(gscAuditKeys.latest(siteId), data);
            }
        },
    });
}

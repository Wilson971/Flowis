"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GscConnectionView } from "@/lib/gsc/types";

interface GscSitesResponse {
    connections: GscConnectionView[];
}

/**
 * Hook to manage GSC connections (list, sync, delete).
 * Adapted for the real schema: sites are separate from connections.
 */
export function useGscConnection(options?: { linkedOnly?: boolean }) {
    const linkedOnly = options?.linkedOnly ?? false;
    const queryClient = useQueryClient();

    const connectionsQuery = useQuery({
        queryKey: ["gsc-connections", { linkedOnly }],
        queryFn: async (): Promise<GscSitesResponse> => {
            const url = linkedOnly ? "/api/gsc/sites?linked_only=true" : "/api/gsc/sites";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch GSC connections");
            return res.json();
        },
        staleTime: 60_000,
    });

    const syncMutation = useMutation({
        mutationFn: async ({ siteId, dateRange = "last_28_days" }: { siteId: string; dateRange?: string }) => {
            const res = await fetch("/api/gsc/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ site_id: siteId, date_range: dateRange }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Sync failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gsc-connections"] });
            queryClient.invalidateQueries({ queryKey: ["gsc-keywords"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (connectionId: string) => {
            const res = await fetch(`/api/gsc/connections/${connectionId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Delete failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gsc-connections"] });
            queryClient.invalidateQueries({ queryKey: ["gsc-keywords"] });
        },
    });

    const connections = connectionsQuery.data?.connections || [];
    const activeConnection = connections.find(c => c.is_active) || null;

    return {
        connections,
        activeConnection,
        isLoading: connectionsQuery.isLoading,
        isConnected: !!activeConnection,
        sync: syncMutation.mutate,
        isSyncing: syncMutation.isPending,
        disconnect: deleteMutation.mutate,
        isDisconnecting: deleteMutation.isPending,
    };
}

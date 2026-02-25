"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Settings2, Scan, Zap } from "lucide-react";
import { useGscIndexation } from "@/hooks/integrations/useGscIndexation";
import { useGscSitemap } from "@/hooks/integrations/useGscSitemap";
import { useQueryClient } from "@tanstack/react-query";
import { GscIndexationChart } from "./GscIndexationChart";
import { GscIndexationStatusBar } from "./GscIndexationStatusBar";
import { GscIndexationFilters } from "./GscIndexationFilters";
import { GscIndexationUrlList } from "./GscIndexationUrlList";
import { GscIndexationQueueTab } from "./GscIndexationQueueTab";
import { GscAutoIndexSettings } from "./GscAutoIndexSettings";
import { GscScanProgressBanner } from "./GscScanProgressBanner";
import { GscIndexationSelectionBar } from "./GscIndexationSelectionBar";
import type { GscIndexationVerdict, GscUrlFilterRule } from "@/lib/gsc/types";
import { useDebounce } from "@/hooks/useDebounce";

interface GscIndexationTabProps {
    siteId: string | null;
    siteUrl: string;
}

interface FullScanState {
    running: boolean;
    inspected: number;
    remaining: number | null;
    passes: number;
    done: boolean;
    error: string | null;
}

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "") + "/functions/v1";

export function GscIndexationTab({ siteId, siteUrl }: GscIndexationTabProps) {
    const queryClient = useQueryClient();
    const [subTab, setSubTab] = useState("sitemap");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filterRule, setFilterRule] = useState<GscUrlFilterRule | null>(null);
    const [filterValue, setFilterValue] = useState("");
    const [scan, setScan] = useState<FullScanState>({
        running: false, inspected: 0, remaining: null, passes: 0, done: false, error: null,
    });
    const abortRef = useRef<boolean>(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const debouncedSearch = useDebounce(search, 300);
    const { refreshSitemap, isRefreshing } = useGscSitemap(siteId);

    const {
        overview,
        urls,
        totalUrls,
        isUrlsLoading,
        inspect,
        isInspecting,
        submit,
        isSubmitting,
    } = useGscIndexation(siteId, {
        page,
        perPage: 50,
        search: debouncedSearch || undefined,
        filterRule,
        filterValue: filterValue || undefined,
    });

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const handleFilterChange = useCallback((rule: GscUrlFilterRule | null, value: string) => {
        setFilterRule(rule);
        setFilterValue(value);
        setPage(1);
    }, []);

    // ── Selection state ───────────────────────────────────────────────────────
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const handleToggleSelect = useCallback((url: string) => {
        setSelectedUrls(prev => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            return next;
        });
    }, []);

    const handleToggleAll = useCallback(() => {
        const allOnPage = urls.map(u => u.url);
        const allSelected = allOnPage.every(u => selectedUrls.has(u));
        if (allSelected) {
            setSelectedUrls(prev => {
                const next = new Set(prev);
                allOnPage.forEach(u => next.delete(u));
                return next;
            });
        } else {
            setSelectedUrls(prev => {
                const next = new Set(prev);
                allOnPage.forEach(u => next.add(u));
                return next;
            });
        }
    }, [urls, selectedUrls]);

    const handleClearSelection = useCallback(() => {
        setSelectedUrls(new Set());
    }, []);

    const handleBatchIndex = useCallback(() => {
        const toSubmit = Array.from(selectedUrls);
        if (toSubmit.length === 0) return;
        submit(toSubmit);
        setSelectedUrls(new Set());
    }, [selectedUrls, submit]);

    const handleSubmitUrl = useCallback((url: string) => {
        submit([url]);
    }, [submit]);

    const handleMassIndex = useCallback(() => {
        const allUrls = urls.map(u => u.url);
        if (allUrls.length > 0) submit(allUrls);
    }, [urls, submit]);

    const handleRefreshAndInspect = useCallback(async () => {
        try {
            await new Promise<void>((resolve, reject) => {
                refreshSitemap(undefined, {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                });
            });
            inspect(undefined);
        } catch {
            // sitemap refresh failed
        }
    }, [refreshSitemap, inspect]);

    // ── Full scan via inspect-batch Edge Function ──────────────────────────────
    const handleFullScan = useCallback(async () => {
        if (!siteId) return;
        abortRef.current = false;

        setScan({ running: true, inspected: 0, remaining: null, passes: 0, done: false, error: null });

        // Poll Supabase every 4s to show real-time progress independently of fetch responses
        pollRef.current = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ["gsc-indexation-overview", siteId] });
            queryClient.invalidateQueries({ queryKey: ["gsc-indexation-urls", siteId] });
        }, 4000);

        // First refresh sitemap to pick up new URLs
        try {
            await new Promise<void>((resolve) => {
                refreshSitemap(undefined, { onSuccess: () => resolve(), onError: () => resolve() });
            });
        } catch { /* non-fatal */ }

        let totalInspected = 0;
        let passes = 0;

        while (!abortRef.current) {
            try {
                const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/inspect-batch`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({ siteId, batchSize: 20 }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `HTTP ${res.status}`);
                }

                const data = await res.json();
                passes++;
                totalInspected += data.inspected || 0;

                setScan(prev => ({
                    ...prev,
                    passes,
                    inspected: totalInspected,
                    remaining: data.remaining ?? null,
                }));

                // Refresh UI data every pass
                queryClient.invalidateQueries({ queryKey: ["gsc-indexation-overview", siteId] });
                queryClient.invalidateQueries({ queryKey: ["gsc-indexation-urls", siteId] });

                // Stop if nothing left to inspect
                if (!data.has_more || data.inspected === 0) break;

                // Small pause between batches
                await new Promise(r => setTimeout(r, 1500));

            } catch (err: any) {
                setScan(prev => ({ ...prev, running: false, error: err.message }));
                return;
            }
        }

        if (pollRef.current) clearInterval(pollRef.current);
        setScan(prev => ({ ...prev, running: false, done: !abortRef.current }));
    }, [siteId, refreshSitemap, queryClient]);

    const handleStopScan = useCallback(() => {
        abortRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        setScan(prev => ({ ...prev, running: false }));
    }, []);

    const emptyOverview = {
        total: 0, indexed: 0, not_indexed: 0, crawled_not_indexed: 0,
        discovered_not_indexed: 0, noindex: 0, blocked_robots: 0,
        errors: 0, unknown: 0, history: [],
    };

    return (
        <div className="space-y-3">
            {/* Bloc 2 — Toolbar + sous-onglets + graphique + status */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs rounded-lg"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        Auto-indexation
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        className="gap-1.5 h-8 text-xs rounded-lg"
                        onClick={handleFullScan}
                        disabled={!siteId || isRefreshing || isInspecting || scan.running}
                    >
                        <Zap className="h-3.5 w-3.5" />
                        {scan.running ? "En cours…" : "Inspection complète"}
                    </Button>
                </div>

                {/* Progress banner */}
                <GscScanProgressBanner
                    running={scan.running}
                    done={scan.done}
                    error={scan.error}
                    inspected={overview ? (overview.indexed || 0) + (overview.not_indexed || 0) + (overview.errors || 0) : scan.inspected}
                    remaining={scan.remaining}
                    passes={scan.passes}
                    totalUrls={overview?.total}
                    onStop={handleStopScan}
                    onDismiss={() => setScan({ running: false, inspected: 0, remaining: null, passes: 0, done: false, error: null })}
                />

                {/* Sous-onglets */}
                <Tabs value={subTab} onValueChange={setSubTab}>
                    <TabsList className="h-9 p-1 rounded-lg">
                        <TabsTrigger value="sitemap" className="text-xs rounded-md px-4 h-7">Pages du sitemap</TabsTrigger>
                        <TabsTrigger value="queue" className="text-xs rounded-md px-4 h-7">Pages en attente</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sitemap" className="mt-4 space-y-0">
                        <GscIndexationChart data={(overview || emptyOverview).history} />
                        <GscIndexationStatusBar overview={overview || emptyOverview} />
                    </TabsContent>

                    <TabsContent value="queue" className="mt-4">
                        <GscIndexationQueueTab siteId={siteId} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Bloc 3 — Filtres + Liste (uniquement pour l'onglet sitemap) */}
            {subTab === "sitemap" && (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <GscIndexationFilters
                        search={search}
                        onSearchChange={handleSearchChange}
                        filterRule={filterRule}
                        filterValue={filterValue}
                        onFilterChange={handleFilterChange}
                        onMassIndex={handleMassIndex}
                        isMassIndexing={isSubmitting}
                        totalFiltered={totalUrls}
                    />
                    <GscIndexationUrlList
                        urls={urls}
                        total={totalUrls}
                        page={page}
                        perPage={50}
                        onPageChange={setPage}
                        siteUrl={siteUrl}
                        onSubmitUrl={handleSubmitUrl}
                        isSubmitting={isSubmitting}
                        isLoading={isUrlsLoading}
                        selectedUrls={selectedUrls}
                        onToggleSelect={handleToggleSelect}
                        onToggleAll={handleToggleAll}
                        onClearSelection={handleClearSelection}
                    />
                </div>
            )}

            <GscAutoIndexSettings
                siteId={siteId}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            {/* Sticky selection toolbar */}
            <GscIndexationSelectionBar
                selectedCount={selectedUrls.size}
                onDeselect={handleClearSelection}
                onBatchIndex={handleBatchIndex}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

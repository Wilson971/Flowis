"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Settings2, Scan } from "lucide-react";
import { useGscIndexation } from "@/hooks/integrations/useGscIndexation";
import { useGscSitemap } from "@/hooks/integrations/useGscSitemap";
import { GscIndexationChart } from "./GscIndexationChart";
import { GscIndexationStatusBar } from "./GscIndexationStatusBar";
import { GscIndexationFilters } from "./GscIndexationFilters";
import { GscIndexationUrlList } from "./GscIndexationUrlList";
import { GscIndexationQueueTab } from "./GscIndexationQueueTab";
import { GscAutoIndexSettings } from "./GscAutoIndexSettings";
import type { GscIndexationVerdict, GscUrlFilterRule } from "@/lib/gsc/types";
import { useDebounce } from "@/hooks/useDebounce";

interface GscIndexationTabProps {
    siteId: string | null;
    siteUrl: string;
}

export function GscIndexationTab({ siteId, siteUrl }: GscIndexationTabProps) {
    const [subTab, setSubTab] = useState("sitemap");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filterRule, setFilterRule] = useState<GscUrlFilterRule | null>(null);
    const [filterValue, setFilterValue] = useState("");

    const debouncedSearch = useDebounce(search, 300);

    const { refreshSitemap, isRefreshing } = useGscSitemap(siteId);

    const {
        overview,
        isOverviewLoading,
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

    const handleSubmitUrl = useCallback((url: string) => {
        submit([url]);
    }, [submit]);

    const handleMassIndex = useCallback(() => {
        const allUrls = urls.map(u => u.url);
        if (allUrls.length > 0) {
            submit(allUrls);
        }
    }, [urls, submit]);

    const handleRefreshAndInspect = useCallback(() => {
        refreshSitemap(undefined, {
            onSuccess: () => {
                inspect(undefined);
            },
        });
    }, [refreshSitemap, inspect]);

    const emptyOverview = {
        total: 0, indexed: 0, not_indexed: 0, crawled_not_indexed: 0,
        discovered_not_indexed: 0, noindex: 0, blocked_robots: 0,
        errors: 0, unknown: 0, history: [],
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={handleRefreshAndInspect}
                    disabled={isRefreshing || isInspecting}
                >
                    <RefreshCw className={cn(
                        "h-3.5 w-3.5",
                        (isRefreshing || isInspecting) && "animate-spin"
                    )} />
                    {isRefreshing ? "Actualisation..." : isInspecting ? "Inspection..." : "Actualiser sitemap"}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => inspect(undefined)}
                    disabled={isInspecting}
                >
                    <Scan className={cn("h-3.5 w-3.5", isInspecting && "animate-pulse")} />
                    Verifier statuts
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setSettingsOpen(true)}
                >
                    <Settings2 className="h-3.5 w-3.5" />
                    Auto-indexation
                </Button>
            </div>

            {/* Sub-tabs */}
            <Tabs value={subTab} onValueChange={setSubTab}>
                <TabsList>
                    <TabsTrigger value="sitemap" className="text-xs">
                        Pages du sitemap
                    </TabsTrigger>
                    <TabsTrigger value="queue" className="text-xs">
                        Pages en attente
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sitemap" className="mt-4 space-y-4">
                    {/* Chart */}
                    <GscIndexationChart data={(overview || emptyOverview).history} />

                    {/* Status distribution bar */}
                    <GscIndexationStatusBar overview={overview || emptyOverview} />

                    {/* Filters */}
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

                    {/* URL List */}
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
                    />
                </TabsContent>

                <TabsContent value="queue" className="mt-4">
                    <GscIndexationQueueTab siteId={siteId} />
                </TabsContent>
            </Tabs>

            {/* Auto-index settings dialog */}
            <GscAutoIndexSettings
                siteId={siteId}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </div>
    );
}

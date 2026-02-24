"use client";

import { useState } from "react";
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { GscKeywordData, GscTopPage, GscCountryStats, GscDeviceStats, GscDailyStats } from "@/lib/gsc/types";

type SortKey = "clicks" | "impressions" | "ctr" | "position";

function useSortable<T>(items: T[], defaultKey: SortKey = "clicks") {
    const [sortKey, setSortKey] = useState<SortKey>(defaultKey);
    const [sortAsc, setSortAsc] = useState(false);

    const toggle = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const sorted = [...items].sort((a: any, b: any) => {
        const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
        return sortAsc ? diff : -diff;
    });

    return { sorted, sortKey, sortAsc, toggle };
}

function SortHeader({ label, field, sortKey, sortAsc, onToggle, className }: {
    label: string; field: SortKey; sortKey: SortKey; sortAsc: boolean;
    onToggle: (k: SortKey) => void; className?: string;
}) {
    const isActive = sortKey === field;
    return (
        <button
            onClick={() => onToggle(field)}
            className={cn(
                "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group",
                isActive && "text-foreground",
                className
            )}
        >
            {label}
            <ArrowUpDown className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100 text-primary")} />
        </button>
    );
}

function Paginator({ total, start, end, onPrev, onNext }: { total: number; start: number; end: number; onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-center justify-end gap-4 p-2 text-xs text-muted-foreground border-t border-border/40">
            <span>Lignes par page : 10</span>
            <span>{start}-{Math.min(end, total)} sur {total}</span>
            <div className="flex items-center gap-1">
                <button onClick={onPrev} disabled={start <= 1} className="p-1 hover:bg-muted rounded disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={onNext} disabled={end >= total} className="p-1 hover:bg-muted rounded disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
        </div>
    );
}

// Alpha3 to Flag
const ALPHA3_TO_ALPHA2: Record<string, string> = {
    FRA: "FR", BEL: "BE", MAR: "MA", CAN: "CA", CHE: "CH", TUN: "TN", DZA: "DZ", ESP: "ES", ITA: "IT", GBR: "GB", USA: "US", PRT: "PT", NLD: "NL", BRA: "BR", DEU: "DE",
};
function countryFlag(alpha3: string): string {
    const alpha2 = ALPHA3_TO_ALPHA2[alpha3];
    if (!alpha2) return "";
    return String.fromCodePoint(...[...alpha2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

interface GenericTableProps<T> {
    data: T[];
    renderRow: (item: T, idx: number) => React.ReactNode;
    firstColumnLabel: string;
}

function GenericTable<T>({ data, renderRow, firstColumnLabel }: GenericTableProps<T>) {
    const { sorted, sortKey, sortAsc, toggle } = useSortable(data);
    const [page, setPage] = useState(1);
    const limit = 10;

    // reset page on sort
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                <span className="text-sm font-medium text-muted-foreground">{firstColumnLabel}</span>
                <button className="p-1 hover:bg-muted rounded-lg"><Filter className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-3 border-b border-border/40 min-w-[600px] overflow-x-auto">
                <span className="text-xs font-medium text-muted-foreground invisible">Sujet</span>
                <SortHeader label="Clics" field="clicks" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                <SortHeader label="Impressions" field="impressions" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                <SortHeader label="CTR" field="ctr" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                <SortHeader label="Position" field="position" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
            </div>
            {data.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Aucune donnee disponible.</div>
            ) : (
                <div className="flex flex-col min-w-[600px] overflow-x-auto">
                    {paginated.map((item, idx) => renderRow(item, idx))}
                </div>
            )}
            {data.length > 0 && (
                <Paginator
                    total={data.length}
                    start={(page - 1) * limit + 1}
                    end={page * limit}
                    onPrev={() => setPage(p => Math.max(1, p - 1))}
                    onNext={() => setPage(p => Math.min(Math.ceil(data.length / limit), p + 1))}
                />
            )}
        </div>
    );
}

function posColor(pos: number) {
    return "text-[#e65100]";
}

interface GscTabbedDataProps {
    dashboard?: {
        top_keywords?: GscKeywordData[];
        top_pages?: GscTopPage[];
        countries?: GscCountryStats[];
        devices?: GscDeviceStats[];
        daily?: GscDailyStats[];
    };
}

export function GscTabbedData({ dashboard }: GscTabbedDataProps) {
    const tabs = [
        { id: "queries", label: "REQUÊTES" },
        { id: "pages", label: "PAGES" },
        { id: "countries", label: "PAYS" },
        { id: "devices", label: "APPAREILS" },
        { id: "appearance", label: "APPARENCE DANS LES RÉSULTATS DE RECHERCHE" },
        { id: "dates", label: "JOURS" }
    ];

    const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)} k` : n.toString();
    const formatCtr = (ctr: number) => `${(ctr * 100).toFixed(1)} %`;
    const formatPos = (pos: number) => (Math.round(pos * 10) / 10).toString().replace('.', ',');

    const RowShell = ({ children, isEven }: { children: React.ReactNode, isEven: boolean }) => (
        <div className={cn("grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-3 text-sm hover:bg-muted/30 border-b border-border/10", isEven && "bg-muted/10")}>
            {children}
        </div>
    );

    return (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden mt-6 shadow-sm">
            <Tabs defaultValue="queries" className="w-full">
                <TabsList className="w-full justify-start h-14 bg-transparent border-b border-border/40 rounded-none px-4 pt-4 gap-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-4 border-b-2 border-transparent transition-none h-full"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="queries" className="m-0 border-none outline-none">
                    <GenericTable<GscKeywordData>
                        data={dashboard?.top_keywords || []}
                        firstColumnLabel="Requêtes les plus fréquent..."
                        renderRow={(kw, idx) => (
                            <RowShell key={kw.query} isEven={idx % 2 === 0}>
                                <span className="truncate pr-4">{kw.query}</span>
                                <span className="text-right text-[#4285f4]">{formatNum(kw.clicks)}</span>
                                <span className="text-right text-[#5e35b1]">{formatNum(kw.impressions)}</span>
                                <span className="text-right text-[#00897b]">{formatCtr(kw.ctr)}</span>
                                <span className={cn("text-right", posColor(kw.position))}>{formatPos(kw.position)}</span>
                            </RowShell>
                        )}
                    />
                </TabsContent>

                <TabsContent value="pages" className="m-0 border-none outline-none">
                    <GenericTable<GscTopPage>
                        data={dashboard?.top_pages || []}
                        firstColumnLabel="Pages principales..."
                        renderRow={(page, idx) => {
                            const path = (() => { try { const u = new URL(page.page_url); return u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, ""); } catch { return page.page_url; } })();
                            return (
                                <RowShell key={page.page_url} isEven={idx % 2 === 0}>
                                    <span className="truncate pr-4" title={page.page_url}>{path}</span>
                                    <span className="text-right text-[#4285f4]">{formatNum(page.clicks)}</span>
                                    <span className="text-right text-[#5e35b1]">{formatNum(page.impressions)}</span>
                                    <span className="text-right text-[#00897b]">{formatCtr(page.ctr)}</span>
                                    <span className={cn("text-right", posColor(page.position))}>{formatPos(page.position)}</span>
                                </RowShell>
                            );
                        }}
                    />
                </TabsContent>

                <TabsContent value="countries" className="m-0 border-none outline-none">
                    <GenericTable<GscCountryStats>
                        data={dashboard?.countries || []}
                        firstColumnLabel="Pays..."
                        renderRow={(c, idx) => (
                            <RowShell key={c.country} isEven={idx % 2 === 0}>
                                <div className="flex items-center gap-2 truncate pr-4">
                                    <span className="text-lg leading-none">{countryFlag(c.country)}</span>
                                    <span className="truncate">{c.country}</span>
                                </div>
                                <span className="text-right text-[#4285f4]">{formatNum(c.clicks)}</span>
                                <span className="text-right text-[#5e35b1]">{formatNum(c.impressions)}</span>
                                <span className="text-right text-[#00897b]">{formatCtr(c.ctr)}</span>
                                <span className={cn("text-right", posColor(c.position))}>{formatPos(c.position)}</span>
                            </RowShell>
                        )}
                    />
                </TabsContent>

                <TabsContent value="devices" className="m-0 border-none outline-none">
                    <GenericTable<GscDeviceStats>
                        data={dashboard?.devices || []}
                        firstColumnLabel="Appareils..."
                        renderRow={(d, idx) => (
                            <RowShell key={d.device} isEven={idx % 2 === 0}>
                                <span className="truncate pr-4 capitalize">{d.device.toLowerCase()}</span>
                                <span className="text-right text-[#4285f4]">{formatNum(d.clicks)}</span>
                                <span className="text-right text-[#5e35b1]">{formatNum(d.impressions)}</span>
                                <span className="text-right text-[#00897b]">{formatCtr(d.ctr)}</span>
                                <span className={cn("text-right", posColor(d.position))}>{formatPos(d.position)}</span>
                            </RowShell>
                        )}
                    />
                </TabsContent>

                <TabsContent value="appearance" className="m-0 border-none outline-none">
                    <GenericTable<any>
                        data={[]}
                        firstColumnLabel="Apparence..."
                        renderRow={() => null}
                    />
                </TabsContent>

                <TabsContent value="dates" className="m-0 border-none outline-none">
                    <GenericTable<GscDailyStats>
                        data={dashboard?.daily || []}
                        firstColumnLabel="Date..."
                        renderRow={(d, idx) => {
                            const dateStr = new Date(d.stat_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
                            return (
                                <RowShell key={d.stat_date} isEven={idx % 2 === 0}>
                                    <span className="truncate pr-4">{dateStr}</span>
                                    <span className="text-right text-[#4285f4]">{formatNum(d.clicks)}</span>
                                    <span className="text-right text-[#5e35b1]">{formatNum(d.impressions)}</span>
                                    <span className="text-right text-[#00897b]">{formatCtr(d.ctr)}</span>
                                    <span className={cn("text-right", posColor(d.position))}>{formatPos(d.position)}</span>
                                </RowShell>
                            );
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

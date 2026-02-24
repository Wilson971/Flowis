"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Globe, Monitor, Smartphone, Tablet, Search } from "lucide-react";
import type { GscCountryStats, GscDeviceStats } from "@/lib/gsc/types";

// ============================================================================
// Country flag emoji from ISO 3166-1 alpha-3
// ============================================================================

const ALPHA3_TO_ALPHA2: Record<string, string> = {
    FRA: "FR", BEL: "BE", MAR: "MA", CAN: "CA", CHE: "CH",
    TUN: "TN", DZA: "DZ", SEN: "SN", CMR: "CM", CIV: "CI",
    DEU: "DE", ESP: "ES", ITA: "IT", GBR: "GB", USA: "US",
    PRT: "PT", NLD: "NL", BRA: "BR", COD: "CD", MDG: "MG",
    MLI: "ML", BFA: "BF", GIN: "GN", TGO: "TG", BEN: "BJ",
    NER: "NE", GAB: "GA", COG: "CG", HTI: "HT", MTQ: "MQ",
    GLP: "GP", REU: "RE", GUF: "GF", NCL: "NC", PYF: "PF",
    MUS: "MU", LBN: "LB", ROU: "RO", POL: "PL", AUT: "AT",
    SWE: "SE", NOR: "NO", DNK: "DK", FIN: "FI", IRL: "IE",
    AUS: "AU", JPN: "JP", CHN: "CN", IND: "IN", KOR: "KR",
    RUS: "RU", MEX: "MX", ARG: "AR", CHL: "CL", COL: "CO",
};

const COUNTRY_NAMES: Record<string, string> = {
    FRA: "France", BEL: "Belgique", MAR: "Maroc", CAN: "Canada", CHE: "Suisse",
    TUN: "Tunisie", DZA: "Algerie", SEN: "Senegal", CMR: "Cameroun", CIV: "Cote d'Ivoire",
    DEU: "Allemagne", ESP: "Espagne", ITA: "Italie", GBR: "Royaume-Uni", USA: "Etats-Unis",
    PRT: "Portugal", NLD: "Pays-Bas", BRA: "Bresil", MDG: "Madagascar", HTI: "Haiti",
    MTQ: "Martinique", GLP: "Guadeloupe", REU: "Reunion", GUF: "Guyane", NCL: "Nouvelle-Caledonie",
    MUS: "Maurice", LBN: "Liban", ROU: "Roumanie", POL: "Pologne", AUT: "Autriche",
    SWE: "Suede", NOR: "Norvege", AUS: "Australie", JPN: "Japon", CHN: "Chine",
    IND: "Inde", MEX: "Mexique", ARG: "Argentine",
};

function countryFlag(alpha3: string): string {
    const alpha2 = ALPHA3_TO_ALPHA2[alpha3];
    if (!alpha2) return "";
    return String.fromCodePoint(
        ...[...alpha2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
}

function countryName(alpha3: string): string {
    return COUNTRY_NAMES[alpha3] || alpha3;
}

// ============================================================================
// Device icons
// ============================================================================

function DeviceIcon({ device, className }: { device: string; className?: string }) {
    switch (device.toUpperCase()) {
        case "DESKTOP": return <Monitor className={className} />;
        case "MOBILE": return <Smartphone className={className} />;
        case "TABLET": return <Tablet className={className} />;
        default: return <Monitor className={className} />;
    }
}

function deviceLabel(device: string): string {
    switch (device.toUpperCase()) {
        case "DESKTOP": return "Desktop";
        case "MOBILE": return "Mobile";
        case "TABLET": return "Tablette";
        default: return device;
    }
}

// ============================================================================
// Compact Table Row
// ============================================================================

function formatNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

// ============================================================================
// Countries Table
// ============================================================================

export function GscCountriesTable({ countries }: { countries: GscCountryStats[] }) {
    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Pays
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {countries.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Aucune donnee.</p>
                ) : (
                    <div className="space-y-0">
                        <div className="grid grid-cols-[1fr_50px_60px_45px_45px] gap-2 px-2 py-1.5 border-b border-border/20">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pays</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Clics</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Impr.</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">CTR</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Pos.</span>
                        </div>
                        {countries.slice(0, 10).map((c) => (
                            <div
                                key={c.country}
                                className="grid grid-cols-[1fr_50px_60px_45px_45px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base leading-none">{countryFlag(c.country)}</span>
                                    <span className="truncate font-medium">{countryName(c.country)}</span>
                                </div>
                                <span className="text-right tabular-nums">{formatNum(c.clicks)}</span>
                                <span className="text-right tabular-nums text-muted-foreground">{formatNum(c.impressions)}</span>
                                <span className="text-right tabular-nums text-muted-foreground">{(c.ctr * 100).toFixed(1)}%</span>
                                <span className={cn(
                                    "text-right tabular-nums font-medium",
                                    c.position <= 10 ? "text-emerald-500" : c.position <= 20 ? "text-amber-500" : "text-muted-foreground"
                                )}>
                                    {Math.round(c.position * 10) / 10}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Search Engines Table (GSC only reports Google traffic)
// ============================================================================

export function GscSearchEnginesTable({ countries }: { countries: GscCountryStats[] }) {
    // GSC only provides Google data, so we aggregate to show a single "Google" row
    const totalClicks = countries.reduce((s, c) => s + c.clicks, 0);
    const totalImpressions = countries.reduce((s, c) => s + c.impressions, 0);

    const engines = [
        { name: "Google", clicks: totalClicks, impressions: totalImpressions, icon: Search },
    ];

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Moteurs de recherche
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-0">
                    <div className="grid grid-cols-[1fr_60px_70px] gap-2 px-2 py-1.5 border-b border-border/20">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Moteur</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Clics</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Impr.</span>
                    </div>
                    {engines.map((e) => (
                        <div
                            key={e.name}
                            className="grid grid-cols-[1fr_60px_70px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs"
                        >
                            <span className="font-medium">{e.name}</span>
                            <span className="text-right tabular-nums">{formatNum(e.clicks)}</span>
                            <span className="text-right tabular-nums text-muted-foreground">{formatNum(e.impressions)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Devices Table
// ============================================================================

export function GscDevicesTable({ devices }: { devices: GscDeviceStats[] }) {
    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Appareils
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {devices.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Aucune donnee.</p>
                ) : (
                    <div className="space-y-0">
                        <div className="grid grid-cols-[1fr_60px_70px] gap-2 px-2 py-1.5 border-b border-border/20">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Appareil</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Clics</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Impr.</span>
                        </div>
                        {devices.map((d) => (
                            <div
                                key={d.device}
                                className="grid grid-cols-[1fr_60px_70px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <DeviceIcon device={d.device} className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{deviceLabel(d.device)}</span>
                                </div>
                                <span className="text-right tabular-nums">{formatNum(d.clicks)}</span>
                                <span className="text-right tabular-nums text-muted-foreground">{formatNum(d.impressions)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle2, Zap, AlertTriangle } from "lucide-react";

interface GscScanProgressBannerProps {
    running: boolean;
    done: boolean;
    error: string | null;
    inspected: number;
    remaining: number | null;
    passes: number;
    totalFromOverview?: number;
    totalUrls?: number;
    onStop: () => void;
    onDismiss: () => void;
}

const SCAN_MESSAGES = [
    "Connexion à Google Search Console…",
    "Récupération des URLs du sitemap…",
    "Inspection des pages en cours…",
    "Analyse des statuts d'indexation…",
    "Vérification des robots.txt…",
    "Mise à jour de la base de données…",
];

function PulsingDot({ className }: { className?: string }) {
    return (
        <span className={cn("relative flex h-2.5 w-2.5", className)}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current" />
        </span>
    );
}

function RadarAnimation() {
    return (
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            {/* Outer rings */}
            <span className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute inset-1 rounded-full border border-violet-500/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
            <span className="absolute inset-2 rounded-full border border-violet-500/40 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
            {/* Core icon */}
            <div className="relative z-10 w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
            </div>
        </div>
    );
}

function UrlTicker({ passes }: { passes: number }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setMsgIndex(i => (i + 1) % SCAN_MESSAGES.length);
                setVisible(true);
            }, 300);
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    return (
        <span
            className={cn(
                "text-xs text-violet-300/80 transition-opacity duration-300",
                visible ? "opacity-100" : "opacity-0"
            )}
        >
            {SCAN_MESSAGES[msgIndex]}
        </span>
    );
}

export function GscScanProgressBanner({
    running,
    done,
    error,
    inspected,
    remaining,
    passes,
    totalFromOverview,
    totalUrls,
    onStop,
    onDismiss,
}: GscScanProgressBannerProps) {
    if (!running && !done && !error) return null;

    const total = (totalFromOverview !== undefined && totalUrls !== undefined)
        ? totalUrls
        : (inspected + (remaining ?? 0));

    const progress = total > 0
        ? Math.min(100, Math.round((inspected / total) * 100))
        : null;

    // ── Error state ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-400">Inspection échouée</p>
                        <p className="text-xs text-red-300/70 mt-0.5 truncate">{error}</p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    // ── Done state ───────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-400">Inspection terminée</p>
                        <p className="text-xs text-emerald-300/70 mt-0.5">
                            {inspected} URL{inspected > 1 ? "s" : ""} inspectée{inspected > 1 ? "s" : ""} en {passes} passe{passes > 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-emerald-400/60 hover:text-emerald-400 transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    // ── Running state ────────────────────────────────────────────────────────
    return (
        <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/8 via-violet-500/5 to-transparent overflow-hidden">
            {/* Animated top border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse" />

            <div className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-3">
                    <RadarAnimation />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <PulsingDot className="text-violet-400" />
                            <span className="text-sm font-semibold text-white">
                                Inspection complète en cours
                            </span>
                        </div>
                        <UrlTicker passes={passes} />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onStop}
                        className="h-8 gap-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 shrink-0"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Arrêter
                    </Button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-violet-300/50 font-medium mb-0.5">Inspectées</p>
                        <p className="text-base font-bold text-white tabular-nums">{inspected}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-violet-300/50 font-medium mb-0.5">Restantes</p>
                        <p className="text-base font-bold text-white tabular-nums">
                            {remaining !== null ? remaining : "…"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-violet-300/50 font-medium mb-0.5">Passes</p>
                        <p className="text-base font-bold text-white tabular-nums">{passes}</p>
                    </div>
                </div>

                {/* Progress bar */}
                {progress !== null ? (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-violet-300/60">
                            <span>Progression</span>
                            <span className="font-semibold text-violet-300">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" style={{ backgroundSize: "200% 100%" }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    // Indeterminate bar when no total known yet
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full animate-[indeterminate_1.8s_ease-in-out_infinite]" />
                    </div>
                )}
            </div>
        </div>
    );
}

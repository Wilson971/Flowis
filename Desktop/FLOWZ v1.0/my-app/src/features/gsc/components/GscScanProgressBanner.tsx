"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle2, Zap, AlertTriangle, RefreshCw, Check, Loader2, Circle } from "lucide-react";

interface GscScanProgressBannerProps {
    running: boolean;
    done: boolean;
    error: string | null;
    isAuthError?: boolean;
    inspected: number;
    remaining: number | null;
    passes: number;
    totalFromOverview?: number;
    totalUrls?: number;
    onStop: () => void;
    onDismiss: () => void;
    onReconnect?: () => void;
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
            <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute inset-1 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
            <span className="absolute inset-2 rounded-full border border-primary/40 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
            {/* Core icon */}
            <div className="relative z-10 w-8 h-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
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
                "text-xs text-primary/80 transition-opacity duration-300",
                visible ? "opacity-100" : "opacity-0"
            )}
        >
            {SCAN_MESSAGES[msgIndex]}
        </span>
    );
}

// ── Scan Step Indicator (Vercel-style segmented progress) ──────────────────

type StepStatus = "done" | "active" | "pending";

const SCAN_STEPS = [
    { key: "connexion", label: "Connexion" },
    { key: "retrieval", label: "Récupération" },
    { key: "inspection", label: "Inspection" },
    { key: "finalization", label: "Finalisation" },
] as const;

function deriveCurrentStep(
    inspected: number,
    remaining: number | null,
    passes: number,
    progress: number | null
): number {
    if (progress !== null && progress >= 95) return 3; // Finalisation
    if (inspected > 0) return 2; // Inspection
    if (remaining !== null) return 1; // Récupération
    return 0; // Connexion
}

function ScanStepIndicator({
    inspected,
    remaining,
    passes,
    progress,
}: {
    inspected: number;
    remaining: number | null;
    passes: number;
    progress: number | null;
}) {
    const currentStep = deriveCurrentStep(inspected, remaining, passes, progress);

    function getStatus(index: number): StepStatus {
        if (index < currentStep) return "done";
        if (index === currentStep) return "active";
        return "pending";
    }

    return (
        <div className="flex items-center gap-0 w-full">
            {SCAN_STEPS.map((step, i) => {
                const status = getStatus(i);
                const isInspection = step.key === "inspection";

                return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
                        {/* Step node */}
                        <div className={cn(
                            "flex items-center gap-1.5 shrink-0",
                            status === "done" && "text-success",
                            status === "active" && "text-primary",
                            status === "pending" && "text-white/25"
                        )}>
                            {/* Icon */}
                            <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                                status === "done" && "bg-success/20 border border-success/40",
                                status === "active" && "bg-primary/20 border border-primary/40 shadow-[0_0_8px_hsl(var(--primary) / 0.3)]",
                                status === "pending" && "bg-white/[0.04] border border-white/[0.08]"
                            )}>
                                {status === "done" && <Check className="w-3 h-3" />}
                                {status === "active" && <Loader2 className="w-3 h-3 animate-spin" />}
                                {status === "pending" && <Circle className="w-2 h-2" />}
                            </div>

                            {/* Label + mini progress */}
                            <div className="hidden sm:flex flex-col min-w-0">
                                <span className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-300",
                                    status === "done" && "text-success",
                                    status === "active" && "text-white",
                                    status === "pending" && "text-white/25"
                                )}>
                                    {step.label}
                                </span>
                                {isInspection && status === "active" && progress !== null && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="h-1 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${Math.min(progress, 94)}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] tabular-nums text-primary/70">{progress}%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {i < SCAN_STEPS.length - 1 && (
                            <div className={cn(
                                "flex-1 h-px mx-2 transition-colors duration-300",
                                i < currentStep
                                    ? "bg-success/40"
                                    : i === currentStep
                                        ? "bg-gradient-to-r from-primary/40 to-muted/30"
                                        : "bg-white/[0.06]"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function GscScanProgressBanner({
    running,
    done,
    error,
    isAuthError,
    inspected,
    remaining,
    passes,
    totalFromOverview,
    totalUrls,
    onStop,
    onDismiss,
    onReconnect,
}: GscScanProgressBannerProps) {
    if (!running && !done && !error) return null;

    const total = (totalFromOverview !== undefined && totalUrls !== undefined)
        ? totalUrls
        : (inspected + (remaining ?? 0));

    const progress = total > 0
        ? Math.min(100, Math.round((inspected / total) * 100))
        : null;

    // ── Auth error state (token révoqué) ─────────────────────────────────────
    if (error && isAuthError) {
        return (
            <div className="rounded-xl border border-warning/25 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-warning">Connexion Google expirée</p>
                        <p className="text-xs text-warning/70 mt-1">
                            Votre accès Google Search Console a expiré ou été révoqué. Reconnectez votre compte pour relancer l&apos;inspection.
                        </p>
                        {onReconnect && (
                            <button
                                onClick={onReconnect}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warning hover:text-warning transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Reconnecter Google Search Console
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-warning/60 hover:text-warning transition-colors text-lg leading-none shrink-0"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    // ── Generic error state ───────────────────────────────────────────────────
    if (error) {
        return (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-destructive">Inspection échouée</p>
                        <p className="text-xs text-destructive/70 mt-0.5 truncate">{error}</p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-destructive/60 hover:text-destructive transition-colors text-lg leading-none"
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
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-success">Inspection terminée</p>
                        <p className="text-xs text-success/70 mt-0.5">
                            {inspected} URL{inspected > 1 ? "s" : ""} inspectée{inspected > 1 ? "s" : ""} en {passes} passe{passes > 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-success/60 hover:text-success transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    // ── Running state ────────────────────────────────────────────────────────
    return (
        <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent overflow-hidden">
            {/* Animated top border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

            <div className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-3">
                    <RadarAnimation />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <PulsingDot className="text-primary" />
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
                        className="h-8 gap-1.5 text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-destructive/20 shrink-0"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Arrêter
                    </Button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-primary/50 font-medium mb-0.5">Inspectées</p>
                        <p className="text-base font-bold text-white tabular-nums">{inspected}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-primary/50 font-medium mb-0.5">Restantes</p>
                        <p className="text-base font-bold text-white tabular-nums">
                            {remaining !== null ? remaining : "…"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-primary/50 font-medium mb-0.5">Passes</p>
                        <p className="text-base font-bold text-white tabular-nums">{passes}</p>
                    </div>
                </div>

                {/* Segmented progress steps */}
                <ScanStepIndicator
                    inspected={inspected}
                    remaining={remaining}
                    passes={passes}
                    progress={progress}
                />
            </div>
        </div>
    );
}

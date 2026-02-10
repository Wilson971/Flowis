"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Store,
    RefreshCw,
    CheckCircle2,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";

type ConnectionHealthCardProps = {
    health: 'connected' | 'disconnected' | 'pending' | null;
    platform: string | null;
    storeName: string;
    lastVerified: number; // in hours
    /** Shop statistics - optional */
    productsCount?: number;
    lastSyncAt?: string | null;
    onTestConnection?: () => void;
    onViewStore?: () => void;
};

/**
 * StoreOverviewCard - Carte boutique connectée
 * 
 * Affiche le statut de connexion et les métriques clés de la boutique.
 * Suit le design system FLOWZ: dark premium + emerald accents.
 */
export const ConnectionHealthCard = ({
    health = 'disconnected',
    platform = 'Unknown',
    storeName,
    lastVerified,
    productsCount = 0,
    lastSyncAt,
    onTestConnection,
    onViewStore
}: ConnectionHealthCardProps) => {
    const [isTesting, setIsTesting] = useState(false);

    const isConnected = health === 'connected';
    const isPending = health === 'pending';
    const isDisconnected = health === 'disconnected' || health === null;

    const handleTestConnection = async () => {
        if (!onTestConnection || isTesting) return;
        setIsTesting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        onTestConnection();
        setIsTesting(false);
    };

    // Format last sync time
    const formatLastSync = (dateStr: string | null) => {
        if (!dateStr) return "Jamais";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
        return `Il y a ${Math.floor(diffMins / 1440)}j`;
    };

    // Platform display config
    const platformConfig: Record<string, { label: string; color: string }> = {
        shopify: { label: "Shopify", color: "text-[#96bf48]" },
        woocommerce: { label: "WooCommerce", color: "text-[#9b5c8f]" },
        custom: { label: "Custom", color: "text-muted-foreground" }
    };

    const currentPlatform = platformConfig[platform?.toLowerCase() || 'custom'] || platformConfig.custom;

    return (
        <div className="flex flex-col h-full p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                            <Store className="h-5 w-5" />
                        </div>
                        {/* Status dot */}
                        <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                            isConnected ? "bg-primary" :
                                isPending ? "bg-signal-warning" :
                                    "bg-destructive"
                        )}>
                            {isConnected && (
                                <motion.span
                                    className="absolute inset-0 rounded-full bg-primary"
                                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </span>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                            {currentPlatform.label}
                        </p>
                        <h3 className="text-xl font-bold tracking-tight text-foreground truncate max-w-[140px]" title={storeName}>
                            {storeName}
                        </h3>
                    </div>
                </div>

                {/* External link to store */}
                {onViewStore && (
                    <button
                        onClick={onViewStore}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-1"
                        title="Voir la boutique"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 flex-1">
                {/* Products count */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide">Produits</span>
                    </div>
                    <p className="text-lg font-bold font-heading tabular-nums text-foreground">
                        {productsCount.toLocaleString('fr-FR')}
                    </p>
                </div>

                {/* Last sync */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide">Sync</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                        {formatLastSync(lastSyncAt || null)}
                    </p>
                </div>
            </div>

            {/* Footer - Connection status & action */}
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                {/* Status text */}
                <div className="flex items-center gap-1.5">
                    {isConnected ? (
                        <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-primary font-medium">Connecté</span>
                        </>
                    ) : isPending ? (
                        <>
                            <AlertCircle className="h-3.5 w-3.5 text-signal-warning" />
                            <span className="text-xs text-signal-warning font-medium">Instable</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-xs text-destructive font-medium">Déconnecté</span>
                        </>
                    )}
                </div>

                {/* Sync button */}
                {onTestConnection && (
                    <button
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            "text-muted-foreground hover:text-primary hover:bg-primary/5",
                            isTesting && "text-primary pointer-events-none"
                        )}
                    >
                        <RefreshCw className={cn("h-3 w-3", isTesting && "animate-spin")} />
                        {isTesting ? "Sync..." : "Synchroniser"}
                    </button>
                )}
            </div>
        </div>
    );
};

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";
import { PlatformLogo, PlatformType } from "../icons/PlatformLogo";

type ConnectionHealthCardProps = {
  health: "connected" | "disconnected" | "pending" | null;
  platform: string | null;
  storeName: string;
  lastVerified: number;
  productsCount?: number;
  lastSyncAt?: string | null;
  onTestConnection?: () => void;
  onViewStore?: () => void;
};

/**
 * ConnectionHealthCard - Premium store connection status
 *
 * Shows store health with animated status indicator,
 * metric tiles, and sync controls.
 */
export const ConnectionHealthCard = ({
  health = "disconnected",
  platform = "Unknown",
  storeName,
  productsCount = 0,
  lastSyncAt,
  onTestConnection,
}: ConnectionHealthCardProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const isConnected = health === "connected";
  const isPending = health === "pending";

  const handleTestConnection = async () => {
    if (!onTestConnection || isTesting) return;
    setIsTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onTestConnection();
    setIsTesting(false);
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
  };

  const statusConfig = isConnected
    ? { label: "Connecté", color: "text-primary", bg: "bg-primary", icon: CheckCircle2 }
    : isPending
      ? { label: "Instable", color: "text-signal-warning", bg: "bg-signal-warning", icon: AlertCircle }
      : { label: "Déconnecté", color: "text-destructive", bg: "bg-destructive", icon: AlertCircle };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
              {platform ? (
                <PlatformLogo platform={platform as PlatformType} size={20} />
              ) : (
                <Store className="h-5 w-5" />
              )}
            </div>
            {/* Animated status dot */}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                statusConfig.bg
              )}
            >
              {isConnected && (
                <motion.span
                  className={cn("absolute inset-0 rounded-full", statusConfig.bg)}
                  animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}
            </span>
          </div>

          <div>
            <p className={cn(styles.text.labelSmall, "mb-0.5")}>
              {platform?.charAt(0).toUpperCase()}{platform?.slice(1) || "Boutique"}
            </p>
            <h3 className={cn(styles.text.h4, "truncate max-w-[140px]")} title={storeName}>
              {storeName}
            </h3>
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <Package className="h-3 w-3" />
            <span className={styles.text.labelSmall}>Produits</span>
          </div>
          <AnimatedCounter
            value={productsCount}
            delay={0.4}
            className="text-xl text-foreground"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <Clock className="h-3 w-3" />
            <span className={styles.text.labelSmall}>Sync</span>
          </div>
          <motion.p
            className="text-sm font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {formatLastSync(lastSyncAt || null)}
          </motion.p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
        <div className={cn("flex items-center gap-1.5", statusConfig.color)}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">{statusConfig.label}</span>
        </div>

        {onTestConnection && (
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200",
              "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20",
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

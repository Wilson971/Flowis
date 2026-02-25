"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, WifiOff, X, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

type AlertLevel = "critical" | "warning" | "info";

type AlertBannerProps = {
  connectionLost?: boolean;
  syncFailures?: number;
  quotaExceeded?: boolean;
  lastSyncDaysAgo?: number;
  storeName?: string;
  onReconnect?: () => void;
  onRetrySync?: () => void;
};

export function AlertBanner({
  connectionLost = false,
  syncFailures = 0,
  quotaExceeded = false,
  lastSyncDaysAgo = 0,
  storeName = "votre boutique",
  onReconnect,
  onRetrySync,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Determine alerts to show (priority order)
  const alerts: Array<{
    id: string;
    level: AlertLevel;
    icon: React.ElementType;
    message: string;
    cta: string;
    onAction?: () => void;
  }> = [];

  if (connectionLost && !dismissed.has("connection")) {
    alerts.push({
      id: "connection",
      level: "critical",
      icon: WifiOff,
      message: `${storeName} est déconnectée${lastSyncDaysAgo > 0 ? ` depuis ${lastSyncDaysAgo} jours` : ""}. Les synchronisations sont en pause.`,
      cta: "Reconnecter maintenant",
      onAction: onReconnect,
    });
  }

  if (syncFailures >= 3 && !dismissed.has("sync")) {
    alerts.push({
      id: "sync",
      level: "warning",
      icon: RefreshCw,
      message: `${syncFailures} synchronisations consécutives ont échoué. Vérifiez votre connexion.`,
      cta: "Réessayer",
      onAction: onRetrySync,
    });
  }

  if (quotaExceeded && !dismissed.has("quota")) {
    alerts.push({
      id: "quota",
      level: "warning",
      icon: AlertCircle,
      message: "Votre quota de génération IA est atteint. Passez au plan supérieur pour continuer.",
      cta: "Voir les plans",
    });
  }

  if (alerts.length === 0) return null;

  const getLevelStyles = (level: AlertLevel) => {
    switch (level) {
      case "critical":
        return {
          bg: "bg-destructive/10 border-destructive/20",
          text: "text-destructive",
          iconBg: "bg-destructive/15",
          btnVariant: "destructive" as const,
        };
      case "warning":
        return {
          bg: "bg-signal-warning/10 border-signal-warning/20",
          text: "text-signal-warning",
          iconBg: "bg-signal-warning/15",
          btnVariant: "outline" as const,
        };
      default:
        return {
          bg: "bg-info/10 border-info/20",
          text: "text-info",
          iconBg: "bg-info/15",
          btnVariant: "outline" as const,
        };
    }
  };

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const levelStyles = getLevelStyles(alert.level);
          const Icon = alert.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={motionTokens.transitions.default}
              className={cn(
                "rounded-xl border p-4 flex items-center gap-3",
                levelStyles.bg
              )}
            >
              {/* Animated icon */}
              <motion.div
                className={cn(
                  "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                  levelStyles.iconBg,
                  levelStyles.text
                )}
                animate={
                  alert.level === "critical"
                    ? { scale: [1, 1.1, 1] }
                    : undefined
                }
                transition={
                  alert.level === "critical"
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              >
                <Icon className="h-4.5 w-4.5" />
              </motion.div>

              {/* Message */}
              <p className={cn("flex-1 text-sm font-medium", levelStyles.text)}>
                {alert.message}
              </p>

              {/* CTA */}
              <Button
                size="sm"
                variant={levelStyles.btnVariant}
                className="shrink-0 gap-1.5 text-xs font-semibold"
                onClick={alert.onAction}
              >
                {alert.cta}
                <ArrowRight className="h-3 w-3" />
              </Button>

              {/* Dismiss */}
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
                className={cn(
                  "shrink-0 p-1 rounded-lg transition-colors",
                  "hover:bg-foreground/5",
                  levelStyles.text
                )}
                aria-label="Fermer l'alerte"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

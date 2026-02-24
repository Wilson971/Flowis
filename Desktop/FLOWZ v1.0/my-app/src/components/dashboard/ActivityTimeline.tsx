"use client";

import { motion } from "framer-motion";
import { ScrollArea } from "../ui/scroll-area";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";

export type ActivityItem = {
  id: string;
  type: "sync" | "error" | "success" | "info";
  title: string;
  description: string;
  timestamp: string;
};

type ActivityTimelineProps = {
  activities: ActivityItem[];
  className?: string;
};

/**
 * ActivityTimeline - Premium activity feed
 *
 * Features: color-coded timeline dots, staggered item entry,
 * refined visual treatment, better empty state.
 */
export const ActivityTimeline = ({
  activities,
  className,
}: ActivityTimelineProps) => {
  const getTypeConfig = (type: ActivityItem["type"]) => {
    switch (type) {
      case "sync":
        return {
          icon: <RefreshCw className="h-3.5 w-3.5" />,
          dotClass: "bg-info border-info/30",
          textClass: "text-info",
          bgClass: "bg-info/10",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          dotClass: "bg-primary border-primary/30",
          textClass: "text-primary",
          bgClass: "bg-primary/10",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          dotClass: "bg-destructive border-destructive/30",
          textClass: "text-destructive",
          bgClass: "bg-destructive/10",
        };
      default:
        return {
          icon: <Activity className="h-3.5 w-3.5" />,
          dotClass: "bg-muted-foreground/40 border-muted-foreground/20",
          textClass: "text-muted-foreground",
          bgClass: "bg-muted/50",
        };
    }
  };

  return (
    <div className={cn("h-full flex flex-col p-4 group", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className={styles.text.labelSmall}>
              Historique
            </p>
            <h3 className={styles.text.h4}>
              Activité Récente
            </h3>
          </div>
        </div>

        {activities.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/50 tabular-nums">
            {activities.length}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full pr-4 -mr-4">
          {activities.length === 0 ? (
            /* Empty state */
            <motion.div
              className="flex flex-col items-center justify-center py-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4 border border-border/50">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Aucune activité
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Les actions de synchronisation et de génération apparaîtront ici.
              </p>
            </motion.div>
          ) : (
            <div className="relative pl-6 space-y-1">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

              {activities.map((item, index) => {
                const config = getTypeConfig(item.type);

                return (
                  <motion.div
                    key={item.id}
                    className="relative group/item"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: motionTokens.durations.normal,
                      delay: 0.3 + index * motionTokens.staggerDelays.fast,
                      ease: motionTokens.easings.smooth,
                    }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-[-17px] top-3 w-2.5 h-2.5 rounded-full border-2 border-card shadow-sm transition-transform duration-200",
                        "group-hover/item:scale-125",
                        config.dotClass
                      )}
                    />

                    {/* Content */}
                    <div
                      className={cn(
                        "p-2 rounded-xl border border-transparent transition-all duration-200",
                        "hover:bg-muted/30 hover:border-border/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-foreground leading-none block mb-1">
                            {item.title}
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Timestamp badge */}
                        <div
                          className={cn(
                            "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border",
                            config.bgClass,
                            config.textClass,
                            "border-transparent"
                          )}
                        >
                          {config.icon}
                          <span className="tracking-wide">{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

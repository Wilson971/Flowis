"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";

export type StudioStatCardProps = {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  badge?: { label: string; variant: "warning" | "info" | "success" };
  subText?: string;
  total?: number;
};

export function StudioStatCard({
  title,
  value,
  icon: Icon,
  isLoading = false,
  badge,
  subText,
  total,
}: StudioStatCardProps) {
  const animatedValue = useCounterAnimation(value, { duration: 1200 });

  if (isLoading) {
    return (
      <Card className="h-full border border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="group h-full">
      <Card className="relative overflow-hidden bg-card/95 backdrop-blur-sm text-card-foreground border border-border/50 h-full hover:border-border hover:shadow-glow-sm hover:shadow-primary/5 transition-all duration-500">
        {/* Gradient accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-violet-500/[0.02] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
        <CardContent className="p-6 flex flex-col justify-center h-full relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 border border-border/50">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col w-full min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                  Statistique
                </p>
                {badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 border uppercase tracking-wider",
                      badge.variant === "warning" &&
                      "text-warning bg-warning/10 border-warning/20",
                      badge.variant === "info" &&
                      "text-info bg-info/10 border-info/20",
                      badge.variant === "success" &&
                      "text-success bg-success/10 border-success/20"
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground truncate mb-1">
                {title}
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {animatedValue}
                </span>
                {total !== undefined && (
                  <span className="text-sm text-muted-foreground font-medium">
                    / {total}
                  </span>
                )}
              </div>
              {subText && (
                <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">
                  {subText}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

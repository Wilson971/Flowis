"use client";

import { cn } from "@/lib/utils";

export function GscPositionBadge({ position }: { position: number }) {
    const color = position <= 3
        ? "text-emerald-500"
        : position <= 10
            ? "text-green-500"
            : position <= 20
                ? "text-amber-500"
                : "text-muted-foreground";
    return <span className={cn("font-medium tabular-nums", color)}>{Math.round(position * 10) / 10}</span>;
}

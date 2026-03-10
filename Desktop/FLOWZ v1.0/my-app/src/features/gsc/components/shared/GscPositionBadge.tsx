"use client";

import { cn } from "@/lib/utils";

export function GscPositionBadge({ position }: { position: number }) {
    const color = position <= 3
        ? "text-success"
        : position <= 10
            ? "text-success"
            : position <= 20
                ? "text-warning"
                : "text-muted-foreground";
    return <span className={cn("font-medium tabular-nums", color)}>{Math.round(position * 10) / 10}</span>;
}

"use client";

import { cn } from "@/lib/utils";
import type { GscDateRange } from "@/lib/gsc/types";

interface GscDateRangePickerProps {
    value: GscDateRange;
    onChange: (v: GscDateRange) => void;
}

export function GscDateRangePicker({ value, onChange }: GscDateRangePickerProps) {
    const options: { label: string; value: GscDateRange }[] = [
        { label: "7 jours", value: "last_7_days" },
        { label: "28 jours", value: "last_28_days" },
    ];

    return (
        <div className="inline-flex items-center rounded-lg border border-border/40 p-0.5 text-xs">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "px-3 py-1 rounded-lg transition-colors font-medium",
                        value === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

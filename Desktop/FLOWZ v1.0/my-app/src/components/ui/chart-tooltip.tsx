import { cn } from "@/lib/utils";

/**
 * ChartTooltip Component
 *
 * A glass-style tooltip for use with recharts or custom chart components.
 * Provides consistent styling with backdrop-blur and border effects.
 *
 * @example
 * // With recharts
 * <Tooltip content={<ChartTooltip />} />
 *
 * // Custom usage
 * <ChartTooltip active payload={[{ name: "Ventes", value: 1234 }]} label="Jan 2026" />
 */

interface ChartTooltipPayload {
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipPayload[];
    label?: string;
    className?: string;
    /** Custom value formatter */
    formatValue?: (value: number | string) => string;
}

export const ChartTooltip = ({
    active,
    payload,
    label,
    className,
    formatValue,
}: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;

    return (
        <div
            className={cn(
                "bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl px-3 py-2 shadow-lg",
                className
            )}
        >
            {label && (
                <p className="text-xs font-medium text-foreground mb-1.5">
                    {label}
                </p>
            )}
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        {entry.color && (
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                        )}
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-semibold text-foreground ml-auto tabular-nums">
                            {formatValue && entry.value != null
                                ? formatValue(entry.value)
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

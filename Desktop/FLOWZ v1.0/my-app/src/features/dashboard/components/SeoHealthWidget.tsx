import {
    BarChart3,
    TrendingUp,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SeoHealthWidgetProps {
    score: number;
    analyzedCount: number;
    criticalCount: number;
    warningCount: number;
    goodCount: number;
    className?: string;
}

export function SeoHealthWidget({
    score,
    analyzedCount,
    criticalCount,
    warningCount,
    goodCount,
    className,
}: SeoHealthWidgetProps) {
    // Calculate percentages
    const total = criticalCount + warningCount + goodCount || 1;
    const criticalPercent = (criticalCount / total) * 100;
    const warningPercent = (warningCount / total) * 100;
    const goodPercent = (goodCount / total) * 100;

    return (
        <div className={cn("h-full flex flex-col", className)}>
            {/* Header */}
            <div className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-bold font-heading">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Santé SEO
                    </h3>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
                        score >= 80 ? "bg-signal-success/10 text-signal-success" :
                            score >= 50 ? "bg-signal-warning/10 text-signal-warning" :
                                "bg-destructive/10 text-destructive"
                    )}>
                        <TrendingUp className="h-3 w-3" />
                        {score}/100
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    {analyzedCount} produits analysés
                </p>
            </div>

            {/* Content */}
            <div className="px-3 pb-3 flex-1">
                {/* Visual Progress Bar */}
                <div className="h-2.5 w-full flex rounded-full overflow-hidden mb-3 bg-muted/50">
                    <div style={{ width: `${goodPercent}%` }} className="bg-signal-success transition-all duration-500" />
                    <div style={{ width: `${warningPercent}%` }} className="bg-signal-warning transition-all duration-500" />
                    <div style={{ width: `${criticalPercent}%` }} className="bg-destructive transition-all duration-500" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">
                            <div className="w-1.5 h-1.5 rounded-full bg-signal-success" />
                            OK
                        </div>
                        <p className="text-lg font-bold text-text-main leading-tight">{goodCount}</p>
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">
                            <div className="w-1.5 h-1.5 rounded-full bg-signal-warning" />
                            Warn
                        </div>
                        <p className="text-lg font-bold text-text-main leading-tight">{warningCount}</p>
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                            Crit
                        </div>
                        <p className="text-lg font-bold text-text-main leading-tight">{criticalCount}</p>
                    </div>
                </div>

                {criticalCount > 0 && (
                    <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-semibold text-destructive truncate">Attention requise</p>
                            <p className="text-[10px] text-destructive/80 leading-tight">
                                {criticalCount} produits majeurs
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

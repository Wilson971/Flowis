import { Clock, TrendingUp, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";

type TimeSavedCardProps = {
    hoursSaved: number;
    onViewReport?: () => void;
};

export const TimeSavedCard = ({
    hoursSaved,
    onViewReport
}: TimeSavedCardProps) => {
    // Mock comparison
    const percentIncrease = 12;

    return (
        <div className="h-full group">
            {/* Note: The parent wrapper controls the card background/border now to match others, 
                 but we ensure internal structure matches the 'ProductStatsCards' pattern */}
            <div className="p-5 h-full flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                Productivité
                            </p>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">Temps Économisé</h3>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5">
                                <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                                    {hoursSaved}
                                </h3>
                                <span className="text-xs text-muted-foreground font-medium">heures</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                <TrendingUp className="h-3 w-3" />
                                +{percentIncrease}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground leading-tight">
                        Env. <span className="font-semibold text-foreground">{Math.round(hoursSaved / 7)} jours</span> de travail
                    </p>
                    {onViewReport && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:text-primary/80 text-xs font-semibold" onClick={onViewReport}>
                            Voir détails
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

import {
    ShoppingBag,
    Store,
    Activity,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface DashboardStats {
    totalProducts: number;
    activeStores: number;
    syncRate: number;
    pendingErrors: number;
}

interface StatsOverviewProps {
    stats?: DashboardStats;
    isLoading?: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/40" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: "Produits Totaux",
            value: stats?.totalProducts || 0,
            icon: ShoppingBag,
            color: "text-primary",
            bgFrom: "from-primary/10",
            bgTo: "to-primary/5",
        },
        {
            label: "Boutiques Actives",
            value: stats?.activeStores || 0,
            icon: Store,
            color: "text-secondary-foreground",
            bgFrom: "from-secondary/20",
            bgTo: "to-secondary/5",
        },
        {
            label: "Taux de Synchro",
            value: `${stats?.syncRate || 0}%`,
            icon: Activity,
            color: "text-signal-success",
            bgFrom: "from-signal-success/10",
            bgTo: "to-signal-success/5",
        },
        {
            label: "Erreurs",
            value: stats?.pendingErrors || 0,
            icon: AlertTriangle,
            color: "text-destructive",
            bgFrom: "from-destructive/10",
            bgTo: "to-destructive/5",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:scale-[1.02] hover:shadow-lg hover:border-white/40"
                >
                    <div
                        className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-70",
                            card.bgFrom,
                            card.bgTo
                        )}
                    />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-muted">{card.label}</p>
                            <h4 className={cn("mt-2 text-3xl font-bold tracking-tight font-heading", card.color)}>
                                {card.value}
                            </h4>
                        </div>
                        <div
                            className={cn(
                                "rounded-xl p-3 bg-white/60 shadow-sm ring-1 ring-inset ring-black/5 transition-transform group-hover:rotate-12",
                            )}
                        >
                            <card.icon className={cn("h-6 w-6", card.color)} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
    title?: string;
    description?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastUpdated?: string;
    className?: string;
}

export function DashboardHeader({
    title = "Tableau de Bord",
    description = "Vue d'ensemble de votre activité et synchronisation",
    onRefresh,
    isRefreshing,
    lastUpdated,
    className,
}: DashboardHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col md:flex-row md:items-center justify-between gap-4 glassmorphism p-6 rounded-2xl relative overflow-hidden",
                className
            )}
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/50 rounded-xl shadow-sm border border-white/40">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-heading">
                        {title}
                    </h1>
                    <p className="text-text-muted">{description}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                {lastUpdated && (
                    <span className="text-xs text-text-muted hidden md:inline-block">
                        Mis à jour : {lastUpdated}
                    </span>
                )}
                <Button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="bg-white/50 hover:bg-white/80 border-primary/20 hover:border-primary/40 text-primary transition-all duration-300 hover:shadow-md"
                >
                    <RefreshCw
                        className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                    />
                    Actualiser
                </Button>
            </div>
        </div>
    );
}

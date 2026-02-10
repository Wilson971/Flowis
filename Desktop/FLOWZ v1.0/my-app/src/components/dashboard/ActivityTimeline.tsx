import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Activity, Circle, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

export type ActivityItem = {
    id: string;
    type: 'sync' | 'error' | 'success' | 'info';
    title: string;
    description: string;
    timestamp: string;
};

type ActivityTimelineProps = {
    activities: ActivityItem[];
    className?: string;
};

export const ActivityTimeline = ({
    activities,
    className
}: ActivityTimelineProps) => {
    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'sync': return <RefreshCw className="h-4 w-4 text-info animate-spin-slow" />;
            case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
            default: return <Activity className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <div className={cn("h-full flex flex-col p-5 group", className)}>
            <div className="pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                            Historique
                        </p>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Activité Récente</h3>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-[350px] pr-4 -mr-4">
                    <div className="relative pl-2 space-y-6 before:absolute before:inset-0 before:ml-2 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-border before:to-transparent">
                        {activities.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                Aucune activité récente à afficher
                            </div>
                        ) : (
                            activities.map((item) => (
                                <div key={item.id} className="relative pl-6 group/item">
                                    <div className={cn(
                                        "absolute left-0 top-1.5 -ml-[5px] h-3 w-3 rounded-full border-2 border-background shadow-sm transition-transform group-hover/item:scale-110",
                                        item.type === 'error' ? "bg-destructive" :
                                            item.type === 'sync' ? "bg-info" :
                                                item.type === 'success' ? "bg-primary" : "bg-muted-foreground/30"
                                    )} />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-sm font-semibold text-foreground leading-none mt-1">{item.title}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground whitespace-nowrap bg-muted/50 px-1.5 py-0.5 rounded border border-border">
                                                {getIcon(item.type)}
                                                <span className="tracking-wide">{item.timestamp}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

/**
 * ActivityFeed - Widget flux d'activité
 */
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Info,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityItem } from '@/hooks/analytics/useRecentActivity';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityFeedProps {
    activities?: ActivityItem[];
    isLoading: boolean;
}

const icons = {
    sync: RefreshCw,
    product_update: Info,
    error: AlertCircle,
    generation: Sparkles,
};

const statusColors = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    info: 'text-blue-500',
};

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                    Derniers événements sur votre compte
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-3 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activities && activities.length > 0 ? (
                        <div className="space-y-6">
                            {activities.map((item) => {
                                const Icon = icons[item.type] || Info;
                                return (
                                    <div key={item.id} className="flex items-start gap-4 group">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full bg-muted transition-colors group-hover:bg-muted/80",
                                            statusColors[item.status]
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium leading-none">
                                                    {item.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {item.timeAgo}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Info className="h-10 w-10 mb-2 opacity-20" />
                            <p>Aucune activité récente</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

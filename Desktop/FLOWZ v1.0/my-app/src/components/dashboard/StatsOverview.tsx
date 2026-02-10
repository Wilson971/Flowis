/**
 * StatsOverview - Widget d'aperçu des statistiques clés
 */
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Store,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/hooks/analytics/useDashboardStats';

interface StatsOverviewProps {
    stats?: DashboardStats;
    isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted rounded mb-1" />
                            <div className="h-3 w-32 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const cards = [
        {
            title: 'Produits Totaux',
            value: stats.totalProducts,
            description: `${stats.syncedProducts} synchronisés`,
            icon: Package,
            trend: '+2.5%', // Mock trend for now
            trendUp: true,
        },
        {
            title: 'Boutiques Actives',
            value: `${stats.activeStores}/${stats.totalStores}`,
            description: 'Connectées',
            icon: Store,
            trend: 'Stable',
            trendUp: true,
        },
        {
            title: 'Taux de Succès Sync',
            value: stats.totalJobs > 0
                ? `${Math.round(((stats.totalJobs - stats.failedJobs) / stats.totalJobs) * 100)}%`
                : '100%',
            description: `${stats.failedJobs} échecs récents`,
            icon: CheckCircle2,
            trend: '-1.2%',
            trendUp: false,
        },
        {
            title: 'Erreurs Critiques',
            value: stats.errorProducts,
            description: 'Produits en erreur',
            icon: AlertCircle,
            trend: stats.errorProducts > 0 ? '+1' : '0',
            trendUp: false,
            alert: stats.errorProducts > 0,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 text-muted-foreground ${card.alert ? 'text-red-500' : ''}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

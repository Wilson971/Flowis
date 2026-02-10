/**
 * StoreCard - Carte de boutique avec statut, stats et actions
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    RefreshCw,
    CheckCircle2,
    Edit,
    Trash2,
    Eye,
    Copy,
    ExternalLink,
    Sparkles,
    AlertCircle,
    Check,
    X,
    ImageIcon,
    Settings,
    Clock,
    Package,
    FolderTree,
    Globe,
    Zap,
    Unplug,
    Link2,
    TestTube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Store, ConnectionHealth } from '@/types/store';

// ============================================================================
// TYPES
// ============================================================================

type StoreStatus = 'connected' | 'error' | 'syncing' | 'disconnected';

interface StoreCardProps {
    store: Store;
    stats?: {
        products?: number;
        categories?: number;
        articles?: number;
    };
    isLoadingStats?: boolean;
    isSyncing?: boolean;
    connectionHealth?: ConnectionHealth;
    onSync?: (storeId: string) => void;
    onTest?: (storeId: string) => void;
    onEdit?: (storeId: string) => void;
    onDisconnect?: (store: Store) => void;
    onReconnect?: (storeId: string) => void;
    onDelete?: (store: Store) => void;
    onCancelDeletion?: (storeId: string) => void;
    onToggleActive?: (storeId: string, active: boolean) => void;
}

// ============================================================================
// CONFIG
// ============================================================================

const statusConfig = {
    connected: {
        label: 'Connecté',
        color: 'text-success',
        bg: 'bg-success/10',
        dot: 'var(--success)',
    },
    error: {
        label: 'Erreur',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        dot: 'var(--destructive)',
    },
    syncing: {
        label: 'Synchronisation...',
        color: 'text-info',
        bg: 'bg-info/10',
        dot: 'var(--info)',
    },
    disconnected: {
        label: 'Déconnecté',
        color: 'text-muted-foreground',
        bg: 'bg-muted/10',
        dot: 'var(--muted-foreground)',
    },
};

// ============================================================================
// HELPERS
// ============================================================================

function StatItem({
    icon: Icon,
    label,
    value,
    isLoading,
}: {
    icon: React.ElementType;
    label: string;
    value: number | undefined;
    isLoading: boolean;
}) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 border border-border group/stat hover:bg-muted transition-colors">
            {isLoading ? (
                <div className="flex flex-col items-center gap-2 w-full">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground group-hover/stat:text-primary transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
                    </div>
                    <span className="text-xl font-bold tabular-nums text-foreground">
                        {value?.toLocaleString() ?? 0}
                    </span>
                </>
            )}
        </div>
    );
}

function getPlatformIcon(platform: string) {
    // Simple text fallback, can be replaced with actual icons
    const platformNames: Record<string, string> = {
        woocommerce: 'WC',
        shopify: 'SH',
    };
    return platformNames[platform] || platform.substring(0, 2).toUpperCase();
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StoreCard({
    store,
    stats = {},
    isLoadingStats = false,
    isSyncing = false,
    connectionHealth = 'unknown',
    onSync,
    onTest,
    onEdit,
    onDisconnect,
    onReconnect,
    onDelete,
    onCancelDeletion,
    onToggleActive,
}: StoreCardProps) {
    // Determine status
    const isDisconnected = store.status === 'disconnected' || !store.active;
    const isDeletionScheduled = store.status === 'pending_deletion';

    const status: StoreStatus = isSyncing
        ? 'syncing'
        : isDisconnected
            ? 'disconnected'
            : store.connection_id
                ? 'connected'
                : 'error';

    const config = statusConfig[status];

    // Get shop URL
    const shopUrl =
        store.platform_connections?.shop_url ||
        (store.platform_connections?.credentials_encrypted as Record<string, string>)?.shop_url ||
        '';
    const displayUrl = shopUrl ? shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';

    // Format last sync
    const lastSyncAt = store.platform_connections?.last_sync_at || store.last_synced_at;
    const lastSyncFormatted = lastSyncAt
        ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true, locale: fr })
        : 'Jamais';

    const indicatorColor = isSyncing ? 'var(--info)' : status === 'connected' ? 'var(--success)' : 'var(--destructive)';

    return (
        <Card
            className={cn(
                'group relative w-full rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-500 card-metal-accent overflow-hidden',
                !store.active && 'opacity-60 grayscale-[0.5]'
            )}
        >
            <CardContent className="p-6 flex flex-col gap-6">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {/* Platform Logo Circle */}
                        <div className="relative">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border shadow-inner text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                {getPlatformIcon(store.platform)}
                            </div>
                            {/* Status Indicator Dot */}
                            <div
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card transition-all duration-300 group-hover:scale-110"
                                style={{ backgroundColor: indicatorColor, boxShadow: `0 0 12px ${indicatorColor}66` }}
                            >
                                {isSyncing && (
                                    <div className="absolute inset-0 rounded-full border border-white/30 animate-ping" />
                                )}
                            </div>
                        </div>

                        {/* Title and URL */}
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground leading-tight">
                                {store.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]">
                                    <Globe className="w-3 h-3" />
                                    {displayUrl || 'no-url.com'}
                                </span>
                                {status === 'connected' && !isDeletionScheduled && (
                                    <Badge
                                        variant="outline"
                                        className="h-5 px-1.5 py-0 text-[10px] font-bold gap-1 bg-success/10 text-success border-success/20"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-current" />
                                        OK
                                    </Badge>
                                )}
                                {isDeletionScheduled && (
                                    <Badge variant="destructive" className="h-5 px-1.5 py-0 text-[10px] font-bold">
                                        Suppression planifiée
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Options Boutique</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(store.id)}>
                                    <Settings className="h-4 w-4 mr-2 opacity-70" />
                                    Paramètres
                                </DropdownMenuItem>
                            )}

                            {onTest && (
                                <DropdownMenuItem onClick={() => onTest(store.id)}>
                                    <TestTube className="h-4 w-4 mr-2 opacity-70" />
                                    Tester la connexion
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {isDisconnected && onReconnect ? (
                                <DropdownMenuItem onClick={() => onReconnect(store.id)}>
                                    <Link2 className="h-4 w-4 mr-2 opacity-70" />
                                    Reconnecter
                                </DropdownMenuItem>
                            ) : (
                                onDisconnect && (
                                    <DropdownMenuItem onClick={() => onDisconnect(store)}>
                                        <Unplug className="h-4 w-4 mr-2 opacity-70" />
                                        Déconnecter
                                    </DropdownMenuItem>
                                )
                            )}

                            <DropdownMenuSeparator />

                            {isDeletionScheduled && onCancelDeletion ? (
                                <DropdownMenuItem
                                    onClick={() => onCancelDeletion(store.id)}
                                    className="text-success font-medium"
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Annuler la suppression
                                </DropdownMenuItem>
                            ) : (
                                onDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(store)}
                                        className="text-destructive font-bold"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer la boutique
                                    </DropdownMenuItem>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Stats Row */}
                <div className="flex gap-3">
                    <StatItem icon={Package} label="Produits" value={stats.products} isLoading={isLoadingStats} />
                    <StatItem icon={FolderTree} label="Catégories" value={stats.categories} isLoading={isLoadingStats} />
                </div>

                {/* Sync Status Row */}
                <div className="flex items-center justify-between py-2 border-y border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Dernière sync</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{lastSyncFormatted}</span>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={store.active}
                            onCheckedChange={(checked) => onToggleActive?.(store.id, checked)}
                            disabled={isDeletionScheduled}
                        />
                        <span className="text-xs font-bold text-muted-foreground">Boutique Active</span>
                    </div>

                    <Button
                        size="sm"
                        className={cn(
                            'h-9 px-4 font-bold transition-all gap-2 rounded-xl',
                            isSyncing
                                ? 'bg-info hover:bg-info/90 text-info-foreground'
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        )}
                        disabled={!store.active || isDisconnected || isDeletionScheduled}
                        onClick={() => onSync?.(store.id)}
                    >
                        {isSyncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4" />
                        )}
                        {isSyncing ? 'En cours...' : 'Synchroniser'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

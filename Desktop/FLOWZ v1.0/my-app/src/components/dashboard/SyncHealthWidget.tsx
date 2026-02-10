/**
 * SyncHealthWidget - Widget d'état de santé des connexions
 */
import Link from 'next/link';
import {
    Link as LinkIcon,
    Wifi,
    WifiOff,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Store } from '@/types/store';
import { cn } from '@/lib/utils';

interface SyncHealthWidgetProps {
    stores?: Store[];
    isLoading: boolean;
}

export function SyncHealthWidget({ stores, isLoading }: SyncHealthWidgetProps) {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Santé des Connexions</CardTitle>
                    <CardDescription>
                        Statut de vos boutiques connectées
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/app/stores">
                        Gérer <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stores && stores.length > 0 ? (
                    <div className="space-y-3">
                        {stores.map((store) => {
                            const isHealthy = store.platform_connections?.connection_health === 'healthy';
                            const isSyncing = false; // store.sync_status not available in current Store type

                            return (
                                <div
                                    key={store.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={store.avatar_url || ''} />
                                            <AvatarFallback>{store.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{store.name}</p>
                                                <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                    {store.platform}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <LinkIcon className="h-3 w-3" />
                                                <a href={store.platform_connections?.shop_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[150px]">
                                                    {store.platform_connections?.shop_url?.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                                            isHealthy ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                        )}>
                                            {isHealthy ? (
                                                <>
                                                    <Wifi className="h-3 w-3" /> Connecté
                                                </>
                                            ) : (
                                                <>
                                                    <WifiOff className="h-3 w-3" /> Déconnecté
                                                </>
                                            )}
                                        </div>
                                        {store.last_synced_at && (
                                            <span className="text-[10px] text-muted-foreground">
                                                Sync: {new Date(store.last_synced_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-lg border-dashed">
                        <AlertTriangle className="h-10 w-10 mb-2 opacity-20" />
                        <p>Aucune boutique connectée</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/app/onboarding">Connecter une boutique</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

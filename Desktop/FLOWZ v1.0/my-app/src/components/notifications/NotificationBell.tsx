/**
 * NotificationBell - Composant dropdown pour les notifications
 */
import React from 'react';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertCircle, XCircle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg header-btn">
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
            </Button>
        );
    }

    const getIcon = (type: string, size = "h-3.5 w-3.5") => {
        switch (type) {
            case 'success': return <CheckCircle2 className={cn(size, "text-success")} />;
            case 'warning': return <AlertCircle className={cn(size, "text-warning")} />;
            case 'error': return <XCircle className={cn(size, "text-destructive")} />;
            default: return <Info className={cn(size, "text-info")} />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg header-btn transition-all">
                    <Bell className={cn("h-[18px] w-[18px] transition-colors", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 border-border/40 shadow-2xl rounded-xl overflow-hidden backdrop-blur-xl bg-popover/95" align="end">
                <div className="flex items-center justify-between px-3 py-2.5 header-metal">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Notifications</h4>
                        {unreadCount > 0 && (
                            <div className="bg-primary/20 text-primary text-[9px] px-1.5 py-0 rounded-full font-bold border border-primary/30">
                                {unreadCount}
                            </div>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-6 px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Tout lire
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-72">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center bg-muted/5">
                            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                <Bell className="h-5 w-5 opacity-40" />
                            </div>
                            <h5 className="font-semibold text-[11px] text-foreground mb-1">Silence radio</h5>
                            <p className="text-[10px] max-w-[140px] opacity-60">Aucune notification pour le moment.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "relative flex gap-3 p-3 border-b border-border/20 last:border-0 hover:bg-muted/40 transition-all cursor-pointer group",
                                        !notif.read_at && "bg-primary/[0.02]"
                                    )}
                                    onClick={() => !notif.read_at && markAsRead.mutate(notif.id)}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        <div className={cn(
                                            "w-7 h-7 rounded flex items-center justify-center border border-border/30",
                                            !notif.read_at ? "bg-background shadow-sm" : "bg-muted/10"
                                        )}>
                                            {getIcon(notif.type)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1.5">
                                            <p className={cn(
                                                "text-[12px] font-bold leading-tight truncate pr-2",
                                                !notif.read_at ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[9px] text-muted-foreground/60 whitespace-nowrap mt-0.5">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                                            </span>
                                        </div>
                                        {notif.message && (
                                            <p className={cn(
                                                "text-[10px] leading-tight line-clamp-1",
                                                !notif.read_at ? "text-muted-foreground" : "text-muted-foreground/40"
                                            )}>
                                                {notif.message}
                                            </p>
                                        )}
                                    </div>

                                    {!notif.read_at && (
                                        <div className="absolute top-1/2 -translate-y-1/2 right-2">
                                            <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-3 bg-muted/10 border-t border-border/30 text-center">
                        <Button variant="ghost" className="text-[11px] h-7 w-full text-muted-foreground hover:text-foreground">
                            Voir toutes les notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

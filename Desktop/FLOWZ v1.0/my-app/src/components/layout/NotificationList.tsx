'use client';

import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NotificationItem } from './NotificationItem';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
}

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

type DateGroup = 'Aujourd\'hui' | 'Hier' | 'Cette semaine' | 'Plus ancien';

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'Aujourd\'hui';
  if (date >= yesterday) return 'Hier';
  if (date >= weekAgo) return 'Cette semaine';
  return 'Plus ancien';
}

const GROUP_ORDER: DateGroup[] = ['Aujourd\'hui', 'Hier', 'Cette semaine', 'Plus ancien'];

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) {
  const grouped = useMemo(() => {
    const groups = new Map<DateGroup, Notification[]>();
    for (const n of notifications) {
      const group = getDateGroup(n.created_at);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(n);
    }
    return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
      label: g,
      items: groups.get(g)!,
    }));
  }, [notifications]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex w-[360px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs text-muted-foreground"
            onClick={onMarkAllAsRead}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-4 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-8 w-8" />
            <span className="text-sm">Aucune notification</span>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="px-4 pb-1 pt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {group.label}
                  </span>
                </div>
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

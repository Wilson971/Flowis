'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  sync: RefreshCw,
  ai: Sparkles,
  error: AlertTriangle,
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();
  const Icon = typeIcons[notification.type] ?? Bell;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
        'hover:bg-muted/50',
        !notification.read && 'bg-muted/30'
      )}
    >
      {/* Unread dot */}
      <div className="flex shrink-0 items-center pt-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            notification.read ? 'bg-transparent' : 'bg-primary'
          )}
        />
      </div>

      {/* Icon */}
      <div className="flex shrink-0 items-center pt-0.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm', !notification.read && 'font-medium text-foreground')}>
          {notification.title}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {notification.message}
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
        </span>
      </div>
    </button>
  );
}

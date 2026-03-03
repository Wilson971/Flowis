'use client';

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { NotificationList } from './NotificationList';

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const displayCount = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={motionTokens.transitions.spring}
                className={cn(
                  'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center',
                  'rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground'
                )}
              >
                {displayCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0" sideOffset={8}>
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  );
}

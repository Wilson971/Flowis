'use client';

/**
 * PublicationCard - Publication scheduling sidebar card
 * Uses ArticleEditContext for state management
 *
 * Platform is implicit from the parent store - no need to display it
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, Calendar, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticleEditContext } from '../context';

export function PublicationCard() {
  const { articleSync, selectedPlatform } = useArticleEditContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const isScheduled = articleSync?.isScheduled || false;
  const scheduledAt = articleSync?.scheduledAt;

  // Platform comes from the store
  const storePlatform = selectedPlatform || 'woocommerce';

  const handleSchedule = async () => {
    if (!selectedDate || !articleSync) return;
    setIsScheduling(true);

    const [hours, minutes] = selectedTime.split(':');
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await articleSync.schedulePublish({
      mode: 'scheduled',
      scheduledAt: scheduledDateTime.toISOString(),
      platforms: [storePlatform],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifySubscribers: false,
      autoShareSocial: false,
    });

    setIsScheduling(false);
  };

  const handlePublishNow = async () => {
    if (!articleSync) return;
    setIsPublishing(true);

    await articleSync.publishNow([storePlatform]);

    setIsPublishing(false);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <Send className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Distribution
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              Publication
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-4">
        {/* Scheduled Info */}
        {isScheduled && scheduledAt && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-primary text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              Planifie pour le {format(new Date(scheduledAt), 'd MMMM a HH:mm', { locale: fr })}
            </div>
          </div>
        )}

        {/* Schedule Section */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Planifier la publication
          </Label>

          <div className="grid grid-cols-2 gap-2">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 text-xs justify-start font-normal bg-background/50 border-border/50"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  {selectedDate
                    ? format(selectedDate, 'd MMM', { locale: fr })
                    : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Time Picker */}
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
                <Clock className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <React.Fragment key={hour}>
                    <SelectItem value={`${hour.toString().padStart(2, '0')}:00`}>
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </SelectItem>
                    <SelectItem value={`${hour.toString().padStart(2, '0')}:30`}>
                      {`${hour.toString().padStart(2, '0')}:30`}
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || isScheduling}
            className="w-full h-9 text-xs font-bold"
            variant="secondary"
          >
            {isScheduling ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-3.5 w-3.5 mr-2" />
            )}
            Planifier
          </Button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Publish Now */}
        <Button
          onClick={handlePublishNow}
          disabled={isPublishing}
          className="w-full h-10 text-xs font-bold"
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Publier maintenant
        </Button>
      </CardContent>
    </Card>
  );
}

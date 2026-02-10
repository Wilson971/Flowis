'use client';

/**
 * PublishTab - Publication and synchronization tab
 */

import React, { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Globe,
  Rocket,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  User,
  Link,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

import type { ArticleForm, PublishPlatform, SyncStatus } from '@/schemas/article-editor';
import type { useArticleSync } from '@/hooks/blog/useArticleSync';
import { PLATFORM_LABELS, SYNC_STATUS_LABELS } from '@/schemas/article-editor';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PublishTabProps {
  form: UseFormReturn<ArticleForm>;
  articleId?: string;
  syncHook: ReturnType<typeof useArticleSync>;
}

// ============================================================================
// SYNC STATUS BADGE
// ============================================================================

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const variants: Record<SyncStatus, { color: string; icon: React.ReactNode }> = {
    draft: { color: 'bg-zinc-500/10 text-zinc-500', icon: null },
    pending: { color: 'bg-amber-500/10 text-amber-500', icon: <Clock className="h-3 w-3" /> },
    syncing: { color: 'bg-blue-500/10 text-blue-500', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    synced: { color: 'bg-emerald-500/10 text-emerald-500', icon: <Check className="h-3 w-3" /> },
    failed: { color: 'bg-red-500/10 text-red-500', icon: <X className="h-3 w-3" /> },
    partial: { color: 'bg-orange-500/10 text-orange-500', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const { color, icon } = variants[status];

  return (
    <Badge variant="secondary" className={cn('gap-1', color)}>
      {icon}
      {SYNC_STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================================
// PLATFORM ITEM
// ============================================================================

interface PlatformItemProps {
  platform: PublishPlatform;
  connected: boolean;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  syncStatus?: SyncStatus;
  externalUrl?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

function PlatformItem({
  platform,
  connected,
  selected,
  onToggle,
  syncStatus,
  externalUrl,
  onRetry,
  isRetrying,
}: PlatformItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-border',
        !connected && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          disabled={!connected}
        />
        <div>
          <p className="font-medium text-sm">{PLATFORM_LABELS[platform]}</p>
          {!connected && (
            <p className="text-xs text-muted-foreground">Non connecté</p>
          )}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Voir l'article <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {connected ? (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
            <Check className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Non connecté
          </Badge>
        )}

        {syncStatus === 'failed' && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-7 px-2"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIME PICKER
// ============================================================================

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [currentHour, currentMinute] = value.split(':');

  return (
    <div className="flex items-center gap-1">
      <Select value={currentHour} onValueChange={(h) => onChange(`${h}:${currentMinute}`)}>
        <SelectTrigger className="w-16 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={currentMinute} onValueChange={(m) => onChange(`${currentHour}:${m}`)}>
        <SelectTrigger className="w-16 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PublishTab({ form, articleId, syncHook }: PublishTabProps) {
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PublishPlatform[]>(['flowz']);
  const [isRetryingPlatform, setIsRetryingPlatform] = useState<PublishPlatform | null>(null);

  const {
    syncStatus,
    isPublished,
    isScheduled,
    scheduledAt,
    connectedPlatforms,
    syncLogs,
    publishNow,
    schedulePublish,
    cancelSchedule,
    retrySync,
    unpublish,
    isPublishing,
    isScheduling,
  } = syncHook;

  // Toggle platform selection
  const togglePlatform = useCallback((platform: PublishPlatform, checked: boolean) => {
    setSelectedPlatforms((prev) =>
      checked
        ? [...prev, platform]
        : prev.filter((p) => p !== platform)
    );
  }, []);

  // Handle publish now
  const handlePublishNow = useCallback(async () => {
    await publishNow(selectedPlatforms);
  }, [publishNow, selectedPlatforms]);

  // Handle schedule
  const handleSchedule = useCallback(async () => {
    if (!selectedDate) return;

    const [hours, minutes] = selectedTime.split(':');
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await schedulePublish({
      mode: 'scheduled',
      scheduledAt: scheduledDateTime.toISOString(),
      platforms: selectedPlatforms,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifySubscribers: false,
      autoShareSocial: false,
    });
  }, [selectedDate, selectedTime, selectedPlatforms, schedulePublish]);

  // Handle retry
  const handleRetry = useCallback(async (platform: PublishPlatform) => {
    setIsRetryingPlatform(platform);
    await retrySync(platform);
    setIsRetryingPlatform(null);
  }, [retrySync]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Current Status */}
      {articleId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Statut actuel</CardTitle>
              <SyncStatusBadge status={syncStatus} />
            </div>
          </CardHeader>
          {isScheduled && scheduledAt && (
            <CardContent>
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Publication planifiée pour le{' '}
                  {format(new Date(scheduledAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={cancelSchedule}
                    className="ml-2 h-auto p-0"
                  >
                    Annuler
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          {isPublished && (
            <CardContent>
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <Check className="h-4 w-4 text-emerald-500" />
                <AlertDescription>
                  Cet article est publié.
                  <Button
                    variant="link"
                    size="sm"
                    onClick={unpublish}
                    className="ml-2 h-auto p-0 text-destructive"
                  >
                    Dépublier
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      )}

      {/* Publish Options */}
      {!isPublished && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Quand publier ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={publishMode}
              onValueChange={(value) => setPublishMode(value as 'now' | 'scheduled')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="font-normal cursor-pointer">
                  Publier maintenant
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                  Planifier pour plus tard
                </Label>
              </div>
            </RadioGroup>

            {publishMode === 'scheduled' && (
              <div className="pl-6 pt-2 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, 'd MMMM yyyy', { locale: fr })
                          : 'Choisir une date'}
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

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <TimePicker value={selectedTime} onChange={setSelectedTime} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Fuseau horaire: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Où publier ?
          </CardTitle>
          <CardDescription>
            Sélectionnez les plateformes de publication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectedPlatforms.map((platform) => {
            const log = syncLogs.find((l) => l.platform === platform.platform);
            return (
              <PlatformItem
                key={platform.platform}
                platform={platform.platform}
                connected={platform.connected}
                selected={selectedPlatforms.includes(platform.platform)}
                onToggle={(checked) => togglePlatform(platform.platform, checked)}
                syncStatus={log?.status as SyncStatus | undefined}
                externalUrl={log?.external_url || undefined}
                onRetry={
                  log?.status === 'failed'
                    ? () => handleRetry(platform.platform)
                    : undefined
                }
                isRetrying={isRetryingPlatform === platform.platform}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Sync History */}
      {syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique de synchronisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <SyncStatusBadge status={log.status as SyncStatus} />
                    <span>{PLATFORM_LABELS[log.platform as PublishPlatform]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    {log.synced_at && (
                      <span>
                        {format(new Date(log.synced_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                    {log.external_url && (
                      <a
                        href={log.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {!isPublished && (
        <div className="flex justify-end">
          <Button
            onClick={publishMode === 'now' ? handlePublishNow : handleSchedule}
            disabled={
              selectedPlatforms.length === 0 ||
              isPublishing ||
              isScheduling ||
              (publishMode === 'scheduled' && !selectedDate)
            }
            className="gap-2"
          >
            {isPublishing || isScheduling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {publishMode === 'now' ? 'Publier maintenant' : 'Planifier la publication'}
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * AdvancedScheduleDialog Component
 *
 * Dialog for advanced article scheduling:
 * - Schedule publish/republish
 * - Multi-platform scheduling
 * - View scheduled actions
 * - Cancel/modify schedules
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Rocket,
  RefreshCw,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  useScheduleManager,
  type ArticleSchedule,
  type ScheduleType,
  type ScheduleStatus,
} from '@/hooks/blog/useArticleSchedules';

// ============================================================================
// TYPES
// ============================================================================

interface AdvancedScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getScheduleTypeInfo(type: ScheduleType): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  switch (type) {
    case 'publish':
      return {
        icon: <Rocket className="w-4 h-4" />,
        label: 'Publication',
        color: 'text-emerald-600 bg-emerald-100',
      };
    case 'republish':
      return {
        icon: <RefreshCw className="w-4 h-4" />,
        label: 'Republication',
        color: 'text-blue-600 bg-blue-100',
      };
    case 'unpublish':
      return {
        icon: <EyeOff className="w-4 h-4" />,
        label: 'Depublication',
        color: 'text-amber-600 bg-amber-100',
      };
    case 'series':
      return {
        icon: <Calendar className="w-4 h-4" />,
        label: 'Serie',
        color: 'text-violet-600 bg-violet-100',
      };
  }
}

function getStatusInfo(status: ScheduleStatus): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  switch (status) {
    case 'pending':
      return {
        icon: <Clock className="w-3.5 h-3.5" />,
        label: 'En attente',
        color: 'text-amber-600 bg-amber-100',
      };
    case 'processing':
      return {
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        label: 'En cours',
        color: 'text-blue-600 bg-blue-100',
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Termine',
        color: 'text-emerald-600 bg-emerald-100',
      };
    case 'failed':
      return {
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: 'Echec',
        color: 'text-red-600 bg-red-100',
      };
    case 'cancelled':
      return {
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: 'Annule',
        color: 'text-muted-foreground bg-muted',
      };
  }
}

function formatScheduleDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// SCHEDULE LIST ITEM
// ============================================================================

interface ScheduleListItemProps {
  schedule: ArticleSchedule;
  onCancel: () => void;
  onDelete: () => void;
  isCancelling: boolean;
  isDeleting: boolean;
}

function ScheduleListItem({
  schedule,
  onCancel,
  onDelete,
  isCancelling,
  isDeleting,
}: ScheduleListItemProps) {
  const typeInfo = getScheduleTypeInfo(schedule.schedule_type);
  const statusInfo = getStatusInfo(schedule.status);
  const isPending = schedule.status === 'pending';
  const isPast = new Date(schedule.scheduled_at) < new Date();

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border transition-all',
        isPending ? 'bg-background border-border' : 'bg-muted/30 border-border/50'
      )}
    >
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', typeInfo.color)}>
        {typeInfo.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-foreground">{typeInfo.label}</span>
          <Badge
            variant="outline"
            className={cn('text-[9px] border-transparent', statusInfo.color)}
          >
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatScheduleDate(schedule.scheduled_at)}
        </p>
        {schedule.platforms && schedule.platforms.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {schedule.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="text-[9px]">
                {platform}
              </Badge>
            ))}
          </div>
        )}
        {schedule.error_message && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {schedule.error_message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isPending && !isPast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Annuler'}
          </Button>
        )}
        {(schedule.status === 'completed' || schedule.status === 'cancelled' || schedule.status === 'failed') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NEW SCHEDULE FORM
// ============================================================================

interface NewScheduleFormProps {
  articleId: string;
  onCreate: (params: {
    article_id: string;
    schedule_type: ScheduleType;
    scheduled_at: Date;
    platforms?: string[];
  }) => Promise<void>;
  isCreating: boolean;
  onClose: () => void;
}

function NewScheduleForm({ articleId, onCreate, isCreating, onClose }: NewScheduleFormProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>('publish');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('12:00');
  const [platforms, setPlatforms] = useState<string[]>(['flowz']);

  const scheduledAt = useMemo(() => {
    if (!date) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }, [date, time]);

  const handleCreate = async () => {
    if (!scheduledAt) return;

    await onCreate({
      article_id: articleId,
      schedule_type: scheduleType,
      scheduled_at: scheduledAt,
      platforms,
    });
    onClose();
  };

  return (
    <div className="space-y-4 py-4">
      {/* Schedule Type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold">Type d'action</Label>
        <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as ScheduleType)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publish">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-600" />
                <span>Publier</span>
              </div>
            </SelectItem>
            <SelectItem value="republish">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Republier</span>
              </div>
            </SelectItem>
            <SelectItem value="unpublish">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-amber-600" />
                <span>Depublier</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-9',
                  !date && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? date.toLocaleDateString('fr-FR') : 'Choisir'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Heure</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                    {hour}:00
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-2">
        <Label className="text-xs font-bold">Plateformes</Label>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="platform-flowz"
              checked={platforms.includes('flowz')}
              onCheckedChange={(checked) => {
                if (checked) {
                  setPlatforms([...platforms, 'flowz']);
                } else {
                  setPlatforms(platforms.filter((p) => p !== 'flowz'));
                }
              }}
            />
            <Label htmlFor="platform-flowz" className="text-xs">FLOWZ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="platform-wordpress"
              checked={platforms.includes('wordpress')}
              onCheckedChange={(checked) => {
                if (checked) {
                  setPlatforms([...platforms, 'wordpress']);
                } else {
                  setPlatforms(platforms.filter((p) => p !== 'wordpress'));
                }
              }}
            />
            <Label htmlFor="platform-wordpress" className="text-xs">WordPress</Label>
          </div>
        </div>
      </div>

      {/* Summary */}
      {scheduledAt && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-foreground">
            <strong>{getScheduleTypeInfo(scheduleType).label}</strong> prevue pour le{' '}
            <strong>{formatScheduleDate(scheduledAt.toISOString())}</strong>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!scheduledAt || platforms.length === 0 || isCreating}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4 mr-2" />
          )}
          Planifier
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdvancedScheduleDialog({
  open,
  onOpenChange,
  articleId,
}: AdvancedScheduleDialogProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');

  const {
    schedules,
    isLoading,
    createSchedule,
    cancelSchedule,
    deleteSchedule,
    isCreating,
    isCancelling,
    isDeleting,
  } = useScheduleManager({ articleId, enabled: open });

  // Separate pending and past schedules
  const pendingSchedules = schedules.filter((s) => s.status === 'pending');
  const pastSchedules = schedules.filter((s) => s.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Planification avancee</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingSchedules.length} action{pendingSchedules.length > 1 ? 's' : ''} en attente
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <Clock className="w-4 h-4" />
              Planifie
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucune planification
                </p>
                <Button variant="outline" onClick={() => setActiveTab('new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Creer une planification
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] pr-2">
                <div className="space-y-3 py-4">
                  {pendingSchedules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        En attente
                      </p>
                      <AnimatePresence mode="popLayout">
                        {pendingSchedules.map((schedule) => (
                          <motion.div
                            key={schedule.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <ScheduleListItem
                              schedule={schedule}
                              onCancel={() => cancelSchedule(schedule.id)}
                              onDelete={() => deleteSchedule(schedule.id)}
                              isCancelling={isCancelling}
                              isDeleting={isDeleting}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {pastSchedules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        Historique
                      </p>
                      {pastSchedules.map((schedule) => (
                        <ScheduleListItem
                          key={schedule.id}
                          schedule={schedule}
                          onCancel={() => cancelSchedule(schedule.id)}
                          onDelete={() => deleteSchedule(schedule.id)}
                          isCancelling={isCancelling}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="new">
            <NewScheduleForm
              articleId={articleId}
              onCreate={createSchedule}
              isCreating={isCreating}
              onClose={() => setActiveTab('list')}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AdvancedScheduleDialog;

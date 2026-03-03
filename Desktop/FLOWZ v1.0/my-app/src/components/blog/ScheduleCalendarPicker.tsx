'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ScheduleCalendarPickerProps {
  onSchedule: (datetime: Date, type: 'publish' | 'republish' | 'unpublish') => void
  currentSchedule?: { scheduled_at: string; type: string } | null
  onCancel?: () => void
  isPending?: boolean
}

const SCHEDULE_TYPES = [
  { value: 'publish', label: 'Publier' },
  { value: 'republish', label: 'Republier' },
  { value: 'unpublish', label: 'D\u00e9publier' },
] as const

export function ScheduleCalendarPicker({
  onSchedule,
  currentSchedule,
  onCancel,
  isPending = false,
}: ScheduleCalendarPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentSchedule ? new Date(currentSchedule.scheduled_at) : undefined
  )
  const [time, setTime] = useState(() => {
    if (currentSchedule) {
      const d = new Date(currentSchedule.scheduled_at)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return '09:00'
  })
  const [scheduleType, setScheduleType] = useState<'publish' | 'republish' | 'unpublish'>(
    (currentSchedule?.type as 'publish' | 'republish' | 'unpublish') ?? 'publish'
  )

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  )

  const isValid = useMemo(() => {
    if (!selectedDate || !time) return false
    const [hours, minutes] = time.split(':').map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(hours, minutes, 0, 0)
    return combined > new Date()
  }, [selectedDate, time])

  function handleSubmit() {
    if (!selectedDate || !time) return
    const [hours, minutes] = time.split(':').map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(hours, minutes, 0, 0)
    onSchedule(combined, scheduleType)
  }

  const triggerLabel = currentSchedule
    ? new Date(currentSchedule.scheduled_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Programmer'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={currentSchedule ? 'secondary' : 'outline'}
          size="sm"
          className={cn('gap-2 rounded-lg')}
        >
          <CalendarIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto rounded-xl p-4" align="end">
        <div className="flex flex-col gap-4">
          {/* Schedule type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Type
            </label>
            <Select
              value={scheduleType}
              onValueChange={(v) =>
                setScheduleType(v as 'publish' | 'republish' | 'unpublish')
              }
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {SCHEDULE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />

          {/* Time picker */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(
                'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1',
                'text-sm text-foreground shadow-sm',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              )}
            />
          </div>

          {/* Timezone */}
          <p className="text-xs text-muted-foreground">
            Fuseau horaire : {timezone}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 rounded-lg"
              disabled={!isValid || isPending}
              onClick={handleSubmit}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarIcon className="mr-2 h-4 w-4" />
              )}
              Programmer
            </Button>

            {currentSchedule && onCancel && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={onCancel}
                disabled={isPending}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { cn } from '@/lib/utils'
import { Badge, type BadgeProps } from '@/components/ui/badge'

interface SettingsCardProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  variant?: 'default' | 'danger'
}

/**
 * Vercel Pro Settings Card — standard card with dark mode gradient overlay.
 * Use across all settings sections for consistent Vercel-style look.
 */
export function SettingsCard({ children, className, noPadding, variant = 'default' }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card relative group overflow-hidden transition-colors',
        variant === 'danger' ? 'border-destructive/30' : 'border-border/40',
        !noPadding && 'p-6',
        className
      )}
    >
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface SettingsHeaderProps {
  icon: React.ElementType
  title: string
  description: string
  iconClassName?: string
  badge?: { label: string; variant: BadgeProps['variant'] }
  children?: React.ReactNode
}

/**
 * Vercel Pro Section Header — monochrome icon box + title/desc + optional badge.
 */
export function SettingsHeader({ icon: Icon, title, description, iconClassName, badge, children }: SettingsHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
        <Icon className={cn('h-[18px] w-[18px] text-foreground/70', iconClassName)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          {badge && (
            <Badge variant={badge.variant} size="sm" className="px-1.5 py-0 text-[9px] h-4">
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  )
}

interface SettingsPageHeaderProps {
  title: string
  description: string
  titleClassName?: string
  badge?: { label: string; variant: BadgeProps['variant'] }
}

/**
 * Vercel Pro Page Header — page title + description + optional badge.
 */
export function SettingsPageHeader({ title, description, titleClassName, badge }: SettingsPageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className={cn('text-lg font-semibold tracking-tight text-foreground', titleClassName)}>{title}</h2>
        {badge && (
          <Badge variant={badge.variant} size="sm" className="px-1.5 py-0 text-[9px] h-4">
            {badge.label}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

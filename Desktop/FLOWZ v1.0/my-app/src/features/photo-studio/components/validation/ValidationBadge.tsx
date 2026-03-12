"use client"

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ValidationBadgeProps {
  status: 'draft' | 'approved' | 'published'
  size?: 'sm' | 'md'
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    classes: 'bg-muted text-muted-foreground border-muted',
    dot: 'bg-muted-foreground',
  },
  approved: {
    label: 'Approuv\u00e9',
    classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  published: {
    label: 'Publi\u00e9',
    classes: 'bg-green-500/10 text-green-500 border-green-500/20',
    dot: 'bg-green-500',
  },
} as const

const sizeConfig = {
  sm: { badge: 'text-[10px] px-2 py-0.5', dot: 'w-1.5 h-1.5' },
  md: { badge: 'text-xs px-2.5 py-1', dot: 'w-2 h-2' },
} as const

export function ValidationBadge({ status, size = 'md' }: ValidationBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.classes,
        sizeStyles.badge,
      )}
    >
      <span className={cn('rounded-full shrink-0', config.dot, sizeStyles.dot)} />
      {config.label}
    </Badge>
  )
}

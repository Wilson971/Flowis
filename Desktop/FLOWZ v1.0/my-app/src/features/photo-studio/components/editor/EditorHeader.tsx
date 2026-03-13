'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EditorMode } from '../../types/studio'

interface EditorHeaderProps {
  productName: string
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onPublish: () => void
}

export function EditorHeader({ productName, mode, onModeChange, onPublish }: EditorHeaderProps) {
  const router = useRouter()

  return (
    <header className={cn(
      'flex items-center justify-between h-14 px-4 border-b border-border bg-background',
    )}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/app/photostudio')}
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="truncate max-w-[300px] text-sm font-medium text-foreground">
          {productName}
        </span>
        <Badge variant="secondary" className="gap-1 flex-shrink-0">
          <Sparkles className="h-3 w-3" />
          Studio
        </Badge>
      </div>

      {/* Center — Mode toggle */}
      <div className="flex items-center rounded-lg bg-muted p-1">
        {(['simple', 'expert'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-lg transition-all',
              mode === m
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'simple' ? 'Simple' : 'Expert'}
          </button>
        ))}
      </div>

      {/* Right */}
      <Button onClick={onPublish} size="sm">
        Publier vers la Boutique
      </Button>
    </header>
  )
}

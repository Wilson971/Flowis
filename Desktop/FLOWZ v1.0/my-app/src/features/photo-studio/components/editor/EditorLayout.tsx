'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EditorLayoutProps {
  sidebar: ReactNode
  canvas: ReactNode
  adjustmentsPanel?: ReactNode
  footer: ReactNode
  showAdjustments: boolean
}

export function EditorLayout({
  sidebar,
  canvas,
  adjustmentsPanel,
  footer,
  showAdjustments,
}: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[280px] border-r border-border overflow-y-auto flex-shrink-0">
          {sidebar}
        </div>

        {/* Canvas */}
        <div className={cn('flex-1 min-w-0 relative bg-[#1a1a1a]')}>
          {canvas}
        </div>

        {/* Adjustments panel */}
        {showAdjustments && adjustmentsPanel && (
          <div className="w-[280px] border-l border-border overflow-y-auto flex-shrink-0">
            {adjustmentsPanel}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-[140px] border-t border-border flex-shrink-0">
        {footer}
      </div>
    </div>
  )
}

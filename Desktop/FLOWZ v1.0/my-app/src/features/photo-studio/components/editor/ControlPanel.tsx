"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { Loader2, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClassificationPanel } from '@/features/photo-studio/classification'
import { useAutoClassify } from '@/features/photo-studio/classification'
import { PresetGrid } from '../PresetGrid'

// ---------------------------------------------------------------------------
// Action groups
// ---------------------------------------------------------------------------

const ACTION_GROUPS = [
  {
    label: 'Arriere-plan',
    actions: [
      { value: 'remove_bg', label: 'Supprimer le fond' },
      { value: 'replace_bg', label: 'Remplacer le fond' },
      { value: 'replace_bg_white', label: 'Fond blanc' },
      { value: 'replace_bg_studio', label: 'Fond studio' },
      { value: 'replace_bg_marble', label: 'Fond marbre' },
      { value: 'replace_bg_wood', label: 'Fond bois' },
    ],
  },
  {
    label: 'Amelioration',
    actions: [
      { value: 'enhance', label: 'Ameliorer' },
      { value: 'enhance_light', label: 'Ameliorer lumiere' },
      { value: 'enhance_color', label: 'Ameliorer couleurs' },
      { value: 'harmonize', label: 'Harmoniser' },
    ],
  },
  {
    label: 'Generation',
    actions: [
      { value: 'generate_angles', label: 'Generer des angles' },
      { value: 'generate_scene', label: 'Generer une scene' },
    ],
  },
  {
    label: 'Personnalise',
    actions: [
      { value: 'magic_edit', label: 'Edition magique' },
    ],
  },
] as const

const PRESET_ACTIONS = new Set(['replace_bg', 'generate_scene'])

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EditorControlPanelProps {
  selectedAction: string | null
  onActionChange: (action: string) => void
  selectedPreset: Record<string, unknown> | null
  onPresetChange: (preset: Record<string, unknown> | null) => void
  productId: string
  imageUrl: string | null
  isGenerating: boolean
  onGenerate: () => void
  userInstruction?: string
  onInstructionChange?: (instruction: string) => void
  /** Quota usage: [used, total] */
  quota?: [number, number]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorControlPanel({
  selectedAction,
  onActionChange,
  selectedPreset,
  onPresetChange,
  productId,
  imageUrl,
  isGenerating,
  onGenerate,
  userInstruction = '',
  onInstructionChange,
  quota,
}: EditorControlPanelProps) {
  const classification = useAutoClassify(productId, imageUrl)

  const showPresets = selectedAction != null && PRESET_ACTIONS.has(selectedAction)
  const showMagicEdit = selectedAction === 'magic_edit'

  const remaining = quota ? quota[1] - quota[0] : null
  const isQuotaExceeded = remaining !== null && remaining <= 0

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h3 className={cn(styles.text.label, 'mb-3')}>Action</h3>
        <Select
          value={selectedAction ?? undefined}
          onValueChange={onActionChange}
        >
          <SelectTrigger className="w-full rounded-lg">
            <SelectValue placeholder="Choisir une action..." />
          </SelectTrigger>
          <SelectContent>
            {ACTION_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.actions.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Preset grid for replace_bg / generate_scene */}
          {showPresets && (
            <div>
              <h4 className={cn(styles.text.label, 'mb-3')}>Preset</h4>
              <PresetGrid
                selectedPresetId={
                  (selectedPreset?.id as string) ?? null
                }
                onSelectPreset={(id) => {
                  onPresetChange(id ? { id } : null)
                }}
                recommendedPresetIds={
                  classification.data?.suggestedSceneIds ?? []
                }
                maxVisiblePresets={6}
              />
            </div>
          )}

          {/* Magic edit instruction */}
          {showMagicEdit && (
            <div>
              <h4 className={cn(styles.text.label, 'mb-3')}>
                Instruction
              </h4>
              <Textarea
                value={userInstruction}
                onChange={(e) => onInstructionChange?.(e.target.value)}
                placeholder="Decrivez la modification souhaitee..."
                className="min-h-[100px] rounded-lg resize-none"
                disabled={isGenerating}
              />
            </div>
          )}

          {/* Classification results */}
          <div>
            <Separator className="mb-4" />
            <ClassificationPanel
              classification={classification.data}
              isLoading={classification.isLoading}
              isError={classification.isError}
              error={classification.error as Error | null}
              refetch={classification.refetch}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer — Generate button */}
      <div className="flex-shrink-0 p-4 border-t border-border space-y-3">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !selectedAction || isQuotaExceeded}
          className="w-full h-12 gap-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generer
            </>
          )}
          {remaining !== null && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs rounded-full"
            >
              {remaining}/{quota![1]}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  )
}

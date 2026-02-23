'use client';

import React from 'react';
import {
  Sparkles,
  Wand2,
  FileDown,
  FileUp,
  SpellCheck,
  Languages,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

import { TONE_LABELS, type EditorTone, type EditorLanguage } from '@/schemas/article-editor';

export interface AIToolbarProps {
  onAction: (action: string, options?: { tone?: EditorTone; language?: EditorLanguage }) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export function AIToolbar({ onAction, isProcessing, disabled }: AIToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-1.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground px-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span className="font-medium">IA</span>
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Quick actions */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction('improve_style')}
        disabled={disabled || isProcessing}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Ameliorer
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction('simplify')}
        disabled={disabled || isProcessing}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <FileDown className="h-3.5 w-3.5" />
        Simplifier
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction('expand')}
        disabled={disabled || isProcessing}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <FileUp className="h-3.5 w-3.5" />
        Developper
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction('correct')}
        disabled={disabled || isProcessing}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <SpellCheck className="h-3.5 w-3.5" />
        Corriger
      </Button>

      {/* Tone dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="h-7 px-2 text-xs gap-1"
          >
            Ton
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.entries(TONE_LABELS) as [EditorTone, string][]).map(
            ([tone, label]) => (
              <DropdownMenuItem
                key={tone}
                onClick={() => onAction('change_tone', { tone })}
              >
                {label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* More actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="h-7 px-2 text-xs gap-1"
          >
            Plus
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="h-4 w-4 mr-2" />
              Traduire
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onAction('translate', { language: 'en' })}>
                Anglais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('translate', { language: 'es' })}>
                Espagnol
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('translate', { language: 'de' })}>
                Allemand
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('generate_intro')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generer introduction
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('generate_conclusion')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generer conclusion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

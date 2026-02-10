"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DetectedTag } from './modals';

type SmartTagsEditorProps = {
  tags: DetectedTag[];
  isAnalyzing: boolean;
  onToggleLock: (key: string) => void;
  onRemove: (key: string) => void;
  onOpenModal?: () => void;
  onRescan?: () => void;
  maxVisibleTags?: number;
};

export const SmartTagsEditor = ({
  tags,
  isAnalyzing,
  onToggleLock,
  onRescan,
  maxVisibleTags = 6,
}: SmartTagsEditorProps) => {
  const { lockedTags, unlockedTags } = useMemo(() => ({
    lockedTags: tags.filter(t => t.locked),
    unlockedTags: tags.filter(t => !t.locked),
  }), [tags]);

  if (isAnalyzing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Smart Tags</span>
        </div>
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Analyse IA en cours...</span>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Smart Tags</span>
        </div>
        <p className="text-xs text-muted-foreground py-2">Aucun tag detecte</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Smart Tags</span>
        {onRescan && (
          <Button variant="link" size="sm" className="h-auto p-0 text-[11px] text-primary hover:text-primary/80 font-semibold uppercase tracking-wider" onClick={onRescan}>
            Scan Again
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {lockedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lockedTags.map((tag) => (
              <button
                key={tag.key}
                onClick={() => onToggleLock(tag.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-xs font-medium transition-all',
                  'bg-primary/20 text-primary border border-primary/30',
                  'hover:bg-primary/30'
                )}
              >
                <Lock className="w-3 h-3" />
                <span>{tag.key}: {tag.value}</span>
              </button>
            ))}
          </div>
        )}
        {unlockedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unlockedTags.slice(0, maxVisibleTags - lockedTags.length).map((tag) => (
              <button
                key={tag.key}
                onClick={() => onToggleLock(tag.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-xs font-medium transition-all',
                  'bg-muted text-muted-foreground border border-border',
                  'hover:bg-accent hover:border-primary/30'
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>{tag.key}: {tag.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

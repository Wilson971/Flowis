'use client';

/**
 * StatusCard - Article status sidebar card
 * Uses ArticleEditContext for state management
 */

import React from 'react';
import { BadgeCheck, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useArticleEditContext } from '../context';
import type { ArticleForm } from '@/schemas/article-editor';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-zinc-500', badge: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  published: { label: 'Publié', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  scheduled: { label: 'Planifié', color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  archived: { label: 'Archivé', color: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
};

export function StatusCard() {
  const { form, articleSync, isFieldModified } = useArticleEditContext();

  const currentStatus = form.watch('status') || 'draft';
  const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.draft;

  const syncStatus = articleSync?.syncStatus || 'draft';
  const isPublished = articleSync?.isPublished || false;
  const isScheduled = articleSync?.isScheduled || false;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <BadgeCheck className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              État
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              Statut de l'article
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-4">
        {/* Current Status Badge */}
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Statut actuel
          </Label>
          <Badge variant="outline" className={cn('gap-1.5', config.badge)}>
            <Circle className={cn('h-2 w-2 fill-current', config.color.replace('bg-', 'text-'))} />
            {config.label}
          </Badge>
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Changer le statut
          </Label>
          <Select
            value={currentStatus}
            onValueChange={(value) => form.setValue('status', value as ArticleForm['status'], { shouldDirty: true })}
          >
            <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-zinc-500 text-zinc-500" />
                  Brouillon
                </div>
              </SelectItem>
              <SelectItem value="published">
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                  Publié
                </div>
              </SelectItem>
              <SelectItem value="scheduled">
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                  Planifié
                </div>
              </SelectItem>
              <SelectItem value="archived">
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                  Archivé
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sync Status Info */}
        {(isPublished || isScheduled) && (
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Synchronisation</span>
              <Badge variant="outline" className={cn(
                'text-[10px]',
                syncStatus === 'synced' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                syncStatus === 'syncing' && 'bg-blue-50 text-blue-600 border-blue-200',
                syncStatus === 'failed' && 'bg-red-50 text-red-600 border-red-200',
                syncStatus === 'pending' && 'bg-amber-50 text-amber-600 border-amber-200',
              )}>
                {syncStatus === 'synced' && 'Synchronisé'}
                {syncStatus === 'syncing' && 'En cours...'}
                {syncStatus === 'failed' && 'Échec'}
                {syncStatus === 'pending' && 'En attente'}
                {syncStatus === 'draft' && 'Non publié'}
                {syncStatus === 'partial' && 'Partiel'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

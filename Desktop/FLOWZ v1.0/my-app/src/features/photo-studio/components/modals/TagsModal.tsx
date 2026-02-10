"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Lock, LockOpen, X, Plus, Sparkles, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export type DetectedTag = {
  key: string;
  value: string;
  locked: boolean;
};

type TagsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: DetectedTag[];
  onToggleLock: (key: string) => void;
  onRemove: (key: string) => void;
  onAddTag?: (key: string, value: string) => void;
};

export const TagsModal = ({
  open,
  onOpenChange,
  tags,
  onToggleLock,
  onRemove,
  onAddTag,
}: TagsModalProps) => {
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  const handleAddTag = () => {
    if (newTagKey.trim() && newTagValue.trim() && onAddTag) {
      onAddTag(newTagKey.trim(), newTagValue.trim());
      setNewTagKey('');
      setNewTagValue('');
    }
  };

  const lockedTags = tags.filter(t => t.locked);
  const unlockedTags = tags.filter(t => !t.locked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Gestion des Tags Detectes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Locked tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Tags verrouilles ({lockedTags.length})
              </Label>
              <span className="text-xs text-muted-foreground">Influencent la generation</span>
            </div>
            {lockedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                {lockedTags.map((tag) => (
                  <Badge key={tag.key} className="bg-primary text-primary-foreground gap-1.5 pr-1">
                    <span className="font-medium">{tag.key}:</span>
                    <span>{tag.value}</span>
                    <button onClick={() => onToggleLock(tag.key)} className="ml-1 hover:opacity-70 transition-opacity" title="Deverrouiller">
                      <LockOpen className="w-3 h-3" />
                    </button>
                    <button onClick={() => onRemove(tag.key)} className="ml-0.5 hover:opacity-70 transition-opacity" title="Supprimer">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                Verrouillez des tags pour qu'ils influencent la generation
              </p>
            )}
          </div>

          {/* Unlocked tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              Tags detectes ({unlockedTags.length})
            </Label>
            <ScrollArea className="max-h-40">
              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                {unlockedTags.map((tag) => (
                  <Badge key={tag.key} variant="secondary" className="gap-1.5 pr-1">
                    <span className="font-medium">{tag.key}:</span>
                    <span>{tag.value}</span>
                    <button onClick={() => onToggleLock(tag.key)} className="ml-1 hover:opacity-70 transition-opacity" title="Verrouiller">
                      <Lock className="w-3 h-3" />
                    </button>
                    <button onClick={() => onRemove(tag.key)} className="ml-0.5 hover:opacity-70 transition-opacity" title="Supprimer">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {unlockedTags.length === 0 && (
                  <span className="text-xs text-muted-foreground">Tous les tags sont verrouilles</span>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Add custom tag */}
          {onAddTag && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un tag personnalise
              </Label>
              <div className="flex gap-2">
                <Input value={newTagKey} onChange={(e) => setNewTagKey(e.target.value)} placeholder="Cle (ex: Couleur)" className="flex-1" />
                <Input value={newTagValue} onChange={(e) => setNewTagValue(e.target.value)} placeholder="Valeur (ex: Rouge)" className="flex-1" />
                <Button onClick={handleAddTag} disabled={!newTagKey.trim() || !newTagValue.trim()} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

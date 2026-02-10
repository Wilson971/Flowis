'use client';

/**
 * OrganizationCard - Category and tags management sidebar card
 * Uses ArticleEditContext for state management
 */

import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { FolderOpen, Tag, Plus, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticleEditContext } from '../context';
import { cn } from '@/lib/utils';

const defaultCategories = [
  'Marketing',
  'E-commerce',
  'SEO',
  'Technologie',
  'Business',
  'Lifestyle',
  'Tutoriels',
];

export function OrganizationCard() {
  const { form, isFieldModified, isFieldWithDraft, draftActions } = useArticleEditContext();
  const [tagInput, setTagInput] = useState('');

  const currentCategory = form.watch('category') || '';
  const currentTags = form.watch('tags') || [];

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !currentTags.includes(newTag)) {
      form.setValue('tags', [...currentTags, newTag], { shouldDirty: true });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Classification
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              Organisation
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-4">
        {/* Category Select */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Catégorie
          </Label>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {defaultCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Tags
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={() => draftActions.handleRegenerateField('tags')}
              disabled={draftActions.isRegenerating}
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Suggérer
            </Button>
          </div>

          {/* Tag Input */}
          <div className="flex gap-1.5">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un tag..."
              className="h-8 text-xs bg-background/50 border-border/50 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Tags Display */}
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 text-[10px] cursor-pointer hover:bg-destructive/10 transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                  <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                </Badge>
              ))}
            </div>
          )}

          {currentTags.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              Aucun tag ajouté
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

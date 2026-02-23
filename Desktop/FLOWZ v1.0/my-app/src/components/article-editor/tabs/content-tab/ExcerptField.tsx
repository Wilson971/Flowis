'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import { FieldStatusBadge } from '@/components/products/FieldStatusBadge';
import type { UseFormReturn } from 'react-hook-form';

interface ExcerptFieldProps {
  form: UseFormReturn<any>;
  excerpt: string;
  content: string;
  hasDraft: boolean;
  isDirty: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
  renderFieldActions: () => React.ReactNode;
  renderSuggestionPreview: () => React.ReactNode;
}

export function ExcerptField({
  form,
  excerpt,
  content,
  hasDraft,
  isDirty,
  onRegenerate,
  isRegenerating,
  renderFieldActions,
  renderSuggestionPreview,
}: ExcerptFieldProps) {
  return (
    <FormField
      control={form.control}
      name="excerpt"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FormLabel>Extrait</FormLabel>
              <FieldStatusBadge
                hasDraft={hasDraft}
                isSynced={!isDirty}
              />
            </div>
            <div className="flex items-center gap-2">
              {renderFieldActions()}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                disabled={!content || isRegenerating}
                className="h-7 text-xs gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Generer
              </Button>
            </div>
          </div>
          <FormControl>
            <Textarea
              {...field}
              value={field.value || ''}
              placeholder="Resume de l'article (2-3 phrases)"
              rows={3}
              className="resize-none"
            />
          </FormControl>
          {renderSuggestionPreview()}
          <p className="text-xs text-muted-foreground">
            {excerpt.length}/300 caracteres
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

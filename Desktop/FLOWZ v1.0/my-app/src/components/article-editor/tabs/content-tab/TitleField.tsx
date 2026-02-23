'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

import { Input } from '@/components/ui/input';
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

interface TitleFieldProps {
  form: UseFormReturn<any>;
  title: string;
  hasDraft: boolean;
  isDirty: boolean;
  onTitleBlur: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  renderFieldActions: () => React.ReactNode;
  renderSuggestionPreview: () => React.ReactNode;
}

export function TitleField({
  form,
  title,
  hasDraft,
  isDirty,
  onTitleBlur,
  onRegenerate,
  isRegenerating,
  renderFieldActions,
  renderSuggestionPreview,
}: TitleFieldProps) {
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FormLabel className="text-base font-medium">Titre</FormLabel>
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
                disabled={isRegenerating}
                className="h-7 text-xs gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Suggerer
              </Button>
            </div>
          </div>
          <FormControl>
            <Input
              {...field}
              placeholder="Titre de l'article"
              onBlur={onTitleBlur}
              className="text-lg font-medium"
            />
          </FormControl>
          {renderSuggestionPreview()}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{title.length} caracteres</span>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

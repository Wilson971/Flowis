'use client';

/**
 * ContentTab - Content editing tab with AI toolbar
 * Uses ArticleEditContext for state management and FieldStatusBadge for AI suggestions
 */

import React, { useCallback } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useWatch } from 'react-hook-form';
import { Wand2, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import { EditorWithAI } from '../../editor/EditorWithAI';
import { useArticleEditContext } from '../../context';
import { FieldStatusBadge } from '@/components/products/FieldStatusBadge';

import type { EditorTone, EditorLanguage } from '@/schemas/article-editor';

import { AIToolbar } from './AIToolbar';
import { TitleField } from './TitleField';
import { SlugField } from './SlugField';
import { ExcerptField } from './ExcerptField';
import { useSlugLock } from './useSlugLock';

export function ContentTab() {
  const {
    form,
    generateSlugFromTitle,
    remainingProposals,
    draftActions,
    dirtyFieldsData,
    contentBuffer,
    isFieldModified,
    isFieldWithDraft,
  } = useArticleEditContext();

  const content = useWatch({ control: form.control, name: 'content' }) || '';
  const title = useWatch({ control: form.control, name: 'title' }) || '';
  const excerpt = useWatch({ control: form.control, name: 'excerpt' }) || '';
  const slug = useWatch({ control: form.control, name: 'slug' }) || '';
  const status = useWatch({ control: form.control, name: 'status' }) || 'draft';

  const {
    isDraft,
    isPublished,
    isSlugLocked,
    setIsSlugLocked,
    showSlugWarning,
    setShowSlugWarning,
  } = useSlugLock(status);

  // Helpers
  const hasDraft = (field: string) => remainingProposals.includes(field);
  const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

  // Handle AI action on entire content
  const handleAIAction = useCallback(
    async (action: string, options?: { tone?: EditorTone; language?: EditorLanguage }) => {
      if (!content || content.length < 10) {
        return;
      }
      // AI actions would be handled by the context


    },
    [content]
  );

  // Handle title blur to generate slug
  const handleTitleBlur = useCallback(() => {
    const slug = form.getValues('slug');
    if (!slug) {
      generateSlugFromTitle();
    }
  }, [form, generateSlugFromTitle]);

  // Render Action Buttons for a field with draft
  const renderFieldActions = (field: string) => {
    if (!hasDraft(field)) return null;

    return (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => draftActions.handleAcceptField(field)}
                disabled={draftActions.isAccepting}
              >
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accepter la suggestion</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-red-700 hover:bg-destructive/10"
                onClick={() => draftActions.handleRejectField(field)}
                disabled={draftActions.isRejecting}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rejeter la suggestion</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  // Render Suggestion Preview
  const renderSuggestionPreview = (field: string) => {
    if (!hasDraft(field) || !contentBuffer?.draft_generated_content) return null;

    const suggestion = contentBuffer.draft_generated_content[field];
    if (!suggestion) return null;

    return (
      <div className="mt-2 p-3 bg-indigo-50/50 rounded border border-indigo-100 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-1 text-indigo-700 font-medium text-xs uppercase">
          <Wand2 className="h-3 w-3" />
          Suggestion IA
        </div>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(suggestion)) }} />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <TitleField
        form={form}
        title={title}
        hasDraft={hasDraft('title')}
        isDirty={!!isDirty('title')}
        onTitleBlur={handleTitleBlur}
        onRegenerate={() => draftActions.handleRegenerateField('title')}
        isRegenerating={draftActions.isRegenerating}
        renderFieldActions={() => renderFieldActions('title')}
        renderSuggestionPreview={() => renderSuggestionPreview('title')}
      />

      {/* Slug URL */}
      <SlugField
        form={form}
        isDraft={isDraft}
        isPublished={isPublished}
        isSlugLocked={isSlugLocked}
        setIsSlugLocked={setIsSlugLocked}
        showSlugWarning={showSlugWarning}
        setShowSlugWarning={setShowSlugWarning}
        generateSlugFromTitle={generateSlugFromTitle}
      />

      {/* Content Editor */}
      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FormLabel className="text-base font-medium">Contenu</FormLabel>
                <FieldStatusBadge
                  hasDraft={hasDraft('content')}
                  isSynced={!isDirty('content')}
                />
              </div>
              {renderFieldActions('content')}
            </div>
            <FormControl>
              <div className="border border-border rounded-lg overflow-hidden">
                {/* AI Toolbar */}
                <AIToolbar
                  onAction={handleAIAction}
                  isProcessing={draftActions.isRegenerating}
                  disabled={!content || content.length < 10}
                />

                {/* Editor */}
                <EditorWithAI
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Commencez a rediger votre article..."
                  minHeight={400}
                />
              </div>
            </FormControl>
            {renderSuggestionPreview('content')}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Excerpt */}
      <ExcerptField
        form={form}
        excerpt={excerpt}
        content={content}
        hasDraft={hasDraft('excerpt')}
        isDirty={!!isDirty('excerpt')}
        onRegenerate={() => draftActions.handleRegenerateField('excerpt')}
        isRegenerating={draftActions.isRegenerating}
        renderFieldActions={() => renderFieldActions('excerpt')}
        renderSuggestionPreview={() => renderSuggestionPreview('excerpt')}
      />
    </div>
  );
}

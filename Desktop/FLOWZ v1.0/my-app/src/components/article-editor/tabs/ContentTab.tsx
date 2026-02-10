'use client';

/**
 * ContentTab - Content editing tab with AI toolbar
 * Uses ArticleEditContext for state management and FieldStatusBadge for AI suggestions
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import {
  Sparkles,
  Wand2,
  FileDown,
  FileUp,
  SpellCheck,
  Languages,
  RefreshCw,
  ChevronDown,
  Check,
  X,
  Lock,
  Unlock,
  Link as LinkIcon,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

import { EditorWithAI } from '../editor/EditorWithAI';
import { useArticleEditContext } from '../context';
import { FieldStatusBadge } from '@/components/products/FieldStatusBadge';

import { TONE_LABELS, type EditorTone, type EditorLanguage } from '@/schemas/article-editor';
import { cn } from '@/lib/utils';

// ============================================================================
// AI TOOLBAR
// ============================================================================

interface AIToolbarProps {
  onAction: (action: string, options?: { tone?: EditorTone; language?: EditorLanguage }) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

function AIToolbar({ onAction, isProcessing, disabled }: AIToolbarProps) {
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  // Slug lock state (locked when published)
  const isDraft = status === 'draft';
  const isPublished = status === 'published';
  const [isSlugLocked, setIsSlugLocked] = useState(false);
  const [showSlugWarning, setShowSlugWarning] = useState(false);

  // Domain for URL preview
  const domain = 'flowz.com';

  // Auto-lock slug when published
  useEffect(() => {
    if (isPublished) {
      setIsSlugLocked(true);
    } else {
      setIsSlugLocked(false);
    }
  }, [isPublished]);

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
      console.log('AI Action:', action, options);
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
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div dangerouslySetInnerHTML={{ __html: String(suggestion) }} />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FormLabel className="text-base font-medium">Titre</FormLabel>
                <FieldStatusBadge
                  hasDraft={hasDraft('title')}
                  isSynced={!isDirty('title')}
                />
              </div>
              <div className="flex items-center gap-2">
                {renderFieldActions('title')}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => draftActions.handleRegenerateField('title')}
                  disabled={draftActions.isRegenerating}
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
                onBlur={handleTitleBlur}
                className="text-lg font-medium"
              />
            </FormControl>
            {renderSuggestionPreview('title')}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{title.length} caracteres</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Slug URL - Style like ProductSeoTab */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            URL de l'article
          </Label>
          <div className="flex items-center gap-2">
            {isDraft && (
              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-0.5 rounded font-medium">
                Brouillon
              </span>
            )}
            {isPublished && (
              <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500 px-2 py-0.5 rounded font-medium">
                Publié
              </span>
            )}
          </div>
        </div>
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-0">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2.5 rounded-l-md border border-r-0 border-border shrink-0">
                  {domain}/blog/
                </span>
                <div className="relative flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      id="slug"
                      placeholder={isDraft ? "genere-automatiquement" : "url-de-larticle"}
                      className="rounded-l-none border-l-0 pr-16"
                      readOnly={isSlugLocked}
                      onClick={() => {
                        if (isSlugLocked && isPublished) {
                          setShowSlugWarning(true);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isPublished && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => isSlugLocked ? setShowSlugWarning(true) : setIsSlugLocked(true)}
                      >
                        {isSlugLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={generateSlugFromTitle}
                      disabled={isSlugLocked}
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {isPublished
            ? "L'URL est verrouillée car l'article est publié. Modifier l'URL pourrait casser les liens existants."
            : "L'identifiant unique de l'article dans l'URL. Utilisez des tirets pour séparer les mots."
          }
        </p>

        {/* Slug Warning Dialog */}
        <AlertDialog open={showSlugWarning} onOpenChange={setShowSlugWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Attention : Modification d'URL</AlertDialogTitle>
              <AlertDialogDescription>
                Modifier l'URL d'un article publié est une action avancée. Si cet article est déjà indexé par Google, cela cassera les liens existants et pourrait impacter négativement votre référencement (SEO).
                <br /><br />
                Êtes-vous sûr de vouloir déverrouiller ce champ ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setIsSlugLocked(false);
                setShowSlugWarning(false);
              }}>
                Déverrouiller
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
      <FormField
        control={form.control}
        name="excerpt"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FormLabel>Extrait</FormLabel>
                <FieldStatusBadge
                  hasDraft={hasDraft('excerpt')}
                  isSynced={!isDirty('excerpt')}
                />
              </div>
              <div className="flex items-center gap-2">
                {renderFieldActions('excerpt')}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => draftActions.handleRegenerateField('excerpt')}
                  disabled={!content || draftActions.isRegenerating}
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
            {renderSuggestionPreview('excerpt')}
            <p className="text-xs text-muted-foreground">
              {excerpt.length}/300 caracteres
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

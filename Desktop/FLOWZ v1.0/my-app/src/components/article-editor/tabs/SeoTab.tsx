'use client';

/**
 * SeoTab - SEO configuration tab
 * Uses ArticleEditContext for state management and FieldStatusBadge for AI suggestions
 */

import React, { useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { Search, Sparkles, Link, Image, AlertCircle, CheckCircle, Check, X, Wand2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useArticleEditContext } from '../context';
import { FieldStatusBadge } from '@/components/products/FieldStatusBadge';
import { cn } from '@/lib/utils';

// ============================================================================
// SEO PREVIEW
// ============================================================================

function GooglePreview({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const displayTitle = title || 'Titre de votre article';
  const displayDescription = description || 'Ajoutez une meta description pour voir comment elle apparaitra dans les resultats de recherche Google.';
  const displayUrl = url || 'flowz.com/blog/votre-article';

  return (
    <div className="border border-border rounded-lg p-4 bg-white dark:bg-zinc-950">
      <p className="text-xs text-muted-foreground mb-1">Apercu Google</p>
      <div className="space-y-1">
        <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate">
          {displayUrl}
        </p>
        <h3 className="text-blue-600 dark:text-blue-400 text-lg font-medium truncate hover:underline cursor-pointer">
          {displayTitle}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {displayDescription}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SEO SCORE INDICATOR
// ============================================================================

function SeoScoreIndicator({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 50) return 'Correct';
    return 'A ameliorer';
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Score SEO</span>
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>
          {score}%
        </span>
      </div>
      <Progress value={score} className={cn('h-2', getProgressColor(score))} />
      <p className={cn('text-xs font-medium', getScoreColor(score))}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
}

// ============================================================================
// SEO CHECKLIST
// ============================================================================

function SeoChecklist({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}) {
  const checks = [
    {
      label: 'Titre SEO defini',
      passed: !!title && title.length > 0,
      tip: 'Ajoutez un titre SEO optimise',
    },
    {
      label: 'Titre entre 30-60 caracteres',
      passed: title.length >= 30 && title.length <= 60,
      tip: `${title.length}/60 caracteres`,
    },
    {
      label: 'Meta description definie',
      passed: !!description && description.length > 0,
      tip: 'Ajoutez une meta description',
    },
    {
      label: 'Description entre 120-160 caracteres',
      passed: description.length >= 120 && description.length <= 160,
      tip: `${description.length}/160 caracteres`,
    },
    {
      label: 'Contenu de plus de 300 mots',
      passed: content.split(/\s+/).filter(Boolean).length > 300,
      tip: `${content.split(/\s+/).filter(Boolean).length} mots`,
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="space-y-4">
      <SeoScoreIndicator score={score} />

      <div className="space-y-2">
        {checks.map((check, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm"
          >
            {check.passed ? (
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className={check.passed ? 'text-muted-foreground' : ''}>
              {check.label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {check.tip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SeoTab() {
  const {
    form,
    remainingProposals,
    draftActions,
    dirtyFieldsData,
    contentBuffer,
  } = useArticleEditContext();

  const title = useWatch({ control: form.control, name: 'title' }) || '';
  const content = useWatch({ control: form.control, name: 'content' }) || '';
  const seoTitle = useWatch({ control: form.control, name: 'seo_title' }) || '';
  const seoDescription = useWatch({ control: form.control, name: 'seo_description' }) || '';
  const slug = useWatch({ control: form.control, name: 'slug' }) || '';

  // Helpers
  const hasDraft = (field: string) => remainingProposals.includes(field);
  const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

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
      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Apercu dans les resultats de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GooglePreview
            title={seoTitle || title}
            description={seoDescription || ''}
            url={`flowz.com/blog/${slug || 'votre-article'}`}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main SEO Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* SEO Title */}
          <FormField
            control={form.control}
            name="seo_title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FormLabel>Titre SEO</FormLabel>
                    <FieldStatusBadge
                      hasDraft={hasDraft('seo_title')}
                      isSynced={!isDirty('seo_title')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {renderFieldActions('seo_title')}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => draftActions.handleRegenerateField('seo_title')}
                      disabled={!content || draftActions.isRegenerating}
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
                    value={field.value || ''}
                    placeholder={title || 'Titre optimise pour les moteurs de recherche'}
                  />
                </FormControl>
                {renderSuggestionPreview('seo_title')}
                <div className="flex items-center justify-between">
                  <FormDescription>
                    Titre affiche dans les resultats Google
                  </FormDescription>
                  <span
                    className={cn(
                      'text-xs',
                      (field.value?.length || 0) > 60
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {field.value?.length || 0}/60
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SEO Description */}
          <FormField
            control={form.control}
            name="seo_description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FormLabel>Meta description</FormLabel>
                    <FieldStatusBadge
                      hasDraft={hasDraft('seo_description')}
                      isSynced={!isDirty('seo_description')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {renderFieldActions('seo_description')}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => draftActions.handleRegenerateField('seo_description')}
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
                    placeholder="Description concise et engageante de votre article"
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                {renderSuggestionPreview('seo_description')}
                <div className="flex items-center justify-between">
                  <FormDescription>
                    Description affichee sous le titre dans Google
                  </FormDescription>
                  <span
                    className={cn(
                      'text-xs',
                      (field.value?.length || 0) > 160
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {field.value?.length || 0}/160
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Canonical URL */}
          <FormField
            control={form.control}
            name="seo_canonical_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL canonique
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="https://..."
                  />
                </FormControl>
                <FormDescription>
                  Laissez vide pour utiliser l'URL par defaut
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* OG Image */}
          <FormField
            control={form.control}
            name="seo_og_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image Open Graph
                </FormLabel>
                <FormControl>
                  <div className="border border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    {field.value ? (
                      <img
                        src={field.value}
                        alt="OG Image"
                        className="max-h-32 mx-auto rounded"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Image pour les reseaux sociaux (1200x630px)</p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* No Index */}
          <FormField
            control={form.control}
            name="no_index"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Bloquer l'indexation</FormLabel>
                  <FormDescription>
                    Empeche les moteurs de recherche d'indexer cette page
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* SEO Checklist */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist SEO</CardTitle>
              <CardDescription>
                Optimisez votre article pour le referencement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeoChecklist
                title={seoTitle || ''}
                description={seoDescription || ''}
                content={content || ''}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

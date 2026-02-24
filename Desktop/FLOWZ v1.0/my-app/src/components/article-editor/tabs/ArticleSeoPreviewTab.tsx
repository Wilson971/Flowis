'use client';

/**
 * ArticleSeoPreviewTab - SEO editing and preview tab
 * Standalone block similar to ProductSeoTab with tabs for Édition and Aperçu
 */

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useWatch, Controller } from 'react-hook-form';
import { Globe, Smartphone, Sparkles, Check, X, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

import { SERPPreview } from '@/components/seo/SERPPreview';
import { SeoFieldEditor } from '@/components/seo/SeoFieldEditor';
import { useArticleEditContext } from '../context';
import { FieldStatusBadge } from '@/components/products/FieldStatusBadge';
import { cn } from '@/lib/utils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ArticleSeoPreviewTab() {
  const {
    form,
    remainingProposals,
    draftActions,
    dirtyFieldsData,
    contentBuffer,
  } = useArticleEditContext();

  // Watch values
  const title = useWatch({ control: form.control, name: 'title' }) || '';
  const content = useWatch({ control: form.control, name: 'content' }) || '';
  const excerpt = useWatch({ control: form.control, name: 'excerpt' }) || '';
  const seoTitle = useWatch({ control: form.control, name: 'seo_title' }) || '';
  const seoDescription = useWatch({ control: form.control, name: 'seo_description' }) || '';
  const slug = useWatch({ control: form.control, name: 'slug' }) || '';
  const noIndex = useWatch({ control: form.control, name: 'no_index' }) || false;

  // Domain for preview
  const domain = 'flowz.com';
  const favicon = '/favicon.ico'; // Default favicon

  // Fallbacks for preview
  const previewTitle = seoTitle || title || 'Titre de votre article';
  const previewDesc = (seoDescription || excerpt || '').replace(/<[^>]*>/g, '').substring(0, 160) || 'Description de votre article...';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm card-elevated">
        <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                Visibilité Web
              </p>
              <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                Référencement (SEO)
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="edit" className="w-full">
            <div className="px-6 pt-4 bg-muted/20">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b-0 rounded-none gap-6">
                <TabsTrigger
                  value="edit"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 font-medium"
                >
                  Édition
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 font-medium"
                >
                  Aperçu Google
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* === EDIT TAB === */}
              <TabsContent value="edit" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
                {/* Meta Title */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <Label>Titre SEO</Label>
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
                        Suggérer
                      </Button>
                    </div>
                  </div>
                  <Controller
                    name="seo_title"
                    control={form.control}
                    render={({ field }) => (
                      <SeoFieldEditor
                        id="seo_title"
                        label=""
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        idealLength={60}
                        placeholder={title || "Titre optimisé pour Google..."}
                        helperText="Le titre bleu cliquable dans les résultats de recherche."
                      />
                    )}
                  />
                  {renderSuggestionPreview('seo_title')}
                </div>

                {/* Meta Description */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <Label>Meta Description</Label>
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
                        Générer
                      </Button>
                    </div>
                  </div>
                  <Controller
                    name="seo_description"
                    control={form.control}
                    render={({ field }) => (
                      <SeoFieldEditor
                        id="seo_description"
                        label=""
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        idealLength={160}
                        multiline
                        placeholder="Description courte et attractive..."
                        helperText="Le texte gris sous le titre. Doit inciter au clic."
                      />
                    )}
                  />
                  {renderSuggestionPreview('seo_description')}
                </div>

                {/* No Index */}
                <FormField
                  control={form.control}
                  name="no_index"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <Label>Bloquer l'indexation</Label>
                        <FormDescription>
                          Empêche les moteurs de recherche d'indexer cette page
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
              </TabsContent>

              {/* === PREVIEW TAB === */}
              <TabsContent value="preview" className="mt-0 animate-in fade-in-50 duration-300">
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                    <Tabs defaultValue="desktop" className="w-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Simulation de résultat
                        </h3>
                        <TabsList className="grid w-[200px] grid-cols-2">
                          <TabsTrigger value="desktop">Desktop</TabsTrigger>
                          <TabsTrigger value="mobile">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Mobile
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="desktop">
                        <SERPPreview
                          title={previewTitle}
                          description={previewDesc}
                          slug={slug || 'votre-article'}
                          domain={domain}
                          favicon={favicon}
                          pathPrefix="blog"
                        />
                      </TabsContent>
                      <TabsContent value="mobile">
                        <div className="max-w-[375px] mx-auto border-x border-t border-border/50 rounded-t-xl bg-surface p-4 min-h-[300px] shadow-sm">
                          <SERPPreview
                            title={previewTitle}
                            description={previewDesc}
                            slug={slug || 'votre-article'}
                            className="border-0 shadow-none bg-transparent p-0"
                            domain={domain}
                            favicon={favicon}
                            pathPrefix="blog"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      Conseils d'optimisation
                    </h4>
                    <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                      <li>Incluez le mot-clé principal au début du titre.</li>
                      <li>La description doit contenir un appel à l'action (CTA).</li>
                      <li>Évitez le bourrage de mots-clés (keyword stuffing).</li>
                      <li>Utilisez des tirets (-) pour séparer les mots dans l'URL.</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

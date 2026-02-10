'use client';

/**
 * BlogEditor Component
 *
 * Full-featured article editor with auto-save and AI tools
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Loader2,
  Wand2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBlogArticle, useAutoSave } from '@/hooks/blog';
import { useBlogAI } from '@/hooks/blog/useBlogAI';
import { styles, motionTokens } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { CanvasStep } from '@/components/blog-ai/steps/CanvasStep';
import type { ArticleStatus } from '@/types/blog';
import type { CanvasAIAction } from '@/types/blog-ai';

// ============================================================================
// STATUS BADGE
// ============================================================================

interface StatusBadgeProps {
  status: ArticleStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
    scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    published: { label: 'Publié', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    archived: { label: 'Archivé', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };

  const { label, color } = config[status];

  return (
    <Badge className={cn(styles.badge.base, styles.badge.sm, color)}>
      {label}
    </Badge>
  );
}

// ============================================================================
// AUTO SAVE INDICATOR
// ============================================================================

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
}

function AutoSaveIndicator({ isSaving, lastSaved, hasChanges }: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Sauvegarde...</span>
      </div>
    );
  }

  if (hasChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-warning">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Modifications non sauvegardées</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-success" />
        <span>Sauvegardé à {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
}

// ============================================================================
// LOADING STATE
// ============================================================================

function EditorLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className={styles.text.bodyMuted}>Chargement de l'article...</p>
      </div>
    </div>
  );
}

// ============================================================================
// BLOG EDITOR
// ============================================================================

interface BlogEditorProps {
  postId: string;
}

export function BlogEditor({ postId }: BlogEditorProps) {
  const router = useRouter();
  const { article, isLoading, updateMutation, isError } = useBlogArticle(postId);
  const blogAI = useBlogAI();

  // Local state for editing
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Sync state with fetched article
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content || '');
      setMetaTitle(article.meta_title || '');
      setMetaDescription(article.meta_description || '');
    }
  }, [article]);

  // Track changes
  useEffect(() => {
    if (article) {
      const changed =
        title !== article.title ||
        content !== (article.content || '') ||
        metaTitle !== (article.meta_title || '') ||
        metaDescription !== (article.meta_description || '');
      setHasChanges(changed);
    }
  }, [title, content, metaTitle, metaDescription, article]);

  // Save function
  const handleSave = useCallback(async () => {
    if (!article) return;

    try {
      await updateMutation.mutateAsync({
        id: postId,
        updates: {
          title,
          content,
          meta_title: metaTitle,
          meta_description: metaDescription,
        },
      });
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [article, postId, title, content, metaTitle, metaDescription, updateMutation]);

  // Auto-save
  useAutoSave({
    data: { title, content, metaTitle, metaDescription },
    onSave: handleSave,
    enabled: hasChanges,
    delay: 30000, // 30 seconds
  });

  // AI rewrite handler
  const handleRewrite = useCallback(
    async (text: string, action: CanvasAIAction): Promise<string> => {
      const result = await blogAI.rewriteText.mutateAsync({
        text,
        action,
      });
      return result;
    },
    [blogAI]
  );

  // Content change handler
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Meta change handler
  const handleMetaChange = useCallback(
    (newMetaTitle?: string, newMetaDescription?: string) => {
      if (newMetaTitle !== undefined) setMetaTitle(newMetaTitle);
      if (newMetaDescription !== undefined) setMetaDescription(newMetaDescription);
    },
    []
  );

  // Publish function
  const handlePublish = useCallback(async () => {
    if (!article) return;

    try {
      await updateMutation.mutateAsync({
        id: postId,
        updates: {
          status: 'published' as ArticleStatus,
          published_at: new Date().toISOString(),
        },
      });
      router.push('/app/blog');
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  }, [article, postId, updateMutation, router]);

  if (isLoading) {
    return <EditorLoading />;
  }

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className={styles.text.body}>Article introuvable</p>
          <Link href="/app/blog">
            <Button variant="outline">Retour au blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionTokens.variants.staggerContainer}
      className="min-h-screen"
    >
      {/* Header */}
      <motion.header
        variants={motionTokens.variants.staggerItem}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app/blog">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className={cn(styles.text.h4, 'mb-0')}>
                    {title || 'Sans titre'}
                  </h1>
                  <StatusBadge status={article.status} />
                </div>
                <AutoSaveIndicator
                  isSaving={updateMutation.isPending}
                  lastSaved={lastSaved}
                  hasChanges={hasChanges}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Tools Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Outils IA</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Outils IA</SheetTitle>
                    <SheetDescription>
                      Utilisez l'IA pour améliorer votre contenu
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={async () => {
                        const meta = await blogAI.generateMeta.mutateAsync({
                          title,
                          content,
                        });
                        setMetaTitle(meta.title);
                        setMetaDescription(meta.description);
                      }}
                      disabled={blogAI.generateMeta.isPending}
                    >
                      {blogAI.generateMeta.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Générer les méta-données SEO
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Preview Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Prévisualiser</span>
              </Button>

              {/* Save Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Sauvegarder</span>
              </Button>

              {/* Publish Button */}
              {article.status !== 'published' && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handlePublish}
                  disabled={updateMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Publier</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={motionTokens.variants.staggerItem}
        className="container mx-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="seo">SEO & Méta</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className={styles.text.label}>
                  Titre de l'article
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez le titre de votre article"
                  className="text-lg font-medium h-12"
                />
              </div>

              {/* Content Editor */}
              <CanvasStep
                content={content}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                onContentChange={handleContentChange}
                onMetaChange={handleMetaChange}
                onRewrite={handleRewrite}
                isRewriting={blogAI.rewriteText.isPending}
              />
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <div className="p-6 bg-muted/30 rounded-lg space-y-6">
                <div>
                  <h3 className={styles.text.h4}>Optimisation SEO</h3>
                  <p className={styles.text.bodyMuted}>
                    Configurez les méta-données pour améliorer votre référencement
                  </p>
                </div>

                <Separator />

                {/* Meta Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meta-title">Titre SEO</Label>
                    <span
                      className={cn(
                        styles.text.bodySmall,
                        metaTitle.length > 60
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {metaTitle.length}/60
                    </span>
                  </div>
                  <Input
                    id="meta-title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Titre optimisé pour les moteurs de recherche"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meta-description">Description SEO</Label>
                    <span
                      className={cn(
                        styles.text.bodySmall,
                        metaDescription.length > 160
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <Textarea
                    id="meta-description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Description accrocheuse pour les résultats de recherche"
                    rows={3}
                  />
                </div>

                {/* Google Preview */}
                <div className="space-y-2">
                  <Label>Aperçu Google</Label>
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-blue-600 hover:underline cursor-pointer font-medium text-base">
                      {metaTitle || title || 'Titre de votre article'}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      www.votresite.com/blog/{article.slug || 'article'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {metaDescription || 'Ajoutez une description SEO pour voir l\'aperçu...'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévisualisation de l'article</DialogTitle>
            <DialogDescription>
              Voici comment votre article apparaîtra
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Meta Preview */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className={styles.text.labelSmall}>Aperçu Google</p>
              <div className="p-3 bg-card rounded border">
                <p className="text-blue-600 hover:underline cursor-pointer font-medium">
                  {metaTitle || title}
                </p>
                <p className="text-xs text-green-700">
                  www.votresite.com/blog/{article.slug}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metaDescription || 'Description de l\'article...'}
                </p>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h1>{title}</h1>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

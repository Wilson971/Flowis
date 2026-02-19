'use client';

/**
 * ArticleEditor - Standalone Article Editor Component
 *
 * Redesigned to match Product Edit Form visual style:
 * - 2-column layout (main + sidebar)
 * - Card-based sections with consistent styling
 * - Motion animations with stagger effects
 * - Context-based state management for AI suggestions
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Rocket,
  Loader2,
  Check,
  Cloud,
  CloudOff,
  FileText,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { ContentTab } from './tabs/ContentTab';
import { ArticleSeoPreviewTab } from './tabs/ArticleSeoPreviewTab';
import { AIPreviewPanel } from './ai/AIPreviewPanel';
import { AIErrorBoundary } from './ai/AIErrorBoundary';

// Sidebar Cards
import { StatusCard } from './sidebar/StatusCard';
import { SeoScoreCard } from './sidebar/SeoScoreCard';
import { PublicationCard } from './sidebar/PublicationCard';
import { OrganizationCard } from './sidebar/OrganizationCard';
import { FeaturedImageCard } from './sidebar/FeaturedImageCard';
import { VersionHistoryCard } from './sidebar/VersionHistoryCard';
import { WordPressSyncCard } from './sidebar/WordPressSyncCard';

// Banners
import { NewArticleBanner, type ArticleSource } from './banners/NewArticleBanner';

// Preview
import { LivePreviewPanel } from './preview/LivePreviewPanel';
import { useLivePreview, type PreviewContent } from '@/hooks/blog/useLivePreview';

// WooCommerce Publish
import { SyncStatusBadge } from './SyncStatusBadge';
import { PublishToWCPanel } from './PublishToWCPanel';

// Context
import { ArticleEditProvider, useArticleEditContext } from './context';
import { useArticleEditProvider } from './context/useArticleEditProvider';

import { useArticleEditorForm } from '@/hooks/blog/useArticleEditorForm';
import { useAIEditorActions } from '@/hooks/blog/useAIEditorActions';
import { useArticleSync } from '@/hooks/blog/useArticleSync';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ArticleEditorProps {
  articleId?: string;
  className?: string;
}

// ============================================================================
// MOTION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

// ============================================================================
// AUTO-SAVE STATUS COMPONENT
// ============================================================================

function AutoSaveStatus({
  status,
  lastSavedAt,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
}) {
  if (status === 'saving') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Sauvegarde...
      </Badge>
    );
  }

  if (status === 'saved') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-200">
        <Cloud className="h-3 w-3" />
        Sauvegardé
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border-red-200">
        <CloudOff className="h-3 w-3" />
        Erreur
      </Badge>
    );
  }

  if (lastSavedAt) {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Check className="h-3 w-3" />
        Sauvé à {lastSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Badge>
    );
  }

  return null;
}

// ============================================================================
// CARD HEADER COMPONENT
// ============================================================================

interface CardHeaderIconProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  action?: React.ReactNode;
}

export function CardHeaderIcon({ icon, label, title, action }: CardHeaderIconProps) {
  return (
    <CardHeader className="pb-4 border-b border-border/10 mb-0 px-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
        </div>
        {action}
      </div>
    </CardHeader>
  );
}

// ============================================================================
// INNER EDITOR COMPONENT (Uses Context)
// ============================================================================

function ArticleEditorInner({ className }: { className?: string }) {
  const router = useRouter();

  // Get context (now we're inside the provider)
  const {
    articleId,
    form,
    isNew,
    isLoading,
    isSaving,
    lastSavedAt,
    autoSaveStatus,
    article,
    articleSync,
    handleSave,
  } = useArticleEditContext();

  // AI Actions (still needed for preview panel)
  const aiActions = useAIEditorActions();

  // Banner state for FloWriter-created articles
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // WooCommerce publish panel state
  const [wcPanelOpen, setWcPanelOpen] = useState(false);

  // Derive WC sync status from articleSync
  const wcSyncStatus = useMemo(() => {
    if (!articleSync) return 'not_synced' as const;
    const status = articleSync.syncStatus;
    if (status === 'synced') return 'synced' as const;
    if (status === 'syncing' || status === 'pending') return 'pending' as const;
    if (status === 'failed') return 'failed' as const;
    return 'not_synced' as const;
  }, [articleSync]);

  // Check if WC store is connected via articleSync
  const hasWCConnection = useMemo(() => {
    if (!articleSync?.connectedPlatforms) return false;
    return articleSync.connectedPlatforms.some(
      (p: { platform: string }) => p.platform === 'woocommerce' || p.platform === 'wordpress'
    );
  }, [articleSync]);

  // Live Preview state
  const livePreview = useLivePreview({
    initialOpen: false,
    initialDevice: 'desktop',
  });

  // Update preview content when form changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      const previewContent: PreviewContent = {
        title: values.title || '',
        content: values.content || '',
        excerpt: values.excerpt || '',
        featuredImage: values.featured_image_url || undefined,
        category: values.category || undefined,
        tags: values.tags || [],
        author: {
          name: 'Auteur',
        },
        publishedAt: new Date(),
      };
      livePreview.setContent(previewContent);
    });

    return () => subscription.unsubscribe();
  }, [form, livePreview]);

  // Determine if we should show the source banner
  const sourceBannerInfo = useMemo(() => {
    if (bannerDismissed || !article) return null;

    // Get source from article data (metadata or direct field)
    const source = (article.source ||
      (article.metadata as Record<string, unknown>)?.source ||
      'manual') as ArticleSource;

    // Only show banner for non-manual sources
    if (source === 'manual') return null;

    // Check if article was created recently (within 1 hour)
    const createdAt = article.created_at ? new Date(article.created_at) : new Date();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Show banner if article is recent (created within last hour)
    const isRecent = createdAt > oneHourAgo;
    if (!isRecent) return null;

    return {
      source,
      createdAt,
    };
  }, [article, bannerDismissed]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBack = useCallback(() => {
    router.push('/app/blog');
  }, [router]);

  const handleSaveDraft = useCallback(async () => {
    const values = form.getValues();
    // This would call the save function from context
    // For now, trigger form submit
  }, [form]);

  const handlePublishNow = useCallback(async () => {
    // Trigger publish
  }, []);

  const handlePreview = useCallback(() => {
    if (articleId) {
      window.open(`/preview/article/${articleId}`, '_blank');
    }
  }, [articleId]);

  // Handle AI preview apply - updates form content with AI result
  const handleApplyAIPreview = useCallback(() => {
    const result = aiActions.applyPreview();
    if (result) {
      form.setValue('content', result, { shouldDirty: true });
    }
  }, [aiActions, form]);

  const isDirty = form.formState.isDirty;

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn('min-h-screen', className)}
    >
      {/* Page Header */}
      <motion.header
        variants={itemVariants}
        className="sticky top-0 z-10 border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-lg bg-muted/50 hover:bg-muted flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <h1 className="text-xl font-extrabold truncate">
                  {isNew ? 'Nouvel article' : form.watch('title') || 'Sans titre'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <AutoSaveStatus status={autoSaveStatus} lastSavedAt={lastSavedAt} />
                  {!isNew && hasWCConnection && (
                    <SyncStatusBadge
                      status={wcSyncStatus}
                      onRetry={wcSyncStatus === 'failed' && articleSync
                        ? () => articleSync.retrySync?.('woocommerce')
                        : undefined}
                    />
                  )}
                  {isDirty && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-200">
                      Non sauvegardé
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Live Preview Toggle */}
              <Button
                variant={livePreview.isOpen ? 'secondary' : 'outline'}
                onClick={livePreview.toggle}
                className={cn(
                  'h-10 px-4 font-bold text-xs uppercase tracking-widest border-border/50',
                  livePreview.isOpen
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'hover:bg-muted/50'
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                Apercu
              </Button>

              {/* WC Publish Button (only when store connected & article saved) */}
              {hasWCConnection && !isNew && (
                <Button
                  variant="outline"
                  onClick={() => setWcPanelOpen(true)}
                  className="h-10 px-4 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50"
                >
                  <Store className="h-4 w-4 mr-2" />
                  WooCommerce
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || (!isDirty && !isNew)}
                className="h-10 px-6 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Brouillon
              </Button>

              <Button
                onClick={handlePublishNow}
                disabled={isSaving}
                className="h-10 px-8 font-extrabold text-xs uppercase tracking-widest min-w-[140px] shadow-[0_0_20px_-5px_var(--primary)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Source Banner (FloWriter, Template, Import, etc.) */}
        {sourceBannerInfo && (
          <NewArticleBanner
            source={sourceBannerInfo.source}
            createdAt={sourceBannerInfo.createdAt}
            autoDismissAfter={60} // Auto-dismiss after 60 seconds
            onDismiss={() => setBannerDismissed(true)}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
          {/* Left Column: Main Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Content Card */}
            {/* Bloc Rédaction - Contenu uniquement */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
              <CardHeaderIcon
                icon={<FileText className="w-5 h-5 text-muted-foreground" />}
                label="Rédaction"
                title="Contenu de l'article"
              />
              <CardContent className="p-6">
                <ContentTab />
              </CardContent>
            </Card>

            {/* Bloc SEO & Aperçu - Nouveau bloc en bas */}
            <ArticleSeoPreviewTab />
          </motion.div>

          {/* Right Column: Sidebar */}
          <motion.aside
            variants={sidebarVariants}
            className="space-y-4"
          >
            {/* Status Card */}
            <StatusCard />

            {/* SEO Score Card */}
            <SeoScoreCard />

            {/* Version History Card (only for existing articles) */}
            {!isNew && articleId && (
              <VersionHistoryCard
                articleId={articleId}
                currentContent={form.watch('content')}
                currentTitle={form.watch('title')}
                onVersionRestored={() => {
                  // Refetch article data after version restore
                  window.location.reload();
                }}
              />
            )}

            {/* Publication Card */}
            <PublicationCard />

            {/* WordPress Sync Card (only for existing articles) */}
            {!isNew && articleId && (
              <WordPressSyncCard articleId={articleId} />
            )}

            {/* Organization Card (Category + Tags) */}
            <OrganizationCard />

            {/* Featured Image Card */}
            <FeaturedImageCard />
          </motion.aside>
        </div>
      </div>

      {/* AI Preview Panel */}
      <AIErrorBoundary fallbackMessage="Une erreur est survenue avec le panneau de prévisualisation IA.">
        <AIPreviewPanel
          isOpen={aiActions.hasPreview}
          originalContent={aiActions.previewOriginal || ''}
          aiResult={aiActions.previewResult || ''}
          actionLabel={aiActions.currentAction ? aiActions.currentAction : undefined}
          onApply={handleApplyAIPreview}
          onCancel={aiActions.cancelPreview}
          isLoading={aiActions.isProcessing}
        />
      </AIErrorBoundary>

      {/* Live Preview Panel */}
      <LivePreviewPanel
        isOpen={livePreview.isOpen}
        onClose={livePreview.close}
        content={livePreview.previewContent}
        device={livePreview.device}
        onDeviceChange={livePreview.setDevice}
      />

      {/* WooCommerce Publish Panel */}
      {articleId && (
        <PublishToWCPanel
          open={wcPanelOpen}
          onOpenChange={setWcPanelOpen}
          articleId={articleId}
          title={form.watch('title') || ''}
          excerpt={form.watch('excerpt') || ''}
          content={form.watch('content') || ''}
          featuredImageUrl={form.watch('featured_image_url') || undefined}
          category={form.watch('category') || undefined}
          tags={form.watch('tags') || []}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT (With Provider)
// ============================================================================

export function ArticleEditor({ articleId, className }: ArticleEditorProps) {
  // Hooks
  const editorForm = useArticleEditorForm({ articleId });
  const aiActions = useAIEditorActions();
  const syncHook = useArticleSync({
    articleId: articleId || '',
    enabled: !!articleId,
  });

  // Create context value
  const contextValue = useArticleEditProvider({
    articleId,
    article: editorForm.article,
    isLoading: editorForm.isLoading,
    isNew: editorForm.isNew,
    form: editorForm.form,
    lastSavedAt: editorForm.lastSavedAt,
    autoSaveStatus: editorForm.autoSaveStatus,
    isSaving: editorForm.isSaving,
    saveDraft: editorForm.saveDraft,
    saveAndPublish: editorForm.saveAndPublish,
    generateSlugFromTitle: editorForm.generateSlugFromTitle,
    aiActions: {
      generateIntro: aiActions.generateIntro,
      generateConclusion: aiActions.generateConclusion,
      suggestTitles: aiActions.suggestTitles,
      generateMetaDescription: aiActions.generateMetaDescription,
      generateExcerpt: aiActions.generateExcerpt,
      isProcessing: aiActions.isProcessing,
    },
    syncHook: {
      syncStatus: syncHook.syncStatus,
      isPublished: syncHook.isPublished,
      isScheduled: syncHook.isScheduled,
      scheduledAt: syncHook.scheduledAt,
      connectedPlatforms: syncHook.connectedPlatforms,
      publishNow: syncHook.publishNow,
      schedulePublish: syncHook.schedulePublish,
      retrySync: syncHook.retrySync,
      isPublishing: syncHook.isPublishing,
      isScheduling: syncHook.isScheduling,
    },
  });

  return (
    <FormProvider {...editorForm.form}>
      <ArticleEditProvider value={contextValue}>
        <ArticleEditorInner className={className} />
      </ArticleEditProvider>
    </FormProvider>
  );
}

export default ArticleEditor;

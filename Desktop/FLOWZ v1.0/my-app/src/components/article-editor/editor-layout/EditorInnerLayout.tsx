'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { ContentTab } from '../tabs/ContentTab';
import { ArticleSeoPreviewTab } from '../tabs/ArticleSeoPreviewTab';
import { AIPreviewPanel } from '../ai/AIPreviewPanel';
import { AIErrorBoundary } from '../ai/AIErrorBoundary';
import { NewArticleBanner, type ArticleSource } from '../banners/NewArticleBanner';
import { LivePreviewPanel } from '../preview/LivePreviewPanel';
import { PublishToWCPanel } from '../PublishToWCPanel';

import { useArticleEditContext } from '../context';
import { useAIEditorActions } from '@/hooks/blog/useAIEditorActions';
import { useLivePreview, type PreviewContent } from '@/hooks/blog/useLivePreview';
import { cn } from '@/lib/utils';

import { EditorHeader } from './EditorHeader';
import { EditorSidebar } from './EditorSidebar';
import { CardHeaderIcon } from './CardHeaderIcon';
import { containerVariants, itemVariants } from './motion-variants';

export function EditorInnerLayout({ className }: { className?: string }) {
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
        tags: (values.tags || []).filter((t): t is string => !!t),
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
    const source = ((article as unknown as Record<string, unknown>).source ||
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
      <EditorHeader
        isNew={isNew}
        isSaving={isSaving}
        isDirty={isDirty}
        autoSaveStatus={autoSaveStatus}
        lastSavedAt={lastSavedAt}
        title={form.watch('title')}
        hasWCConnection={hasWCConnection}
        wcSyncStatus={wcSyncStatus}
        articleSync={articleSync}
        livePreview={livePreview}
        onSaveDraft={handleSaveDraft}
        onPublishNow={handlePublishNow}
        onOpenWcPanel={() => setWcPanelOpen(true)}
      />

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

            {/* Bloc SEO & Aperçu */}
            <ArticleSeoPreviewTab />
          </motion.div>

          {/* Right Column: Sidebar */}
          <EditorSidebar
            isNew={isNew}
            articleId={articleId}
            currentContent={form.watch('content')}
            currentTitle={form.watch('title')}
            onVersionRestored={() => {
              window.location.reload();
            }}
          />
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

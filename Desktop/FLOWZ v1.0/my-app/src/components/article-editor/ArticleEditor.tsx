'use client';

/**
 * ArticleEditor - Standalone Article Editor Component
 *
 * Slim wrapper that sets up the Provider and delegates rendering
 * to editor-layout/ sub-components.
 */

import React from 'react';
import { FormProvider } from 'react-hook-form';

import { ArticleEditProvider } from './context';
import { useArticleEditProvider } from './context/useArticleEditProvider';
import { useArticleEditorForm } from '@/hooks/blog/useArticleEditorForm';
import { useAIEditorActions } from '@/hooks/blog/useAIEditorActions';
import { useArticleSync } from '@/hooks/blog/useArticleSync';

import { EditorInnerLayout } from './editor-layout';

// Re-export CardHeaderIcon for external consumers
export { CardHeaderIcon } from './editor-layout';

// ============================================================================
// TYPES
// ============================================================================

interface ArticleEditorProps {
  articleId?: string;
  className?: string;
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
        <EditorInnerLayout className={className} />
      </ArticleEditProvider>
    </FormProvider>
  );
}

export default ArticleEditor;

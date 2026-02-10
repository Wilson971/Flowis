'use client';

/**
 * ArticleEditContext - State management for article editor
 *
 * Follows the same pattern as ProductEditContext for consistency:
 * - Triple-buffer content management (original, working, draft AI)
 * - Field-level AI suggestion tracking
 * - Dirty fields tracking
 * - Accept/Reject draft actions
 */

import { createContext, useContext, ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { ArticleForm } from '@/schemas/article-editor';
import type { BlogArticle } from '@/types/blog';
import type { SyncStatus } from '@/schemas/article-editor';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Content buffer for managing article versions
 * - original_content: Content as synced from platform
 * - working_content: Current form values
 * - draft_generated_content: AI-generated suggestions per field
 */
export interface ArticleContentBuffer {
  original_content: Partial<ArticleForm>;
  working_content: ArticleForm;
  draft_generated_content: Record<string, string>;
}

export type ArticleContentStatus = 'synced' | 'modified' | 'draft' | 'conflict';

export interface ArticleDirtyFieldsData {
  dirtyFieldsContent?: string[];
  contentStatus?: ArticleContentStatus;
  hasConflict?: boolean;
}

export interface ArticleDraftActions {
  handleAcceptField: (field: string) => Promise<void>;
  handleRejectField: (field: string) => Promise<void>;
  handleRegenerateField: (field: string) => Promise<void>;
  isAccepting: boolean;
  isRejecting: boolean;
  isRegenerating: boolean;
  previewField: string | null;
  setPreviewField: (field: string | null) => void;
}

export interface ArticleSaveHook {
  save: (data: ArticleForm, options?: { metadata?: any }) => Promise<void>;
  isPending: boolean;
  isSaving: boolean;
}

export interface ArticleSyncHook {
  syncStatus: SyncStatus;
  isPublished: boolean;
  isScheduled: boolean;
  scheduledAt: string | null;
  publishNow: (platforms: string[]) => Promise<boolean>;
  schedulePublish: (options: any) => Promise<boolean>;
  isPublishing: boolean;
  isScheduling: boolean;
}

export interface ArticleEditContextType {
  // Identifier
  articleId: string | undefined;

  // Article data
  article: BlogArticle | undefined | null;
  isLoading: boolean;
  isNew: boolean;

  // Form
  form: UseFormReturn<ArticleForm>;
  savedSnapshot: ArticleForm | null;
  setSavedSnapshot?: (snapshot: ArticleForm | null) => void;

  // Triple-buffer content
  contentBuffer: ArticleContentBuffer | undefined;

  // Dirty fields tracking
  dirtyFieldsData?: ArticleDirtyFieldsData;

  // SEO Analysis
  seoScore?: number;
  seoChecks?: Array<{ label: string; passed: boolean; severity: 'critical' | 'warning' | 'info' }>;

  // AI Proposals (fields with AI suggestions)
  remainingProposals: string[];
  draftActions: ArticleDraftActions;

  // Save & Sync
  isSaving: boolean;
  handleSave: (data: ArticleForm) => Promise<void>;
  articleSave?: ArticleSaveHook;
  articleSync?: ArticleSyncHook;

  // Auto-save
  lastSavedAt: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Refetch functions
  refetchArticle?: () => Promise<any>;
  refetchContentBuffer?: () => Promise<any>;

  // Helpers
  isFieldModified: (fieldName: string) => boolean;
  isFieldWithDraft: (fieldName: string) => boolean;
  resetModifiedFields?: () => void;
  generateSlugFromTitle: () => void;

  // Platform context
  selectedPlatform?: 'flowz' | 'woocommerce' | 'wordpress';
  connectedPlatforms?: Array<{ platform: string; connected: boolean }>;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const ArticleEditContext = createContext<ArticleEditContextType | undefined>(undefined);

// ============================================================================
// HOOK
// ============================================================================

export const useArticleEditContext = () => {
  const context = useContext(ArticleEditContext);
  if (!context) {
    throw new Error('useArticleEditContext must be used within an ArticleEditProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface ArticleEditProviderProps {
  children: ReactNode;
  value: ArticleEditContextType;
}

export const ArticleEditProvider = ({ children, value }: ArticleEditProviderProps) => {
  return (
    <ArticleEditContext.Provider value={value}>
      {children}
    </ArticleEditContext.Provider>
  );
};

// ============================================================================
// DEFAULT VALUES (for initial render)
// ============================================================================

export const defaultArticleDraftActions: ArticleDraftActions = {
  handleAcceptField: async () => {},
  handleRejectField: async () => {},
  handleRegenerateField: async () => {},
  isAccepting: false,
  isRejecting: false,
  isRegenerating: false,
  previewField: null,
  setPreviewField: () => {},
};

export const defaultArticleContentBuffer: ArticleContentBuffer = {
  original_content: {},
  working_content: {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    featured_image_alt: '',
    category: '',
    tags: [],
    seo_title: '',
    seo_description: '',
    seo_og_image: '',
    seo_canonical_url: '',
    no_index: false,
    status: 'draft',
    author_id: null,
    publish_mode: 'draft',
    scheduled_at: null,
    platforms: ['flowz'],
    // WordPress settings
    comment_status: 'open',
    ping_status: 'closed',
    sticky: false,
    format: 'standard',
    template: '',
    // Sync data (readonly)
    platform_post_id: null,
    link: null,
    // WordPress author
    wp_author_id: null,
    wp_author_name: null,
  },
  draft_generated_content: {},
};

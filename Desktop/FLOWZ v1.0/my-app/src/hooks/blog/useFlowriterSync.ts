/**
 * useFlowriterSync Hook
 *
 * Syncs Flowriter state with Supabase backend for cross-device draft recovery
 * Uses blog_articles table with status 'auto_draft'
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { FlowriterState, FlowriterStep, DEFAULT_FLOWRITER_STATE } from '@/types/blog-ai';
import type { BlogArticle } from '@/types/blog';

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTO_SAVE_DEBOUNCE_MS = 3000; // Save every 3 seconds of inactivity
const QUERY_KEY = ['flowriter', 'auto-draft'];

// ============================================================================
// TYPES
// ============================================================================

export interface FlowriterSyncOptions {
  storeId: string;
  tenantId: string;
  enabled?: boolean;
}

export interface AutoDraftData {
  articleId: string;
  flowriterState: FlowriterState;
  lastModified: Date;
}

/**
 * Draft metadata for UI display
 * Compatible with ExtendedDraftInfo expected by DraftRestorationDialog
 */
export interface DraftInfo {
  title: string;
  topic: string;
  wordCount: number;
  lastModified: Date;
  currentStep: FlowriterStep;
  ageLabel: string;
  source: 'backend';
  // For DraftRestorationDialog compatibility
  isBackendDraft: boolean;
  isRecent: boolean;
}

interface FlowriterMetadata {
  auto_saved: boolean;
  flowriter_state: FlowriterState;
  last_auto_save: string;
}

// Key for tracking dismissed drafts (lightweight localStorage usage)
const DISMISSED_KEY_PREFIX = 'flowriter-draft-dismissed-';

/**
 * Calculate human-readable age string
 */
function getAgeLabel(date: Date): string {
  const ageMs = Date.now() - date.getTime();
  const minutes = Math.floor(ageMs / 60000);
  const hours = Math.floor(ageMs / 3600000);
  const days = Math.floor(ageMs / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFlowriterSync(options: FlowriterSyncOptions) {
  const { storeId, tenantId, enabled = true } = options;
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Track pending save state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Track if the draft prompt has been dismissed this session
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`${DISMISSED_KEY_PREFIX}${storeId}`) === 'true';
    } catch {
      return false;
    }
  });

  // Track current auto-draft article ID
  const autoDraftIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // LOAD EXISTING AUTO-DRAFT
  // ============================================================================

  const {
    data: existingDraft,
    isLoading: isLoadingDraft,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: [...QUERY_KEY, storeId],
    queryFn: async (): Promise<AutoDraftData | null> => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('id, title, metadata, updated_at')
        .eq('store_id', storeId)
        .eq('status', 'auto_draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No auto-draft found is not an error
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      const metadata = data.metadata as FlowriterMetadata | null;
      if (!metadata?.flowriter_state) return null;

      autoDraftIdRef.current = data.id;

      return {
        articleId: data.id,
        flowriterState: metadata.flowriter_state,
        lastModified: new Date(data.updated_at),
      };
    },
    enabled: enabled && !!storeId && !!tenantId,
    staleTime: 0, // Always check on mount
    gcTime: 5 * 60 * 1000,
  });

  // ============================================================================
  // SAVE AUTO-DRAFT MUTATION
  // ============================================================================

  const saveAutoDraftMutation = useMutation({
    mutationFn: async (state: FlowriterState): Promise<string> => {
      const now = new Date().toISOString();

      const metadata: FlowriterMetadata = {
        auto_saved: true,
        flowriter_state: state,
        last_auto_save: now,
      };

      // Generate title from state
      const title = state.articleData.title ||
        (state.articleData.topic ? `Brouillon: ${state.articleData.topic.slice(0, 50)}` : 'Brouillon Flowriter');

      // If we have an existing auto-draft, update it
      if (autoDraftIdRef.current) {
        const { data, error } = await supabase
          .from('blog_articles')
          .update({
            title,
            content: state.articleData.content || '',
            metadata,
            updated_at: now,
          })
          .eq('id', autoDraftIdRef.current)
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }

      // Create new auto-draft
      const slug = `auto-draft-${Date.now()}`;

      const { data, error } = await supabase
        .from('blog_articles')
        .insert({
          tenant_id: tenantId,
          store_id: storeId,
          title,
          slug,
          status: 'auto_draft',
          content: state.articleData.content || '',
          metadata,
        })
        .select('id')
        .single();

      if (error) throw error;

      autoDraftIdRef.current = data.id;
      return data.id;
    },
    onSuccess: () => {
      setLastSyncTime(new Date());
      setSyncError(null);
    },
    onError: (error: Error) => {
      setSyncError(error.message);
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });

  // ============================================================================
  // DELETE AUTO-DRAFT MUTATION
  // ============================================================================

  const deleteAutoDraftMutation = useMutation({
    mutationFn: async () => {
      // Delete ALL auto_drafts for this store (not just the one we tracked)
      // This ensures cleanup even if autoDraftIdRef wasn't set properly
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('store_id', storeId)
        .eq('status', 'auto_draft');

      if (error) throw error;

      autoDraftIdRef.current = null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // ============================================================================
  // CONVERT TO REGULAR DRAFT MUTATION
  // ============================================================================

  const convertToDraftMutation = useMutation({
    mutationFn: async (finalState: FlowriterState): Promise<string> => {
      const now = new Date().toISOString();

      if (!autoDraftIdRef.current) {
        throw new Error('No auto-draft to convert');
      }

      // Update the existing auto-draft to a regular draft
      const { data, error } = await supabase
        .from('blog_articles')
        .update({
          status: 'draft',
          title: finalState.articleData.title,
          content: finalState.articleData.content,
          metadata: {
            ai_generated: true,
            converted_from_auto_draft: true,
            flowriter_config: finalState.articleData.config,
          },
          updated_at: now,
        })
        .eq('id', autoDraftIdRef.current)
        .select('id')
        .single();

      if (error) throw error;

      const articleId = data.id;
      autoDraftIdRef.current = null; // Clear reference

      return articleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
    },
  });

  // ============================================================================
  // DEBOUNCED SAVE FUNCTION
  // ============================================================================

  const saveState = useCallback((state: FlowriterState) => {
    if (!enabled || !storeId || !tenantId) return;

    // Don't save if there's no meaningful data
    const hasData = state.articleData.topic ||
      state.articleData.title ||
      state.articleData.content ||
      state.articleData.outline.length > 0;

    if (!hasData) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(() => {
      setIsSyncing(true);
      saveAutoDraftMutation.mutate(state);
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [enabled, storeId, tenantId, saveAutoDraftMutation]);

  // ============================================================================
  // IMMEDIATE SAVE (for step changes)
  // ============================================================================

  const saveImmediately = useCallback((state: FlowriterState) => {
    if (!enabled || !storeId || !tenantId) return;

    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const hasData = state.articleData.topic ||
      state.articleData.title ||
      state.articleData.content ||
      state.articleData.outline.length > 0;

    if (!hasData) return;

    setIsSyncing(true);
    saveAutoDraftMutation.mutate(state);
  }, [enabled, storeId, tenantId, saveAutoDraftMutation]);

  // ============================================================================
  // DISCARD AUTO-DRAFT
  // ============================================================================

  const discardAutoDraft = useCallback(async () => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Immediately clear the cached draft data (optimistic update)
    queryClient.setQueryData([...QUERY_KEY, storeId], null);
    autoDraftIdRef.current = null;

    try {
      await deleteAutoDraftMutation.mutateAsync();
    } catch (error) {
      // Refetch to restore accurate state if deletion failed
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, storeId] });
    }
  }, [deleteAutoDraftMutation, queryClient, storeId]);

  // ============================================================================
  // CONVERT AND FINALIZE
  // ============================================================================

  const finalizeAsArticle = useCallback(async (state: FlowriterState): Promise<string | null> => {
    try {
      const articleId = await convertToDraftMutation.mutateAsync(state);
      return articleId;
    } catch (error) {
      console.error('[FlowriterSync] Convert failed:', error);
      return null;
    }
  }, [convertToDraftMutation]);

  // ============================================================================
  // DRAFT DETECTION & RESTORATION (v3.0)
  // ============================================================================

  /**
   * Computed: Draft info for UI display
   */
  const draftInfo: DraftInfo | null = existingDraft ? {
    title: existingDraft.flowriterState.articleData.title || 'Sans titre',
    topic: existingDraft.flowriterState.articleData.topic || '',
    wordCount: existingDraft.flowriterState.articleData.content?.split(/\s+/).filter(Boolean).length || 0,
    lastModified: existingDraft.lastModified,
    currentStep: existingDraft.flowriterState.currentStep,
    ageLabel: getAgeLabel(existingDraft.lastModified),
    source: 'backend',
    isBackendDraft: true,  // Always true in backend-first architecture
    isRecent: true,        // Backend drafts are considered recent
  } : null;

  /**
   * Computed: Should show draft prompt?
   * True if: draft exists AND not dismissed AND not currently loading
   */
  const showDraftPrompt = !!existingDraft && !isDismissed && !isLoadingDraft;

  /**
   * Dismiss the draft prompt (for this session)
   * Does NOT delete the draft - just hides the prompt
   */
  const dismissDraftPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(`${DISMISSED_KEY_PREFIX}${storeId}`, 'true');
    } catch {
      // Ignore localStorage errors
    }
  }, [storeId]);

  /**
   * Restore draft: hydrates state from backend draft
   * Returns the FlowriterState to apply, or null if no draft
   */
  const restoreDraft = useCallback((): FlowriterState | null => {
    if (!existingDraft) return null;

    // Mark as dismissed since user chose to restore (don't show prompt again)
    setIsDismissed(true);
    try {
      localStorage.removeItem(`${DISMISSED_KEY_PREFIX}${storeId}`);
    } catch {
      // Ignore localStorage errors
    }

    return existingDraft.flowriterState;
  }, [existingDraft, storeId]);

  /**
   * Clear dismissal flag (e.g., after a new draft is created)
   */
  const clearDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(`${DISMISSED_KEY_PREFIX}${storeId}`);
    } catch {
      // Ignore localStorage errors
    }
  }, [storeId]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Draft detection (v3.0: backend-first)
    showDraftPrompt,
    draftInfo,
    isLoadingDraft,

    // Existing draft data (raw)
    existingDraft,
    hasExistingDraft: !!existingDraft,

    // Sync status
    isSyncing,
    lastSyncTime,
    syncError,

    // Actions
    saveState,           // Debounced save
    saveImmediately,     // Immediate save (for step changes)
    discardAutoDraft,    // Delete auto-draft and dismiss prompt
    dismissDraftPrompt,  // Hide prompt without deleting draft
    restoreDraft,        // Get state from backend draft
    clearDismissal,      // Reset dismissal flag
    finalizeAsArticle,   // Convert auto_draft to draft
    refetchDraft,        // Refresh draft query

    // Current auto-draft ID
    autoDraftId: autoDraftIdRef.current,
  };
}

export type FlowriterSyncReturn = ReturnType<typeof useFlowriterSync>;


/**
 * useBrandStyles - CRUD hooks for brand_styles table
 *
 * Provides:
 * - useBrandStyles()       - List all brand styles for current user
 * - useCreateBrandStyle()  - Create a new brand style
 * - useUpdateBrandStyle()  - Update an existing brand style
 * - useDeleteBrandStyle()  - Delete a brand style
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BrandStyle } from '../types/studio';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBrandStyleParams {
  name: string;
  brand_colors: string[];
  prompt_modifier?: string | null;
}

export interface UpdateBrandStyleParams {
  id: string;
  name?: string;
  brand_colors?: string[];
  prompt_modifier?: string | null;
}

// ============================================================================
// QUERY KEY
// ============================================================================

const BRAND_STYLES_KEY = ['brand-styles'] as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all brand styles for the current user, ordered by name.
 */
export function useBrandStyles() {
  const supabase = createClient();

  return useQuery({
    queryKey: BRAND_STYLES_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      const { data, error } = await supabase
        .from('brand_styles')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as BrandStyle[];
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new brand style for the current user.
 */
export function useCreateBrandStyle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateBrandStyleParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      const { data, error } = await supabase
        .from('brand_styles')
        .insert({
          user_id: user.id,
          name: params.name,
          brand_colors: params.brand_colors,
          prompt_modifier: params.prompt_modifier ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BrandStyle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_STYLES_KEY });
      toast.success('Style de marque cree');
    },
    onError: (error: Error) => {
      toast.error('Erreur de creation', {
        description: error.message,
      });
    },
  });
}

/**
 * Update an existing brand style.
 */
export function useUpdateBrandStyle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBrandStyleParams) => {
      const { data, error } = await supabase
        .from('brand_styles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BrandStyle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_STYLES_KEY });
      toast.success('Style de marque mis a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur de mise a jour', {
        description: error.message,
      });
    },
  });
}

/**
 * Delete a brand style by ID.
 */
export function useDeleteBrandStyle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brand_styles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_STYLES_KEY });
      toast.success('Style de marque supprime');
    },
    onError: (error: Error) => {
      toast.error('Erreur de suppression', {
        description: error.message,
      });
    },
  });
}

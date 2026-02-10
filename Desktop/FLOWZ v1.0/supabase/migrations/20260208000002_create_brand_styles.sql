-- Migration: Create brand_styles table for Photo Studio
-- Description: Stores user-defined brand style presets with colors and prompt modifiers

CREATE TABLE IF NOT EXISTS public.brand_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand_colors TEXT[] DEFAULT '{}',
  prompt_modifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_styles_user ON public.brand_styles(user_id);

ALTER TABLE public.brand_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own brand styles"
  ON public.brand_styles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
